import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: list nilai by mapel_id + kelas_id + semester + jenis
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mapel_id = searchParams.get('mapel_id');
  const kelas_id = searchParams.get('kelas_id');
  const semester = searchParams.get('semester');
  const jenis = searchParams.get('jenis');
  const tahun_ajaran = searchParams.get('tahun_ajaran');

  const where: Record<string, unknown> = {};
  if (mapel_id) where.mapel_id = mapel_id;
  if (kelas_id) where.kelas_id = kelas_id;
  if (semester) where.semester = semester;
  if (jenis) where.jenis = jenis;
  if (tahun_ajaran) where.tahun_ajaran = tahun_ajaran;

  const nilai = await prisma.nilaiSantri.findMany({
    where,
    include: {
      santri: { select: { id: true, nama_lengkap: true, nis: true } },
      mapel: { select: { id: true, nama: true } },
    },
    orderBy: { santri: { nama_lengkap: 'asc' } },
  });

  return NextResponse.json({ nilai });
}

// POST: upsert batch nilai
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { items, mapel_id, kelas_id, semester, jenis, tahun_ajaran } = body;

  if (
    !items ||
    !Array.isArray(items) ||
    !mapel_id ||
    !kelas_id ||
    !semester ||
    !jenis ||
    !tahun_ajaran
  ) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  let count = 0;
  for (const item of items as Array<{
    santri_id: string;
    nilai: number;
    keterangan?: string;
  }>) {
    if (!item.santri_id || item.nilai === undefined || item.nilai === null) {
      continue;
    }

    // Cari existing dulu
    const existing = await prisma.nilaiSantri.findFirst({
      where: {
        santri_id: item.santri_id,
        mapel_id,
        kelas_id,
        semester,
        jenis,
        tahun_ajaran,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.nilaiSantri.update({
        where: { id: existing.id },
        data: {
          nilai: item.nilai,
          keterangan: item.keterangan ?? null,
        },
      });
    } else {
      await prisma.nilaiSantri.create({
        data: {
          santri_id: item.santri_id,
          mapel_id,
          kelas_id,
          semester,
          jenis,
          tahun_ajaran,
          nilai: item.nilai,
          keterangan: item.keterangan ?? null,
        },
      });
    }
    count++;
  }

  return NextResponse.json({ success: true, count });
}
