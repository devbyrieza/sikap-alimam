import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kelas_id = searchParams.get('kelas_id');

  try {
    const where = kelas_id
      ? { kelas_id, is_active: true }
      : { is_active: true };

    const mapel = await prisma.mataPelajaran.findMany({
      where,
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, kelas_id: true },
    });

    return NextResponse.json({ mapel });
  } catch (err) {
    console.error('[GET /api/master/mapel]', err);
    return NextResponse.json({ error: 'Gagal mengambil data mapel' }, { status: 500 });
  }
}
