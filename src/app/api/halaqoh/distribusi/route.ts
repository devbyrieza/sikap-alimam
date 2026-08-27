import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const asatidz = await prisma.pegawai.findMany({
      where: {
        OR: [
          { kategori_pegawai: { contains: 'ASATIDZ' } },
          { kategori_pegawai: { contains: 'GURU' } },
          { kategori_pegawai: { contains: 'MUSYRIF' } },
          { jabatan: { contains: 'Pengasuh' } },
        ]
      },
      include: {
        halaqoh_kelompok: {
          include: {
            anggota: true
          }
        }
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    return NextResponse.json({ success: true, asatidz });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { pegawai_id, kelompok } = await req.json(); // kelompok: { id?, nama_kelompok, sesi }[]
    
    // 1. Get current groups for this teacher
    const currentGroups = await prisma.halaqohKelompok.findMany({
      where: { pegawai_id }
    });
    
    const currentIds = currentGroups.map(g => g.id);
    const newIds = kelompok.filter((k: any) => k.id).map((k: any) => k.id);

    // 2. Delete groups that were removed from the UI for this teacher
    const toDelete = currentIds.filter(id => !newIds.includes(id));
    if (toDelete.length > 0) {
      await prisma.halaqohKelompok.deleteMany({
        where: { id: { in: toDelete } }
      });
    }

    // 3. Upsert groups
    for (const k of kelompok) {
      if (k.id) {
        await prisma.halaqohKelompok.update({
          where: { id: k.id },
          data: {
            nama_kelompok: k.nama_kelompok,
            sesi: k.sesi
          }
        });
      } else {
        await prisma.halaqohKelompok.create({
          data: {
            pegawai_id,
            nama_kelompok: k.nama_kelompok,
            sesi: k.sesi
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Distribusi halaqoh berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}