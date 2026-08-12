import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const kls = await prisma.kelas.findMany({ where: { jenjang: 'IL' } });
  console.log(kls);
  const mapels = await prisma.mataPelajaran.findMany({ where: { kelas_id: { in: kls.map(k => k.id) } } });
  console.log(mapels);
}
main().finally(() => prisma.$disconnect());
