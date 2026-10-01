const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.$queryRaw`SELECT nama_lengkap, nis FROM santri_aktif`;
  console.log("ALL SANTRI IN DB:");
  all.forEach(s => console.log(s.nama_lengkap + " (" + s.nis + ")"));
}
main().finally(() => prisma.$disconnect());
