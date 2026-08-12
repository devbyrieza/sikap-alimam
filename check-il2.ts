import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const kelasList = await prisma.kelas.findMany({ where: { jenjang: 'IL' }, include: { santri: true } });
  console.log('IL Classes:', kelasList.map(k => ({ id: k.id, nama: k.nama, jenjang: k.jenjang, isActive: k.is_active, santriCount: k.santri.length })));
}
main().finally(() => prisma.$disconnect());
