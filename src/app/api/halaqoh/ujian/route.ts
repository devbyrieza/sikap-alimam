import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const santri_id = searchParams.get('santri_id');
    const jenis_ujian = searchParams.get('jenis_ujian');
    const dari = searchParams.get('dari');
    const sampai = searchParams.get('sampai');
    const pegawai_id = searchParams.get('pegawai_id');

    const where: any = {};
    if (santri_id) where.santri_id = santri_id;
    if (jenis_ujian) where.jenis_ujian = jenis_ujian;
    if (pegawai_id) where.pegawai_id = pegawai_id;
    if (dari || sampai) {
      where.tanggal = {};
      if (dari) where.tanggal.gte = new Date(dari);
      if (sampai) where.tanggal.lte = new Date(sampai);
    }

    const data = await prisma.ujianTahfidz.findMany({
      where,
      include: {
        santri: {
          select: { nama_lengkap: true, nis: true }
        },
        pegawai: {
          select: { nama_lengkap: true }
        }
      },
      orderBy: {
        tanggal: 'desc'
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      santri_id,
      pegawai_id,
      tanggal,
      jenis_ujian,
      juz,
      surah_nomor,
      surah_nama,
      ayat_dari,
      ayat_ke,
      jumlah_halaman,
      nilai_bacaan,
      nilai_sikap = 82,
      is_lulus = true,
      catatan
    } = body;

    let nilai_akhir = Math.round((Number(nilai_bacaan) + Number(nilai_sikap)) / 2);
    
    if (jenis_ujian === 'ujian_itqon' && is_lulus !== false) {
      nilai_akhir += 10;
      if (nilai_akhir > 100) nilai_akhir = 100;
    }

    const data = id ? await prisma.ujianTahfidz.update({
      where: { id },
      data: {
        santri_id,
        pegawai_id,
        tanggal: new Date(tanggal),
        jenis_ujian,
        juz: juz ? Number(juz) : null,
        surah_nomor: surah_nomor ? Number(surah_nomor) : null,
        surah_nama,
        ayat_dari: ayat_dari ? Number(ayat_dari) : null,
        ayat_ke: ayat_ke ? Number(ayat_ke) : null,
        jumlah_halaman: jumlah_halaman ? Number(jumlah_halaman) : null,
        nilai_bacaan: Number(nilai_bacaan),
        nilai_sikap: Number(nilai_sikap),
        nilai_akhir,
        is_lulus: Boolean(is_lulus),
        catatan
      }
    }) : await prisma.ujianTahfidz.create({
      data: {
        santri_id,
        pegawai_id,
        tanggal: new Date(tanggal),
        jenis_ujian,
        juz: juz ? Number(juz) : null,
        surah_nomor: surah_nomor ? Number(surah_nomor) : null,
        surah_nama,
        ayat_dari: ayat_dari ? Number(ayat_dari) : null,
        ayat_ke: ayat_ke ? Number(ayat_ke) : null,
        jumlah_halaman: jumlah_halaman ? Number(jumlah_halaman) : null,
        nilai_bacaan: Number(nilai_bacaan),
        nilai_sikap: Number(nilai_sikap),
        nilai_akhir,
        is_lulus: Boolean(is_lulus),
        catatan
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
