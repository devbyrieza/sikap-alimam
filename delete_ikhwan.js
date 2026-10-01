const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pegawai.delete({ where: { id: '5eee40f8-24cd-494b-8fce-dd12a4227f21' } })
  .then(p => console.log('Deleted:', p))
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
