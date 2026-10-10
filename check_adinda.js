const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adinda = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: 'Adinda' } },
    include: { asatidz_mapel: { include: { mapel: true, kelas: true } } }
  });
  console.log(JSON.stringify(adinda, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
