const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pegawai.findMany({ orderBy: { created_at: 'desc' }, take: 5 })
  .then(p => console.log(p.map(x => x.nama_lengkap)))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
