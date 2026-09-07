
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Cek data Ade Supyana
    const pegawai = await prisma.pegawai.findMany({
      where: { OR: [ { nama_lengkap: { contains: 'Ade', mode: 'insensitive' } }, { no_hp: { contains: '5775053536' } } ] }
    });
    const wali = await prisma.orangTuaSantri.findMany({
      where: { OR: [ { nama_ayah: { contains: 'Ade', mode: 'insensitive' } }, { no_hp_ayah: { contains: '5775053536' } }, { nama_wali: { contains: 'Ade', mode: 'insensitive' } }, { no_hp_wali: { contains: '5775053536' } } ] }
    });
    
    // 2. Fix IL jenjang
    const updatedIL = await prisma.kelas.updateMany({
      where: { nama: { contains: 'IL' } },
      data: { jenjang: 'I\'dad Lughowi' }
    });

    return NextResponse.json({ pegawai, wali, updatedIL });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

