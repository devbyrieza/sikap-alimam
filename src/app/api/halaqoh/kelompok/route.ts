export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { syncHalaqohFromExcel } from '@/lib/syncHalaqohFromExcel';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  let pegawai_id = searchParams.get('pegawai_id');
  const sesi = searchParams.get('sesi');

  try {
    const totalKelompok = await prisma.halaqohKelompok.count();
    if (totalKelompok === 0) {
      await syncHalaqohFromExcel().catch(() => {});
    }

    // Resolution for logged in teacher / pengampu
    const userRole = (session.role || "").toLowerCase();
    if (!pegawai_id && !userRole.includes("admin_super") && !userRole.includes("mudir") && !userRole.includes("kadiv_pengasuhan")) {
      if (session.asatidz_id) {
        pegawai_id = session.asatidz_id;
      } else if (session.userId) {
        const p = await prisma.pegawai.findFirst({
          where: {
            OR: [
              { user_id: session.userId },
              { email: session.email },
              ...(session.nama ? [{ nama_lengkap: { contains: session.nama.split(" ")[0], mode: "insensitive" as const } }] : [])
            ]
          }
        });
        if (p) pegawai_id = p.id;
      }
    }

    const kelompok = await prisma.halaqohKelompok.findMany({
      where: {
        ...(pegawai_id && { pegawai_id }),
        ...(sesi && { sesi }) },
      include: {
        pegawai: { select: { nama_lengkap: true } },
        anggota: {
          include: {
            santri: {
              include: { kelas: true }
            } } } } });
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
        sesi } });
    return NextResponse.json(newKelompok);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
