const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const kls = await prisma.kelas.findMany({ 
    where: { nama: { contains: 'IL', mode: 'insensitive' } } 
  });
  console.log('--- KELAS IL YANG ADA ---');
  for (const k of kls) {
    const count = await prisma.santriAktif.count({ where: { kelas_id: k.id } });
    const activeCount = await prisma.santriAktif.count({ where: { kelas_id: k.id, is_active: true } });
    console.log(`- ${k.nama} (ID: ${k.id}, Jenjang: ${k.jenjang}) -> Total Santri: ${count}, Aktif: ${activeCount}`);
  }
}
main().finally(() => prisma.$disconnect());
