const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.$queryRaw`SELECT nama_lengkap, is_active FROM santri_aktif WHERE nama_lengkap LIKE '%Miizan%' OR nama_lengkap LIKE '%Radil%' OR nama_lengkap LIKE '%Syafiq%'`;
  console.log(all);
}
main().finally(() => prisma.$disconnect());
