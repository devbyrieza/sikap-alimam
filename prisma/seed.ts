import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ASATIDZ_CONFIG = [
  { nama: "Ust. Wahab Rajasam, M.Pd", role: "ADMIN_SUPER,GURU", jabatan: "Admin Super & Guru", kategori: "GURU" },
  { nama: "Rieza Eka Tomara, S.Kom", role: "ADMIN_SUPER", jabatan: "Admin Super IT", kategori: "GURU" },
  { nama: "Wahyudi Pranata, Lc.", role: "KADIV_PENGASUHAN,MUSYRIF", jabatan: "Kadiv Pengasuhan & Musyrif", kategori: "GURU" },
  { nama: "Imron Abdillah", role: "KADIV_KURIKULUM,WALI_KELAS,MUSYRIF,GURU", jabatan: "Kadiv Kurikulum & Wali Kelas IL", kategori: "GURU" },
  { nama: "Agus Cahyono", role: "WALI_KELAS,MUSYRIF,GURU", jabatan: "Wali Kelas MTs & Musyrif", kategori: "GURU" },
  { nama: "Muhammad Iqbal, S. Pd", role: "MUSYRIF,GURU", jabatan: "Musyrif & Guru", kategori: "GURU" },
  { nama: "Abdil Aziz, S.Pd., B.A.", role: "GURU,KADIV_KURIKULUM", jabatan: "Guru & Kurikulum", kategori: "GURU" },
  { nama: "Ikhwan Ramandhanu", role: "MUSYRIF", jabatan: "Musyrif / Pengasuh", kategori: "MUSYRIF" },
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
  { nis: "2602070019", nama: "Iman Prayogo", jk: "L" },
  { nis: "2602070020", nama: "Syeh Al Bani Irsyad Amrulloh", jk: "L" },
  { nis: "2602070021", nama: "Wahyu Hidayat", jk: "L" },
  { nis: "2602070022", nama: "Zakaria Reynaldo", jk: "L" },
];

const SANTRI_11_MA = [
  { nis: "121232020034222003", nama: "Pandi Rianto", jk: "L" },
  { nis: "510032020813221", nama: "Salman Abdulrahim Uran", jk: "L" },
  { nis: "131232020011241007", nama: "Radil", jk: "L" },
];

const SANTRI_12_MA = [
  { nis: "510032020813211029", nama: "Muhammad Abdul Rahman", jk: "L" },
  { nis: "510032020813211030", nama: "Muhammad Abdul Rohim", jk: "L" },
  { nis: "131232020011241006", nama: "Yasser Ali Nurdin", jk: "L" },
  { nis: "510032020813211031", nama: "Syafiq Karimalai", jk: "L" },
  { nis: "131232020011222010", nama: "Dicky Dwy AP", jk: "L" },
];

async function main() {
  console.log("🌱 Seeding database SIAKAD Al-Imam...");

  // 1. Admin user
  const adminPass = await bcrypt.hash("Paas2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pesantren-alimam.com" },
    update: { password: adminPass },
    create: {
      email: "admin@pesantren-alimam.com",
      password: adminPass,
      nama: "Administrator",
      role: "ADMIN_SUPER",
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
  const kelas11 = await prisma.kelas.upsert({
    where: { nama: "11 MA" },
    update: {},
    create: { nama: "11 MA", jenjang: "MA" },
  });
  const kelas12 = await prisma.kelas.upsert({
    where: { nama: "12 MA" },
    update: {},
    create: { nama: "12 MA", jenjang: "MA" },
  });
  console.log("✅ Kelas created: 7 MTs, IL, 11 MA, 12 MA");

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

  // 5. Asatidz & Civitas
  for (const item of ASATIDZ_CONFIG) {
    const slug = item.nama
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z.]/g, "");
    const email = `${slug}@pesantren-alimam.com`;
    const pass = await bcrypt.hash("Paas2026!", 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: { password: pass, role: item.role },
      create: { email, password: pass, nama: item.nama, role: item.role },
    });

    await prisma.pegawai.upsert({
      where: { user_id: user.id },
      update: { jabatan: item.jabatan, kategori_pegawai: item.kategori },
      create: {
        user_id: user.id,
        nama_lengkap: item.nama,
        jabatan: item.jabatan,
        kategori_pegawai: item.kategori,
      },
    });
  }
  console.log(`✅ ${ASATIDZ_CONFIG.length} civitas/asatidz dengan role struktural telah dikonfigurasi`);

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
  // 8. Santri 11 MA
  for (const s of SANTRI_11_MA) {
    const existing = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: s.nama },
    });
    if (!existing) {
      await prisma.santriAktif.create({
        data: {
          nis: s.nis || null,
          nama_lengkap: s.nama,
          kelas_id: kelas11.id,
          jenis_kelamin: s.jk,
        },
      });
    }
  }
  console.log(`✅ ${SANTRI_11_MA.length} santri 11 MA`);

  // 9. Santri 12 MA
  for (const s of SANTRI_12_MA) {
    const existing = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: s.nama },
    });
    if (!existing) {
      await prisma.santriAktif.create({
        data: {
          nis: s.nis || null,
          nama_lengkap: s.nama,
          kelas_id: kelas12.id,
          jenis_kelamin: s.jk,
        },
      });
    }
  }
  console.log(`✅ ${SANTRI_12_MA.length} santri 12 MA`);
  console.log("\n🎉 Seeding selesai!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
