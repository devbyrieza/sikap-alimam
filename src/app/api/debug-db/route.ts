
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Cek data Ade Supyana
    const pegawai = await prisma.pegawai.findMany({
      where: { OR: [ { nama_lengkap: { contains: 'Ade', mode: 'insensitive' } }, { no_hp: { contains: '5775053536' } } ] }
    });
    
    // Cari di tabel users
    const users = await prisma.user.findMany({
      where: { OR: [ { nama: { contains: 'Ade', mode: 'insensitive' } }, { phone: { contains: '5775053536' } }, { username: { contains: '5775053536' } } ] }
    });
    
    // 2. Fix IL jenjang
    const updatedIL = await prisma.kelas.updateMany({
      where: { nama: { contains: 'IL' } },
      data: { jenjang: 'I\'dad Lughowi' }
    });

    return NextResponse.json({ pegawai, users, updatedIL });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

