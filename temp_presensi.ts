import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const data = await prisma.presensiSiswa.findMany();
  console.log(data.map(d => ({ id: d.id, tanggal: d.tanggal, created_at: d.created_at })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
