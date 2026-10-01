const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE santri_aktif ADD COLUMN IF NOT EXISTS nisn VARCHAR(50);');
  
  const semuaSantri = await prisma.santriAktif.findMany();
  const salman = semuaSantri.find(s => s.nama_lengkap.toLowerCase().includes('salman'));
  console.log('Salman from findMany:', salman ? salman.nama_lengkap : 'NOT FOUND');
}
main().finally(() => prisma.$disconnect());
