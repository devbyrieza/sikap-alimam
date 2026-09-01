import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const santriNaufal = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: { contains: 'M Naufal Alfaniri', mode: 'insensitive' } }
    });

    if (!santriNaufal) {
      return NextResponse.json({ success: false, error: 'Santri tidak ditemukan' });
    }

    const kelompokIqbal = await prisma.halaqohKelompok.findMany({
      where: { nama_kelompok: { contains: 'Iqbal', mode: 'insensitive' } }
    });

    let count = 0;
    for (const kel of kelompokIqbal) {
      const existing = await prisma.halaqohAnggota.findFirst({
        where: { kelompok_id: kel.id, santri_id: santriNaufal.id }
      });
      if (!existing) {
        await prisma.halaqohAnggota.create({
          data: { kelompok_id: kel.id, santri_id: santriNaufal.id }
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Berhasil menambahkan M Naufal Alfaniri ke ${count} kelompok Ust. Iqbal.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
