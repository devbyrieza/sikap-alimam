import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai import data Guru hasil fetch production ke DB Lokal...");

  const dataPath = 'gurus_production.json';
  if (!fs.existsSync(dataPath)) {
    console.error("File gurus_production.json tidak ditemukan! Silakan fetch terlebih dahulu.");
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const gurus = JSON.parse(rawData);
  console.log(`Membaca ${gurus.length} data Guru dari JSON.`);

  // Ambil guru yang ada di SIKAP saat ini
  const sikapGuruList = await prisma.pegawai.findMany({
    where: { kategori_pegawai: 'ASATIDZ' }
  });

  const incomingIds = new Set(gurus.map((g: any) => g.id));

  // Hapus guru yang tidak ada di list incoming (SIMPEG)
  const toDeleteIds = sikapGuruList
    .filter(g => !incomingIds.has(g.id))
    .map(g => g.id);

  if (toDeleteIds.length > 0) {
    console.log(`Menghapus ${toDeleteIds.length} data Guru lama di SIKAP...`);
    
    // Hapus relasi agar tidak foreign key violation
    await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.capaianTahfidz.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });
    await prisma.ibadahAdabSantri.deleteMany({ where: { pegawai_id: { in: toDeleteIds } } });

    await prisma.pegawai.deleteMany({ where: { id: { in: toDeleteIds } } });
    console.log("Data guru lama berhasil dibersihkan.");
  }

  // Import/Upsert guru baru
  let count = 0;
  for (const g of gurus) {
    await prisma.pegawai.upsert({
      where: { id: g.id },
      update: {
        nik: g.nik,
        nama_lengkap: g.nama_lengkap,
        jenis_kelamin: g.jenis_kelamin,
        tempat_lahir: g.tempat_lahir,
        tanggal_lahir: g.tanggal_lahir ? new Date(g.tanggal_lahir) : null,
        no_hp: g.no_hp,
        email: g.email,
        alamat: g.alamat,
        kategori_pegawai: 'ASATIDZ'
      },
      create: {
        id: g.id,
        nik: g.nik || `GURU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama_lengkap: g.nama_lengkap,
        jenis_kelamin: g.jenis_kelamin,
        tempat_lahir: g.tempat_lahir,
        tanggal_lahir: g.tanggal_lahir ? new Date(g.tanggal_lahir) : null,
        no_hp: g.no_hp,
        email: g.email,
        alamat: g.alamat,
        kategori_pegawai: 'ASATIDZ'
      }
    });
    count++;
  }

  console.log(`Sukses mengimport ${count} data Guru ke DB Lokal!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
