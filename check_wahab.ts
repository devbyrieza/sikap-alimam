import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const allPegawai = await prisma.pegawai.findMany({ select: { nama_lengkap: true } });
  const possibleWahab = allPegawai.filter(p => p.nama_lengkap.toLowerCase().includes('wahab') || p.nama_lengkap.toLowerCase().includes('rajasam') || p.nama_lengkap.toLowerCase().includes('rajasa'));
  console.log('Possible matches for Wahab:', possibleWahab);
}
main().finally(() => prisma.$disconnect());
