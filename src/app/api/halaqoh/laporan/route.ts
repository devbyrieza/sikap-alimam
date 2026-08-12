export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const santri_id = searchParams.get('santri_id');
  const bulan = parseInt(searchParams.get('bulan') || '1');
  const tahun = parseInt(searchParams.get('tahun') || '2026');
  const pekan_ke = parseInt(searchParams.get('pekan_ke') || '1');
  const periode = searchParams.get('periode') || 'pekanan';

  if (!santri_id) {
    return NextResponse.json({ error: 'santri_id diperlukan' }, { status: 400 });
  }

  try {
    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date;

    if (periode === 'pekanan') {
      const startDay = (pekan_ke - 1) * 7 + 1;
      const endDay = Math.min(31, pekan_ke * 7);
      startDate = new Date(Date.UTC(tahun, bulan - 1, startDay));
      endDate = new Date(Date.UTC(tahun, bulan - 1, endDay, 23, 59, 59));
    } else if (periode === 'bulanan') {
      startDate = new Date(Date.UTC(tahun, bulan - 1, 1));
      endDate = new Date(Date.UTC(tahun, bulan, 0, 23, 59, 59));
    } else {
      // Semesteran
      const isSemester2 = bulan > 6;
      const startMonth = isSemester2 ? 6 : 0;
      const endMonth = isSemester2 ? 11 : 5;
      startDate = new Date(Date.UTC(tahun, startMonth, 1));
      endDate = new Date(Date.UTC(tahun, endMonth + 1, 0, 23, 59, 59));
    }

    // Fetch CatatanHalaqoh in date range
    const catatan = await prisma.catatanHalaqoh.findMany({
      where: {
        santri_id,
        tanggal: { gte: startDate, lte: endDate },
      },
    });

    // Fetch UjianTahfidz in date range
    const ujian = await prisma.ujianTahfidz.findMany({
      where: {
        santri_id,
        tanggal: { gte: startDate, lte: endDate },
      },
      orderBy: { tanggal: 'desc' },
    });

    const total_hadir = catatan.filter(c => c.kehadiran === 'hadir').length;
    const total_sakit = catatan.filter(c => c.kehadiran === 'sakit').length;
    const total_izin = catatan.filter(c => c.kehadiran === 'izin').length;
    const total_alfa = catatan.filter(c => c.kehadiran === 'alfa').length;

    const total_halaman = parseFloat(catatan.reduce((a, c) => a + (c.jumlah_halaman || 0), 0).toFixed(1));

    const hadirRecords = catatan.filter(c => c.kehadiran === 'hadir');
    const avg_nilai_sikap = hadirRecords.length > 0
      ? Math.round(hadirRecords.reduce((a, c) => a + c.nilai_sikap, 0) / hadirRecords.length)
      : 82;

    const avg_nilai_bacaan = hadirRecords.length > 0
      ? Math.round(hadirRecords.reduce((a, c) => a + c.nilai_bacaan, 0) / hadirRecords.length)
      : 82;

    const avg_nilai_harian = hadirRecords.length > 0
      ? Math.round(hadirRecords.reduce((a, c) => a + c.nilai_akhir, 0) / hadirRecords.length)
      : 82;

    const ujianPekanan = ujian.find((u: any) => u.jenis_ujian === 'ujian_pekanan');
    const ujianBulanan = ujian.find((u: any) => u.jenis_ujian === 'ujian_bulanan');
    const ujianTarget = ujian.find((u: any) => u.jenis_ujian === 'ujian_target');
    const ujianItqonList = ujian.filter((u: any) => u.jenis_ujian === 'ujian_itqon' && u.is_lulus);

    const ujian_pekanan_nilai = ujianPekanan?.nilai_akhir ?? null;
    const ujian_bulanan_nilai = ujianBulanan?.nilai_akhir ?? null;
    const ujian_target_nilai = ujianTarget?.nilai_akhir ?? null;
    const ujian_itqon_count = ujianItqonList.length;

    // Calculate Raport Estimation
    const examScore = ujian_pekanan_nilai || ujian_bulanan_nilai || ujian_target_nilai || avg_nilai_harian;
    const bonusItqon = ujian_itqon_count > 0 ? 10 : 0;
    const nilai_raport_estimasi = Math.min(100, Math.round((avg_nilai_harian + examScore) / 2) + bonusItqon);

    return NextResponse.json({
      santri_id,
      periode,
      bulan,
      tahun,
      total_hadir,
      total_sakit,
      total_izin,
      total_alfa,
      total_halaman,
      avg_nilai_sikap,
      avg_nilai_bacaan,
      avg_nilai_harian,
      ujian_pekanan_nilai,
      ujian_bulanan_nilai,
      ujian_target_nilai,
      ujian_itqon_count,
      nilai_raport_estimasi,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
