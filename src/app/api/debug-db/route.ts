import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Injeksi Akun Admin & Guru (agar bisa login)
    await prisma.user.upsert({
      where: { email: 'admin@pesantren-alimam.com' },
      update: { password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq' },
      create: { email: 'admin@pesantren-alimam.com', password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq', nama: 'Administrator', role: 'admin', is_active: true }
    });
    
    const userRieza = await prisma.user.upsert({
      where: { email: 'riezaekatomara@gmail.com' },
      update: { password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq' },
      create: { email: 'riezaekatomara@gmail.com', password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq', nama: 'Rieza Eka Tomara', role: 'GURU', is_active: true }
    });

    // 2. Injeksi Pegawai (agar muncul di dropdown Asatidz)
    await prisma.pegawai.upsert({
      where: { user_id: userRieza.id },
      update: { kategori_pegawai: 'GURU' },
      create: { user_id: userRieza.id, nama_lengkap: 'Rieza Eka Tomara', jabatan: 'Guru', kategori_pegawai: 'GURU' }
    });

    // 3. Injeksi Kelas (agar muncul di dropdown Kelas)
    const kelas7 = await prisma.kelas.upsert({ where: { nama: '7 MTs' }, update: {}, create: { nama: '7 MTs', jenjang: 'MTs' } });
    const kelasIL = await prisma.kelas.upsert({ where: { nama: 'I\'dad Lughowy' }, update: {}, create: { nama: 'I\'dad Lughowy', jenjang: 'IL' } });

    // 4. Injeksi Mapel (agar muncul di dropdown Mapel)
    await prisma.mataPelajaran.upsert({ where: { nama_kelas_id: { nama: 'Bahasa Arab', kelas_id: kelas7.id } }, update: {}, create: { nama: 'Bahasa Arab', kelas_id: kelas7.id } });
    await prisma.mataPelajaran.upsert({ where: { nama_kelas_id: { nama: 'Aqidah', kelas_id: kelas7.id } }, update: {}, create: { nama: 'Aqidah', kelas_id: kelas7.id } });
    await prisma.mataPelajaran.upsert({ where: { nama_kelas_id: { nama: 'Fiqih', kelas_id: kelasIL.id } }, update: {}, create: { nama: 'Fiqih', kelas_id: kelasIL.id } });

    return NextResponse.json({ success: true, message: 'Data Kelas, Asatidz, dan Mapel berhasil disuntikkan!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
