import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: validasi token + return daftar asatidz
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');

  if (!token) {
    return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 });
  }

  // Cari token di DB
  const tokenData = await prisma.tokenHarian.findUnique({
    where: { token },
  });

  if (!tokenData) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
  }

  // Cek expiry
  if (new Date() > tokenData.expires_at) {
    return NextResponse.json({ error: 'Token sudah kadaluarsa' }, { status: 410 });
  }

  // Ambil daftar asatidz aktif
  const asatidz = await prisma.asatidz.findMany({
    where: { is_active: true },
    select: {
      id: true,
      nama_lengkap: true,
      gelar_depan: true,
      gelar_belakang: true,
      jabatan: true,
    },
    orderBy: { nama_lengkap: 'asc' },
  });

  return NextResponse.json({
    valid: true,
    tanggal: tokenData.tanggal,
    asatidz,
  });
}

// POST: simpan absensi
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');

  if (!token) {
    return NextResponse.json({ error: 'Token diperlukan' }, { status: 400 });
  }

  // Validasi token
  const tokenData = await prisma.tokenHarian.findUnique({ where: { token } });
  if (!tokenData) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
  }
  if (new Date() > tokenData.expires_at) {
    return NextResponse.json({ error: 'Token kadaluarsa' }, { status: 410 });
  }

  const body = await req.json();
  const { asatidz_id, lat, lng, foto_url } = body;

  if (!asatidz_id) {
    return NextResponse.json({ error: 'Pilih nama asatidz terlebih dahulu' }, { status: 400 });
  }

  const tanggal = tokenData.tanggal;
  const now = new Date();

  // Tentukan status: telat jika setelah jam 08:00
  const jamMasuk = now;
  const batasJam = new Date(now);
  batasJam.setHours(8, 0, 0, 0);
  const status = jamMasuk > batasJam ? 'telat' : 'hadir';

  // Cek duplikasi
  const existing = await prisma.presensiAsatidz.findUnique({
    where: { asatidz_id_tanggal: { asatidz_id, tanggal } },
  });

  if (existing) {
    return NextResponse.json({ error: 'Anda sudah melakukan absensi hari ini' }, { status: 409 });
  }

  // Simpan presensi
  const presensi = await prisma.presensiAsatidz.create({
    data: {
      asatidz_id,
      tanggal,
      jam_masuk: jamMasuk,
      status,
      metode: 'link',
      lat: lat ?? null,
      lng: lng ?? null,
      foto_url: foto_url ?? null,
    },
    include: {
      asatidz: { select: { nama_lengkap: true } },
    },
  });

  return NextResponse.json({
    success: true,
    nama: presensi.asatidz.nama_lengkap,
    jam_masuk: presensi.jam_masuk,
    status: presensi.status,
  });
}
