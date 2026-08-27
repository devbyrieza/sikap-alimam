const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function syncRoles() {
  console.log('=== Syncing User Roles in SIKAP ===');
  
  const roleMappings = [
    { nameMatch: 'Wahab', role: 'ADMIN_SUPER,GURU' },
    { nameMatch: 'Rieza', role: 'ADMIN_SUPER' },
    { nameMatch: 'Wahyudi', role: 'KADIV_PENGASUHAN,MUSYRIF' },
    { nameMatch: 'Imron', role: 'KADIV_KURIKULUM,WALI_KELAS,MUSYRIF,GURU' },
    { nameMatch: 'Agus', role: 'WALI_KELAS,MUSYRIF,GURU' },
    { nameMatch: 'Iqbal', role: 'MUSYRIF,GURU' },
    { nameMatch: 'Aziz', role: 'KADIV_KURIKULUM,GURU' },
  ];

  for (const m of roleMappings) {
    const users = await prisma.user.findMany({
      where: { nama: { contains: m.nameMatch, mode: 'insensitive' } }
    });
    for (const u of users) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: m.role }
      });
      console.log('  Updated user:', u.nama, '-> role:', m.role);
    }
  }

  // Ensure Ustadz Ikhwan Ramandhanu exists as Musyrif
  const ikhwan = await prisma.user.findFirst({
    where: { nama: { contains: 'Ikhwan', mode: 'insensitive' } }
  });
  if (!ikhwan) {
    const pass = await bcrypt.hash("Paas2026!", 12);
    const newUser = await prisma.user.create({
      data: {
        email: 'ikhwan.ramandhanu@pesantren-alimam.com',
        password: pass,
        nama: 'Ikhwan Ramandhanu',
        role: 'MUSYRIF',
        plain_password: "Paas2026!"
      }
    });
    await prisma.pegawai.create({
      data: {
        user_id: newUser.id,
        nama_lengkap: 'Ikhwan Ramandhanu',
        jabatan: 'Musyrif / Pengasuh',
        kategori_pegawai: 'MUSYRIF'
      }
    });
    console.log('  Created Musyrif account for Ikhwan Ramandhanu');
  } else {
    console.log('  Ikhwan Ramandhanu account exists:', ikhwan.nama);
  }
}

syncRoles()
  .then(() => {
    console.log('=== Role Sync Completed Successfully ===');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error('Error during role sync:', err);
    return prisma.$disconnect();
  });
