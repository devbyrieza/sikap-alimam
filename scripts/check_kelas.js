const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== KELAS IN DATABASE ===');
  const kelas = await prisma.kelas.findMany();
  console.log(kelas);

  console.log('\n=== SANTRI PER KELAS ===');
  for (const k of kelas) {
    const count = await prisma.santriAktif.count({
      where: { kelas_id: k.id }
    });
    console.log(`Kelas [${k.id}] nama="${k.nama}" jenjang="${k.jenjang}" -> Santri count: ${count}`);
  }
}

checkData()
  .then(() => prisma.$disconnect())
  .catch(console.error);
