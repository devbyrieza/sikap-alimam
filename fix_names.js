const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.pegawai.updateMany({
    where: { nama_lengkap: 'Ade Supyana S. Pd. I' },
    data: { nama_lengkap: 'Ade Supyana, S.Pd.I' }
  });
  console.log('Updated Ade:', p1.count);

  const p2 = await prisma.pegawai.updateMany({
    where: { nama_lengkap: 'Hardiansyah, S. Pd' },
    data: { nama_lengkap: 'Hardiansyah, S.Pd' }
  });
  console.log('Updated Hardiansyah:', p2.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());