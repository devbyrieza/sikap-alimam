import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sesi = await prisma.masterSesiWaktu.findMany({ orderBy: { jam_ke: 'asc' } });
  console.log(JSON.stringify(sesi, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
