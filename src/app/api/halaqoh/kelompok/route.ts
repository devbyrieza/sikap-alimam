export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pegawai_id = searchParams.get('pegawai_id');
  const sesi = searchParams.get('sesi');

  try {
    const kelompok = await prisma.halaqohKelompok.findMany({
      where: {
        ...(pegawai_id && { pegawai_id }),
        ...(sesi && { sesi }),
      },
      include: {
        anggota: {
          include: {
            santri: true,
          },
        },
      },
    });
    return NextResponse.json(kelompok);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { pegawai_id, kelas_id, nama_kelompok, sesi } = body;

    const newKelompok = await prisma.halaqohKelompok.create({
      data: {
        pegawai_id,
        kelas_id,
        nama_kelompok,
        sesi,
      },
    });
    return NextResponse.json(newKelompok);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
