import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const groups = await prisma.halaqohKelompok.findMany({
    include: { pegawai: { select: { nama_lengkap: true } } }
  });
  console.log(JSON.stringify(groups, null, 2));
}
main().finally(() => prisma.$disconnect());