const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`SELECT * FROM santri_aktif WHERE nis = '2602070010'`;
  console.log(result);
}
main().finally(() => prisma.$disconnect());
