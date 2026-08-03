import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'pribadi.guru@pesantren-alimam.com';
  const password = 'pribadi123';
  const passwordHash = await bcrypt.hash(password, 10);
  const nama = 'Demo Guru Pribadi';

  // Create or find Pegawai
  let pegawai = await prisma.pegawai.findFirst({
    where: { email: email }
  });

  if (!pegawai) {
    pegawai = await prisma.pegawai.create({
      data: {
        nama_lengkap: nama,
        email: email,
        kategori_pegawai: 'GURU',
        jabatan: 'Guru Pengajar',
        nip: `DEMO${Math.floor(Math.random() * 10000)}`
      }
    });
    console.log('Created Pegawai:', pegawai.id);
  } else {
    console.log('Pegawai already exists:', pegawai.id);
  }

  // Create User
  const user = await prisma.user.upsert({
    where: { email: email },
    update: {
      password: passwordHash,
      nama: nama,
      role: 'GURU',
      is_active: true
    },
    create: {
      email: email,
      password: passwordHash,
      nama: nama,
      role: 'GURU',
      is_active: true
    }
  });

  console.log('Created/Updated User:', user.id);

  // Link them
  await prisma.pegawai.update({
    where: { id: pegawai.id },
    data: { user_id: user.id }
  });

  console.log('Done! Login with:', email, password);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
