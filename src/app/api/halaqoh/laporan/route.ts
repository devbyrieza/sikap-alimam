import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const santri_id = searchParams.get('santri_id');
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const pekan_ke = searchParams.get('pekan_ke');

    if (!santri_id) {
      return NextResponse.json({ error: 'santri_id is required' }, { status: 400 });
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (bulan && tahun) {
      const year = parseInt(tahun);
      const month = parseInt(bulan) - 1;

      if (pekan_ke) {
        const week = parseInt(pekan_ke);
        const startDay = (week - 1) * 7 + 1;
        let endDay = week * 7;

        startDate = new Date(year, month, startDay);
        endDate = new Date(year, month, endDay, 23, 59, 59, 999);

        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        if (endDay > lastDayOfMonth || week >= 5) {
          endDate = new Date(year, month, lastDayOfMonth, 23, 59, 59, 999);
        }
      } else {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      }
    }

    const whereDate = startDate && endDate ? {
      gte: startDate,
      lte: endDate
    } : undefined;

    const catatanWhere: any = { santri_id };
    if (whereDate) catatanWhere.tanggal = whereDate;

    const ujianWhere: any = { santri_id };
    if (whereDate) ujianWhere.tanggal = whereDate;

    const [catatanList, ujianList] = await Promise.all([
      prisma.catatanHalaqoh.findMany({ where: catatanWhere }),
      prisma.ujianTahfidz.findMany({ where: ujianWhere })
    ]);

    let total_hadir = 0;
    let total_sakit = 0;
    let total_izin = 0;
    let total_alfa = 0;
    let total_halaman = 0;

    let sum_kelancaran = 0;
    let sum_bacaan = 0;
    let sum_harian = 0;

    catatanList.forEach(c => {
      if (c.kehadiran === 'hadir') total_hadir++;
      else if (c.kehadiran === 'sakit') total_sakit++;
      else if (c.kehadiran === 'izin') total_izin++;
      else if (c.kehadiran === 'alfa') total_alfa++;

      total_halaman += (c.jumlah_halaman || 0);
      sum_kelancaran += (c.nilai_kelancaran || 0);
      sum_bacaan += (c.nilai_bacaan || 0);
      sum_harian += (c.nilai_akhir || 0);
    });

    const catatanCount = catatanList.length || 1;
    const avg_nilai_kelancaran = Math.round((sum_kelancaran / catatanCount) * 100) / 100;
    const avg_nilai_bacaan = Math.round((sum_bacaan / catatanCount) * 100) / 100;
    const avg_nilai_harian = Math.round((sum_harian / catatanCount) * 100) / 100;

    const ujianPekanan = ujianList.filter(u => u.jenis_ujian === 'ujian_pekanan');
    const ujianBulanan = ujianList.filter(u => u.jenis_ujian === 'ujian_bulanan');
    const ujianItqon = ujianList.filter(u => u.jenis_ujian === 'ujian_itqon' && u.is_lulus);

    const ujian_pekanan_nilai = ujianPekanan.length 
      ? Math.round(ujianPekanan.reduce((acc, u) => acc + u.nilai_akhir, 0) / ujianPekanan.length)
      : 0;
      
    const ujian_bulanan_nilai = ujianBulanan.length 
      ? Math.round(ujianBulanan.reduce((acc, u) => acc + u.nilai_akhir, 0) / ujianBulanan.length)
      : 0;

    const ujian_itqon_count = ujianItqon.length;

    let nilai_raport_estimasi = Math.round((avg_nilai_harian + (ujian_pekanan_nilai || avg_nilai_harian)) / 2);
    if (ujian_itqon_count > 0) {
      nilai_raport_estimasi += 10;
    }
    if (nilai_raport_estimasi > 100) {
      nilai_raport_estimasi = 100;
    }

    return NextResponse.json({
      summary: {
        total_hadir,
        total_sakit,
        total_izin,
        total_alfa,
        total_halaman,
        avg_nilai_kelancaran: catatanList.length === 0 ? 0 : avg_nilai_kelancaran,
        avg_nilai_bacaan: catatanList.length === 0 ? 0 : avg_nilai_bacaan,
        avg_nilai_harian: catatanList.length === 0 ? 0 : avg_nilai_harian,
        ujian_pekanan_nilai,
        ujian_bulanan_nilai,
        ujian_itqon_count,
        nilai_raport_estimasi: catatanList.length === 0 ? 0 : nilai_raport_estimasi
      },
      catatan: catatanList,
      ujian: ujianList
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
