import { prisma } from "@/lib/prisma";

const HALAMAN_PER_JUZ = 20;

export interface HalaqohSummaryResult {
  kelompokNama: string | null;
  pengampuNama: string | null;
  targetJuz: number;
  totalDihafalJuz: number;
  totalSetoranZiyadah: number;
  bulan: number;
  tahun: number;
  capaianBulanIni: {
    jumlahSetoran: number;
    totalHalaman: number;
    totalJuz: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
  };
  setoranTerbaru: Array<{
    id: string;
    tanggal: string;
    sesi: string;
    jenis: string;
    surahNama: string;
    surahSelesaiNama: string | null;
    ayatDari: number;
    ayatKe: number;
    jumlahHalaman: number;
    kehadiran: string;
    nilaiAkhir: number;
    catatan: string | null;
  }>;
}

/**
 * Menghitung ringkasan Halaqoh secara otomatis dari data setoran (`catatan_halaqoh`).
 * Total juz dihafal TIDAK pernah diinput manual, melainkan dihitung dari akumulasi halaman ziyadah / 20.
 */
export async function computeHalaqohSummary(
  santriId: string,
  month?: number,
  year?: number
): Promise<HalaqohSummaryResult> {
  const now = new Date();
  const targetMonth = month && month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  const targetYear = year && year >= 2020 ? year : now.getFullYear();

  const monthStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const monthEnd = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

  const [santri, anggota, allCatatan] = await Promise.all([
    prisma.santriAktif.findUnique({
      where: { id: santriId },
      select: { target_juz: true },
    }),
    prisma.halaqohAnggota.findFirst({
      where: { santri_id: santriId, is_active: true },
      include: {
        kelompok: {
          include: {
            pegawai: { select: { nama_lengkap: true } },
          },
        },
      },
    }),
    prisma.catatanHalaqoh.findMany({
      where: { santri_id: santriId },
      orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
    }),
  ]);

  let totalHalamanZiyadah = 0;
  let totalSetoranZiyadah = 0;

  let jumlahSetoranBulanIni = 0;
  let totalHalamanBulanIni = 0;
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alfa = 0;

  for (const row of allCatatan) {
    const keh = (row.kehadiran || "hadir").toLowerCase();
    const jenis = (row.jenis || "").toLowerCase();
    const hal = Number(row.jumlah_halaman) || 0;

    if (jenis === "ziyadah" && keh === "hadir") {
      totalHalamanZiyadah += hal;
      totalSetoranZiyadah += 1;
    }

    const tgl = new Date(row.tanggal);
    if (tgl >= monthStart && tgl <= monthEnd) {
      if (keh === "hadir") {
        hadir += 1;
        jumlahSetoranBulanIni += 1;
        if (jenis === "ziyadah") {
          totalHalamanBulanIni += hal;
        }
      } else if (keh === "sakit") {
        sakit += 1;
      } else if (keh === "izin") {
        izin += 1;
      } else if (keh === "alfa" || keh === "alpha") {
        alfa += 1;
      }
    }
  }

  const totalDihafalJuz = Math.round((totalHalamanZiyadah / HALAMAN_PER_JUZ) * 100) / 100;
  const capaianJuzBulanIni = Math.round((totalHalamanBulanIni / HALAMAN_PER_JUZ) * 100) / 100;

  return {
    kelompokNama: anggota?.kelompok?.nama_kelompok || null,
    pengampuNama: anggota?.kelompok?.pegawai?.nama_lengkap || null,
    targetJuz: Number(santri?.target_juz ?? 3),
    totalDihafalJuz,
    totalSetoranZiyadah,
    bulan: targetMonth,
    tahun: targetYear,
    capaianBulanIni: {
      jumlahSetoran: jumlahSetoranBulanIni,
      totalHalaman: Math.round(totalHalamanBulanIni * 10) / 10,
      totalJuz: capaianJuzBulanIni,
      hadir,
      sakit,
      izin,
      alfa,
    },
    setoranTerbaru: allCatatan.slice(0, 15).map((r) => ({
      id: r.id,
      tanggal: r.tanggal.toISOString().slice(0, 10),
      sesi: r.sesi,
      jenis: r.jenis,
      surahNama: r.surah_nama,
      surahSelesaiNama: r.surah_selesai_nama,
      ayatDari: r.ayat_dari,
      ayatKe: r.ayat_ke,
      jumlahHalaman: r.jumlah_halaman,
      kehadiran: r.kehadiran,
      nilaiAkhir: r.nilai_akhir,
      catatan: r.catatan,
    })),
  };
}
