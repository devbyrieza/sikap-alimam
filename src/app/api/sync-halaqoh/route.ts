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
      "Fiqri Ramdan Handoko", "Nurcahya Eka Putra", "Dicky", "Radhil"
    ]
  },
  {
    pengampu_nama: "Zeidhan",
    tingkatan: "PEMULA",
    nama_kelompok: "Halaqoh Ust. Zeidhan (Tahap Pemula)",
    santri: [
      "Muhammad Rizky", "Azka Panji Kusuma", "Abdullah Rasyid", 
      "Reo Afelano", "Naufal Dzaki", "Pandi Rianto"
    ]
  },
  {
    pengampu_nama: "Agus Cahyono",
    tingkatan: "MENENGAH",
    nama_kelompok: "Halaqoh Ust. Agus Cahyono (Tahap Menengah)",
    santri: [
      "Panji Ahmad", "Miizan Al-Ghifari Dizlilar", "Fariq Malaibui", "Labibullah El Fatih", 
      "Daffa Muammar Dzaki", "M Fazril Alkais", "Muhammad Hafidz Abdurrahman", "Iman Prayogo", 
      "Salman Abdulrahim", "Wahyu Hidayat", "Muhammad Khoirul Azzam", "Khubaib Abdul Aziz"
    ]
  },
  {
    pengampu_nama: "Azzam",
    tingkatan: "MENENGAH",
    nama_kelompok: "Halaqoh Ust. Azzam (Tahap Menengah)",
    santri: [
      "Abdul Aziz Ali", "Abdul Hakim", "Atqanul Ummah Ahmad", "Haidar Ayyubi", "Farid", 
      "Rifqi Arsyad Fadilah", "Muhammad Azzam Al Hafizh", "Ahmad Farros Al Barqy", "Yasser Ali Nurdin", 
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
      "Abdurrahim", "Syafiq Karimaly", "Abdurrahman"
    ]
  }
];

export async function GET(request: Request) {
    try {
    const { searchParams } = new URL(request.url);
    const resetCatatan = searchParams.get('resetCatatan') === 'true';
    const log: string[] = [];

    if (resetCatatan) {
      await prisma.catatanHalaqoh.deleteMany({});
      log.push("⚠️ Berhasil mereset semua data NILAI CATATAN HALAQOH.");
    }
    
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
                        const santri = semuaSantri.find(s => {
          const dbName = s.nama_lengkap.toLowerCase();
          const qName = namaSantri.toLowerCase();
          
          if (dbName.replace(/[^a-z0-9]/g, '').includes(qName.replace(/[^a-z0-9]/g, ''))) return true;
          if (qName.replace(/[^a-z0-9]/g, '').includes(dbName.replace(/[^a-z0-9]/g, ''))) return true;

          // Hardcoded fallbacks for the very problematic ones
          if (qName.includes('dicky') && (dbName.includes('dicky') || dbName.includes('diki') || dbName.includes('dwi'))) return true;
          if (qName.includes('radhil') && (dbName.includes('radil') || dbName.includes('radhil') || dbName.includes('radhiel'))) return true;
          if (qName.includes('panji ahmad') && (dbName.includes('panji') || dbName.includes('ahmad'))) return true;
          if (qName.includes('salman') && dbName.includes('salman')) return true;
          if (qName.includes('yasser') && (dbName.includes('yasser') || dbName.includes('yaseer') || dbName.includes('yasir') || dbName.includes('nurdin'))) return true;
          if (qName.includes('syafiq') && (dbName.includes('syafiq') || dbName.includes('syafik') || dbName.includes('karim'))) return true;
          if (qName.includes('abdurrahman') && dbName.includes('abdurrahman')) return true;
          if (qName.includes('abdurrahim') && dbName.includes('abdurrahim')) return true;

          // Fuzzy keyword match (at least ONE unique word matches)
          const searchWords = qName.split(' ').filter(w => w.length >= 4 && w !== 'muhammad' && w !== 'ahmad' && w !== 'andi');
          if (searchWords.length > 0) {
            return searchWords.some(w => dbName.includes(w));
          }
          return dbName.includes(qName.split(' ')[0]);
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
