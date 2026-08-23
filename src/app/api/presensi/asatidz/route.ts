import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: list presensi by tanggal (hanya Admin Super dan Mudir)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.role || "").toLowerCase();
  const allowedRoles = ["admin", "admin_super", "mudir"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Forbidden: Hanya Admin Super dan Mudir yang memiliki akses melihat absensi guru' },
      { status: 403 }
    );
  }

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
      pegawai: {
        select: { id: true, nama_lengkap: true, jabatan: true } } },
    orderBy: { jam_masuk: 'asc' } });

  // Asatidz yang belum absen
  const sudahAbsen = presensi.map((p) => p.pegawai_id);
  let belumAbsen = await prisma.pegawai.findMany({
    where: {
      OR: [
        { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
        { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
        { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
        { jabatan: { contains: "Guru", mode: "insensitive" } },
        { jabatan: { contains: "Pengajar", mode: "insensitive" } },
        { mata_pelajaran: { not: null } },
      ],
      id: sudahAbsen.length > 0 ? { notIn: sudahAbsen } : undefined },
    select: { id: true, nama_lengkap: true, jabatan: true },
    orderBy: { nama_lengkap: 'asc' } });

  if (belumAbsen.length === 0 && presensi.length === 0) {
    belumAbsen = await prisma.pegawai.findMany({
      select: { id: true, nama_lengkap: true, jabatan: true },
      orderBy: { nama_lengkap: 'asc' } });
  }

  return NextResponse.json({ presensi, belumAbsen, tanggal });
}

// POST: input manual oleh admin / mudir
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.role || "").toLowerCase();
  const allowedRoles = ["admin", "admin_super", "mudir"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'Forbidden: Hanya Admin Super dan Mudir yang memiliki akses input absensi guru' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    pegawai_id,
    tanggal: tanggalStr,
    status,
    keterangan,
    jam_masuk: jamStr } = body;

  if (!pegawai_id || !tanggalStr || !status) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  const tanggal = new Date(tanggalStr);
  tanggal.setHours(0, 0, 0, 0);
  const jam_masuk = jamStr ? new Date(jamStr) : new Date();

  const presensi = await prisma.presensiAsatidz.upsert({
    where: { pegawai_id_tanggal: { pegawai_id, tanggal } },
    update: {
      status,
      keterangan: keterangan ?? null,
      jam_masuk,
      metode: 'manual' },
    create: {
      pegawai_id,
      tanggal,
      jam_masuk,
      status,
      metode: 'manual',
      keterangan: keterangan ?? null },
    include: {
      pegawai: { select: { nama_lengkap: true } } } });

  return NextResponse.json({ success: true, presensi });
}
