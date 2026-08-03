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
    const dataPegawaiPribadi = {
      nama_lengkap: namaPribadi,
      email: emailPribadi,
      kategori_pegawai: 'GURU',
      jabatan: 'Guru Pengajar',
      unit_kerja: 'Pesantren Al-Imam',
      divisi: 'Pengajar',
      nip: `DEMO${Math.floor(Math.random() * 10000)}`,
      user_id: userPribadi.id,
      no_hp: '081234567890',
      jenis_kelamin: 'L',
      mata_pelajaran: 'Aqidah, Fiqih'
    };

    if (!pegawaiPribadi) {
      await prisma.pegawai.create({ data: dataPegawaiPribadi });
    } else {
      await prisma.pegawai.update({ where: { id: pegawaiPribadi.id }, data: dataPegawaiPribadi });
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
    const dataPegawaiPresentasi = {
      nama_lengkap: namaPresentasi,
      email: emailPresentasi,
      kategori_pegawai: 'GURU',
      jabatan: 'Guru Pengajar',
      unit_kerja: 'Pesantren Al-Imam',
      divisi: 'Pengajar',
      nip: `DEMO${Math.floor(Math.random() * 10000)}`,
      user_id: userPresentasi.id,
      no_hp: '081298765432',
      jenis_kelamin: 'L',
      mata_pelajaran: 'Bahasa Arab, Tahfidz'
    };

    if (!pegawaiPresentasi) {
      await prisma.pegawai.create({ data: dataPegawaiPresentasi });
    } else {
      await prisma.pegawai.update({ where: { id: pegawaiPresentasi.id }, data: dataPegawaiPresentasi });
    }

    // === 3. Akun Demo Wali Santri ===
    const emailWali = 'wali.santri@pesantren-alimam.com';
    const passwordWali = 'wali123';
    const passwordHashWali = await bcrypt.hash(passwordWali, 10);
    const namaWali = 'Bpk. H. Rahmat Hidayat (Wali Santri)';

    const userWali = await prisma.user.upsert({
      where: { email: emailWali },
      update: { password: passwordHashWali, nama: namaWali, role: 'WALI', is_active: true },
      create: { email: emailWali, password: passwordHashWali, nama: namaWali, role: 'WALI', is_active: true }
    });

    // Cari santri aktif pertama untuk dihubungkan ke wali
    const firstSantri = await prisma.santriAktif.findFirst({
      where: { is_active: true },
      orderBy: { nama_lengkap: 'asc' },
    });

    if (firstSantri) {
      await prisma.orangTuaSantri.upsert({
        where: {
          user_id_santri_id: {
            user_id: userWali.id,
            santri_id: firstSantri.id,
          },
        },
        update: {},
        create: {
          user_id: userWali.id,
          santri_id: firstSantri.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Semua Akun Demo (Guru Pribadi, Guru Presentasi, dan Wali Santri) berhasil disiapkan.',
      data: [
        { role: 'GURU (Pribadi)', email: emailPribadi, password: passwordPribadi },
        { role: 'GURU (Resmi/Presentasi)', email: emailPresentasi, password: passwordPresentasi },
        { role: 'WALI SANTRI', email: emailWali, password: passwordWali, linked_santri: firstSantri?.nama_lengkap || null }
      ]
    });
  } catch (error: any) {
    console.error('Failed to create demo users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
