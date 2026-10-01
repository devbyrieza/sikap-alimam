const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pegawai.findMany({ select: { nama_lengkap: true } }).then(p => { 
  console.log(p.map(x => x.nama_lengkap).join('\n')); 
  prisma.$disconnect(); 
});
