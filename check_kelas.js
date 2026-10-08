const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const kelas = await prisma.kelas.findMany({
    select: { id: true, nama: true, jenjang: true, is_active: true, _count: { select: { santri: true } } }
  });
  console.log(JSON.stringify(kelas, null, 2));
}
main().finally(() => prisma.$disconnect());
