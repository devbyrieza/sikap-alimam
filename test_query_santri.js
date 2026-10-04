const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const kelas_id = '17853f33-75b5-402a-91c6-62c097915203';
  const status = null;
  const q = null;
  
  const whereClause = {};
  if (kelas_id && kelas_id !== "all") {
    whereClause.kelas_id = kelas_id;
  }
  if (status && status !== "all") {
    whereClause.status_kesiswaan = status;
  } else if (!status) {
    whereClause.is_active = true;
  }
  
  console.log('whereClause:', whereClause);
  const santriList = await prisma.santriAktif.findMany({
    where: whereClause
  });
  console.log('Returned santri:', santriList.length);
}
main().finally(() => prisma.$disconnect());
