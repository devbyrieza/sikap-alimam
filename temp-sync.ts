import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const adminPasswordHash = await bcrypt.hash('AdminAlimam2026!', 10);
  const guruPasswordHash = await bcrypt.hash('GuruAlimam2026!', 10);

  const semuaGuru = await prisma.pegawai.findMany({
    where: {
      OR: [
        { kategori_pegawai: { contains: 'GURU', mode: 'insensitive' } },
        { kategori_pegawai: { contains: 'ASATIDZ', mode: 'insensitive' } }
      ]
    }
  });

  for (const pegawai of semuaGuru) {
    const isMultiRole = pegawai.nama_lengkap.toUpperCase().includes('RIEZA EKA TOMARA') ||
                        pegawai.nama_lengkap.toUpperCase().includes('ABDIL AZIZ') ||
                        pegawai.nama_lengkap.toUpperCase().includes('WAHAB RAJASAM');
    const role = isMultiRole ? 'ADMIN_SUPER' : 'GURU';
    const passwordHash = isMultiRole ? adminPasswordHash : guruPasswordHash;

    let targetEmail = pegawai.email?.toLowerCase().trim();
    if (!targetEmail || targetEmail === '') {
      targetEmail = `${pegawai.nama_lengkap.split(/[\s,]+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')}@pesantren-alimam.com`;
    }

    let nipPegawai = pegawai.nip;
    if (!nipPegawai || nipPegawai.length < 10) {
      nipPegawai = `202608${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        await prisma.pegawai.update({ where: { id: pegawai.id }, data: { nip: nipPegawai, email: targetEmail } });
      } catch(e) {
        nipPegawai = `202608${Math.floor(1000 + Math.random() * 9000)}`;
        await prisma.pegawai.update({ where: { id: pegawai.id }, data: { nip: nipPegawai, email: targetEmail } });
      }
    } else {
      await prisma.pegawai.update({ where: { id: pegawai.id }, data: { email: targetEmail } });
    }

    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: { nama: pegawai.nama_lengkap, role: role, password: passwordHash, is_active: true },
      create: { email: targetEmail, nama: pegawai.nama_lengkap, role: role, password: passwordHash, is_active: true },
    });

    if (!pegawai.user_id || pegawai.user_id !== user.id) {
      await prisma.pegawai.update({ where: { id: pegawai.id }, data: { user_id: user.id } });
    }
    console.log(`Synced SIKAP: ${pegawai.nama_lengkap} - NIP: ${nipPegawai}`);
  }
}
run().then(() => process.exit(0)).catch(console.error);
