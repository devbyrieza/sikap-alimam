import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// URL database SIMPEG Fallback (Jika env tidak diset)
const FALLBACK_DB_URL = "postgresql://postgres:nhzYTBmfqk8RUhOoYHmvkbzoN2OhN@127.0.0.1:5433/ppdb_alimam?schema=public";

async function main() {
  const SIMPEG_DB_URL = process.env.SIMPEG_DATABASE_URL || FALLBACK_DB_URL;
  console.log("Memulai sinkronisasi data Guru dari SIMPEG...");
  
  // Parse skema secara dinamis dari URL koneksi
  let schema = "public";
  try {
    const urlObj = new URL(SIMPEG_DB_URL);
    schema = urlObj.searchParams.get("schema") || "public";
  } catch (e) {
    console.warn("Gagal mengekstrak nama skema dari URL, default ke 'public'.");
  }

  console.log(`Menghubungkan ke DB SIMPEG dengan skema: '${schema}'`);

  const pgClient = new Client({
    connectionString: SIMPEG_DB_URL,
  });

  try {
    await pgClient.connect();
    console.log("Berhasil terhubung ke database SIMPEG.");

    // Query dinamis berdasarkan skema (office.pegawai di prod, public.pegawai di lokal)
    const queryStr = `
      SELECT id, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, no_hp, email, alamat, kategori_pegawai, mata_pelajaran 
      FROM ${schema}.pegawai 
      WHERE kategori_pegawai = 'ASATIDZ' 
         OR kategori_pegawai = 'GURU' 
         OR kategori_pegawai = 'Guru'
         OR kategori_pegawai ILIKE '%guru%'
    `;

    const res = await pgClient.query(queryStr);
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
            mata_pelajaran: guru.mata_pelajaran,
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
            mata_pelajaran: guru.mata_pelajaran,
            kategori_pegawai: 'ASATIDZ'
          }
        });

        // Auto-mapping ke AsatidzmMapel jika ada mata_pelajaran
        if (guru.mata_pelajaran) {
          // Normalisasi nama mapel agar cocok dengan data SIKAP
          let searchName = guru.mata_pelajaran;
          const lowerMapel = guru.mata_pelajaran.toLowerCase();
          if (lowerMapel.includes("qur'an") || lowerMapel.includes("tahfidz") || lowerMapel.includes("tahfizh")) {
            searchName = "Tahfizh";
          } else if (lowerMapel === "fiqih" || lowerMapel === "fiqh") {
            searchName = "Fiqh";
          } else if (lowerMapel === "aqidah" || lowerMapel === "akidah") {
            searchName = "Akidah";
          } else if (lowerMapel === "hadits" || lowerMapel === "hadis") {
            searchName = "Hadis";
          } else if (lowerMapel === "tarikh" || lowerMapel.includes("siroh")) {
            searchName = "Siroh";
          } else if (lowerMapel === "ipa") {
            searchName = "IPA";
          }

          // Cari mapel di SIKAP yang namanya mengandung nilai dari SIMPEG (case-insensitive)
          const matchedMapel = await prisma.mataPelajaran.findFirst({
            where: {
              nama: {
                contains: searchName,
                mode: 'insensitive'
              }
            }
          });

          if (matchedMapel) {
            // Ambil semua kelas di SIKAP
            const allKelas = await prisma.kelas.findMany();
            for (const k of allKelas) {
              await prisma.asatidzmMapel.upsert({
                where: {
                  pegawai_id_mapel_id_kelas_id: {
                    pegawai_id: guru.id,
                    mapel_id: matchedMapel.id,
                    kelas_id: k.id
                  }
                },
                update: {},
                create: {
                  pegawai_id: guru.id,
                  mapel_id: matchedMapel.id,
                  kelas_id: k.id
                }
              });
            }
          }
        }

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
