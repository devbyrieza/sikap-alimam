import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser(nama: string, email: string) {
  // 1. Find Pegawai
  const pegawai = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: nama, mode: 'insensitive' } }
  });

  if (!pegawai) {
    console.log(`\u274C Pegawai dengan nama "${nama}" tidak ditemukan di tabel Pegawai.`);
    return;
  }

  // 2. Check Profile
  let profile = await prisma.profile.findFirst({
    where: { OR: [{ email: email }, { full_name: { contains: nama, mode: 'insensitive' } }] }
  });

  const hashedPassword = await bcrypt.hash('alimam123', 10);

  if (profile) {
    console.log(`\u2705 Akun untuk "${nama}" sudah ada. Memperbarui password dan email...`);
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        email: email,
        password_hash: hashedPassword,
        id: pegawai.user_id || profile.id // make sure it matches
      }
    });
    console.log(`   -> Email: ${profile.email}`);
    console.log(`   -> Password direset menjadi: alimam123`);
  } else {
    console.log(`\u26A0\uFE0F Akun untuk "${nama}" belum ada. Membuat akun baru...`);
    // Ensure user_id exists on pegawai
    let userId = pegawai.user_id;
    if (!userId) {
      userId = require('crypto').randomUUID();
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { user_id: userId }
      });
    }

    profile = await prisma.profile.create({
      data: {
        id: userId ?? undefined,
        email: email,
        full_name: pegawai.nama_lengkap,
        password_hash: hashedPassword,
        role: 'guru',
        phone: '080000000000'
      }
    });
    console.log(`   -> Berhasil dibuat! Email: ${profile.email} | Password: alimam123`);
  }
}

async function main() {
  console.log("Memproses akun...");
  await createUser('Iqbal', 'iqbal@pesantren-alimam.com');
  await createUser('Wahab', 'wahab@pesantren-alimam.com');
}

main().finally(() => prisma.$disconnect());
