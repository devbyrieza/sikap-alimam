const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.pegawai.findMany({
    where: { 
      OR: [
        { nama_lengkap: { contains: 'Ade Supyana' } },
        { nama_lengkap: { contains: 'Hardiansyah' } }
      ]
    },
    select: { id: true, nama_lengkap: true }
  });
  console.log('Found:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());