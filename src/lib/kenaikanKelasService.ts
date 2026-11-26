import { prisma } from "@/lib/prisma";

/**
 * Konfigurasi parameter kenaikan kelas otomatis.
 * TODO: Konfirmasi Mudir untuk syarat kelayakan kenaikan kelas (mis. batas nilai minimum, batas ketidakhadiran/alfa, dan syarat tahfidz).
 */
export interface KenaikanKelasConfig {
  // TODO: Konfirmasi Mudir — sementara null (otomatis naik kecuali masuk pengecualian manual)
  minRataRataNilai: number | null;
  maxAlfaPerTahun: number | null;
  // Peta urutan kenaikan kelas berdasarkan nama kelas (case-insensitive)
  progressionMap: Record<string, string | "LULUS">;
}

export const DEFAULT_KENAIKAN_KELAS_CONFIG: KenaikanKelasConfig = {
  minRataRataNilai: null, // TODO: Konfirmasi Mudir
  maxAlfaPerTahun: null, // TODO: Konfirmasi Mudir
  progressionMap: {
    "7 mts": "8 MTs",
    "8 mts": "9 MTs",
    "9 mts": "LULUS",
    "7 smp it": "8 SMP IT",
    "8 smp it": "9 SMP IT",
    "9 smp it": "10 SMA IT",
    "il": "10 MA",
    "10 ma": "11 MA",
    "11 ma": "12 MA",
    "12 ma": "LULUS",
    "10 sma it": "11 SMA IT",
    "11 sma it": "12 SMA IT",
    "12 sma it": "LULUS",
  },
};

export interface KenaikanKelasSummary {
  tahunAjaranAsal: string;
  tahunAjaranTujuan: string;
  dryRun: boolean;
  totalDiperiksa: number;
  naikKelas: number;
  tinggalKelas: number;
  lulus: number;
  dilewatiIdempotent: number;
  detail: Array<{
    santriId: string;
    nama: string;
    kelasAsal: string;
    kelasTujuan: string;
    status: "naik" | "tinggal" | "lulus" | "skipped";
    alasan?: string;
  }>;
}

function resolveNextClassName(
  currentClassName: string,
  progressionMap: Record<string, string | "LULUS">
): string | "LULUS" | null {
  const norm = currentClassName.trim().toLowerCase();
  if (progressionMap[norm]) return progressionMap[norm];

  // Fallback pola angka di awal nama kelas (mis. "7 MTs A" -> "8 MTs A")
  const match = currentClassName.match(/^(\d{1,2})\s+(.+)$/);
  if (match) {
    const grade = Number(match[1]);
    const rest = match[2];
    if (grade === 9 && rest.toLowerCase().includes("mts")) return "LULUS";
    if (grade === 12) return "LULUS";
    if (grade >= 7 && grade < 12) {
      return `${grade + 1} ${rest}`;
    }
  }
  return null;
}

/**
 * Service terpusat kenaikan kelas otomatis saat pergantian tahun ajaran.
 * - Idempotent: aman dijalankan berulang kali; santri yang sudah tercatat di `riwayat_kelas_santri`
 *   untuk `tahunAjaranTujuan` akan dilewati sehingga tidak pernah naik kelas dua kali.
 * - Mendukung pengecualian manual (`pengecualian_kenaikan_kelas`) untuk santri yang tidak naik kelas.
 */
