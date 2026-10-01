const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.santriAktif.findUnique({ where: { nis: '2602070010' } });
  console.log(s);
  
  const all = await prisma.santriAktif.findMany();
  console.log("Total santri:", all.length);
}
main().finally(() => prisma.$disconnect());
