import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adinda = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: 'Adinda' } },
    include: { asatidz_mapel: { include: { mapel: true, kelas: true } } }
  });
  return NextResponse.json(adinda);
}
