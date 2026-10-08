const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const santri = await prisma.santriAktif.findMany({
    where: { 
      OR: [
        { nama_lengkap: { contains: 'Zakaria' } },
        { nama_lengkap: { contains: 'Demo' } }
      ]
    },
    include: { kelas: true }
  });
  console.log(JSON.stringify(santri, null, 2));
}
check().then(() => prisma.$disconnect());
