import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminPasswordHash = await bcrypt.hash('AdminAlimam2026!', 10);
    const guruPasswordHash = await bcrypt.hash('GuruAlimam2026!', 10);

    // Daftar Lengkap Civitas & Akun Guru / Multi-Role
    const civitasAccounts = [
      // ══════════════════════════════════════════════════════════════
      // 1. MULTIUSER (ADMIN SUPER & GURU)
      // ══════════════════════════════════════════════════════════════
      {
        nama_lengkap: 'Rieza Eka Tomara, S.Kom',
        email: 'riezaekatomara@gmail.com',
        alias_email: 'rieza@pesantren-alimam.com',
        nik: '1609010706970003',
        kategori_pegawai: 'STAF, GURU',
        jabatan: 'Staff IT & Pengajar',
        role: 'ADMIN_SUPER',
        passwordHash: adminPasswordHash,
        isMultiRole: true,
      },
      {
        nama_lengkap: 'Abdil Aziz, S.Pd, B.A',
        email: 'abdilaziz@pesantren-alimam.com',
        alias_email: 'abdil.aziz@pesantren-alimam.com',
        nik: '3322183101990002',
        kategori_pegawai: 'GURU',
        jabatan: 'Kasi Kurikulum & Pengajar',
        role: 'ADMIN_SUPER',
        passwordHash: adminPasswordHash,
        isMultiRole: true,
      },
      {
        nama_lengkap: 'Wahab Rajasam, M.Pd',
        email: 'wahabrajasam@pesantren-alimam.com',
        alias_email: 'wahab.rajasam@pesantren-alimam.com',
        nik: null,
        kategori_pegawai: 'GURU, PIMPINAN',
        jabatan: 'Mudir Pesantren & Pengajar',
        role: 'ADMIN_SUPER',
        passwordHash: adminPasswordHash,
        isMultiRole: true,
      },

      // ══════════════════════════════════════════════════════════════
      // 2. CIVITAS BERKATEGORI GURU (AKUN GURU)
      // ══════════════════════════════════════════════════════════════
      {
        nama_lengkap: 'Hardiansyah',
        email: 'hardiansyah@pesantren-alimam.com',
        nik: null,
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Muhammad Maulana Rizki',
        email: 'maulanarizki@pesantren-alimam.com',
        nik: null,
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Teguh Hudaya, Lc, M.M',
        email: 'teguhhudaya@pesantren-alimam.com',
        nik: null,
        kategori_pegawai: 'GURU, STAF',
        jabatan: 'Guru & Staf',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Ade Supyana S. Pd. I',
        email: 'adesupyana@pesantren-alimam.com',
        nik: '3202082102690001',
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Arifin Saefullah, A.Ma, Dpl, Lc, M.M, M.Pd',
        email: 'arifinsaefullah@pesantren-alimam.com',
        nik: '3511110204810005',
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Muhammad Thoriq Ibn Ziyad, Lc, M.Ag',
        email: 'thoriqziyad@pesantren-alimam.com',
        nik: '3202290106940002',
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Agus Cahyono',
        email: 'aguscahyono@pesantren-alimam.com',
        nik: '6408012910950001',
        kategori_pegawai: 'GURU, MUSYRIF',
        jabatan: 'Guru & Musyrif',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Wahyudi Pranata, Lc',
        email: 'wahyudipranata@pesantren-alimam.com',
        nik: '1901072302950001',
        kategori_pegawai: 'GURU',
        jabatan: 'Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Imron Abdillah',
        email: 'imronabdillah@pesantren-alimam.com',
        nik: '3301022411900005',
        kategori_pegawai: 'GURU, MUSYRIF',
        jabatan: 'Guru & Musyrif',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Ramdan',
        email: 'ramdan@pesantren-alimam.com',
        nik: '3202091101990007',
        kategori_pegawai: 'GURU, STAF',
        jabatan: 'Guru & Staf',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
      {
        nama_lengkap: 'Muhammad Iqbal, S.Pd',
        email: 'muhammadiqbal@pesantren-alimam.com',
        nik: '3211051605920001',
        kategori_pegawai: 'MUSYRIF, GURU',
        jabatan: 'Musyrif & Guru',
        role: 'GURU',
        passwordHash: guruPasswordHash,
        isMultiRole: false,
      },
    ];

    const results = [];

    for (const item of civitasAccounts) {
      // 1. Upsert User Account di SIKAP
      const user = await prisma.user.upsert({
        where: { email: item.email.toLowerCase().trim() },
        update: {
          nama: item.nama_lengkap,
          role: item.role,
          password: item.passwordHash,
          is_active: true,
        },
        create: {
          email: item.email.toLowerCase().trim(),
          nama: item.nama_lengkap,
          role: item.role,
          password: item.passwordHash,
          is_active: true,
        },
      });

      // Jika ada alias email, buat/update juga
      if (item.alias_email) {
        await prisma.user.upsert({
          where: { email: item.alias_email.toLowerCase().trim() },
          update: {
            nama: item.nama_lengkap,
            role: item.role,
            password: item.passwordHash,
            is_active: true,
          },
          create: {
            email: item.alias_email.toLowerCase().trim(),
            nama: item.nama_lengkap,
            role: item.role,
            password: item.passwordHash,
            is_active: true,
          },
        });
      }

      // 2. Link ke Pegawai
      // Cari data pegawai yang ada berdasarkan user_id, nik, atau nama_lengkap
      let pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            item.nik ? { nik: item.nik } : undefined,
            { nama_lengkap: { contains: item.nama_lengkap.split(',')[0].trim(), mode: 'insensitive' } },
          ].filter(Boolean) as any,
        },
      });

      if (pegawai) {
        pegawai = await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: {
            user_id: user.id,
            email: item.email,
            nama_lengkap: item.nama_lengkap,
            nik: item.nik || pegawai.nik,
            kategori_pegawai: item.kategori_pegawai,
            jabatan: item.jabatan || pegawai.jabatan,
          },
        });
      } else {
        pegawai = await prisma.pegawai.create({
          data: {
            user_id: user.id,
            nama_lengkap: item.nama_lengkap,
            email: item.email,
            nik: item.nik || null,
            kategori_pegawai: item.kategori_pegawai,
            jabatan: item.jabatan,
          },
        });
      }

      results.push({
        nama: item.nama_lengkap,
        email: item.email,
        role: item.role,
        isMultiRole: item.isMultiRole,
        pegawaiId: pegawai.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat dan mengonfigurasi seluruh akun Civitas Guru dan Multiuser Admin Super!',
      total: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Error provisioning civitas accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
