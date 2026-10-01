const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pegawai.findFirst({ where: { nama_lengkap: { contains: 'Ikhwan' } } }).then(p => { console.log(p); prisma.$disconnect(); });
