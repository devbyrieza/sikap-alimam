const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pegawai.findMany({ where: { nama_lengkap: { contains: 'Zeidhan', mode: 'insensitive' } } })
  .then(p => console.log('Zeidhans:', p))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
