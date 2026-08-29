export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let pegawai_id = session.asatidz_id;
  if (!pegawai_id && session.userId) {
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

  const userRole = (session.role || "").toLowerCase();
  const isAdminOrKadiv = userRole.includes("admin") || userRole.includes("mudir") || userRole.includes("kadiv");

  try {
    const [santriAktif, kelompokHalaqoh] = await Promise.all([
      prisma.santriAktif.findMany({
        where: { is_active: true },
        select: {
          id: true,
          nama_lengkap: true,
          kelas_id: true,
          nis: true,
          kelas: { select: { nama: true } } } }),
      prisma.halaqohKelompok.findMany({
        where: {
          ...(!isAdminOrKadiv && pegawai_id ? { pegawai_id } : {}) } }),
    ]);

    return NextResponse.json({
      santriAktif,
      kelompokHalaqoh });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