export async function prosesKenaikanKelasOtomatis(params: {
  tahunAjaranAsal: string;
  tahunAjaranTujuan: string;
  dryRun?: boolean;
  config?: Partial<KenaikanKelasConfig>;
}): Promise<KenaikanKelasSummary> {
  const { tahunAjaranAsal, tahunAjaranTujuan, dryRun = false } = params;
  const config: KenaikanKelasConfig = {
    ...DEFAULT_KENAIKAN_KELAS_CONFIG,
    ...(params.config || {}),
    progressionMap: {
      ...DEFAULT_KENAIKAN_KELAS_CONFIG.progressionMap,
      ...(params.config?.progressionMap || {}),
    },
  };

  const [santriAktifList, allKelas, existingRiwayat, pengecualianList] = await Promise.all([
    prisma.santriAktif.findMany({
      where: { is_active: true, status_kesiswaan: "aktif" },
      include: { kelas: true },
      orderBy: { nama_lengkap: "asc" },
    }),
    prisma.kelas.findMany({ where: { is_active: true } }),
    prisma.riwayatKelasSantri.findMany({
      where: { tahun_ajaran: tahunAjaranTujuan },
      select: { santri_id: true },
    }),
    prisma.pengecualianKenaikanKelas.findMany({
      where: { tahun_ajaran_asal: tahunAjaranAsal },
    }),
  ]);

  const alreadyProcessed = new Set(existingRiwayat.map((r) => r.santri_id));
  const excludedMap = new Map(pengecualianList.map((e) => [e.santri_id, e.alasan || "Pengecualian manual"]));
  const kelasByNameLower = new Map(allKelas.map((k) => [k.nama.trim().toLowerCase(), k]));

  const summary: KenaikanKelasSummary = {
    tahunAjaranAsal,
    tahunAjaranTujuan,
    dryRun,
    totalDiperiksa: santriAktifList.length,
    naikKelas: 0,
    tinggalKelas: 0,
    lulus: 0,
    dilewatiIdempotent: 0,
    detail: [],
  };

  const ops: Array<() => Promise<unknown>> = [];

  for (const santri of santriAktifList) {
    if (alreadyProcessed.has(santri.id)) {
      summary.dilewatiIdempotent += 1;
      summary.detail.push({
        santriId: santri.id,
        nama: santri.nama_lengkap,
        kelasAsal: santri.kelas.nama,
        kelasTujuan: santri.kelas.nama,
        status: "skipped",
        alasan: `Sudah diproses untuk tahun ajaran ${tahunAjaranTujuan}`,
      });
      continue;
    }

    const excludedReason = excludedMap.get(santri.id);
    if (excludedReason) {
      summary.tinggalKelas += 1;
      summary.detail.push({
        santriId: santri.id,
        nama: santri.nama_lengkap,
        kelasAsal: santri.kelas.nama,
        kelasTujuan: santri.kelas.nama,
        status: "tinggal",
        alasan: excludedReason,
      });

      if (!dryRun) {
        ops.push(async () => {
          await prisma.riwayatKelasSantri.upsert({
            where: {
              santri_id_tahun_ajaran: {
                santri_id: santri.id,
                tahun_ajaran: tahunAjaranTujuan,
              },
            },
            update: {},
            create: {
              santri_id: santri.id,
              kelas_id: santri.kelas_id,
              kelas_nama: santri.kelas.nama,
              tahun_ajaran: tahunAjaranTujuan,
              status: "tinggal",
              catatan: excludedReason,
            },
          });
        });
      }
      continue;
    }

    const nextTarget = resolveNextClassName(santri.kelas.nama, config.progressionMap);
    if (!nextTarget) {
      summary.tinggalKelas += 1;
      summary.detail.push({
        santriId: santri.id,
        nama: santri.nama_lengkap,
        kelasAsal: santri.kelas.nama,
        kelasTujuan: santri.kelas.nama,
        status: "tinggal",
        alasan: "Pemetaan kelas tujuan belum dikonfigurasi",
      });
      continue;
    }

    if (nextTarget === "LULUS") {
      summary.lulus += 1;
      summary.detail.push({
        santriId: santri.id,
        nama: santri.nama_lengkap,
        kelasAsal: santri.kelas.nama,
        kelasTujuan: "Lulus / Alumni",
        status: "lulus",
      });

      if (!dryRun) {
        ops.push(async () => {
          await prisma.$transaction([
            prisma.santriAktif.update({
              where: { id: santri.id },
              data: { status_kesiswaan: "lulus", is_active: false },
            }),
            prisma.riwayatKelasSantri.upsert({
              where: {
                santri_id_tahun_ajaran: {
                  santri_id: santri.id,
                  tahun_ajaran: tahunAjaranTujuan,
                },
              },
              update: {},
              create: {
                santri_id: santri.id,
                kelas_id: santri.kelas_id,
                kelas_nama: santri.kelas.nama,
                tahun_ajaran: tahunAjaranTujuan,
                status: "lulus",
                catatan: `Lulus dari ${santri.kelas.nama} pada ${tahunAjaranAsal}`,
              },
            }),
          ]);
        });
      }
      continue;
    }

    const targetKelas = kelasByNameLower.get(nextTarget.trim().toLowerCase());
    if (!targetKelas) {
      summary.tinggalKelas += 1;
      summary.detail.push({
        santriId: santri.id,
        nama: santri.nama_lengkap,
        kelasAsal: santri.kelas.nama,
        kelasTujuan: nextTarget,
        status: "tinggal",
        alasan: `Kelas tujuan "${nextTarget}" belum tersedia di master kelas`,
      });
      continue;
    }

    summary.naikKelas += 1;
    summary.detail.push({
      santriId: santri.id,
      nama: santri.nama_lengkap,
      kelasAsal: santri.kelas.nama,
      kelasTujuan: targetKelas.nama,
      status: "naik",
    });

    if (!dryRun) {
      ops.push(async () => {
        await prisma.$transaction([
          prisma.santriAktif.update({
            where: { id: santri.id },
            data: { kelas_id: targetKelas.id },
          }),
          prisma.riwayatKelasSantri.upsert({
            where: {
              santri_id_tahun_ajaran: {
                santri_id: santri.id,
                tahun_ajaran: tahunAjaranTujuan,
              },
            },
            update: {},
            create: {
              santri_id: santri.id,
              kelas_id: targetKelas.id,
              kelas_nama: targetKelas.nama,
              tahun_ajaran: tahunAjaranTujuan,
              status: "naik",
              catatan: `Naik dari ${santri.kelas.nama} ke ${targetKelas.nama}`,
            },
          }),
        ]);
      });
    }
  }

  for (const runOp of ops) {
    await runOp();
  }

  return summary;
}
