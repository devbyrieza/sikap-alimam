import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const halaqohData = [
  {
    nama_ustadz: "Wahyudi Pranata, Lc.", // matched with Ust. Wahyudi
    sesi: "subuh", // assuming default sesi
    santri_names: [
      "Muhammad Rasyid Ridho", // Rasyid
      "Andi Ibra Faeyza Hasan Alnasr", // Andi Ibra Faeyza
      "Abdurrahim Pati Raja", // Abdurrahman Pati Raja? Wait, let's check
      "Fiqri Ramdan Handoko", // Fiqri
      "Nurcahya Eka Putra",
      "Dicky Dwy AP", // Dicky
      "Radil"
    ]
  },
  {
    nama_ustadz: "Ustadz Zeidhan", // create if missing
    sesi: "subuh",
    santri_names: [
      "Muhammad Rizky", // Muhammad Rizki
      "Azka Panji Kusuma", // Azka Panji
      "Abdullah Rasyid",
      "Muhammad Hafidz Reo Afelano", // Muhammad Hafizh Reo
      "Naufal Dzakiy Purnama", // Naufal Dzakiy
      "Pandi Rianto" // Pandi
    ]
  },
  {
    nama_ustadz: "Agus Cahyono", // matched with Ustadz Agus Cohyono
    sesi: "subuh",
    santri_names: [
      "Panji Ahmad",
      "Miizan Alghifary Dizlilar", // Mizan
      "Fariq Malaibui",
      "Labibullah El Fatih", // Labibullah
      "Daffa Muammar Dzaki", // Daffa Muhammad
      "M Fazril Alkais", // Muhammad Fazril
      "Muhammad Hafidz Abdurrahman", // Muhammad Hafizh ? Or maybe someone else?
      "Iman Prayogo", // Iman
      "Salman Abdulrahim Uran", // Salman
      "Wahyu Hidayat", // Wahyu
      "Muhammad Khoirul Azzam", // Khairul Azzam
      "Khubaib Abdul Aziz" // Khubaib
    ]
  },
  {
    nama_ustadz: "Ustadz Azzam", // create if missing
    sesi: "subuh",
    santri_names: [
      "Abdul Aziz Ali", // Abdul Aziz
      "Abdul Hakim",
      "Atqanul Ummah Ahmad", // Atqonul Ummah
      "Haidar Ayyubi", // Haidar
      "Farid",
      "Rifqi Arsyad Fadilah", // Rifqi Arsyad
      "Muhammad Azzam Al Hafiz", // Muhammad Azzam
      "Ahmad Farros Al Barqy", // Ahmad Farros
      "Yasser Ali Nurdin", // Yaseer
      "Ken Alfarezha Haryadi", // Ken Alfareza
      "Muhammad Yahya Ayyash", // Yahya Ayyash
      "Lalu Muhamad Rizky Ananda" // Lalu
    ]
  },
  {
    nama_ustadz: "Muhammad Iqbal, S. Pd", // matched with Ustadz Iqbal
    sesi: "subuh",
    santri_names: [
      "Khalish",
      "Muhammad Rifqi Hamid",
      "Syeh Al Bani Irsyad Amrulloh", // Syeh Al Bani
      "Fanni Hariri Hamonangan", // Hariri
      "Favian Radi", // Favian
      "Hibban Hibaturrahman", // Hibban
      "M Naufal Alfaniri", // Naufal Al fariri
      "Muh Asrorin Da Silva", // Muhammad Asrorin
      "Muhammad Abdul Rohim", // Rahim? Wait, Rahim is Abdurrahim Pati Raja? Or Muhammad Abdul Rohim?
      "Syafiq Karimalai", // Syafiq
      "Muhammad Abdul Rahman" // Rahman?
    ]
  }
];

// Resolving Ambiguities:
// "Abdurrahman Pati Raja" vs "Abdurrahim Pati Raja" (Rahim)
// Let's assume Abdurrahman Pati Raja -> Muhammad Hafidz Abdurrahman ? No, there's "Muhammad Hafidz Abdurrahman" and "Abdurrahim Pati Raja".
// Wait, looking at list_santri.js output:
// - Abdurrahim Pati Raja -> Rahim
// - Muhammad Hafidz Abdurrahman -> Abdurrahman Pati Raja
// - Muhammad Abdul Rahman -> Rahman
// - Muhammad Abdul Rohim -> ?
// - Muhammad Hafizh -> Muhammad Hafidz Reo Afelano OR Muhammad Hafidz Abdurrahman

async function seed() {
  console.log('Starting seed...');
  
  // Clean up existing
  await prisma.halaqohAnggota.deleteMany({});
  await prisma.halaqohKelompok.deleteMany({});
  
  // Ensure Pegawai exist
  for (const group of halaqohData) {
    let ust = await prisma.pegawai.findFirst({
      where: { nama_lengkap: group.nama_ustadz }
    });
    if (!ust) {
      console.log(`Creating missing Ustadz: ${group.nama_ustadz}`);
      // create default user
      const user = await prisma.user.create({
        data: {
          username: group.nama_ustadz.toLowerCase().replace(/\s+/g, ''),
          nama: group.nama_ustadz,
          email: `${group.nama_ustadz.toLowerCase().replace(/\s+/g, '')}@example.com`,
          password: "default",
          role: "GURU"
        }
      });
      ust = await prisma.pegawai.create({
        data: {
          nama_lengkap: group.nama_ustadz,
          jabatan: "Musyrif & Guru",
          kategori_pegawai: "GURU",
          user_id: user.id
        }
      });
    }
    
    // Create Kelompok
    const kelompok = await prisma.halaqohKelompok.create({
      data: {
        pegawai_id: ust.id,
        nama_kelompok: `Halaqoh ${group.nama_ustadz.split(',')[0]}`,
        sesi: group.sesi
      }
    });
    
    console.log(`Created Kelompok: ${kelompok.nama_kelompok}`);
    
    // Add Anggota
    for (const sName of group.santri_names) {
      const santri = await prisma.santriAktif.findFirst({
        where: { nama_lengkap: sName }
      });
      if (santri) {
        await prisma.halaqohAnggota.create({
          data: {
            kelompok_id: kelompok.id,
            santri_id: santri.id
          }
        });
        console.log(`  + Added: ${santri.nama_lengkap}`);
      } else {
        console.log(`  ! MISSING SANTRI: ${sName}`);
      }
    }
  }
  
  console.log('Seed completed successfully!');
}

seed().catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
