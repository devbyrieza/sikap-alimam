import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SYNCING OFFICIAL SCHEDULE (REVISI 2 AGUSTUS 2026) ===");

  // 1. Fetch all Pegawai, Kelas, Mapel
  const [pegawaiList, kelasList, mapelList] = await Promise.all([
    prisma.pegawai.findMany(),
    prisma.kelas.findMany({ where: { is_active: true } }),
    prisma.mataPelajaran.findMany({ where: { is_active: true } }),
  ]);

  console.log(`Found ${pegawaiList.length} Pegawai, ${kelasList.length} Kelas, ${mapelList.length} Mapel.`);

  // Helper matching functions
  const findTeacher = (codeOrName: string) => {
    const q = codeOrName.toLowerCase();
    return pegawaiList.find((p) => {
      const name = p.nama_lengkap.toLowerCase();
      if (q === "a" || q.includes("abdil") || q.includes("azis") || q.includes("aziz")) return name.includes("aziz") || name.includes("azis");
      if (q === "b" || q.includes("ade")) return name.includes("ade") || name.includes("supiana");
      if (q === "c" || q.includes("agus")) return name.includes("agus") || name.includes("cahyono");
      if (q === "d" || q.includes("arifin") || q.includes("saefullah") || q.includes("syaifullah")) return name.includes("arifin") || name.includes("syaifullah") || name.includes("saefullah");
      if (q === "e" || q.includes("imran")) return name.includes("imran") || name.includes("abdillah");
      if (q === "f" || q.includes("hardi")) return name.includes("hardiansyah") || name.includes("hardi");
      if (q === "g" || q.includes("ikbal")) return name.includes("ikbal") || name.includes("iqbal");
      if (q === "h" || q.includes("thoriq")) return name.includes("thoriq") || name.includes("toriq");
      if (q === "i" || q.includes("rieza")) return name.includes("rieza") || name.includes("eka") || name.includes("tomara");
      if (q === "j" || q.includes("teguh")) return name.includes("teguh") || name.includes("hudaya");
      if (q === "k" || q.includes("wahab")) return name.includes("wahab") || name.includes("rajasam");
      if (q === "l" || q.includes("wahyudi")) return name.includes("wahyudi") || name.includes("pranata");
      if (q === "m" || q.includes("rizki") || q.includes("maulana")) return name.includes("maulana") || name.includes("rizki");
      return name.includes(q);
    });
  };

  const findKelas = (namaQuery: string) => {
    const q = namaQuery.toUpperCase();
    return kelasList.find((k) => {
      const kn = k.nama.toUpperCase();
      if (q === "7" || q === "MTS") return kn.includes("7") || kn.includes("MTS");
      if (q === "IL" || q === "IDAD") return kn.includes("IL") || kn.includes("I'DAD") || kn.includes("LUCHOWY") || kn.includes("LUGHOWI");
      return kn.includes(q);
    });
  };

  const findMapel = (namaQuery: string, kelasId?: string) => {
    const q = namaQuery.toLowerCase();
    const candidate = mapelList.filter((m) => {
      const mn = m.nama.toLowerCase();
      if (q.includes("akidah")) return mn.includes("akidah");
      if (q.includes("hadis")) return mn.includes("hadis");
      if (q.includes("fiqh")) return mn.includes("fiqh");
      if (q.includes("siroh")) return mn.includes("siroh");
      if (q.includes("kitabah")) return mn.includes("kitabah");
      if (q.includes("nahwu")) return mn.includes("nahwu");
      if (q.includes("shorf")) return mn.includes("shorf");
      if (q.includes("arab")) return mn.includes("arab");
      if (q.includes("entrepreneur") || q.includes("prakarya")) return mn.includes("entrepreneur") || mn.includes("prakarya");
      if (q.includes("indonesia")) return mn.includes("indonesia");
      if (q.includes("inggris")) return mn.includes("inggris");
      if (q.includes("matematika")) return mn.includes("matematika");
      if (q.includes("ipa")) return mn.includes("ipa");
      if (q.includes("tadribat")) return mn.includes("tadribat");
      if (q.includes("tahsin")) return mn.includes("tahsin");
      return mn.includes(q);
    });

    if (kelasId && candidate.length > 1) {
      const matched = candidate.find((m) => m.kelas_id === kelasId);
      if (matched) return matched;
    }

    return candidate[0];
  };

  const getWaktu = (jam: number) => {
    const map: Record<number, { mulai: string; selesai: string }> = {
      1: { mulai: "04:50", selesai: "05:30" },
      2: { mulai: "05:30", selesai: "06:10" },
      3: { mulai: "07:00", selesai: "07:40" },
      4: { mulai: "07:40", selesai: "08:20" },
      5: { mulai: "08:20", selesai: "09:00" },
      6: { mulai: "09:00", selesai: "09:40" },
      7: { mulai: "10:00", selesai: "10:40" },
      8: { mulai: "10:40", selesai: "11:20" },
      9: { mulai: "11:20", selesai: "12:00" },
    };
    return map[jam] || { mulai: "07:00", selesai: "07:40" };
  };

  // Schedule matrix definition
  const rawSchedule = [
    // === SENIN ===
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

    // === SELASA ===
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

    // === RABU ===
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

    // === KAMIS ===
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

    // === JUM'AT ===
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

    // === SABTU ===
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

  console.log(`Clearing existing JadwalPelajaran (${await prisma.jadwalPelajaran.count()} records)...`);
  await prisma.jadwalPelajaran.deleteMany({});

  let countCreated = 0;
  for (const item of rawSchedule) {
    const k = findKelas(item.kelas);
    const p = findTeacher(item.teacher);
    const m = findMapel(item.mapel, k?.id);

    if (!k) {
      console.warn(`[WARN] Kelas not found for: ${item.kelas}`);
      continue;
    }
    if (!p) {
      console.warn(`[WARN] Pegawai not found for: ${item.teacher}`);
      continue;
    }
    if (!m) {
      console.warn(`[WARN] Mapel not found for: ${item.mapel}`);
      continue;
    }

    const { mulai, selesai } = getWaktu(item.jam);

    await prisma.jadwalPelajaran.create({
      data: {
        hari: item.hari,
        jam_ke: item.jam,
        waktu_mulai: mulai,
        waktu_selesai: selesai,
        kelas_id: k.id,
        pegawai_id: p.id,
        mapel_id: m.id,
        tipe_pekan: item.pekan || "semua",
      },
    });

    countCreated++;
  }

  console.log(`✅ SUCCESSFULLY SYNCED ${countCreated} JADWAL PELAJARAN RECORDS!`);
}

main()
  .catch((e) => {
    console.error("Error syncing schedule:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
