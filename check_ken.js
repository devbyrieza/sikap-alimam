const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`SELECT * FROM santri_aktif WHERE nis = '2602070010' OR nama_lengkap ILIKE '%Ken%' OR nama_lengkap ILIKE '%Miizan%'`;
  console.log(result);
}
main().finally(() => prisma.$disconnect());
