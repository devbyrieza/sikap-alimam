import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    // Cari santri bernama raylan akbar (case insensitive search)
    const raylan = await prisma.santriAktif.findFirst({
      where: {
        nama_lengkap: {
          contains: 'raylan',
          mode: 'insensitive'
        }
      }
    });

    if (raylan) {
      console.log(`Ditemukan: ${raylan.nama_lengkap} (ID: ${raylan.id})`);
      
      // Hapus data atau set is_active false
      await prisma.santriAktif.delete({
        where: { id: raylan.id }
      });
      console.log('Berhasil dihapus dari database karena mengundurkan diri.');
    } else {
      console.log('Raylan Akbar tidak ditemukan di database.');
    }

    // Cek ulang jumlah
    const kelasMTs = await prisma.kelas.findFirst({ where: { nama: '7 MTs' } });
    const kelasIL = await prisma.kelas.findFirst({ where: { nama: 'I\'dad Lughowy' } });

    const totalMTs = await prisma.santriAktif.count({ where: { kelas_id: kelasMTs?.id } });
    const totalIL = await prisma.santriAktif.count({ where: { kelas_id: kelasIL?.id } });

    console.log(`\nJumlah Santri MTs saat ini: ${totalMTs}`);
    console.log(`Jumlah Santri IL saat ini: ${totalIL}`);
    console.log(`Total Keseluruhan: ${totalMTs + totalIL}`);
    
  } catch (error) {
    console.error("Gagal melakukan pengecekan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
