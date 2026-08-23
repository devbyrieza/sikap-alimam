export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Assuming session user id corresponds to a pegawai
  const pegawai_id = (session.user as any)?.id;

  try {
    const [santriAktif, kelompokHalaqoh] = await Promise.all([
      prisma.santriAktif.findMany({
        select: {
          id: true,
          nama_lengkap: true,
          kelas_id: true,
          nis: true,
          kelas: { select: { nama: true } } } }),
      prisma.halaqohKelompok.findMany({
        where: {
          ...(pegawai_id && { pegawai_id }) } }),
    ]);

    return NextResponse.json({
      santriAktif,
      kelompokHalaqoh });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
