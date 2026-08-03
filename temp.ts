import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const j = await prisma.jurnalMengajar.findMany({ include: { pegawai: true, mapel: true } });
  console.log(JSON.stringify(j, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
