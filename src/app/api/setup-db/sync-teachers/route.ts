import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncAsatidzMapel } from '@/lib/syncAsatidzMapel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];

    // Ensure IL class exists
    let classIL = await prisma.kelas.findFirst({
      where: {
        is_active: true,
        OR: [
          { nama: 'IL' },
          { jenjang: 'IL' },
          { nama: { contains: "I'dad", mode: "insensitive" } }
        ]
      }
    });

    if (!classIL) {
      classIL = await prisma.kelas.create({
        data: {
          nama: 'IL',
          jenjang: 'IL',
          is_active: true
        }
      });
      logs.push("Created canonical Kelas 'IL'.");
    } else {
      logs.push(`Found canonical Kelas 'IL' (ID: ${classIL.id}).`);
    }

    // Get all teachers
    const teachers = await prisma.pegawai.findMany({
      where: {
        AND: [
          {
            OR: [
              { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR", "MUSYRIF", "musyrif"] } },
              { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
              { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
              { mata_pelajaran: { not: null } },
            ]
          },
          { kategori_pegawai: { not: "PEGAWAI_UMUM" } }
        ]
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    logs.push(`Found ${teachers.length} teachers to evaluate.`);

    let syncedCount = 0;
    for (const t of teachers) {
      if (t.mata_pelajaran && t.mata_pelajaran.trim()) {
        await syncAsatidzMapel(t.id, t.mata_pelajaran);
        syncedCount++;
        logs.push(`Synced [${t.nama_lengkap}]: ${t.mata_pelajaran}`);
      }
    }

    // Also explicitly verify Azzam Aghnia Ilman
    const azzam = teachers.find(t => t.nama_lengkap.toLowerCase().includes('azzam'));
    let azzamDetails = null;
    if (azzam) {
      const azzamMapels = await prisma.asatidzmMapel.findMany({
        where: { pegawai_id: azzam.id },
        include: { kelas: true, mapel: true }
      });
      azzamDetails = {
        id: azzam.id,
        nama: azzam.nama_lengkap,
        mata_pelajaran: azzam.mata_pelajaran,
        relational_count: azzamMapels.length,
        assignments: azzamMapels.map(am => ({
          kelas: am.kelas.nama,
          jenjang: am.kelas.jenjang,
          mapel: am.mapel.nama
        }))
      };
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mensinkronisasi ${syncedCount} guru ke relasi kelas & mapel.`,
      logs,
      azzam: azzamDetails
    });
  } catch (error: any) {
    console.error("Error in sync-teachers route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
