import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const asatidz = await prisma.pegawai.findMany({
      where: {
        OR: [
          { kategori_pegawai: { contains: 'ASATIDZ' } },
          { kategori_pegawai: { contains: 'GURU' } },
        ]
      },
      include: {
        mengajar: {
          include: {
            kelas: true,
            mapel: true
          }
        }
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    const kelas = await prisma.kelas.findMany({ where: { is_active: true }, orderBy: [{ jenjang: 'asc' }, { nama: 'asc' }] });
    const mapel = await prisma.mataPelajaran.findMany({ where: { is_active: true }, orderBy: { nama: 'asc' } });

    return NextResponse.json({ success: true, asatidz, kelas, mapel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { pegawai_id, assignments } = await req.json();
    
    // Clear old
    await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id } });

    // Insert new
    if (assignments && assignments.length > 0) {
      await prisma.asatidzmMapel.createMany({
        data: assignments.map((a: any) => ({
          pegawai_id,
          kelas_id: a.kelas_id,
          mapel_id: a.mapel_id
        }))
      });
    }

    // Rebuild mata_pelajaran string for SIMPEG compatibility
    const updated = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id },
      include: { kelas: true, mapel: true }
    });

    const mapelString = updated.map(a => [] ).join(', ');
    
    await prisma.pegawai.update({
      where: { id: pegawai_id },
      data: { mata_pelajaran: mapelString || null }
    });

    return NextResponse.json({ success: true, message: "Distribusi mengajar berhasil disimpan", mata_pelajaran: mapelString });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
