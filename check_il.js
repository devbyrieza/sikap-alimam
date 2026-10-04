const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const kls = await prisma.kelas.findFirst({ where: { jenjang: 'IL' } });
  if (kls) {
    const mapel = await prisma.mataPelajaran.findMany({ where: { kelas_id: kls.id } });
    console.log('Mapel di ' + kls.nama + ':', mapel.map(m => m.nama));
  } else {
    console.log('Kelas IL not found');
  }
}
main().finally(() => prisma.$disconnect());
