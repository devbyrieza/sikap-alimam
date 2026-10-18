import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hashDefault = await bcrypt.hash("PAAS2026!", 10);
    const hashWahab = await bcrypt.hash("2026#@", 10);

    // 1. Kelas canonical
    const kelasMts = await prisma.kelas.upsert({
      where: { nama: "7 MTs" },
      update: { jenjang: "MTs", is_active: true },
      create: { nama: "7 MTs", jenjang: "MTs", is_active: true }
    });

    const kelasIL = await prisma.kelas.upsert({
      where: { nama: "IL" },
      update: { jenjang: "IL", is_active: true },
      create: { nama: "IL", jenjang: "IL", is_active: true }
    });

    // 2. Akun Peran Terpisah Civitas SIKAP
    const canonicalAccounts = [
      {
        username: "admin",
        email: "admin@pesantren-alimam.com",
        nama: "Administrator Sistem",
        role: "ADMIN_SUPER",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Super Administrator IT & Sistem",
        divisi: "IT & Sistem Informasi",
        kategori: "PEGAWAI_UMUM",
        nip: "2026081001",
        phone: "081234567890"
      },
      {
        username: "keuangan",
        email: "keuangan@pesantren-alimam.com",
        nama: "Ustadz Maulidin Bachtiar",
        role: "ADMIN_KEUANGAN",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Kepala Divisi Keuangan / Admin Keuangan",
        divisi: "Keuangan & Administrasi",
        kategori: "PEGAWAI_UMUM",
        nip: "2026081002",
        phone: "081234567891"
      },
      {
        username: "kurikulum",
        email: "kurikulum@pesantren-alimam.com",
        nama: "Ustadz Agus Cahyono, S.Pd.",
        role: "KADIV_KURIKULUM",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Kadiv Kurikulum & Kepala Madrasah",
        divisi: "Kurikulum & Akademik",
        kategori: "ASATIDZ",
        nip: "2026081003",
        phone: "081234567892"
      },
      {
        username: "pengasuhan",
        email: "pengasuhan@pesantren-alimam.com",
        nama: "Ustadz Wahab Rajasam, M.Pd.",
        role: "KADIV_PENGASUHAN",
        plainPassword: "2026#@",
        passwordHash: hashWahab,
        jabatan: "Kadiv Pengasuhan & Mudir Pesantren",
        divisi: "Pengasuhan & Kesantrian",
        kategori: "ASATIDZ",
        nip: "2026081004",
        phone: "081234567893"
      },
      {
        username: "walikelas.il",
        email: "walikelas@pesantren-alimam.com",
        nama: "Ustadz Imran Fathillah, S.Pd.",
        role: "WALI_KELAS",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Wali Kelas IL & Pengajar",
        divisi: "Akademik",
        kategori: "ASATIDZ",
        nip: "2026081005",
        phone: "081234567894"
      },
      {
        username: "guru.mapel",
        email: "guru@pesantren-alimam.com",
        nama: "Ustadz Abdil Aziz, S.Pd.",
        role: "GURU",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Guru Mata Pelajaran",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        nip: "2026081006",
        phone: "081234567895"
      },
      {
        username: "musyrif",
        email: "musyrif@pesantren-alimam.com",
        nama: "Ustadz Muhammad Iqbal, S.Pd.",
        role: "MUSYRIF",
        plainPassword: "PAAS2026!",
        passwordHash: hashDefault,
        jabatan: "Musyrif Tahfidz & Pengampu Halaqoh",
        divisi: "Al-Qur'an & Halaqoh Tahfidz",
        kategori: "MUSYRIF",
        nip: "2026081007",
        phone: "081234567896"
      }
    ];

    const results = [];

    for (const acc of canonicalAccounts) {
      const user = await prisma.user.upsert({
        where: { email: acc.email },
        update: {
          username: acc.username,
          nama: acc.nama,
          role: acc.role,
          password: acc.passwordHash,
          plain_password: acc.plainPassword,
          phone: acc.phone,
          is_active: true
        },
        create: {
          username: acc.username,
          email: acc.email,
          nama: acc.nama,
          role: acc.role,
          password: acc.passwordHash,
          plain_password: acc.plainPassword,
          phone: acc.phone,
          is_active: true
        }
      });

      let pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: acc.email },
            { nama_lengkap: acc.nama }
          ]
        }
      });

      if (pegawai) {
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: {
            user_id: user.id,
            nama_lengkap: acc.nama,
            email: acc.email,
            divisi: acc.divisi,
            jabatan: acc.jabatan,
            kategori_pegawai: acc.kategori,
            no_hp: acc.phone,
            nip: acc.nip
          }
        });
      } else {
        pegawai = await prisma.pegawai.create({
          data: {
            user_id: user.id,
            nama_lengkap: acc.nama,
            email: acc.email,
            divisi: acc.divisi,
            jabatan: acc.jabatan,
            kategori_pegawai: acc.kategori,
            no_hp: acc.phone,
            nip: acc.nip,
            jenis_kelamin: "L"
          }
        });
      }

      if (acc.role === "WALI_KELAS" && acc.username.includes("il")) {
        await prisma.kelas.update({
          where: { id: kelasIL.id },
          data: { wali_kelas_id: pegawai.id }
        });
      }

      results.push({
        nama: acc.nama,
        username: acc.username,
        email: acc.email,
        role: acc.role,
        jabatan: acc.jabatan,
        plain_password: acc.plainPassword
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengonfigurasi akun Civitas terpisah (Admin Super, Keuangan, Kurikulum, Pengasuhan, Wali Kelas, Guru Mapel, Musyrif).',
      total: results.length,
      data: results
    });

  } catch (error: any) {
    console.error('Error provisioning civitas accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
