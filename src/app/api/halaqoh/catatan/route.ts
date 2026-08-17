export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get('tanggal');
  const dari = searchParams.get('dari');
  const sampai = searchParams.get('sampai');
  const sesi = searchParams.get('sesi');
  const kelompok_id = searchParams.get('kelompok_id');
  const pegawai_id = searchParams.get('pegawai_id');

  // Build date filter
  let tanggalFilter: any = undefined;
  if (tanggal) {
    tanggalFilter = new Date(tanggal);
  } else if (dari || sampai) {
    tanggalFilter = {
      ...(dari && { gte: new Date(dari) }),
      ...(sampai && { lte: new Date(sampai + 'T23:59:59.999Z') }),
    };
  }

  try {
    const catatan = await prisma.catatanHalaqoh.findMany({
      where: {
        ...(tanggalFilter && { tanggal: tanggalFilter }),
        ...(sesi && { sesi }),
        ...(kelompok_id && { kelompok_id }),
        ...(pegawai_id && { pegawai_id }),
      },
      include: {
        santri: {
          select: {
            nama_lengkap: true,
            nis: true,
          },
        },
        pegawai: {
          select: {
            nama_lengkap: true,
          },
        },
      },
      orderBy: [{ tanggal: 'desc' }, { sesi: 'asc' }],
    });
    return NextResponse.json(catatan);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      kelompok_id,
      pegawai_id,
      tanggal,
      sesi,
      jenis,
      surah_nomor,
      surah_nama,
      surah_nama_arab,
      ayat_dari,
      ayat_ke,
      jumlah_halaman,
      entries,
    } = body;

    const parsedTanggal = new Date(tanggal);

    const upserts = entries.map((entry: any) => {
      const nilai_akhir = Math.round((entry.nilai_bacaan + entry.nilai_kelancaran) / 2);

      return prisma.catatanHalaqoh.upsert({
        where: {
          santri_id_tanggal_sesi: {
            santri_id: entry.santri_id,
            tanggal: parsedTanggal,
            sesi: sesi,
          },
        },
        update: {
          kelompok_id,
          pegawai_id,
          jenis: entry.jenis ?? jenis,
          surah_nomor: entry.surah_nomor ?? surah_nomor,
          surah_nama: entry.surah_nama ?? surah_nama,
          surah_nama_arab: entry.surah_nama_arab ?? surah_nama_arab,
          ayat_dari: entry.ayat_dari ?? ayat_dari,
          ayat_ke: entry.ayat_ke ?? ayat_ke,
          jumlah_halaman: entry.jumlah_halaman ?? jumlah_halaman,
          kehadiran: entry.kehadiran,
          alasan: entry.alasan,
          nilai_sikap: entry.nilai_sikap,
          nilai_bacaan: entry.nilai_bacaan,
          nilai_kelancaran: entry.nilai_kelancaran,
          nilai_akhir,
          catatan: entry.catatan,
        },
        create: {
          santri_id: entry.santri_id,
          kelompok_id,
          pegawai_id,
          tanggal: parsedTanggal,
          sesi,
          jenis: entry.jenis ?? jenis,
          surah_nomor: entry.surah_nomor ?? surah_nomor,
          surah_nama: entry.surah_nama ?? surah_nama,
          surah_nama_arab: entry.surah_nama_arab ?? surah_nama_arab,
          ayat_dari: entry.ayat_dari ?? ayat_dari,
          ayat_ke: entry.ayat_ke ?? ayat_ke,
          jumlah_halaman: entry.jumlah_halaman ?? jumlah_halaman,
          kehadiran: entry.kehadiran,
          alasan: entry.alasan,
          nilai_sikap: entry.nilai_sikap,
          nilai_bacaan: entry.nilai_bacaan,
          nilai_kelancaran: entry.nilai_kelancaran,
          nilai_akhir,
          catatan: entry.catatan,
        },
      });
    });

    const results = await prisma.$transaction(upserts);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
