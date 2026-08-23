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
      if (isRieza) jabatanKhusus = 'Kabid IT & Pengajar';
      if (isAbdilAziz) jabatanKhusus = 'Kabid Kurikulum & Pengajar';
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

      // Generate NIP (User ID) if not exist
      let nipPegawai = pegawai.nip;
      if (!nipPegawai) {
        // Format NIP 10 Digit: 2026 (Tahun) + 08 (Bulan) + 4 digit random (e.g. 2026081234)
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
        nipPegawai = `202608${randomDigits}`; 
        
        try {
          await prisma.pegawai.update({
            where: { id: pegawai.id },
            data: { nip: nipPegawai }
          });
        } catch(e) {
          nipPegawai = `202608${Math.floor(1000 + Math.random() * 9000)}`;
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
          is_active: true },
        create: {
          email: targetEmail,
          nama: pegawai.nama_lengkap,
          role: role,
          password: passwordHash,
          is_active: true } });

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
        nipPegawai: nipPegawai });
    }

    // Pastikan Santri IL Pindahan (Iman Prayogo - NIS 2602070019) terdaftar
    const kelasIL = await prisma.kelas.findFirst({
      where: {
        OR: [
          { jenjang: "IL" },
          { nama: { contains: "IL", mode: "insensitive" } },
          { nama: { contains: "I'dad", mode: "insensitive" } }
        ]
      }
    });

    if (kelasIL) {
      const imanExist = await prisma.santriAktif.findFirst({
        where: { nama_lengkap: { contains: "Iman Prayogo", mode: "insensitive" } }
      });
      if (!imanExist) {
        await prisma.santriAktif.create({
          data: {
            nis: "2602070019",
            nama_lengkap: "Iman Prayogo",
            kelas_id: kelasIL.id,
            jenis_kelamin: "L",
            is_active: true
          }
        });
        results.push({ santriAdded: "Iman Prayogo (NIS 2602070019)" });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat dan mengonfigurasi seluruh akun Civitas Guru & Santri (Termasuk Iman Prayogo - 22 Santri IL)!',
      total: results.length,
      data: results });

  } catch (error: any) {
    console.error('Error provisioning civitas accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
