const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const santri = await prisma.santriAktif.findMany({
    where: { is_active: true }
  });
  console.log(santri.map(s => s.nama_lengkap).join('\n'));
}
run().finally(() => prisma.$disconnect());
