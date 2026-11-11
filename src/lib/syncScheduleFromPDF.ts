import { getStandardMapelName } from "@/lib/mapel";
import { prisma } from "@/lib/prisma";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

export const DEFAULT_SESI_WAKTU = [
  { jam_ke: 1, waktu_mulai: "04:50", waktu_selesai: "05:30", durasi_menit: 40 },
  { jam_ke: 2, waktu_mulai: "05:30", waktu_selesai: "06:10", durasi_menit: 40 },
  { jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", durasi_menit: 40 },
  { jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", durasi_menit: 40 },
  { jam_ke: 5, waktu_mulai: "08:20", waktu_selesai: "09:00", durasi_menit: 40 },
  { jam_ke: 6, waktu_mulai: "09:00", waktu_selesai: "09:40", durasi_menit: 40 },
  { jam_ke: 7, waktu_mulai: "10:00", waktu_selesai: "10:40", durasi_menit: 40 },
  { jam_ke: 8, waktu_mulai: "10:40", waktu_selesai: "11:20", durasi_menit: 40 },
  { jam_ke: 9, waktu_mulai: "11:20", waktu_selesai: "12:00", durasi_menit: 40 },
] as const;

interface RawScheduleEntry {
  hari: string;
  jam: number;
  kelas: "7" | "IL";
  teacher: string;
  mapel: string;
  pekan?: "ganjil" | "genap" | "semua";
}

export const OFFICIAL_RAW_SCHEDULE: RawScheduleEntry[] = [
  // Senin
  { hari: "Senin", jam: 3, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 4, kelas: "7", teacher: "B", mapel: "Bahasa Indonesia" },
  { hari: "Senin", jam: 4, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 5, kelas: "7", teacher: "B", mapel: "Bahasa Indonesia" },
  { hari: "Senin", jam: 5, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 6, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 6, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 7, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 7, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 8, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 8, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Senin", jam: 9, kelas: "7", teacher: "C", mapel: "Kitabah" },
  { hari: "Senin", jam: 9, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },

  // Selasa
  { hari: "Selasa", jam: 3, kelas: "7", teacher: "H", mapel: "Hadis" },
  { hari: "Selasa", jam: 3, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Selasa", jam: 4, kelas: "7", teacher: "H", mapel: "Hadis" },
  { hari: "Selasa", jam: 4, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Selasa", jam: 5, kelas: "7", teacher: "K", mapel: "Fiqh" },
  { hari: "Selasa", jam: 5, kelas: "IL", teacher: "H", mapel: "Siroh Nabi" },
  { hari: "Selasa", jam: 6, kelas: "7", teacher: "K", mapel: "Fiqh" },
  { hari: "Selasa", jam: 6, kelas: "IL", teacher: "H", mapel: "Siroh Nabi" },
  { hari: "Selasa", jam: 7, kelas: "7", teacher: "F", mapel: "IPA Terpadu" },
  { hari: "Selasa", jam: 7, kelas: "IL", teacher: "K", mapel: "Fiqh" },
  { hari: "Selasa", jam: 8, kelas: "7", teacher: "F", mapel: "IPA Terpadu" },
  { hari: "Selasa", jam: 8, kelas: "IL", teacher: "K", mapel: "Fiqh" },
  { hari: "Selasa", jam: 9, kelas: "7", teacher: "M", mapel: "Bahasa Inggris" },
  { hari: "Selasa", jam: 9, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },

  // Rabu
  { hari: "Rabu", jam: 3, kelas: "7", teacher: "H", mapel: "Hadis" },
  { hari: "Rabu", jam: 4, kelas: "7", teacher: "H", mapel: "Hadis" },
  { hari: "Rabu", jam: 5, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Rabu", jam: 5, kelas: "IL", teacher: "H", mapel: "Hadis" },
  { hari: "Rabu", jam: 6, kelas: "7", teacher: "I", mapel: "Matematika" },
  { hari: "Rabu", jam: 6, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Rabu", jam: 7, kelas: "7", teacher: "H", mapel: "Siroh Nabi" },
  { hari: "Rabu", jam: 7, kelas: "IL", teacher: "C", mapel: "Kitabah" },
  { hari: "Rabu", jam: 8, kelas: "7", teacher: "H", mapel: "Siroh Nabi" },
  { hari: "Rabu", jam: 8, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Rabu", jam: 9, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Rabu", jam: 9, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },

  // Kamis
  { hari: "Kamis", jam: 3, kelas: "7", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 3, kelas: "7", teacher: "M", mapel: "Bahasa Inggris", pekan: "genap" },
  { hari: "Kamis", jam: 3, kelas: "IL", teacher: "D", mapel: "Akidah", pekan: "semua" },
  { hari: "Kamis", jam: 4, kelas: "7", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 4, kelas: "7", teacher: "M", mapel: "Bahasa Inggris", pekan: "genap" },
  { hari: "Kamis", jam: 4, kelas: "IL", teacher: "D", mapel: "Akidah", pekan: "semua" },
  { hari: "Kamis", jam: 5, kelas: "7", teacher: "D", mapel: "Akidah", pekan: "semua" },
  { hari: "Kamis", jam: 5, kelas: "IL", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 5, kelas: "IL", teacher: "E", mapel: "Nahwu", pekan: "genap" },
  { hari: "Kamis", jam: 6, kelas: "7", teacher: "D", mapel: "Akidah", pekan: "semua" },
  { hari: "Kamis", jam: 6, kelas: "IL", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 6, kelas: "IL", teacher: "E", mapel: "Nahwu", pekan: "genap" },
  { hari: "Kamis", jam: 7, kelas: "7", teacher: "L", mapel: "Bahasa Arab", pekan: "semua" },
  { hari: "Kamis", jam: 7, kelas: "IL", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 7, kelas: "IL", teacher: "E", mapel: "Nahwu", pekan: "genap" },
  { hari: "Kamis", jam: 8, kelas: "7", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 8, kelas: "7", teacher: "M", mapel: "Bahasa Inggris", pekan: "genap" },
  { hari: "Kamis", jam: 8, kelas: "IL", teacher: "E", mapel: "Nahwu", pekan: "semua" },
  { hari: "Kamis", jam: 9, kelas: "7", teacher: "J", mapel: "Entrepreneurship", pekan: "ganjil" },
  { hari: "Kamis", jam: 9, kelas: "7", teacher: "M", mapel: "Bahasa Inggris", pekan: "genap" },
  { hari: "Kamis", jam: 9, kelas: "IL", teacher: "A", mapel: "Bahasa Arab", pekan: "semua" },

  // Jumat
  { hari: "Jumat", jam: 3, kelas: "7", teacher: "I", mapel: "Matematika" },
  { hari: "Jumat", jam: 3, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 4, kelas: "7", teacher: "I", mapel: "Matematika" },
  { hari: "Jumat", jam: 4, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 5, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 5, kelas: "IL", teacher: "C", mapel: "Tadribat Alal Anmath" },
  { hari: "Jumat", jam: 6, kelas: "7", teacher: "G", mapel: "Shorf" },
  { hari: "Jumat", jam: 6, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 7, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 7, kelas: "IL", teacher: "G", mapel: "Shorf" },
  { hari: "Jumat", jam: 8, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Jumat", jam: 8, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },

  // Sabtu
  { hari: "Sabtu", jam: 5, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 5, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 6, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 6, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 7, kelas: "7", teacher: "L", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 7, kelas: "IL", teacher: "A", mapel: "Bahasa Arab" },
  { hari: "Sabtu", jam: 8, kelas: "7", teacher: "G", mapel: "Tahsin Al-Quran" },
  { hari: "Sabtu", jam: 8, kelas: "IL", teacher: "E", mapel: "Tahsin Al-Quran" },
  { hari: "Sabtu", jam: 9, kelas: "7", teacher: "G", mapel: "Tahsin Al-Quran" },
  { hari: "Sabtu", jam: 9, kelas: "IL", teacher: "E", mapel: "Tahsin Al-Quran" },
];

export async function ensureDefaultSesiWaktu() {
  const existing = await prisma.masterSesiWaktu.findMany({
    orderBy: { jam_ke: "asc" },
  });
  if (existing.length > 0) return existing;

  await prisma.masterSesiWaktu.createMany({
    data: DEFAULT_SESI_WAKTU.map((s) => ({ ...s, is_active: true })),
    skipDuplicates: true,
  });

  return prisma.masterSesiWaktu.findMany({
    orderBy: { jam_ke: "asc" },
  });
}

export async function syncScheduleFromPDF(options?: {
  force?: boolean;
  syncTeacherSubjects?: boolean;
}) {
  const force = Boolean(options?.force);

  try {
    const sesiList = await ensureDefaultSesiWaktu();
    const existingCount = await prisma.jadwalPelajaran.count();

    if (existingCount > 0 && !force) {
      return {
        skipped: true,
        countCreated: 0,
        existingCount,
        totalTemplate: OFFICIAL_RAW_SCHEDULE.length,
        skippedEntries: 0,
      };
    }

    console.log(
      `[AutoSyncSchedule] Sinkronisasi ${OFFICIAL_RAW_SCHEDULE.length} slot jadwal resmi (${force ? "force" : "initial"})...`,
    );

    const [pegawaiList, kelasList, mapelList] = await Promise.all([
      prisma.pegawai.findMany(),
      prisma.kelas.findMany({
        where: { is_active: true },
        include: { _count: { select: { santri: true } } },
      }),
      prisma.mataPelajaran.findMany({ where: { is_active: true } }),
    ]);

    // 1. Pastikan Ust. Abdil Aziz, B.A. tersedia sebagai pengampu Kode A (Bahasa Arab IL)
    let abdilAziz = pegawaiList.find((p) => {
      const n = p.nama_lengkap.toLowerCase();
      return n.includes("aziz") || n.includes("azis");
    });
    if (!abdilAziz) {
      try {
        const createdAziz = await prisma.pegawai.create({
          data: {
            nama_lengkap: "Abdil Aziz, B.A.",
            jenis_kelamin: "L",
            kategori_pegawai: "ASATIDZ",
            jabatan: "Guru Bahasa Arab",
            mata_pelajaran: "IL: Bahasa Arab",
          },
          include: undefined,
        });
        abdilAziz = createdAziz;
        pegawaiList.push(createdAziz);
      } catch {
        // Abaikan jika sudah ada secara paralel
      }
    }

    // 2. Pastikan Ust. Maulidin Bachtiar tersedia sebagai pengampu Kode M (Bahasa Inggris)
    let maulidin = pegawaiList.find((p) => {
      const n = p.nama_lengkap.toLowerCase();
      return n.includes("maulidin") || n.includes("bachtiar");
    });
    if (!maulidin) {
      try {
        const createdMaulidin = await prisma.pegawai.create({
          data: {
            nama_lengkap: "Maulidin Bachtiar",
            jenis_kelamin: "L",
            kategori_pegawai: "GURU",
            jabatan: "Admin Keuangan & Guru Bahasa Inggris",
            mata_pelajaran: "7 MTs: Bahasa Inggris",
          },
        });
        maulidin = createdMaulidin;
        pegawaiList.push(createdMaulidin);
      } catch {
        // Abaikan jika sudah ada secara paralel
      }
    }

    // 3. Sinkronkan tabel relasi asatidzm_mapel bagi guru yang belum tersinkron dari string mata_pelajaran
    const shouldSyncSubjects =
      options?.syncTeacherSubjects !== false && (force || existingCount === 0);
    let refreshedMapelList = mapelList;
    if (shouldSyncSubjects) {
      const existingRels = await prisma.asatidzmMapel.findMany({
        select: { pegawai_id: true },
      });
      const syncedIds = new Set(existingRels.map((r) => r.pegawai_id));
      for (const p of pegawaiList) {
        if (p.mata_pelajaran?.trim() && (force || !syncedIds.has(p.id))) {
          await syncAsatidzMapel(p.id, p.mata_pelajaran).catch(() => {});
        }
      }
      refreshedMapelList = await prisma.mataPelajaran.findMany({
        where: { is_active: true },
      });
    }

    const findTeacher = (codeOrName: string) => {
      const q = codeOrName.toLowerCase();
      return pegawaiList.find((p) => {
        const name = p.nama_lengkap.toLowerCase();
        if (
          q === "a" ||
          q.includes("abdil") ||
          q.includes("azis") ||
          q.includes("aziz")
        ) {
          return name.includes("aziz") || name.includes("azis");
        }
        if (q === "b" || q.includes("ade")) {
          return name.includes("ade") || name.includes("supiana");
        }
        if (q === "c" || q.includes("agus")) {
          return name.includes("agus") || name.includes("cahyono");
        }
        if (
          q === "d" ||
          q.includes("arifin") ||
          q.includes("saefullah") ||
          q.includes("syaifullah")
        ) {
          return (
            name.includes("arifin") ||
            name.includes("syaifullah") ||
            name.includes("saefullah")
          );
        }
        if (q === "e" || q.includes("imran") || q.includes("imron")) {
          return (
            name.includes("imran") ||
            name.includes("imron") ||
            name.includes("abdillah")
          );
        }
        if (q === "f" || q.includes("hardi")) {
          return name.includes("hardiansyah") || name.includes("hardi");
        }
        if (q === "g" || q.includes("ikbal") || q.includes("iqbal")) {
          return name.includes("ikbal") || name.includes("iqbal");
        }
        if (q === "h" || q.includes("thoriq")) {
          return name.includes("thoriq") || name.includes("toriq");
        }
        if (q === "i" || q.includes("rieza")) {
          return (
            name.includes("rieza") ||
            name.includes("eka") ||
            name.includes("tomara")
          );
        }
        if (q === "j" || q.includes("teguh")) {
          return name.includes("teguh") || name.includes("hudaya");
        }
        if (q === "k" || q.includes("wahab")) {
          return name.includes("wahab") || name.includes("rajasam");
        }
        if (q === "l" || q.includes("wahyudi")) {
          return (
            name.includes("pranata") ||
            (name.includes("wahyudi") && !name.includes("imam"))
          );
        }
        if (
          q === "m" ||
          q.includes("maulidin") ||
          q.includes("bachtiar") ||
          q.includes("rizki") ||
          q.includes("maulana")
        ) {
          return (
            name.includes("maulidin") ||
            name.includes("bachtiar") ||
            name.includes("maulana") ||
            name.includes("rizki")
          );
        }
        return name.includes(q);
      });
    };

    const sortedKelas = [...kelasList].sort(
      (a, b) => (b._count?.santri || 0) - (a._count?.santri || 0),
    );

    const findKelas = (namaQuery: string) => {
      const q = namaQuery.toUpperCase().trim();
      if (q === "7" || q === "MTS") {
        return (
          sortedKelas.find((k) => {
            const kn = k.nama.toUpperCase().trim();
            return kn === "7 MTS" || kn === "7";
          }) ||
          sortedKelas.find((k) => {
            const kn = k.nama.toUpperCase();
            return kn.includes("7") || kn.includes("MTS");
          })
        );
      }
      if (q === "IL" || q === "IDAD") {
        return (
          sortedKelas.find((k) => k.nama.toUpperCase().trim() === "IL") ||
          sortedKelas.find((k) => {
            const kn = k.nama.toUpperCase();
            return (
              kn.includes("I'DAD") ||
              kn.includes("IDAD") ||
              kn.includes("LUGHOW") ||
              kn.includes("LUCHOW") ||
              kn === "IL" ||
              kn.startsWith("IL ")
            );
          })
        );
      }
      return sortedKelas.find((k) => k.nama.toUpperCase().includes(q));
    };

    const findMapel = (namaQuery: string, kelasId?: string) => {
      const q = namaQuery.toLowerCase().trim();
      const standardName = getStandardMapelName(namaQuery, false).toLowerCase();
      const candidate = refreshedMapelList.filter((m) => {
        const mn = m.nama.toLowerCase().trim();
        if (mn === q || (standardName && mn === standardName)) return true;
        if (q.includes("akidah") || q.includes("aqidah")) {
          return mn.includes("akidah") || mn.includes("aqidah") || mn.includes("tauhid");
        }
        if (q.includes("hadis")) {
          return mn.includes("hadis") || mn.includes("hadits");
        }
        if (q.includes("fiqh") || q.includes("fiqih") || q.includes("fikih")) {
          return (
            (mn.includes("fiqh") || mn.includes("fiqih") || mn.includes("fikih")) &&
            !mn.includes("ushul")
          );
        }
        if (q.includes("siroh") || q.includes("sirah")) {
          return mn.includes("siroh") || mn.includes("sirah");
        }
        if (q.includes("kitabah") || q.includes("khitobah")) {
          return mn.includes("kitabah") || mn.includes("khitobah");
        }
        if (q.includes("nahwu")) return mn.includes("nahwu");
        if (q.includes("shorf") || q.includes("shorof") || q.includes("sharaf")) {
          return mn.includes("shorf") || mn.includes("shorof") || mn.includes("sharaf");
        }
        if (q.includes("arab")) return mn.includes("arab");
        if (
          q.includes("entrepreneur") ||
          q.includes("prakarya") ||
          q.includes("kewirausahaan")
        ) {
          return (
            mn.includes("entrepreneur") ||
            mn.includes("prakarya") ||
            mn.includes("kewirausahaan")
          );
        }
        if (q.includes("indonesia")) return mn.includes("indonesia");
        if (q.includes("inggris") || q.includes("english")) {
          return mn.includes("inggris") || mn.includes("english");
        }
        if (q.includes("matematika") || q === "mtk") {
          return mn.includes("matematika") || mn === "mtk";
        }
        if (q.includes("ipa")) return mn.includes("ipa");
        if (q.includes("tadribat")) return mn.includes("tadribat");
        if (q.includes("tahsin")) {
          return mn.includes("tahsin") || mn.includes("tahfidz") || mn.includes("tahfiz");
        }
        return mn.includes(q);
      });

      const inKelas = kelasId
        ? candidate.filter((m) => m.kelas_id === kelasId)
        : candidate;
      const pool = inKelas.length > 0 ? inKelas : candidate;

      return (
        pool.find((m) => m.nama.toLowerCase().trim() === standardName) ||
        pool.find((m) => m.nama.toLowerCase().trim() === q) ||
        pool[0]
      );
    };

    const sesiTimeMap = new Map<number, { mulai: string; selesai: string }>();
    for (const d of DEFAULT_SESI_WAKTU) {
      sesiTimeMap.set(d.jam_ke, {
        mulai: d.waktu_mulai,
        selesai: d.waktu_selesai,
      });
    }
    for (const s of sesiList) {
      sesiTimeMap.set(s.jam_ke, {
        mulai: s.waktu_mulai,
        selesai: s.waktu_selesai,
      });
    }

    const rowsToInsert: {
      hari: string;
      jam_ke: number;
      waktu_mulai: string;
      waktu_selesai: string;
      kelas_id: string;
      pegawai_id: string;
      mapel_id: string;
      tipe_pekan: string;
    }[] = [];

    let skippedEntries = 0;
    for (const item of OFFICIAL_RAW_SCHEDULE) {
      const k = findKelas(item.kelas);
      const p = findTeacher(item.teacher);
      const m = findMapel(item.mapel, k?.id);

      if (!k || !p || !m) {
        skippedEntries++;
        continue;
      }

      const timing = sesiTimeMap.get(item.jam) || {
        mulai: "07:00",
        selesai: "07:40",
      };

      rowsToInsert.push({
        hari: item.hari,
        jam_ke: item.jam,
        waktu_mulai: timing.mulai,
        waktu_selesai: timing.selesai,
        kelas_id: k.id,
        pegawai_id: p.id,
        mapel_id: m.id,
        tipe_pekan: item.pekan || "semua",
      });
    }

    await prisma.$transaction(async (tx) => {
      if (force) {
        await tx.jadwalPelajaran.deleteMany({});
      } else {
        const checkAgain = await tx.jadwalPelajaran.count();
        if (checkAgain > 0) return;
      }

      if (rowsToInsert.length > 0) {
        await tx.jadwalPelajaran.createMany({ data: rowsToInsert });
      }
    });

    console.log(
      `[AutoSyncSchedule] Berhasil menyinkronkan ${rowsToInsert.length}/${OFFICIAL_RAW_SCHEDULE.length} slot jadwal resmi.`,
    );

    return {
      skipped: false,
      countCreated: rowsToInsert.length,
      totalTemplate: OFFICIAL_RAW_SCHEDULE.length,
      skippedEntries,
    };
  } catch (err) {
    console.error("[AutoSyncSchedule] Error:", err);
    throw err;
  }
}
