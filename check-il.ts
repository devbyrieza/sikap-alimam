import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const kelas = await prisma.kelas.findFirst({ where: { jenjang: 'IL' } });
  if (!kelas) {
    console.log('IL Class not found');
    return;
  }
  const mapels = await prisma.mataPelajaran.findMany({ where: { kelas_id: kelas.id } });
  console.log('Mapels for IL:', mapels.map(m => m.nama));
  const asatidzMapels = await prisma.asatidzmMapel.findMany({ where: { kelas_id: kelas.id } });
  console.log('Asatidz assigned to IL:', asatidzMapels);
}
main().finally(() => prisma.$disconnect());
