import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";
import { getOfficialNis } from "@/lib/officialSantri";
import { getSession } from "@/lib/auth";
import { getStandardMapelName } from "@/lib/mapel";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let santri_id = searchParams.get("santri_id");
  const rawSemester = searchParams.get("semester") || "Ganjil";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";

  try {
    const session = await getSession();

    // Jika santri_id tidak dioper, cari santri milik Wali Santri yang sedang login
    if (!santri_id && session?.userId) {
      const orangTua = await prisma.orangTuaSantri.findFirst({
        where: { user_id: session.userId },
        select: { santri_id: true }
      });
      if (orangTua?.santri_id) {
        santri_id = orangTua.santri_id;
      }
    }

    // If no santri_id provided or found, default to the first active santri in db
    if (!santri_id) {
      const defaultSantri = await prisma.santriAktif.findFirst({
        where: { is_active: true },
        include: { kelas: true },
        orderBy: { nama_lengkap: "asc" }
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
        kelas: true
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    const kelas_id = santri.kelas_id;
    const klsNama = santri.kelas?.nama?.toUpperCase() || "";
    const isMA = santri.kelas && (
      santri.kelas.jenjang === "MA" || 
      klsNama.includes("MA") || 
      klsNama === "10" || 
      klsNama === "11" || 
      klsNama === "12" || 
      klsNama.startsWith("10") || 
      klsNama.startsWith("11") || 
      klsNama.startsWith("12")
    );

    // Normalisasi filter semester: mendukung "Ganjil" / "1" atau "Genap" / "2"
    const isGanjil = rawSemester === "1" || rawSemester.toLowerCase() === "ganjil";
    const semesterVariants = isGanjil ? ["Ganjil", "1"] : ["Genap", "2"];

    // 2. Get All Santri in the same Class (for Ranking)
    const temanSekelas = await prisma.santriAktif.findMany({
      where: { kelas_id: kelas_id, is_active: true },
      select: { id: true, nama_lengkap: true }
    });
    const jumlahSantri = temanSekelas.length;

    // 3. Get All Grades for the Class (untuk penentuan Ranking yang 100% selaras dengan Cetak Rapor)
    const allNilaiRaw = await prisma.nilaiSantri.findMany({
      where: {
        santri: { kelas_id: kelas_id },
        semester: { in: semesterVariants },
        tahun_ajaran
      },
      include: { mapel: true }
    });

    // Helper: Hitung Nilai Murni PTS per santri per mapel
    const getStudentScore = (sId: string, targetStandardName: string): number | null => {
      const vals = allNilaiRaw.filter(
        n => n.santri_id === sId && getStandardMapelName(n.mapel.nama, isMA) === targetStandardName
      );
      if (vals.length === 0) return null;

      const getVal = (jenis: string) => {
        const entry = vals.find(v => v.jenis === jenis);
        return entry ? Number(entry.nilai) : 0;
      };

      const hasPeriode = (suffix: string, ujianKey: string) => {
        return vals.some(
          v => v.jenis === `harian${suffix}` || 
               v.jenis === `kompetensi${suffix}` || 
               v.jenis === `sikap${suffix}` || 
               v.jenis === ujianKey
        );
      };

      if (hasPeriode("_pas", "pas")) {
        return Math.round(getVal("pas"));
      } else if (hasPeriode("_pts", "pts")) {
        return Math.round(getVal("pts"));
      }

      if (vals.some(v => v.jenis === "ujian")) {
        return Math.round(getVal("ujian"));
      }

      return Math.round(Number(vals[0].nilai));
    };

    const getRawStudentScore = (sId: string, targetStandardName: string): number | null => {
      const vals = allNilaiRaw.filter(
        n => n.santri_id === sId && getStandardMapelName(n.mapel.nama, isMA) === targetStandardName
      );
      if (vals.length === 0) return null;

      const getVal = (jenis: string) => {
        const entry = vals.find(v => v.jenis === jenis);
        return entry ? Number(entry.nilai) : 0;
      };

      const hasPeriode = (suffix: string, ujianKey: string) => {
        return vals.some(
          v => v.jenis === `harian${suffix}` || 
               v.jenis === `kompetensi${suffix}` || 
               v.jenis === `sikap${suffix}` || 
               v.jenis === ujianKey
        );
      };

      if (hasPeriode("_pas", "pas")) {
        return getVal("pas");
      } else if (hasPeriode("_pts", "pts")) {
        return getVal("pts");
      }

      if (vals.some(v => v.jenis === "ujian")) {
        return getVal("ujian");
      }

      return Number(vals[0].nilai);
    };

    const isSyariahOrBahasa = (name: string): boolean => {
      const low = name.toLowerCase();
      const umumKeywords = ["matematika", "mtk", "ipa", "ips", "indonesia", "inggris", "pjok", "penjas", "seni", "pkn", "informatika", "prakarya", "kewirausahaan", "entrepreneurship"];
      return !umumKeywords.some(u => low.includes(u));
    };

    // Ambil daftar mapel standar yang ada di kelas ini
    const mapelStandardMap = new Map<string, { standardName: string; rawNama: string; nama_arab?: string | null; kategori: string }>();
    allNilaiRaw.forEach(n => {
      const std = getStandardMapelName(n.mapel.nama, isMA);
      if (!mapelStandardMap.has(std)) {
        mapelStandardMap.set(std, {
          standardName: std,
          rawNama: n.mapel.nama,
          nama_arab: n.mapel.nama_arab,
          kategori: n.mapel.kategori || "syariah"
        });
      }
    });
    const classStandardMapels = Array.from(mapelStandardMap.values());

    // 4. Hitung Total dan Ranking untuk Setiap Santri di Kelas (5-tier tie-breaker)
    const santriTotals = temanSekelas.map(s => {
      let total = 0;
      let totalRaw = 0;
      let count = 0;
      let diniyahTotal = 0;

      classStandardMapels.forEach(m => {
        const val = getStudentScore(s.id, m.standardName);
        const rawVal = getRawStudentScore(s.id, m.standardName);
        if (val !== null) {
          total += val;
          count++;
        }
        if (rawVal !== null) {
          totalRaw += rawVal;
          if (isSyariahOrBahasa(m.standardName)) {
            diniyahTotal += rawVal;
          }
        }
      });

      const average = count > 0 ? Math.round(total / count) : 0;
      const averageRaw = count > 0 ? (totalRaw / count) : 0;

      return {
        id: s.id,
        nama: s.nama_lengkap,
        total: Math.round(total),
        totalRaw,
        average,
        averageRaw,
        diniyahTotal
      };
    });

    const sortedTotals = [...santriTotals].sort((a, b) => {
      if (Math.abs(b.averageRaw - a.averageRaw) > 0.0001) {
        return b.averageRaw - a.averageRaw;
      }
      if (Math.abs(b.totalRaw - a.totalRaw) > 0.0001) {
        return b.totalRaw - a.totalRaw;
      }
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      if (Math.abs(b.diniyahTotal - a.diniyahTotal) > 0.0001) {
        return b.diniyahTotal - a.diniyahTotal;
      }
      return a.nama.localeCompare(b.nama);
    });

    const rankMap = new Map<string, number>();
    sortedTotals.forEach((st, index) => {
      rankMap.set(st.id, index + 1);
    });

    const currentSantriData = santriTotals.find(s => s.id === santri_id);
    const studentTotalNilai = currentSantriData?.total || 0;
    const rataRataTotal = currentSantriData?.average || 0;
    const studentRank = rankMap.get(santri_id) || 1;

    // 5. Presensi & Breakdown (Hanya Presensi KBM Pelajaran Resmi di Kelas)
    const presensiRaw = await prisma.presensiSiswa.findMany({
      where: { 
        santri_id,
        mapel_id: { not: null }
      },
      include: { mapel: { select: { nama: true } } },
      orderBy: { tanggal: "desc" }
    });

    const presensi = presensiRaw.filter((p) => p.mapel?.nama != null);
    
    const getDateString = (d: Date) => d.toISOString().split("T")[0];
    const datesHadir = new Set<string>();
    const datesSakit = new Set<string>();
    const datesIzin = new Set<string>();
    const datesAlpha = new Set<string>();
    const datesTotal = new Set<string>();

    presensi.forEach(p => {
      const d = getDateString(p.tanggal);
      datesTotal.add(d);
      if (p.status === "hadir") datesHadir.add(d);
      if (p.status === "sakit") datesSakit.add(d);
      if (p.status === "izin") datesIzin.add(d);
      if (p.status === "alpha") datesAlpha.add(d);
    });

    const totalHari = datesTotal.size;
    const totalHadir = datesHadir.size;
    const totalSakit = datesSakit.size;
    const totalIzin = datesIzin.size;
    const totalAlpha = datesAlpha.size;
    const persentaseKehadiran = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 100;

    // 6. Get Jurnal Mengajar di Kelas Santri
    const jurnalKelas = await prisma.jurnalMengajar.findMany({
      where: { kelas_id: santri.kelas_id },
      orderBy: { tanggal: "desc" },
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
        mapel: { select: { id: true, nama: true, kategori: true } }
      }
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
      catatan: j.catatan || ""
    }));

    // 7. Get Tahfidz & Ujian
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 15
    });

    const ujianTahfidz = await prisma.ujianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" }
    });

    // 8. Get Akademik (Nilai Santri)
    const akademik = await prisma.nilaiSantri.findMany({
      where: {
        santri_id,
        semester: { in: semesterVariants },
        tahun_ajaran
      },
      include: {
        mapel: true
      },
      orderBy: { created_at: "asc" }
    });

    // Extract unique mapel list
    const mapelMap = new Map();
    akademik.forEach((n) => {
      if (n.mapel && !mapelMap.has(n.mapel_id)) {
        mapelMap.set(n.mapel_id, {
          id: n.mapel_id,
          nama: n.mapel.nama.replace(/^\[.*?\]\s*/, ""),
          kategori: n.mapel.kategori || "umum"
        });
      }
    });

    // Also include mapels from class master if available
    const classMapels = await prisma.mataPelajaran.findMany({
      where: { kelas_id: santri.kelas_id, is_active: true },
      select: { id: true, nama: true, kategori: true },
      orderBy: { nama: "asc" }
    });
    classMapels.forEach((m) => {
      const cleanNama = m.nama.replace(/^\[.*?\]\s*/, "");
      if (!mapelMap.has(m.id)) {
        mapelMap.set(m.id, {
          id: m.id,
          nama: cleanNama,
          kategori: m.kategori || "umum"
        });
      }
    });

    const mapelList = Array.from(mapelMap.values()).sort((a, b) => a.nama.localeCompare(b.nama, "id"));

    // 9. Get Ibadah & Adab
    const ibadah = await prisma.ibadahAdabSantri.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 30
    });

    let shubuhJamaah = 0;
    ibadah.forEach((i) => {
      if (i.shubuh === "Berjamaah") shubuhJamaah++;
    });
    const persentaseShubuh = ibadah.length > 0 ? Math.round((shubuhJamaah / ibadah.length) * 100) : 100;
    const sppInfo = await cekStatusSpp(santri.id);

    const userRole = (session?.role || "WALI_SANTRI").toUpperCase();
    const isStaff = userRole !== "WALI_SANTRI" && (
      userRole.includes("ADMIN") || 
      userRole.includes("GURU") || 
      userRole.includes("MUDIR") || 
      userRole.includes("KEPALA") || 
      userRole.includes("KADIV") || 
      userRole.includes("MUSYRIF")
    );

    const isAccessLocked = !sppInfo.lunas && sppInfo.status !== "menunggu_verifikasi" && !sppInfo.isUnlockedManual;

    return NextResponse.json({
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: getOfficialNis(santri.nama_lengkap) || santri.nis,
        kelas: santri.kelas.nama,
        jenjang: santri.kelas.jenjang,
        foto_url: santri.foto_url,
        semester: isGanjil ? "Ganjil" : "Genap",
        tahun_ajaran
      },
      is_locked: isAccessLocked && !isStaff,
      spp: sppInfo,
      ringkasan: (isAccessLocked && !isStaff) ? {
        persentaseKehadiran: 0,
        totalHari: 0,
        totalHadir: 0,
        totalSakit: 0,
        totalIzin: 0,
        totalAlpha: 0,
        persentaseShubuh: 0,
        ranking: 0,
        totalNilai: 0,
        rataRata: 0,
        jumlahSantri
      } : {
        persentaseKehadiran,
        totalHari,
        totalHadir,
        totalSakit,
        totalIzin,
        totalAlpha,
        persentaseShubuh,
        ranking: studentRank,
        totalNilai: Math.round(studentTotalNilai),
        rataRata: Math.round(rataRataTotal),
        jumlahSantri
      },
      detail: (isAccessLocked && !isStaff) ? {
        presensi: [],
        jurnal: [],
        akademik: [],
        mapelList: [],
        tahfidz: [],
        ujianTahfidz: [],
        ibadah: []
      } : {
        presensi: presensi.map((p) => ({
          id: p.id,
          tanggal: p.tanggal.toISOString().split("T")[0],
          status: p.status,
          mapel_nama: p.mapel?.nama ? p.mapel.nama.replace(/^\[.*?\]\s*/, "") : null,
          jam_ke: p.jam_ke,
          keterangan: p.keterangan || ""
        })),
        jurnal: formattedJurnal,
        akademik: akademik.map((a) => ({
          id: a.id,
          mapel_id: a.mapel_id,
          mapel_nama: a.mapel?.nama ? a.mapel.nama.replace(/^\[.*?\]\s*/, "") : "Mapel",
          mapel_kategori: a.mapel?.kategori || "umum",
          jenis: a.jenis,
          nilai: a.nilai,
          keterangan: a.keterangan
        })),
        mapelList,
        tahfidz,
        ujianTahfidz,
        ibadah
      }
    });
  } catch (error) {
    console.error("Error generating rapor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
