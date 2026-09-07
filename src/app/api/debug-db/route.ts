
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const pegawai = await prisma.pegawai.findMany({
      where: { OR: [ { nama_lengkap: { contains: 'Ade', mode: 'insensitive' } }, { no_hp: { contains: '5775053536' } } ] }
    });
    const wali = await prisma.waliSantri.findMany({
      where: { OR: [ { nama_lengkap: { contains: 'Ade', mode: 'insensitive' } }, { no_hp: { contains: '5775053536' } } ] }
    });
    return NextResponse.json({ pegawai, wali });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

