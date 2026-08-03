import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let santri_id = searchParams.get("santri_id");

  try {
    // If no santri_id provided, default to the first active santri in db
    if (!santri_id) {
      const defaultSantri = await prisma.santriAktif.findFirst({
        where: { is_active: true },
        include: { kelas: true },
        orderBy: { nama_lengkap: "asc" },
      });
      if (!defaultSantri) {
        return NextResponse.json({ error: "No active santri found" }, { status: 404 });
      }
      santri_id = defaultSantri.id;
    }

    // 1. Get Data Santri
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: {
        kelas: true,
      },
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // 2. Get Presensi & Breakdown
    const presensi = await prisma.presensiSiswa.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
    });
    
    const totalHari = presensi.length || 0;
    const totalHadir = presensi.filter((p) => p.status === "hadir").length;
    const totalSakit = presensi.filter((p) => p.status === "sakit").length;
    const totalIzin = presensi.filter((p) => p.status === "izin").length;
    const totalAlpha = presensi.filter((p) => p.status === "alpha").length;
    const persentaseKehadiran = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

    // 3. Get Jurnal Mengajar di Kelas Santri
    const jurnalKelas = await prisma.jurnalMengajar.findMany({
      where: { kelas_id: santri.kelas_id },
      orderBy: { tanggal: "desc" },
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
        mapel: { select: { id: true, nama: true, kategori: true } },
      },
    });

    const formatName = (str: string) => {
      if (!str) return "-";
      return str.split(" ").map(word => {
        if (word.includes(".")) return word;
        if (word === word.toUpperCase() || word === word.toLowerCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
      }).join(" ");
    };

    const formattedJurnal = jurnalKelas.map((j) => ({
      id: j.id,
      tanggal: j.tanggal.toISOString().split("T")[0],
      asatidz: j.pegawai?.nama_lengkap ? formatName(j.pegawai.nama_lengkap.trim()) : "-",
      mapel: j.mapel?.nama ? j.mapel.nama.replace(/^\[.*?\]\s*/, "") : "-",
      mapel_kategori: j.mapel?.kategori || "umum",
      jam_ke: j.jam_ke || "-",
      materi: j.materi,
      learning_outcome: j.learning_outcome || j.materi,
      kegiatan: j.kegiatan,
      catatan: j.catatan || "",
    }));

    // 4. Get Tahfidz
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 15,
    });

    // 5. Get Akademik (Nilai Santri)
    const akademik = await prisma.nilaiSantri.findMany({
      where: { santri_id },
      include: {
        mapel: true,
      },
      orderBy: { created_at: "asc" },
    });

    // Extract unique mapel list
    const mapelMap = new Map();
    akademik.forEach((n) => {
      if (n.mapel && !mapelMap.has(n.mapel_id)) {
        mapelMap.set(n.mapel_id, {
          id: n.mapel_id,
          nama: n.mapel.nama.replace(/^\[.*?\]\s*/, ""),
          kategori: n.mapel.kategori || "umum",
        });
      }
    });

    // Also include mapels from class master if available
    const classMapels = await prisma.mataPelajaran.findMany({
      where: { kelas_id: santri.kelas_id, is_active: true },
      select: { id: true, nama: true, kategori: true },
      orderBy: { nama: "asc" },
    });
    classMapels.forEach((m) => {
      const cleanNama = m.nama.replace(/^\[.*?\]\s*/, "");
      if (!mapelMap.has(m.id)) {
        mapelMap.set(m.id, {
          id: m.id,
          nama: cleanNama,
          kategori: m.kategori || "umum",
        });
      }
    });

    const mapelList = Array.from(mapelMap.values()).sort((a, b) => a.nama.localeCompare(b.nama, "id"));

    // 6. Get Ibadah & Adab
    const ibadah = await prisma.ibadahAdabSantri.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 30, // Sebulan terakhir
    });

    let shubuhJamaah = 0;
    ibadah.forEach((i) => {
      if (i.shubuh === "Berjamaah") shubuhJamaah++;
    });
    const persentaseShubuh = ibadah.length > 0 ? Math.round((shubuhJamaah / ibadah.length) * 100) : 100;
    const sppInfo = await cekStatusSpp(santri.id);

    return NextResponse.json({
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas.nama,
        jenjang: santri.kelas.jenjang,
        foto_url: santri.foto_url,
      },
      spp: sppInfo,
      ringkasan: {
        persentaseKehadiran,
        totalHari,
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpha,
        persentaseShubuh,
      },
      detail: {
        presensi: presensi.map((p) => ({
          id: p.id,
          tanggal: p.tanggal.toISOString().split("T")[0],
          status: p.status,
          keterangan: p.keterangan || "",
        })),
        jurnal: formattedJurnal,
        akademik: akademik.map((a) => ({
          id: a.id,
          mapel_id: a.mapel_id,
          mapel_nama: a.mapel?.nama ? a.mapel.nama.replace(/^\[.*?\]\s*/, "") : "Mapel",
          mapel_kategori: a.mapel?.kategori || "umum",
          jenis: a.jenis,
          nilai: a.nilai,
          keterangan: a.keterangan,
        })),
        mapelList,
        tahfidz,
        ibadah,
      },
    });
  } catch (error) {
    console.error("Error generating rapor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
