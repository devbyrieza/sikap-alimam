import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ASATIDZ = [
  "Abdil Aziz",
  "Agus Cahyono",
  "Ade Supiana",
  "Arifin Syaifullah",
  "Bachtiar",
  "Imam Wahyudi",
  "Imran Fathillah",
  "Muhammad Iqbal",
  "Ramdan",
  "Rieza",
  "Saif",
  "Teguh",
  "Thoriq",
  "Wahab Rajasam",
  "Wahyudi Pranata",
];

const MAPEL_7MTS = [
  "Akidah",
  "Hadis",
  "Fiqh",
  "Siroh Nabi",
  "Kitabah",
  "Shorf",
  "Bahasa Arab",
  "Entrepreneurship",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Matematika",
  "IPA Terpadu",
  "Tahsin/Tahfidz Al-Quran",
];

const MAPEL_IL = [
  "Akidah",
  "Hadis",
  "Fiqh",
  "Siroh Nabi",
  "Kitabah",
  "Tadribat Alal Anmath",
  "Nahwu",
  "Shorf",
  "Bahasa Arab",
  "Entrepreneurship",
  "Tahsin/Tahfiz Al Quran",
];

async function main() {
  console.log("🌱 Seeding database SIAKAD Al-Imam...");

  // 1. Admin user
  const adminPass = await bcrypt.hash("AdminAlimam2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pesantren-alimam.com" },
    update: {},
    create: {
      email: "admin@pesantren-alimam.com",
      password: adminPass,
      nama: "Administrator",
      role: "admin",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // 2. Kelas
  const kelas7 = await prisma.kelas.upsert({
    where: { nama: "7 MTs" },
    update: {},
    create: { nama: "7 MTs", jenjang: "MTs" },
  });
  const kelasIL = await prisma.kelas.upsert({
    where: { nama: "IL" },
    update: {},
    create: { nama: "IL", jenjang: "Islamiyah" },
  });
  console.log("✅ Kelas created: 7 MTs, IL");

  // 3. Mata Pelajaran Kelas 7
  for (const nama of MAPEL_7MTS) {
    await prisma.mataPelajaran.upsert({
      where: { nama_kelas_id: { nama, kelas_id: kelas7.id } },
      update: {},
      create: { nama, kelas_id: kelas7.id },
    });
  }
  console.log(`✅ ${MAPEL_7MTS.length} mapel Kelas 7 MTs`);

  // 4. Mata Pelajaran Kelas IL
  for (const nama of MAPEL_IL) {
    await prisma.mataPelajaran.upsert({
      where: { nama_kelas_id: { nama, kelas_id: kelasIL.id } },
      update: {},
      create: { nama, kelas_id: kelasIL.id },
    });
  }
  console.log(`✅ ${MAPEL_IL.length} mapel Kelas IL`);

  // 5. Asatidz
  for (const nama of ASATIDZ) {
    // Buat user login untuk tiap asatidz
    const slug = nama
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z.]/g, "");
    const email = `${slug}@pesantren-alimam.com`;
    const pass = await bcrypt.hash("GuruAlimam2026!", 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pass, nama, role: "guru" },
    });

    await prisma.asatidz.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        nama_lengkap: nama,
        jenis: "guru",
      },
    });
  }
  console.log(`✅ ${ASATIDZ.length} asatidz dengan akun login`);

  console.log("\n🎉 Seeding selesai!");
  console.log("📧 Admin login: admin@pesantren-alimam.com / AdminAlimam2026!");
  console.log("📧 Guru login : nama.guru@pesantren-alimam.com / alimam123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
