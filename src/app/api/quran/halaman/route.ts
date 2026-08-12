export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { calculateHalaman, getSurahByNomor } from '@/lib/quran-madinah';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surahNomor = parseInt(searchParams.get('surah') || '0');
  const ayatDari = parseInt(searchParams.get('dari') || '1');
  const ayatKe = parseInt(searchParams.get('ke') || '1');

  if (!surahNomor || surahNomor < 1 || surahNomor > 114) {
    return NextResponse.json({ error: 'Nomor surah tidak valid' }, { status: 400 });
  }

  const surah = getSurahByNomor(surahNomor);
  if (!surah) {
    return NextResponse.json({ error: 'Surah tidak ditemukan' }, { status: 404 });
  }

  // Clamp values
  const dari = Math.max(1, Math.min(ayatDari, surah.total_ayat));
  const ke = Math.max(dari, Math.min(ayatKe, surah.total_ayat));

  const halaman = calculateHalaman(surahNomor, dari, ke);

  return NextResponse.json({
    surah_nomor: surahNomor,
    surah_nama: surah.nama_latin,
    ayat_dari: dari,
    ayat_ke: ke,
    halaman,
    halaman_mulai_surah: surah.halaman_mulai,
  });
}
