const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.pegawai.findMany({
    select: { id: true, nama_lengkap: true },
    take: 10
  });
  console.log('Found:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());