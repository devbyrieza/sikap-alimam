import { prisma } from '@/lib/prisma';
async function main() {
  const kelas = await prisma.kelas.findMany({
    select: { id: true, nama: true, jenjang: true, is_active: true }
  });
  console.log(JSON.stringify(kelas, null, 2));
}
main();
