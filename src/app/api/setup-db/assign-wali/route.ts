import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const assignments = [
      { nama_guru: "Agus Cahyono", nama_kelas: "7 MTs" },
      { nama_guru: "Imron Abdillah", nama_kelas: "IL" }
    ];

    const results = [];

    for (const assignment of assignments) {
      // 1. Cari Pegawai (Guru)
      const pegawai = await prisma.pegawai.findFirst({
        where: {
          nama_lengkap: {
            contains: assignment.nama_guru,
            mode: 'insensitive'
          }
        },
        include: { user: true }
      });

      if (!pegawai) {
        results.push({ status: "error", message: `Pegawai ${assignment.nama_guru} tidak ditemukan di database.` });
        continue;
      }

      // 2. Cari Kelas
      const kelas = await prisma.kelas.findFirst({
        where: {
          nama: {
            equals: assignment.nama_kelas,
            mode: 'insensitive'
          }
        }
      });

      if (!kelas) {
        results.push({ status: "error", message: `Kelas ${assignment.nama_kelas} tidak ditemukan di database.` });
        continue;
      }

      // 3. Update Kelas dengan wali_kelas_id
      await prisma.kelas.update({
        where: { id: kelas.id },
        data: { wali_kelas_id: pegawai.id }
      });

      // 4. Update Role User menjadi WALI_KELAS jika belum
      if (pegawai.user_id) {
        // Hanya update jika rolenya sebelumnya adalah GURU atau role biasa, untuk memastikan kita tidak men-downgrade Admin Super
        if (pegawai.user?.role === 'GURU' || pegawai.user?.role === 'guru') {
          await prisma.user.update({
            where: { id: pegawai.user_id },
            data: { role: 'WALI_KELAS' }
          });
        }
      }

      results.push({
        status: "success",
        message: `Berhasil menugaskan ${pegawai.nama_lengkap} sebagai Wali Kelas ${kelas.nama}`,
        pegawai_id: pegawai.id,
        kelas_id: kelas.id,
        user_updated: !!pegawai.user_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Proses penugasan Wali Kelas selesai',
      data: results
    });

  } catch (error: any) {
    console.error('Failed to assign wali kelas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
