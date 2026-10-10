const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const adinda = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: 'Adinda' } },
    include: { mengajar: true }
  });
  console.log('Adinda:', JSON.stringify(adinda, null, 2));
}
main().finally(() => prisma.$disconnect());
