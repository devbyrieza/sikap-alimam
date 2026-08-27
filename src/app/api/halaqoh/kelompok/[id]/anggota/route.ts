export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.role || "").toLowerCase();
  const isAllowed = role.includes("admin_super") || role.includes("kadiv_pengasuhan");
  if (!isAllowed) {
    return NextResponse.json({ error: "Akses ditolak. Hanya Admin Super dan Kadiv Pengasuhan yang berhak mengelola anggota kelompok." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { santri_id } = body;
    const kelompok_id = params.id;

    const newAnggota = await prisma.halaqohAnggota.upsert({
      where: {
        kelompok_id_santri_id: {
          kelompok_id,
          santri_id } },
      update: {},
      create: {
        kelompok_id,
        santri_id } });

    return NextResponse.json(newAnggota);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.role || "").toLowerCase();
  const isAllowed = role.includes("admin_super") || role.includes("kadiv_pengasuhan");
  if (!isAllowed) {
    return NextResponse.json({ error: "Akses ditolak. Hanya Admin Super dan Kadiv Pengasuhan yang berhak mengelola anggota kelompok." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const santri_id = searchParams.get('santri_id');
  const kelompok_id = params.id;


  if (!santri_id) {
    return NextResponse.json({ error: 'santri_id is required' }, { status: 400 });
  }

  try {
    await prisma.halaqohAnggota.delete({
      where: {
        kelompok_id_santri_id: {
          kelompok_id,
          santri_id } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
