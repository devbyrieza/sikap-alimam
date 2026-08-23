import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kelas_id = searchParams.get('kelas_id');

  try {
    const where = kelas_id
      ? { kelas_id, is_active: true }
      : { is_active: true };

    const santri = await prisma.santriAktif.findMany({
      where,
      orderBy: { nama_lengkap: 'asc' },
      select: { id: true, nama_lengkap: true, nis: true, jenis_kelamin: true } });

    return NextResponse.json({ santri });
  } catch (err) {
    console.error('[GET /api/master/santri]', err);
    return NextResponse.json({ error: 'Gagal mengambil data santri' }, { status: 500 });
  }
}
