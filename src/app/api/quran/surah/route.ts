export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { surahData, searchSurah } from '@/lib/quran-madinah';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (q) {
    return NextResponse.json(searchSurah(q));
  }
  
  return NextResponse.json(surahData);
}
