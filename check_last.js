const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.$queryRaw`SELECT nama_lengkap, nis, nisn FROM santri_aktif ORDER BY created_at DESC LIMIT 10`;
  console.log(all);
}
main().finally(() => prisma.$disconnect());
