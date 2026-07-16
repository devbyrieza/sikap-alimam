import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: list presensi by tanggal (default hari ini)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tanggalStr = searchParams.get('tanggal');

  let tanggal: Date;
  if (tanggalStr) {
    tanggal = new Date(tanggalStr);
    tanggal.setHours(0, 0, 0, 0);
  } else {
    tanggal = new Date();
    tanggal.setHours(0, 0, 0, 0);
  }

  const presensi = await prisma.presensiAsatidz.findMany({
    where: { tanggal },
    include: {
      asatidz: {
        select: { id: true, nama_lengkap: true, jabatan: true },
      },
    },
    orderBy: { jam_masuk: 'asc' },
  });

  // Asatidz yang belum absen
  const sudahAbsen = presensi.map((p) => p.asatidz_id);
  const belumAbsen = await prisma.asatidz.findMany({
    where: {
      is_active: true,
      id: sudahAbsen.length > 0 ? { notIn: sudahAbsen } : undefined,
    },
    select: { id: true, nama_lengkap: true, jabatan: true },
    orderBy: { nama_lengkap: 'asc' },
  });

  return NextResponse.json({ presensi, belumAbsen, tanggal });
}

// POST: input manual oleh admin
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    asatidz_id,
    tanggal: tanggalStr,
    status,
    keterangan,
    jam_masuk: jamStr,
  } = body;

  if (!asatidz_id || !tanggalStr || !status) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  const tanggal = new Date(tanggalStr);
  tanggal.setHours(0, 0, 0, 0);
  const jam_masuk = jamStr ? new Date(jamStr) : new Date();

  const presensi = await prisma.presensiAsatidz.upsert({
    where: { asatidz_id_tanggal: { asatidz_id, tanggal } },
    update: {
      status,
      keterangan: keterangan ?? null,
      jam_masuk,
      metode: 'manual',
    },
    create: {
      asatidz_id,
      tanggal,
      jam_masuk,
      status,
      metode: 'manual',
      keterangan: keterangan ?? null,
    },
    include: {
      asatidz: { select: { nama_lengkap: true } },
    },
  });

  return NextResponse.json({ success: true, presensi });
}
