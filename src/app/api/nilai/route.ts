import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: list nilai by mapel_id + kelas_id + semester + tahun_ajaran
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let mapel_id = searchParams.get('mapel_id');
  const kelas_id = searchParams.get('kelas_id');
  const semester = searchParams.get('semester');
  const tahun_ajaran = searchParams.get('tahun_ajaran');
  const nama_mapel_custom = searchParams.get('nama_mapel_custom');

  if (!mapel_id && nama_mapel_custom) {
    const existingMapel = await prisma.mataPelajaran.findFirst({
      where: { nama: { equals: nama_mapel_custom, mode: "insensitive" }, ...(kelas_id ? { kelas_id } : {}) }
    });
    if (existingMapel) {
      mapel_id = existingMapel.id;
    } else {
      return NextResponse.json({ nilai: [] });
    }
  }

  const where: Record<string, unknown> = {};
  if (mapel_id) where.mapel_id = mapel_id;
  if (kelas_id) where.kelas_id = kelas_id;
  if (semester) where.semester = semester;
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

// POST: bulk upsert nilai (High-Density)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); // DISABLED FOR MVP/TESTING
  }

  const body = await req.json();
  const { data, mapel_id, kelas_id, semester, tahun_ajaran, periode, nama_mapel_custom } = body;

  let finalMapelId = mapel_id;
  if (!finalMapelId && nama_mapel_custom) {
    const existing = await prisma.mataPelajaran.findFirst({
      where: { nama: { equals: nama_mapel_custom, mode: "insensitive" }, kelas_id }
    });
    if (existing) {
      finalMapelId = existing.id;
    } else {
      const newMapel = await prisma.mataPelajaran.create({
        data: { nama: nama_mapel_custom.trim(), kelas_id, is_active: true }
      });
      finalMapelId = newMapel.id;
    }
  }

  if (
    !data ||
    !Array.isArray(data) ||
    !finalMapelId ||
    !kelas_id ||
    !semester ||
    !tahun_ajaran ||
    !periode
  ) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  let count = 0;
  
  // Data format expected: 
  // [ { santri_id: 'uuid', nilai: { harian: 90, kompetensi: 85, sikap: null, ujian: null } } ]

  for (const item of data) {
    if (!item.santri_id || !item.nilai) continue;

    const uiKeys = ['harian', 'kompetensi', 'sikap', 'ujian'];

    for (const uiKey of uiKeys) {
      const value = item.nilai[uiKey];
      
      // Map uiKey to database jenis
      let jenis = '';
      if (uiKey === 'ujian') {
        jenis = periode; // "pts" or "pas"
      } else {
        jenis = `${uiKey}_${periode}`; // e.g. "harian_pts" or "kompetensi_pas"
      }

      // Jika value ada angkanya (bisa 0)
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        
        // Upsert data
        const existing = await prisma.nilaiSantri.findFirst({
          where: {
            santri_id: item.santri_id,
            mapel_id: finalMapelId,
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
              nilai: numValue,
            },
          });
        } else {
          await prisma.nilaiSantri.create({
            data: {
              santri_id: item.santri_id,
              mapel_id: finalMapelId,
              kelas_id,
              semester,
              jenis,
              tahun_ajaran,
              nilai: numValue,
            },
          });
        }
        count++;
      } else if (value === '' || value === null) {
         // Optionally, if value is explicitly empty, we could delete it, 
         // but for safety in MVP, we just ignore it.
      }
    }
  }

  return NextResponse.json({ success: true, count });
}
