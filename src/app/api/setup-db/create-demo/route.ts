import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const email = 'pribadi.guru@pesantren-alimam.com';
    const password = 'pribadi123';
    const passwordHash = await bcrypt.hash(password, 10);
    const nama = 'Ust. Pribadi (Demo), S.Pd.';

    // Create User first
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
          nip: `DEMO${Math.floor(Math.random() * 10000)}`,
          user_id: user.id
        }
      });
    } else {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { user_id: user.id }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Akun Demo Guru berhasil dibuat/diperbarui.',
      data: {
        email,
        password: 'pribadi123'
      }
    });
  } catch (error: any) {
    console.error('Failed to create demo guru:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
