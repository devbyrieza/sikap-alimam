import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const p = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: 'Agus', mode: 'insensitive' } }
    });
    if (!p) return NextResponse.json({ error: 'Pegawai not found' });
    
    const am = await prisma.asatidzmMapel.findMany({
      where: { pegawai_id: p.id },
      include: { mapel: { include: { kelas: true } } }
    });
    return NextResponse.json({ pegawai: p.nama_lengkap, am });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
