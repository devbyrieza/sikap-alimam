import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// URL database SIMPEG di server Coolify (produksi)
const SIMPEG_DB_URL = "postgresql://user_office:password_rahasia_office123@ucso0wo8gg8owc880w8sco44:5432/postgres?schema=office";

async function main() {
  console.log("Memulai sinkronisasi data Guru dari SIMPEG (Produksi)...");

  const pgClient = new Client({
    connectionString: SIMPEG_DB_URL,
  });

  try {
    await pgClient.connect();
    console.log("Berhasil terhubung ke database SIMPEG.");

    // Ambil data dari SIMPEG (tabel office.pegawai)
    const res = await pgClient.query(`
      SELECT id, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, no_hp, email, alamat, kategori_pegawai 
      FROM office.pegawai 
      WHERE kategori_pegawai = 'ASATIDZ' 
         OR kategori_pegawai = 'GURU' 
         OR kategori_pegawai = 'Guru'
         OR kategori_pegawai ILIKE '%guru%'
    `);
    
    const simpegGuruList = res.rows;
    console.log(`Ditemukan ${simpegGuruList.length} data Guru (ASATIDZ/GURU) di SIMPEG.`);

    if (simpegGuruList.length === 0) {
      console.log("Tidak ada data guru yang ditemukan di SIMPEG. Sinkronisasi dibatalkan untuk menghindari penghapusan tidak disengaja.");
      return;
    }

    // Ambil data yang ada di SIKAP saat ini
    const sikapGuruList = await prisma.pegawai.findMany({
      where: { kategori_pegawai: 'ASATIDZ' }
    });

    const simpegGuruIds = new Set(simpegGuruList.map(g => g.id));
    
    // Cari Guru di SIKAP yang TIDAK ADA di SIMPEG untuk dihapus
    const toDeleteIds = sikapGuruList
      .filter(g => !simpegGuruIds.has(g.id))
      .map(g => g.id);

    if (toDeleteIds.length > 0) {
      console.log(`Akan menghapus ${toDeleteIds.length} data Guru di SIKAP yang tidak ada di SIMPEG.`);
      
      // Hapus relasi yang terikat terlebih dahulu agar tidak foreign key constraint error
      await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
      await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
      await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
      await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
      await prisma.capaianTahfidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
      await prisma.ibadahAdabSantri.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });

      // Hapus pegawai
      await prisma.pegawai.deleteMany({ where: { id: { in: toDeleteIds } } });
      console.log("Berhasil menghapus data guru lama.");
    }

    // Insert atau Update data dari SIMPEG ke SIKAP
    let updatedCount = 0;

    for (const guru of simpegGuruList) {
      try {
        await prisma.pegawai.upsert({
          where: { id: guru.id },
          update: {
            nik: guru.nik,
            nama_lengkap: guru.nama_lengkap,
            jenis_kelamin: guru.jenis_kelamin,
            tempat_lahir: guru.tempat_lahir,
            tanggal_lahir: guru.tanggal_lahir ? new Date(guru.tanggal_lahir) : null,
            no_hp: guru.no_hp,
            email: guru.email,
            alamat: guru.alamat,
            kategori_pegawai: 'ASATIDZ' // Normalisasi
          },
          create: {
            id: guru.id,
            nik: guru.nik || `GURU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            nama_lengkap: guru.nama_lengkap,
            jenis_kelamin: guru.jenis_kelamin,
            tempat_lahir: guru.tempat_lahir,
            tanggal_lahir: guru.tanggal_lahir ? new Date(guru.tanggal_lahir) : null,
            no_hp: guru.no_hp,
            email: guru.email,
            alamat: guru.alamat,
            kategori_pegawai: 'ASATIDZ'
          }
        });
        updatedCount++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.warn(`Peringatan: NIK atau Email bentrok untuk ${guru.nama_lengkap}. Melewati.`);
        } else {
          console.error(`Gagal sinkronisasi data untuk ${guru.nama_lengkap}:`, err.message);
        }
      }
    }

    console.log(`Sinkronisasi Selesai! (Diproses: ${updatedCount} data).`);

  } catch (error) {
    console.error("Terjadi kesalahan saat sinkronisasi:", error);
  } finally {
    await pgClient.end();
    await prisma.$disconnect();
  }
}

main();
