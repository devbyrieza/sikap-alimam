import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Create or Update User for Azzam
    const passwordHash = await bcrypt.hash('PAAS2026!', 10);
    const email = 'azzam@pesantren-alimam.com';
    const username = 'azzam';

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { nama: { contains: 'Azzam', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username,
          nama: 'Ust. Azzam Aghnia Ilman Azzauhari',
          role: 'MUSYRIF,GURU',
          password: passwordHash,
          plain_password: 'PAAS2026!',
          is_active: true,
        }
      });
      logs.push('Created User account: ' + user.email);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          nama: 'Ust. Azzam Aghnia Ilman Azzauhari',
          username: user.username || username,
          role: user.role.includes('MUSYRIF') ? user.role : user.role + ',MUSYRIF',
          password: passwordHash,
          plain_password: 'PAAS2026!',
          is_active: true
        }
      });
      logs.push('Updated existing User: ' + user.email);
    }

    // 2. Create or Update Pegawai for Azzam
    let pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { nik: '3205223112040001' },
          { user_id: user.id },
          { nama_lengkap: { contains: 'Azzam', mode: 'insensitive' } }
        ]
      }
    });

    const pegawaiData = {
      nama_lengkap: 'Ust. Azzam Aghnia Ilman Azzauhari',
      nama_panggilan: 'Azzam',
      nik: '3205223112040001',
      no_hp: '082119136590',
      jenis_kelamin: 'L',
      tempat_lahir: 'Garut',
      tanggal_lahir: new Date('2004-12-31'),
      email: 'azzam@pesantren-alimam.com',
      kategori_pegawai: 'ASATIDZ,MUSYRIF',
      divisi: 'Kepengasuhan',
      jabatan: 'Pengasuh & Pengampu Halaqoh',
      unit_kerja: 'Pesantren Al-Imam',
      user_id: user.id
    };

    if (!pegawai) {
      pegawai = await prisma.pegawai.create({
        data: pegawaiData
      });
      logs.push('Created Pegawai record: ' + pegawai.nama_lengkap);
    } else {
      pegawai = await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: pegawaiData
      });
      logs.push('Updated Pegawai record: ' + pegawai.nama_lengkap);
    }

    // 3. Sync Halaqoh Groups for Azzam
    const groups = await prisma.halaqohKelompok.findMany();
    let updatedGroupsCount = 0;

    for (const g of groups) {
      if (
        g.nama_kelompok.toLowerCase().includes('azzam') ||
        g.nama_kelompok.toLowerCase().includes('imran') ||
        g.nama_kelompok.toLowerCase().includes('imron')
      ) {
        await prisma.halaqohKelompok.update({
          where: { id: g.id },
          data: {
            pegawai_id: pegawai.id,
            nama_kelompok: g.nama_kelompok
              .replace(/Imran Abdillah/gi, 'Azzam Aghnia Ilman')
              .replace(/Imron Abdillah/gi, 'Azzam Aghnia Ilman')
          }
        });
        updatedGroupsCount++;
      }
    }
    logs.push("Linked " + updatedGroupsCount + " Halaqoh groups to Ust. Azzam Aghnia Ilman Azzauhari");

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi data Azzam Aghnia Ilman Azzauhari di SIKAP berhasil!',
      logs,
      pegawai,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nama: user.nama,
        role: user.role
      }
    });

  } catch (err: any) {
    console.error('Error syncing Azzam:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
