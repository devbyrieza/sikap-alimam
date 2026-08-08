import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Ambil Kelas IL
    const kelasIL = await prisma.kelas.findFirst({ where: { nama: 'IL' } });
    const kelasMTs = await prisma.kelas.findFirst({ where: { nama: '7 MTs' } });

    if (!kelasIL || !kelasMTs) {
      throw new Error("Kelas IL atau 7 MTs tidak ditemukan");
    }

    // 2. Hapus Raylan Akbar jika masih ada
    const deletedRaylan = await prisma.santriAktif.deleteMany({
      where: {
        nama_lengkap: { contains: 'Raylan', mode: 'insensitive' }
      }
    });
    console.log(`Raylan dihapus: ${deletedRaylan.count}`);

    // 3. Upsert Iman Prayogo
    const iman = await prisma.santriAktif.upsert({
      where: { nis: '2602070019' },
      update: {
        nama_lengkap: 'Iman Prayogo',
        kelas_id: kelasIL.id,
        jenis_kelamin: 'L',
        is_active: true
      },
      create: {
        nis: '2602070019',
        nama_lengkap: 'Iman Prayogo',
        kelas_id: kelasIL.id,
        jenis_kelamin: 'L',
        is_active: true
      }
    });
    console.log('Iman Prayogo berhasil ditambahkan/diupdate:', iman);

    // 4. Verifikasi Total
    const totalMTs = await prisma.santriAktif.count({ where: { kelas_id: kelasMTs.id, is_active: true } });
    const totalIL = await prisma.santriAktif.count({ where: { kelas_id: kelasIL.id, is_active: true } });

    console.log(`\n=== HASIL SINKRONISASI ===`);
    console.log(`Jumlah Santri 7 MTs : ${totalMTs} (Target: 19)`);
    console.log(`Jumlah Santri IL    : ${totalIL} (Target: 22)`);
    console.log(`Total Keseluruhan   : ${totalMTs + totalIL} (Target: 41)`);

    const listIL = await prisma.santriAktif.findMany({
      where: { kelas_id: kelasIL.id, is_active: true },
      orderBy: { nis: 'asc' },
      select: { nis: true, nama_lengkap: true }
    });
    console.log('\nDaftar Santri IL Terkini:');
    listIL.forEach((s, idx) => console.log(`${idx + 1}. [NIS: ${s.nis}] ${s.nama_lengkap}`));

  } catch (error) {
    console.error("Gagal melakukan pengecekan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
