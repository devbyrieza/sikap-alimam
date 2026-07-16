import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const kelas = await prisma.kelas.findMany({
      where: { is_active: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, jenjang: true },
    });

    return NextResponse.json({ kelas });
  } catch (err) {
    console.error('[GET /api/master/kelas]', err);
    return NextResponse.json({ error: 'Gagal mengambil data kelas' }, { status: 500 });
  }
}
