import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ASATIDZ = [
  "Agus Cahyono",
  "Wahyudi Pranata, Lc.",
  "Imran Abdillah",
  "Ramdan",
  "Abdil Aziz, S.Pd., B.A.",
  "Rieza Eka Tomara, S.Kom"
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

const SANTRI_MTS = [
  { nis: "2601070001", nama: "Atqanul Ummah Ahmad", jk: "L" },
  { nis: "2601070002", nama: "Abdul Aziz Ali", jk: "L" },
  { nis: "2601070003", nama: "Abdul Hakim", jk: "L" },
  { nis: "2601070004", nama: "Ahmad Farros Al Barqy", jk: "L" },
  { nis: "2601070005", nama: "Andi Ibra Faeyza Hasan Alnasr", jk: "L" },
  { nis: "2601070006", nama: "Azka Panji Kusuma", jk: "L" },
  { nis: "2601070007", nama: "Fariq Malaibui", jk: "L" },
  { nis: "2601070008", nama: "Haidar Ayyubi", jk: "L" },
  { nis: "2601070009", nama: "Khalish", jk: "L" },
  { nis: "2601070010", nama: "Labibullah El Fatih", jk: "L" },
  { nis: "2601070011", nama: "M Fazril Alkais", jk: "L" },
  { nis: "2601070012", nama: "M Naufal Alfaniri", jk: "L" },
  { nis: "2601070013", nama: "Muhammad Rifqi Hamid", jk: "L" },
  { nis: "2601070014", nama: "Muh Asrorin Da Silva", jk: "L" },
  { nis: "2601070015", nama: "Muhammad Hafidz Reo Afelano", jk: "L" },
  { nis: "2601070016", nama: "Muhammad Yahya Ayyash", jk: "L" },
  { nis: "2601070017", nama: "Naufal Dzakiy Purnama", jk: "L" },
  { nis: "2601070018", nama: "Rifqi Arsyad Fadilah", jk: "L" },
  { nis: "2601070019", nama: "Muhammad Azzam Al Hafiz", jk: "L" },
];

const SANTRI_IL = [
  { nis: "2602070001", nama: "Abdullah Rasyid", jk: "L" },
  { nis: "2602070002", nama: "Abdurrahim Pati Raja", jk: "L" },
  { nis: "2602070003", nama: "Daffa Muammar Dzaki", jk: "L" },
  { nis: "2602070004", nama: "Farid", jk: "L" },
  { nis: "2602070005", nama: "Favian Radi", jk: "L" },
  { nis: "2602070006", nama: "Fanni Hariri Hamonangan", jk: "L" },
  { nis: "2602070007", nama: "Fiqri Ramdan Handoko", jk: "L" },
  { nis: "2602070008", nama: "Hibban Hibaturrahman", jk: "L" },
  { nis: "2602070009", nama: "Khubaib Abdul Aziz", jk: "L" },
  { nis: "2602070010", nama: "Ken Alfarezha Haryadi", jk: "L" },
  { nis: "2602070011", nama: "Lalu Muhamad Rizky Ananda", jk: "L" },
  { nis: "2602070012", nama: "Miizan Alghifary Dizlilar", jk: "L" },
  { nis: "2602070013", nama: "Muhammad Hafidz Abdurrahman", jk: "L" },
  { nis: "2602070014", nama: "Muhammad Khoirul Azzam", jk: "L" },
  { nis: "2602070015", nama: "Muhammad Rasyid Ridho", jk: "L" },
  { nis: "2602070016", nama: "Muhammad Rizky", jk: "L" },
  { nis: "2602070017", nama: "Nurcahya Eka Putra", jk: "L" },
  { nis: "2602070018", nama: "Panji Ahmad", jk: "L" },
  { nis: "2602070020", nama: "Syeh Al Bani Irsyad Amrulloh", jk: "L" },
  { nis: "2602070021", nama: "Wahyu Hidayat", jk: "L" },
  { nis: "2602070022", nama: "Zakaria Reynaldo", jk: "L" },
];

async function main() {
  console.log("🌱 Seeding database SIAKAD Al-Imam...");

  // 1. Admin user
  const adminPass = await bcrypt.hash("AdminAlimam2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pesantren-alimam.com" },
    update: { password: adminPass },
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
      update: { password: pass },
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

  // 6. Santri MTs
  for (const s of SANTRI_MTS) {
    const existing = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: s.nama },
    });
    if (!existing) {
      await prisma.santriAktif.create({
        data: {
          nis: s.nis || null,
          nama_lengkap: s.nama,
          kelas_id: kelas7.id,
          jenis_kelamin: s.jk,
        },
      });
    }
  }
  console.log(`✅ ${SANTRI_MTS.length} santri MTs`);

  // 7. Santri IL
  for (const s of SANTRI_IL) {
    const existing = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: s.nama },
    });
    if (!existing) {
      await prisma.santriAktif.create({
        data: {
          nis: s.nis || null,
          nama_lengkap: s.nama,
          kelas_id: kelasIL.id,
          jenis_kelamin: s.jk,
        },
      });
    }
  }
  console.log(`✅ ${SANTRI_IL.length} santri IL`);

  console.log("\n🎉 Seeding selesai!");
  console.log("📧 Admin login: admin@pesantren-alimam.com / AdminAlimam2026!");
  console.log("📧 Guru login : nama.guru@pesantren-alimam.com / alimam123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
