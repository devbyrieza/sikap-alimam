import { prisma } from "@/lib/prisma";

export async function syncHalaqohFromExcel() {
  try {
    console.log("[AutoSyncHalaqoh] Starting sync halaqoh kelompok & anggota...");

    const [pegawaiList, santriList, kelasList] = await Promise.all([
      prisma.pegawai.findMany(),
      prisma.santriAktif.findMany(),
      prisma.kelas.findMany({ where: { is_active: true } }),
    ]);

    // Helper finding teacher
    const findTeacher = (nameQuery: string) => {
      const q = nameQuery.toLowerCase();
      return pegawaiList.find((p) => {
        const name = p.nama_lengkap.toLowerCase();
        if (q.includes("agus")) return name.includes("agus") || name.includes("cahyono");
        if (q.includes("imran") || q.includes("imron")) return name.includes("imran") || name.includes("abdillah");
        if (q.includes("ikbal") || q.includes("iqbal")) return name.includes("ikbal") || name.includes("iqbal");
        if (q.includes("ikhwan")) return name.includes("ikhwan");
        if (q.includes("wahyudi")) return name.includes("wahyudi") || name.includes("pranata");
        return name.includes(q);
      });
    };

    // Helper finding santri
    const findSantri = (nameQuery: string) => {
      const q = nameQuery.toLowerCase().trim();
      const parts = q.split(" ").filter((p) => p.length > 2);

      // Exact substring match
      let match = santriList.find((s) => s.nama_lengkap.toLowerCase().includes(q));
      if (match) return match;

      // Partial word match
      if (parts.length > 0) {
        match = santriList.find((s) => {
          const sn = s.nama_lengkap.toLowerCase();
          return parts.every((pt) => sn.includes(pt));
        });
      }

      if (match) return match;

      // First two words match
      if (parts.length >= 2) {
        match = santriList.find((s) => {
          const sn = s.nama_lengkap.toLowerCase();
          return sn.includes(parts[0]) && sn.includes(parts[1]);
        });
      }

      return match || null;
    };

    // Define official 5 Groups
    const groupsDefinition = [
      {
        musyrifQuery: "Agus Cahyono",
        namaKelompok: "Halaqoh Ust. Agus Cahyono (MTs)",
        santriNames: [
          "Abdul Aziz Ali",
          "Abdul Hakim",
          "Ahmad Farros Al Barqy",
          "Andi Ibra Faeyza Hasan Alnasr",
          "ATQANUL UMMAH AHMAD",
          "Azka Panji Kusuma",
          "Fariq Malaibui",
          "Haidar Ayyubi",
          "KHALISH",
          "Labibullah El Fatih",
        ],
      },
      {
        musyrifQuery: "Imran Abdillah",
        namaKelompok: "Halaqoh Ust. Imran Abdillah (IL)",
        santriNames: [
          "Muhammad Hafidz Abdurrahman",
          "Syeh Al bani Irsyad Amrullah",
          "Abdullah Rasyid",
          "Abdurrahim Pati Jaya",
          "Daffa Muammar Dzaki",
          "Fanni Hariri Hamonangan",
          "Farid",
          "Favian radi",
          "Fiqri Ramdan Handoko",
          "Hibban Hibaturrahman",
          "Nurcahya Eka Putra",
        ],
      },
      {
        musyrifQuery: "Iqbal",
        namaKelompok: "Halaqoh Ust. Iqbal (MTs)",
        santriNames: [
          "Muh Asrorin Da Silva",
          "Muhammad Azzam Al Hafidz",
          "Muhammad Hafidz Reo Afelano",
          "Muhammad Rifqi Hamid",
          "Muhammad Naufal Alfaniri",
          "M. Fazril Alkais",
          "Naufal Dzakiy Purnama",
          "Muhammad Yahya Ayyash",
          "Rifqi Arsyadi Fadilah",
        ],
      },
      {
        musyrifQuery: "Ikhwan",
        namaKelompok: "Halaqoh Ust. Ikhwan (Kls 11 & 12)",
        santriNames: [
          "Radil",
          "Salman",
          "Rohman",
          "Rohim",
          "Diki",
          "Syafiq",
          "Yaser",
        ],
      },
      {
        musyrifQuery: "Wahyudi",
        namaKelompok: "Halaqoh Ust. Wahyudi (IL)",
        santriNames: [
          "Ken Alfarezha Haryadi",
          "Khubaib Abdul Aziz",
          "Lalu Muhammad Rizky Ananda",
          "Mizan Alghofary Dizlilar",
          "Muhammad Khoirul Azzam",
          "Zakaria reynaldo",
          "Wahyu Hidayat",
          "Panji Ahmad",
          "Iman Prayogo", // Menggantikan Raylan Akbar
          "Muhammad Rizky",
          "Muhammad Rasyid Ridho",
        ],
      },
    ];

    const seseis = ["subuh", "maghrib", "dhuha"];

    // Clear existing groups & members cleanly
    await prisma.halaqohAnggota.deleteMany({});
    await prisma.halaqohKelompok.deleteMany({});

    let totalGroupsCreated = 0;
    let totalMembersCreated = 0;

    for (const groupDef of groupsDefinition) {
      let teacher = findTeacher(groupDef.musyrifQuery);
      if (!teacher) {
        try {
          teacher = await prisma.pegawai.create({
            data: {
              nama_lengkap: `Ust. ${groupDef.musyrifQuery}`,
              jenis_kelamin: "L",
              kategori_pegawai: "ASATIDZ",
              jabatan: "Musyrif Halaqoh",
            },
          });
          pegawaiList.push(teacher);
        } catch (e) {
          continue;
        }
      }

      for (const sesi of seseis) {
        const kel = await prisma.halaqohKelompok.create({
          data: {
            pegawai_id: teacher.id,
            nama_kelompok: `${groupDef.namaKelompok} - Sesi ${sesi.toUpperCase()}`,
            sesi: sesi,
            is_active: true,
          },
        });
        totalGroupsCreated++;

        for (const santriName of groupDef.santriNames) {
          let s = findSantri(santriName);
          if (!s) {
            try {
              s = await prisma.santriAktif.create({
                data: {
                  nama_lengkap: santriName,
                  nis: `SAN-${Math.floor(100000 + Math.random() * 900000)}`,
                  jenis_kelamin: "L",
                  kelas_id: kelasList[0]?.id || "",
                  is_active: true,
                },
              });
              santriList.push(s);
            } catch (e) {
              continue;
            }
          }

          if (s) {
            await prisma.halaqohAnggota.create({
              data: {
                kelompok_id: kel.id,
                santri_id: s.id,
                is_active: true,
              },
            });
            totalMembersCreated++;
          }
        }
      }
    }

    console.log(`[AutoSyncHalaqoh] Berhasil membuat ${totalGroupsCreated} kelompok halaqoh dan ${totalMembersCreated} entri anggota!`);
    return { success: true, totalGroupsCreated, totalMembersCreated };
  } catch (err) {
    console.error("[AutoSyncHalaqoh] Error:", err);
    throw err;
  }
}
