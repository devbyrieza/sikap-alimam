import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus data Guru (karena belum sinkron / belum ada di SIMPEG)...");

  try {
    const sikapGuruList = await prisma.pegawai.findMany({
      where: { kategori_pegawai: 'ASATIDZ' }
    });

    const toDeleteIds = sikapGuruList.map(g => g.id);

    if (toDeleteIds.length > 0) {
      console.log(`Menghapus ${toDeleteIds.length} data Guru dari SIKAP...`);
      
      await prisma.jadwalPelajaran.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });
      await prisma.asatidzmMapel.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });
      await prisma.jurnalMengajar.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });
      await prisma.presensiAsatidz.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });
      await prisma.capaianTahfidz.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });
      await prisma.ibadahAdabSantri.deleteMany({
        where: { pegawai_id: { in: toDeleteIds } }
      });

      await prisma.pegawai.deleteMany({
        where: { id: { in: toDeleteIds } }
      });
      console.log("Berhasil menghapus data guru beserta jadwalnya.");
    } else {
      console.log("Tidak ada data Guru yang perlu dihapus.");
    }
  } catch (error) {
    console.error("Gagal menghapus:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
