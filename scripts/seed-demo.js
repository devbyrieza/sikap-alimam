const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser(email, plainPassword, nama, nip) {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1. Create or update User
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, nama, role: 'GURU' },
    create: { email, password: hashedPassword, nama, role: 'GURU' },
  });

  // 2. Create or update Pegawai
  const pegawai = await prisma.pegawai.upsert({
    where: { user_id: user.id },
    update: { nama_lengkap: nama, nip, kategori_pegawai: 'ASATIDZ' },
    create: { user_id: user.id, nama_lengkap: nama, nip, kategori_pegawai: 'ASATIDZ' },
  });

  // 3. Ensure mapping
  const kelas = await prisma.kelas.findFirst({ where: { is_active: true } });
  const mapel = await prisma.mataPelajaran.findFirst({ where: { is_active: true } });

  if (kelas && mapel) {
    const existingMap = await prisma.asatidzmMapel.findFirst({
      where: { pegawai_id: pegawai.id, kelas_id: kelas.id, mapel_id: mapel.id }
    });

    if (!existingMap) {
      await prisma.asatidzmMapel.create({
        data: { pegawai_id: pegawai.id, kelas_id: kelas.id, mapel_id: mapel.id }
      });
    }
  }
  
  return { email, plainPassword, nama };
}

async function main() {
  console.log('Seeding demo accounts...');

  // Akun Demo Pribadi
  const pribadi = await createDemoUser(
    'pribadi.guru@pesantren-alimam.com', 
    'pribadi123', 
    'Ust. Pribadi (Demo), S.Pd.', 
    'DEMOPRIBADI'
  );
  console.log(`Akun Pribadi dibuat: ${pribadi.email} / ${pribadi.plainPassword}`);

  // Akun Demo Presentasi Guru
  const presentasi = await createDemoUser(
    'presentasi.guru@pesantren-alimam.com', 
    'presentasi123', 
    'Ust. Presentasi (Demo), S.Pd.', 
    'DEMOPRESENTASI'
  );
  console.log(`Akun Presentasi dibuat: ${presentasi.email} / ${presentasi.plainPassword}`);

  console.log('Semua akun demo ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
