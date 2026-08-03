import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // === 1. Akun Demo Pribadi ===
    const emailPribadi = 'pribadi.guru@pesantren-alimam.com';
    const passwordPribadi = 'pribadi123';
    const passwordHashPribadi = await bcrypt.hash(passwordPribadi, 10);
    const namaPribadi = 'Ust. Pribadi (Demo), S.Pd.';

    const userPribadi = await prisma.user.upsert({
      where: { email: emailPribadi },
      update: { password: passwordHashPribadi, nama: namaPribadi, role: 'GURU', is_active: true },
      create: { email: emailPribadi, password: passwordHashPribadi, nama: namaPribadi, role: 'GURU', is_active: true }
    });

    let pegawaiPribadi = await prisma.pegawai.findFirst({ where: { email: emailPribadi } });
    if (!pegawaiPribadi) {
      await prisma.pegawai.create({
        data: { nama_lengkap: namaPribadi, email: emailPribadi, kategori_pegawai: 'GURU', jabatan: 'Guru Pengajar', nip: `DEMO${Math.floor(Math.random() * 10000)}`, user_id: userPribadi.id }
      });
    } else {
      await prisma.pegawai.update({ where: { id: pegawaiPribadi.id }, data: { user_id: userPribadi.id } });
    }

    // === 2. Akun Presentasi Resmi ===
    const emailPresentasi = 'presentasi.guru@pesantren-alimam.com';
    const passwordPresentasi = 'presentasi123';
    const passwordHashPresentasi = await bcrypt.hash(passwordPresentasi, 10);
    const namaPresentasi = 'Ust. Presentasi (Resmi), Lc.';

    const userPresentasi = await prisma.user.upsert({
      where: { email: emailPresentasi },
      update: { password: passwordHashPresentasi, nama: namaPresentasi, role: 'GURU', is_active: true },
      create: { email: emailPresentasi, password: passwordHashPresentasi, nama: namaPresentasi, role: 'GURU', is_active: true }
    });

    let pegawaiPresentasi = await prisma.pegawai.findFirst({ where: { email: emailPresentasi } });
    if (!pegawaiPresentasi) {
      await prisma.pegawai.create({
        data: { nama_lengkap: namaPresentasi, email: emailPresentasi, kategori_pegawai: 'GURU', jabatan: 'Guru Pengajar', nip: `DEMO${Math.floor(Math.random() * 10000)}`, user_id: userPresentasi.id }
      });
    } else {
      await prisma.pegawai.update({ where: { id: pegawaiPresentasi.id }, data: { user_id: userPresentasi.id } });
    }

    return NextResponse.json({
      success: true,
      message: 'Dua Akun Demo (Pribadi & Presentasi) berhasil disiapkan.',
      data: [
        { email: emailPribadi, password: passwordPribadi },
        { email: emailPresentasi, password: passwordPresentasi }
      ]
    });
  } catch (error: any) {
    console.error('Failed to create demo guru:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
