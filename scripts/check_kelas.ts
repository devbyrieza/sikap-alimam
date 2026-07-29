import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const kelas = await prisma.kelas.findMany();
  console.log("Daftar Kelas:", kelas);
  await prisma.$disconnect();
}
run();
