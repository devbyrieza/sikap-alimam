import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const HALAQOH_DATA = [
  {
    pengampu_nama: "Wahyudi", // Will match "Wahyudi Pranata" etc
    tingkatan: "PEMULA",
    nama_kelompok: "Halaqoh Ust. Wahyudi (Tahap Pemula)",
    santri: [
      "Muhammad Rasyid Ridho", "Andi Ibra Faeyza Hasan Al-Nasr", "Abdurrahim Pati Raja", 
      "Fiqri Ramdan Handoko", "Nurcahya Eka Putra", "Dicky Dwi", "Radil"
    ]
  },
  {
    pengampu_nama: "Zeidhan",
    tingkatan: "PEMULA",
    nama_kelompok: "Halaqoh Ust. Zeidhan (Tahap Pemula)",
    santri: [
      "Muhammad Rizki", "Azka Panji Kusuma", "Abdullah Rasyid", 
      "Muhammad Hafizh Reo Afelano", "Naufal Dzaki Purnama", "Pandi Rianto"
    ]
  },
  {
    pengampu_nama: "Agus Cahyono",
    tingkatan: "MENENGAH",
    nama_kelompok: "Halaqoh Ust. Agus Cahyono (Tahap Menengah)",
    santri: [
      "Panji Ahmad", "Miizan Al-Ghifari Dizlilar", "Fariq Malaibui", "Labibullah El Fatih", 
      "Daffa Muammar Dzaki", "M Fazril Alkais", "Muhammad Hafidz Abdurrahman", "Iman Prayogo", 
      "Salman Abdulrahim Uran", "Wahyu Hidayat", "Muhammad Khoirul Azzam", "Khubaib Abdul Aziz"
    ]
  },
  {
    pengampu_nama: "Azzam",
    tingkatan: "MENENGAH",
    nama_kelompok: "Halaqoh Ust. Azzam (Tahap Menengah)",
    santri: [
      "Abdul Aziz Ali", "Abdul Hakim", "Atqanul Ummah Ahmad", "Haidar Ayyubi", "Farid", 
      "Rifqi Arsyad Fadilah", "Muhammad Azzam Al Hafizh", "Ahmad Farros Al Barqy", "Yaseer Ali Nurdin", 
      "Ken Alfarezha Haryadi", "Muhammad Yahya Ayyash", "Lalu Muhamad Rizky Ananda"
    ]
  },
  {
    pengampu_nama: "Iqbal",
    tingkatan: "LANJUTAN",
    nama_kelompok: "Halaqoh Ust. Iqbal (Tahap Lanjutan)",
    santri: [
      "Khalish", "Muhammad Rifqi Hamid", "Syeh Al Bani", "Fanni Hariri Hamonangan", 
      "Favian Radi", "Hibban Hibaturrahman", "M Naufal Alfaniri", "Muh Asrorin Da Silva", 
      "Muhammad Abdurrahim", "Syafiq Karimalai", "Muhammad Abdurrahman"
    ]
  }
];

export async function GET(request: Request) {
  try {
    const log: string[] = [];
    
    // 1. Dapatkan semua santri & pegawai untuk pencocokan ID
    const semuaSantri = await prisma.santriAktif.findMany();
    const semuaPegawai = await prisma.pegawai.findMany();

    // 2. Hapus semua keanggotaan dan kelompok halaqoh yang lama (reset)
    await prisma.halaqohAnggota.deleteMany({});
    await prisma.halaqohKelompok.deleteMany({});
    log.push("✅ Berhasil mereset (menghapus) semua kelompok halaqoh lama.");

    // 3. Loop dan buat kelompok baru berdasarkan data array
    for (const data of HALAQOH_DATA) {
      // Cari ID Pegawai berdasarkan nama
      const pegawai = semuaPegawai.find(p => p.nama_lengkap.toLowerCase().includes(data.pengampu_nama.toLowerCase()));
      
      if (!pegawai) {
        log.push(`❌ Gagal menemukan Pegawai dengan nama mengandung "${data.pengampu_nama}". Melewati...`);
        continue;
      }

      // Buat Kelompok Baru
      const kelompok = await prisma.halaqohKelompok.create({
        data: {
          pegawai_id: pegawai.id,
          nama_kelompok: data.nama_kelompok,
          tingkatan: data.tingkatan
        }
      });
      log.push(`✅ Berhasil membuat kelompok: ${data.nama_kelompok}`);

      // Cari ID Santri dan masukkan ke Kelompok
      let santriDitemukan = 0;
      for (const namaSantri of data.santri) {
        // Hapus tanda baca/spasi ekstra untuk pencocokan yang lebih akurat
        const searchName = namaSantri.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const santri = semuaSantri.find(s => {
          const dbName = s.nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, '');
          // Cek apakah mirip (substring) atau ada typo sedikit
          return dbName.includes(searchName) || searchName.includes(dbName);
        });

        if (santri) {
          await prisma.halaqohAnggota.create({
            data: {
              kelompok_id: kelompok.id,
              santri_id: santri.id,
              is_active: true
            }
          });
          santriDitemukan++;
        } else {
          log.push(`   ⚠️ Peringatan: Santri "${namaSantri}" tidak ditemukan di database.`);
        }
      }
      log.push(`   -> Berhasil memasukkan ${santriDitemukan}/${data.santri.length} santri ke kelompok ini.`);
    }

    return NextResponse.json({ success: true, message: "Sinkronisasi berhasil dijalankan", log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
