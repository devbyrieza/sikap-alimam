import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/auth";
import { detectJuzFromUjian } from "@/lib/quran-madinah";

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
    const session = await getSession();

    // Cek Kunci Nilai Halaqoh
    const lockSetting = await prisma.kalenderAkademik.findFirst({
      where: { kategori: "PENGATURAN_SISTEM", nama_kegiatan: "LOCK_INPUT_HALAQOH" }
    });
    if (lockSetting?.is_libur && !session?.role?.includes("ADMIN_SUPER") && !session?.role?.includes("MUDIR")) {
      return NextResponse.json({ error: "Akses Ditolak: Penginputan Ujian Halaqoh sudah dikunci oleh Admin Kurikulum." }, { status: 403 });
    }

    const body = await request.json();
    let {
      id,
      santri_id,
      pegawai_id,
      tanggal,
      jenis_ujian,
      juz,
      surah_nomor,
      surah_nama,
      surah_selesai_nomor,
      surah_selesai_nama,
      ayat_dari,
      ayat_ke,
      jumlah_halaman,
      nilai_bacaan,
      nilai_kelancaran,
      nilai_sikap,
      is_lulus,
      catatan
    } = body;

    if (!pegawai_id && session) {
      if (session.asatidz_id) {
        pegawai_id = session.asatidz_id;
      } else if (session.userId) {
        const pegawai = await prisma.pegawai.findFirst({
          where: { user_id: session.userId }
        });
        if (pegawai) pegawai_id = pegawai.id;
      }
    }

    if (!pegawai_id) {
      return NextResponse.json({ error: "Data Pegawai/Musyrif tidak ditemukan. Harap lengkapi profil terlebih dahulu." }, { status: 400 });
    }

    let nilai_akhir = Math.round((Number(nilai_bacaan) + Number(nilai_kelancaran || 0) + Number(nilai_sikap)) / 3);
    if (jenis_ujian === 'ujian_itqon' && is_lulus) {
      nilai_akhir = Math.min(100, nilai_akhir + 10);
    }

    let final_ayat_dari = ayat_dari ? Number(ayat_dari) : null;
    let final_ayat_ke = ayat_ke ? Number(ayat_ke) : null;
    if (final_ayat_dari !== null && final_ayat_ke !== null && final_ayat_dari > final_ayat_ke) {
      const temp = final_ayat_dari;
      final_ayat_dari = final_ayat_ke;
      final_ayat_ke = temp;
    }

    let final_juz = juz ? Number(juz) : null;
    if (!final_juz) {
      final_juz = detectJuzFromUjian({
        juz,
        surah_nomor,
        surah_selesai_nomor,
        catatan,
        jumlah_halaman,
      });
    }

    if (id) {
      const updated = await prisma.ujianTahfidz.update({
        where: { id },
        data: {
          santri_id,
          pegawai_id,
          tanggal: new Date(tanggal),
          jenis_ujian,
          juz: final_juz,
          surah_nomor: surah_nomor ? Number(surah_nomor) : null,
          surah_nama,
          surah_selesai_nomor: surah_selesai_nomor ? Number(surah_selesai_nomor) : null,
          surah_selesai_nama,
          ayat_dari: final_ayat_dari,
          ayat_ke: final_ayat_ke,
          jumlah_halaman: jumlah_halaman ? Number(jumlah_halaman) : null,
          nilai_bacaan: Number(nilai_bacaan),
          nilai_kelancaran: Number(nilai_kelancaran || 0),
          nilai_sikap: Number(nilai_sikap),
          nilai_akhir,
          is_lulus,
          catatan
        }
      });
      return NextResponse.json(updated);
    } else {
      const data = await prisma.ujianTahfidz.create({
        data: {
          santri_id,
          pegawai_id,
          tanggal: new Date(tanggal),
          jenis_ujian,
          juz: final_juz,
          surah_nomor: surah_nomor ? Number(surah_nomor) : null,
          surah_nama,
          surah_selesai_nomor: surah_selesai_nomor ? Number(surah_selesai_nomor) : null,
          surah_selesai_nama,
          ayat_dari: final_ayat_dari,
          ayat_ke: final_ayat_ke,
          jumlah_halaman: jumlah_halaman ? Number(jumlah_halaman) : null,
          nilai_bacaan: Number(nilai_bacaan),
          nilai_kelancaran: Number(nilai_kelancaran || 0),
          nilai_sikap: Number(nilai_sikap),
          nilai_akhir,
          is_lulus,
          catatan
        }
      });

      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
