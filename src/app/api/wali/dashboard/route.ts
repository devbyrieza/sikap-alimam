import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWaliOrStaffSantri } from "@/lib/waliAccess";
import { getOfficialNis } from "@/lib/officialSantri";
import { getRaporButtonState } from "@/lib/raporStatus";
import { computeHalaqohSummary } from "@/lib/halaqohSummary";
import { getStandardMapelName } from "@/lib/mapel";

export const dynamic = "force-dynamic";

function countJplFromJamKe(jamKe?: string | null): number {
  if (!jamKe) return 1;
  const trimmed = jamKe.trim();
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (end >= start) return end - start + 1;
  }
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").filter((p) => p.trim() !== "");
    if (parts.length > 0) return parts.length;
  }
  return 1;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedSantriId = searchParams.get("santri_id");
    const semester = searchParams.get("semester") || "Ganjil";
    const tahunAjaran = searchParams.get("tahun_ajaran") || "2026/2027";
    const bulanParam = searchParams.get("bulan");
    const tahunParam = searchParams.get("tahun");

    const auth = await authorizeWaliOrStaffSantri(requestedSantriId);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { santriId, spp, isSppLocked } = auth;

    const santri = await prisma.santriAktif.findUnique({
      where: { id: santriId },
      include: {
        kelas: {
          include: {
            wali_kelas: {
              select: { id: true, nama_lengkap: true, nama_panggilan: true, no_hp: true },
            },
          },
        },
        musyrif: {
          select: { id: true, nama_lengkap: true, nama_panggilan: true, no_hp: true },
        },
      },
    });

    if (!santri) {
      return NextResponse.json({ success: false, error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const nisResmi = (santri.nama_lengkap ? getOfficialNis(santri.nama_lengkap) : null) || santri.nis;

    const biodata = {
      id: santri.id,
      nama: santri.nama_lengkap,
      nis: nisResmi || "-",
      nisn: santri.nisn || "-",
      tempatLahir: santri.tempat_lahir || null,
      tanggalLahir: santri.tanggal_lahir ? santri.tanggal_lahir.toISOString().slice(0, 10) : null,
      kelasAktif: santri.kelas?.nama || "-",
      kelasId: santri.kelas_id,
      kamarAktif: santri.kamar_aktif || "-",
      musyrifAktif: santri.musyrif?.nama_lengkap || "-",
      waliKelas: santri.kelas?.wali_kelas
        ? {
            nama: santri.kelas.wali_kelas.nama_lengkap,
            noHp: santri.kelas.wali_kelas.no_hp,
          }
        : null,
      fotoUrl: santri.foto_url,
    };

    // Jika terkunci SPP, hanya kembalikan biodata + status SPP (data akademik/pengasuhan dikunci)
    if (isSppLocked) {
      return NextResponse.json({
        success: true,
        locked: true,
        spp,
        biodata,
      });
    }

    const isGanjil = semester === "1" || semester.toLowerCase() === "ganjil";
    const semesterVariants = isGanjil ? ["Ganjil", "1"] : ["Genap", "2"];

    const [
      keaktifanArab,
      pelanggaranList,
      presensiRows,
      mapelKelas,
      nilaiRows,
      ekskulRows,
      penilaianWaliKelas,
      pengasuhan,
      halaqoh,
      kesehatanList,
    ] = await Promise.all([
      prisma.keaktifanArabSantri.findFirst({
        where: {
          santri_id: santriId,
          semester: { in: semesterVariants },
          tahun_ajaran: tahunAjaran,
        },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: { updated_at: "desc" },
      }),
      prisma.pelanggaranSantri.findMany({
        where: { santri_id: santriId },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
        take: 30,
      }),
      prisma.presensiSiswa.findMany({
        where: { santri_id: santriId },
        select: { status: true, jam_ke: true },
      }),
      prisma.mataPelajaran.findMany({
        where: { kelas_id: santri.kelas_id },
        select: { id: true, nama: true },
        orderBy: { nama: "asc" },
      }),
      prisma.nilaiSantri.findMany({
        where: {
          santri_id: santriId,
          semester: { in: semesterVariants },
          tahun_ajaran: tahunAjaran,
        },
        include: { mapel: { select: { id: true, nama: true } } },
        orderBy: { mapel: { nama: "asc" } },
      }),
      prisma.ekskulSantri.findMany({
        where: {
          santri_id: santriId,
          semester: { in: semesterVariants },
          tahun_ajaran: tahunAjaran,
        },
        orderBy: { nama_ekskul: "asc" },
      }),
      prisma.penilaianWaliKelas.findFirst({
        where: {
          santri_id: santriId,
          semester: { in: semesterVariants },
          tahun_ajaran: tahunAjaran,
        },
        include: { pegawai: { select: { nama_lengkap: true } } },
      }),
      prisma.pengasuhanSantri.findFirst({
        where: {
          santri_id: santriId,
          semester: { in: semesterVariants },
          tahun_ajaran: tahunAjaran,
        },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: { updated_at: "desc" },
      }),
      computeHalaqohSummary(
        santriId,
        bulanParam ? Number(bulanParam) : undefined,
        tahunParam ? Number(tahunParam) : undefined
      ),
      prisma.kesehatanSantri.findMany({
        where: { santri_id: santriId },
        include: { pegawai: { select: { nama_lengkap: true } } },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
        take: 10,
      }),
    ]);

    // Hitung presensi dalam satuan JPL
    let sakitJpl = 0;
    let izinJpl = 0;
    let alphaJpl = 0;
    for (const p of presensiRows) {
      const jpl = countJplFromJamKe(p.jam_ke);
      const st = (p.status || "").toLowerCase();
      if (st === "sakit") sakitJpl += jpl;
      else if (st === "izin") izinJpl += jpl;
      else if (st === "alpha" || st === "alfa") alphaJpl += jpl;
    }

    // Ringkas nilai per mapel untuk blok Ujian-ujian & Nilai
    const mapelScoreMap = new Map<
      string,
      {
        mapelId: string;
        mapelNama: string;
        harian: number | null;
        pts: number | null;
        pas: number | null;
        nilaiAkhir: number | null;
      }
    >();

    for (const n of nilaiRows) {
      const stdName = getStandardMapelName(n.mapel.nama);
      const existing = mapelScoreMap.get(stdName) || {
        mapelId: n.mapel.id,
        mapelNama: stdName,
        harian: null,
        pts: null,
        pas: null,
        nilaiAkhir: null,
      };
      const val = Number(n.nilai);
      if (n.jenis === "harian" || n.jenis === "harian_pas" || n.jenis === "harian_pts") {
        existing.harian = val;
      } else if (n.jenis === "pts") {
        existing.pts = val;
      } else if (n.jenis === "pas" || n.jenis === "ujian_akhir") {
        existing.pas = val;
      }
      existing.nilaiAkhir = existing.pas ?? existing.pts ?? existing.harian;
      mapelScoreMap.set(stdName, existing);
    }

    // Deduplikasi mapel dropdown jurnal
    const seenMapel = new Map<string, { id: string; nama: string }>();
    for (const m of mapelKelas) {
      const std = getStandardMapelName(m.nama);
      if (!seenMapel.has(std)) {
        seenMapel.set(std, { id: m.id, nama: std });
      }
    }

    const raporButtons = getRaporButtonState(
      nilaiRows.map((n) => ({ jenis: n.jenis, nilai: n.nilai }))
    );

    const latestKesehatan = kesehatanList[0] || null;

    return NextResponse.json({
      success: true,
      locked: false,
      spp,
      semester: isGanjil ? "Ganjil" : "Genap",
      tahunAjaran,
      biodata,
      keaktifanArab: keaktifanArab
        ? {
            predikat: keaktifanArab.predikat,
            catatan: keaktifanArab.catatan,
            tanggal: keaktifanArab.tanggal.toISOString().slice(0, 10),
            petugas: keaktifanArab.pegawai?.nama_lengkap || null,
          }
        : null,
      pelanggaran: pelanggaranList.map((item) => ({
        id: item.id,
        tanggal: item.tanggal.toISOString().slice(0, 10),
        pelanggaran: item.pelanggaran,
        sanksi: item.sanksi,
        kategori: item.kategori,
        petugas: item.pegawai?.nama_lengkap || null,
      })),
      kbm: {
        presensiJpl: {
          sakit: sakitJpl,
          izin: izinJpl,
          alpha: alphaJpl,
        },
        mapelOptions: Array.from(seenMapel.values()),
        ujianNilai: Array.from(mapelScoreMap.values()),
        ekskul: ekskulRows.map((e) => ({
          id: e.id,
          namaEkskul: e.nama_ekskul,
          nilai: e.nilai,
          nilaiAngka: e.nilai_angka,
          keterangan: e.keterangan,
        })),
        sikapKedisiplinan: penilaianWaliKelas
          ? {
              nilaiSikap: penilaianWaliKelas.nilai_sikap,
              skorSikap: penilaianWaliKelas.skor_sikap,
              nilaiKedisiplinan: penilaianWaliKelas.nilai_kedisiplinan,
              skorKedisiplinan: penilaianWaliKelas.skor_kedisiplinan,
              catatanWaliKelas: penilaianWaliKelas.catatan_wali_kelas,
              waliKelasNama: penilaianWaliKelas.pegawai?.nama_lengkap || null,
            }
          : null,
        raporButtons,
      },
      pengasuhan: pengasuhan
        ? {
            kebersihan_diri_kamar: pengasuhan.kebersihan_diri_kamar,
            kerapian_diri_barang: pengasuhan.kerapian_diri_barang,
            kemandirian: pengasuhan.kemandirian,
            kepatuhan_kedisiplinan: pengasuhan.kepatuhan_kedisiplinan,
            ibadah_akhlak: pengasuhan.ibadah_akhlak,
            mentoring_mulahadzoh: pengasuhan.mentoring_mulahadzoh,
            catatan_musyrif: pengasuhan.catatan_musyrif,
            tanggal: pengasuhan.tanggal.toISOString().slice(0, 10),
            musyrifNama: pengasuhan.pegawai?.nama_lengkap || null,
          }
        : null,
      halaqoh,
      kesehatan: latestKesehatan
        ? {
            tinggiBadan: latestKesehatan.tinggi_badan,
            beratBadan: latestKesehatan.berat_badan,
            riwayatSakit: latestKesehatan.riwayat_sakit,
            rambut: latestKesehatan.penilaian_rambut,
            kuku: latestKesehatan.penilaian_kuku,
            telinga: latestKesehatan.penilaian_telinga,
            gigi: latestKesehatan.penilaian_gigi,
            catatanGizi: latestKesehatan.catatan_gizi_kesehatan,
            tanggal: latestKesehatan.tanggal.toISOString().slice(0, 10),
            petugas: latestKesehatan.pegawai?.nama_lengkap || null,
            riwayatList: kesehatanList.map((k) => ({
              id: k.id,
              tanggal: k.tanggal.toISOString().slice(0, 10),
              tinggiBadan: k.tinggi_badan,
              beratBadan: k.berat_badan,
              riwayatSakit: k.riwayat_sakit,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/wali/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data dashboard ananda" },
      { status: 500 }
    );
  }
}
