const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const kelas11 = await prisma.kelas.findFirst({ where: { nama: '11 MA' } });
  const kelas12 = await prisma.kelas.findFirst({ where: { nama: '12 MA' } });
  
  if (!kelas11 || !kelas12) {
    console.log("Kelas MA tidak ditemukan");
    return;
  }
  
  const mapelsToInsert = [
    { nama: 'Matematika', kkm: 75 },
    { nama: 'Bahasa Inggris', kkm: 75 }
  ];
  
  for (const kelas of [kelas11, kelas12]) {
    for (const mapel of mapelsToInsert) {
      const exists = await prisma.mataPelajaran.findFirst({
        where: { nama: mapel.nama, kelas_id: kelas.id }
      });
      if (!exists) {
        await prisma.mataPelajaran.create({
          data: {
            nama: mapel.nama,
            kkm: mapel.kkm,
            kelas_id: kelas.id,
            is_active: true
          }
        });
        console.log(`Added ${mapel.nama} to ${kelas.nama}`);
      } else {
        console.log(`${mapel.nama} already exists in ${kelas.nama}`);
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
