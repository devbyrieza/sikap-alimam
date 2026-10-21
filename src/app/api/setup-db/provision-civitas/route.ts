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

    const kelasMA = await prisma.kelas.upsert({
      where: { nama: "MA" },
      update: { jenjang: "MA", is_active: true },
      create: { nama: "MA", jenjang: "MA", is_active: true }
    });

    await prisma.kelas.upsert({
      where: { nama: "10 MA" },
      update: { jenjang: "MA", is_active: true },
      create: { nama: "10 MA", jenjang: "MA", is_active: true }
    });
    await prisma.kelas.upsert({
      where: { nama: "11 MA" },
      update: { jenjang: "MA", is_active: true },
      create: { nama: "11 MA", jenjang: "MA", is_active: true }
    });
    await prisma.kelas.upsert({
      where: { nama: "12 MA" },
      update: { jenjang: "MA", is_active: true },
      create: { nama: "12 MA", jenjang: "MA", is_active: true }
    });

    // 2. Akun Resmi Civitas & Gelar SIKAP Al-Imam
    const officialStaff = [
      {
        username: "rieza",
        email: "rieza@pesantren-alimam.com",
        altEmail: "admin@pesantren-alimam.com",
        namaLengkap: "Rieza Eka Tomara, S.Kom.",
        namaPanggilan: "Ust. Rieza",
        role: "ADMIN_SUPER",
        jabatan: "Kepala IT & Super Administrator Sistem",
        divisi: "IT & Sistem Informasi",
        kategori: "PEGAWAI_UMUM",
        mataPelajaran: "7 MTs: Matematika",
        nip: "2026081001",
        phone: "081234567801",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "wahab",
        email: "wahab@pesantren-alimam.com",
        altEmail: "wahab.rajasam@alimam.sch.id",
        namaLengkap: "Wahab Rajasam, M.Pd.",
        namaPanggilan: "Ust. Wahab",
        role: "ADMIN_SUPER",
        jabatan: "Mudir Pesantren & Dewan Pembina",
        divisi: "Pimpinan Pesantren",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Fiqh; IL: Fiqh",
        nip: "2026081002",
        phone: "081234567802",
        passwordHash: hashWahab,
        plainPassword: "2026#@"
      },
      {
        username: "keuangan",
        email: "keuangan@pesantren-alimam.com",
        altEmail: "bachtiar@alimam.sch.id",
        namaLengkap: "Maulidin Bachtiar",
        namaPanggilan: "Ust. Bachtiar",
        role: "ADMIN_KEUANGAN",
        jabatan: "Kepala Divisi Keuangan / Admin Keuangan",
        divisi: "Keuangan & Administrasi",
        kategori: "PEGAWAI_UMUM",
        mataPelajaran: "7 MTs: Bahasa Inggris",
        nip: "2026081003",
        phone: "081234567803",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "kurikulum",
        email: "kurikulum@pesantren-alimam.com",
        altEmail: "imron@pesantren-alimam.com",
        namaLengkap: "Imron Abdillah, S.Pd.",
        namaPanggilan: "Ust. Imron",
        role: "KEPALA_KURIKULUM",
        jabatan: "Kepala Kurikulum & Wali Kelas IL",
        divisi: "Kurikulum & Akademik",
        kategori: "ASATIDZ",
        mataPelajaran: "IL: Nahwu, Tahsin Al-Quran",
        nip: "2026081004",
        phone: "081234567804",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!",
        isWaliIL: true
      },
      {
        username: "pengasuhan",
        email: "pengasuhan@pesantren-alimam.com",
        altEmail: "wahyudi.pranata@alimam.sch.id",
        namaLengkap: "Wahyudi Pranata, B.A.",
        namaPanggilan: "Ust. Wahyudi",
        role: "KEPALA_PENGASUHAN",
        jabatan: "Kepala Pengasuhan & Asatidz",
        divisi: "Kepengasuhan & Kesantrian",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Bahasa Arab",
        nip: "2026081005",
        phone: "081234567805",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "walikelas.mts",
        email: "walikelas.mts@pesantren-alimam.com",
        altEmail: "agus.cahyono@alimam.sch.id",
        namaLengkap: "Agus Cahyono",
        namaPanggilan: "Ust. Agus",
        role: "WALI_KELAS",
        jabatan: "Wali Kelas MTs & Asatidz",
        divisi: "Akademik",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Kitabah; IL: Kitabah, Tadribat Alal Anmath",
        nip: "2026081006",
        phone: "081234567806",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!",
        isWaliMts: true
      },
      {
        username: "walikelas.ma",
        email: "walikelas.ma@pesantren-alimam.com",
        altEmail: "thoriq@alimam.sch.id",
        namaLengkap: "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.",
        namaPanggilan: "Ust. Thoriq",
        role: "WALI_KELAS",
        jabatan: "Wali Kelas MA & Asatidz",
        divisi: "Akademik",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Siroh Nabi, Hadis; IL: Siroh Nabi, Hadis",
        nip: "2026081007",
        phone: "081234567807",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!",
        isWaliMA: true
      },
      {
        username: "musyrif",
        email: "musyrif@pesantren-alimam.com",
        altEmail: "muhammad.iqbal@alimam.sch.id",
        namaLengkap: "Muhammad Iqbal, S.Pd.",
        namaPanggilan: "Ust. Iqbal",
        role: "MUSYRIF",
        jabatan: "Musyrif Tahfidz & Pengampu Halaqoh",
        divisi: "Al-Qur'an & Halaqoh Tahfidz",
        kategori: "MUSYRIF",
        mataPelajaran: "7 MTs: Shorf, Tahsin Al-Quran; IL: Shorf",
        nip: "2026081009",
        phone: "081234567809",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "ade.supiana",
        email: "ade.supiana@alimam.sch.id",
        namaLengkap: "Ade Supiana, S.Pd.I",
        namaPanggilan: "Ust. Ade",
        role: "GURU",
        jabatan: "Guru Bahasa Indonesia",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Bahasa Indonesia",
        nip: "2026081010",
        phone: "081234567810",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "arifin.syaifullah",
        email: "arifin.syaifullah@alimam.sch.id",
        namaLengkap: "Arifin Syaifullah, Lc., M.M., M.Pd.",
        namaPanggilan: "Ust. Arifin",
        role: "GURU",
        jabatan: "Guru Akidah",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Akidah; IL: Akidah",
        nip: "2026081011",
        phone: "081234567811",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "teguh.hudaya",
        email: "teguh@alimam.sch.id",
        namaLengkap: "Teguh Hudaya, Lc., M.M.",
        namaPanggilan: "Ust. Teguh",
        role: "GURU",
        jabatan: "Guru Entrepreneurship",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: Entrepreneurship; IL: Entrepreneurship",
        nip: "2026081012",
        phone: "081234567812",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "hardiansyah",
        email: "hardiansyah@pesantren-alimam.com",
        namaLengkap: "Hardiansyah, S.Pd.",
        namaPanggilan: "Ust. Hardiansyah",
        role: "GURU",
        jabatan: "Guru IPA Terpadu",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        mataPelajaran: "7 MTs: IPA Terpadu",
        nip: "2026081013",
        phone: "081234567813",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "imam.wahyudi",
        email: "imam.wahyudi@alimam.sch.id",
        namaLengkap: "Imam Wahyudi",
        namaPanggilan: "Ust. Imam",
        role: "GURU",
        jabatan: "Guru Pengajar",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        nip: "2026081014",
        phone: "081234567814",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "ramdan",
        email: "ramdan@alimam.sch.id",
        namaLengkap: "Ramdan",
        namaPanggilan: "Ust. Ramdan",
        role: "GURU",
        jabatan: "Guru Pengajar",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        nip: "2026081015",
        phone: "081234567815",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      },
      {
        username: "saif",
        email: "saif@alimam.sch.id",
        namaLengkap: "Saif",
        namaPanggilan: "Ust. Saif",
        role: "GURU",
        jabatan: "Guru Pengajar",
        divisi: "Pengajaran & Pembelajaran",
        kategori: "ASATIDZ",
        nip: "2026081016",
        phone: "081234567816",
        passwordHash: hashDefault,
        plainPassword: "PAAS2026!"
      }
    ];

    const results = [];

    for (const st of officialStaff) {
      if (st.phone) {
        await prisma.user.updateMany({
          where: { phone: st.phone },
          data: { phone: null }
        });
      }
      if (st.username) {
        await prisma.user.updateMany({
          where: { username: st.username },
          data: { username: null }
        });
      }

      let user = await prisma.user.findUnique({ where: { email: st.email } });
      if (!user && (st as any).altEmail) {
        user = await prisma.user.findUnique({ where: { email: (st as any).altEmail } });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: { nama: { contains: st.namaLengkap.split(',')[0].trim(), mode: "insensitive" } }
        });
      }

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: st.username,
            email: st.email,
            nama: st.namaLengkap,
            role: st.role,
            password: st.passwordHash,
            plain_password: st.plainPassword,
            phone: st.phone,
            is_active: true
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            username: st.username,
            email: st.email,
            nama: st.namaLengkap,
            role: st.role,
            password: st.passwordHash,
            plain_password: st.plainPassword,
            phone: st.phone,
            is_active: true
          }
        });
      }

      if (st.nip) {
        await prisma.pegawai.updateMany({
          where: { nip: st.nip },
          data: { nip: null }
        });
      }
      await prisma.pegawai.updateMany({
        where: { user_id: user.id },
        data: { user_id: null }
      });

      let pegawai = await prisma.pegawai.findFirst({ where: { user_id: user.id } });
      if (!pegawai) {
        pegawai = await prisma.pegawai.findFirst({ where: { email: st.email } });
      }
      if (!pegawai && (st as any).altEmail) {
        pegawai = await prisma.pegawai.findFirst({ where: { email: (st as any).altEmail } });
      }
      if (!pegawai) {
        pegawai = await prisma.pegawai.findFirst({
          where: { nama_lengkap: { contains: st.namaLengkap.split(',')[0].trim(), mode: "insensitive" } }
        });
      }

      if (pegawai) {
        pegawai = await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: {
            user_id: user.id,
            nama_lengkap: st.namaLengkap,
            nama_panggilan: st.namaPanggilan,
            email: st.email,
            divisi: st.divisi,
            jabatan: st.jabatan,
            kategori_pegawai: st.kategori,
            mata_pelajaran: (st as any).mataPelajaran || pegawai.mata_pelajaran,
            no_hp: st.phone,
            nip: st.nip
          }
        });
      } else {
        pegawai = await prisma.pegawai.create({
          data: {
            user_id: user.id,
            nama_lengkap: st.namaLengkap,
            nama_panggilan: st.namaPanggilan,
            email: st.email,
            divisi: st.divisi,
            jabatan: st.jabatan,
            kategori_pegawai: st.kategori,
            mata_pelajaran: (st as any).mataPelajaran,
            no_hp: st.phone,
            nip: st.nip,
            jenis_kelamin: "L"
          }
        });
      }

      if ((st as any).isWaliMts) {
        await prisma.kelas.update({
          where: { id: kelasMts.id },
          data: { wali_kelas_id: pegawai.id }
        });
      }
      if ((st as any).isWaliIL) {
        await prisma.kelas.update({
          where: { id: kelasIL.id },
          data: { wali_kelas_id: pegawai.id }
        });
      }
      if ((st as any).isWaliMA) {
        await prisma.kelas.update({
          where: { id: kelasMA.id },
          data: { wali_kelas_id: pegawai.id }
        });
      }

      results.push({
        nama: st.namaLengkap,
        username: st.username,
        email: st.email,
        role: st.role,
        jabatan: st.jabatan,
        plain_password: st.plainPassword
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengonfigurasi data resmi pejabat & civitas SIKAP Al-Imam (Rieza Eka Tomara, Wahab Rajasam, Maulidin Bachtiar, Imron Abdillah, Wahyudi Pranata, Agus Cahyono, Thoriq Ziyad, Ade Supiana, Arifin Syaifullah, Hardiansyah, Teguh Hudaya, Muhammad Iqbal, dll).',
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
