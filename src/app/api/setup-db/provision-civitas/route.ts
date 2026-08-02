import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminPasswordHash = await bcrypt.hash('AdminAlimam2026!', 10);
    const guruPasswordHash = await bcrypt.hash('GuruAlimam2026!', 10);

    // 1. Ambil semua data pegawai dengan kategori mengandung "GURU" atau "ASATIDZ" (case-insensitive)
    const semuaGuru = await prisma.pegawai.findMany({
      where: {
        OR: [
          { kategori_pegawai: { contains: 'GURU', mode: 'insensitive' } },
          { kategori_pegawai: { contains: 'ASATIDZ', mode: 'insensitive' } }
        ]
      }
    });

    const results = [];

    for (const pegawai of semuaGuru) {
      const namaUpper = pegawai.nama_lengkap.toUpperCase();
      
      // Deteksi Multi-Role Admin Super
      const isRieza = namaUpper.includes('RIEZA EKA TOMARA');
      const isAbdilAziz = namaUpper.includes('ABDIL AZIZ');
      const isWahab = namaUpper.includes('WAHAB RAJASAM');
      
      const isMultiRole = isRieza || isAbdilAziz || isWahab;
      const role = isMultiRole ? 'ADMIN_SUPER' : 'GURU';
      const passwordHash = isMultiRole ? adminPasswordHash : guruPasswordHash;
      
      // Tentukan Jabatan Khusus
      let jabatanKhusus = pegawai.jabatan;
      if (isRieza) jabatanKhusus = 'Kasi IT & Pengajar';
      if (isAbdilAziz) jabatanKhusus = 'Kasi Kurikulum & Pengajar';
      if (isWahab) jabatanKhusus = 'Mudir Pesantren & Pengajar';

      // Update jabatan pegawai jika perlu
      if (isMultiRole && pegawai.jabatan !== jabatanKhusus) {
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { jabatan: jabatanKhusus }
        });
      }

      // Tentukan Email (Gunakan yang ada di database, jika kosong baru buat email default)
      let targetEmail = pegawai.email?.toLowerCase().trim();
      
      if (!targetEmail || targetEmail === '') {
        // Buat email default: namadepan@pesantren-alimam.com
        const namaDepan = pegawai.nama_lengkap.split(/[\s,]+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        targetEmail = `${namaDepan}@pesantren-alimam.com`;
        
        // Update pegawai agar punya email ini
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { email: targetEmail }
        });
      }

      // Generate NIP (Nomor Induk Pegawai) if not exist
      let nipPegawai = pegawai.nip;
      if (!nipPegawai) {
        // Simple NIP format: 26 + 3 random digits, e.g., 26101
        // To be safe, we just use a 5-digit sequence logic based on current loop index or a random number
        const randomDigits = Math.floor(100 + Math.random() * 900); // 100 to 999
        nipPegawai = `26${randomDigits}`; // e.g. 26101, 26999
        
        try {
          await prisma.pegawai.update({
            where: { id: pegawai.id },
            data: { nip: nipPegawai }
          });
        } catch(e) {
          // In case of unique constraint violation (very rare), just try again with another number
          nipPegawai = `26${Math.floor(100 + Math.random() * 900)}`;
          await prisma.pegawai.update({
            where: { id: pegawai.id },
            data: { nip: nipPegawai }
          });
        }
      }

      // 2. Upsert User Account di SIKAP
      const user = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
          nama: pegawai.nama_lengkap,
          role: role,
          password: passwordHash,
          is_active: true,
        },
        create: {
          email: targetEmail,
          nama: pegawai.nama_lengkap,
          role: role,
          password: passwordHash,
          is_active: true,
        },
      });

      // 3. Link ke Pegawai
      if (!pegawai.user_id || pegawai.user_id !== user.id) {
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { user_id: user.id }
        });
      }

      results.push({
        nama: pegawai.nama_lengkap,
        email_digunakan: targetEmail,
        email_asli_db: pegawai.email,
        role: role,
        isMultiRole: isMultiRole,
        jabatan: jabatanKhusus || pegawai.jabatan,
        pegawaiId: pegawai.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat dan mengonfigurasi seluruh akun Civitas Guru (Dinamis dari Database)!',
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
