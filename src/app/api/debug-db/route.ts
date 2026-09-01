import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const naufals = await prisma.santriAktif.findMany({
      where: {
        OR: [
          { nama_lengkap: { contains: 'Naufal', mode: 'insensitive' } },
          { nama_lengkap: { contains: 'Alfaniri', mode: 'insensitive' } },
          { nama_lengkap: { contains: 'Al-Faniri', mode: 'insensitive' } }
        ]
      },
      select: { id: true, nama_lengkap: true, nis: true }
    });

    const kelompok = await prisma.halaqohKelompok.findFirst({
      where: { nama_kelompok: { contains: 'Iqbal', mode: 'insensitive' } },
      include: { anggota: { include: { santri: true } } }
    });

    return NextResponse.json({ naufals, kelompok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
