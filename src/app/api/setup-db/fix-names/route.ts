import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let result = [];
    
    // Fix Ade
    const p1 = await prisma.pegawai.updateMany({
      where: { nama_lengkap: 'Ade Supyana S. Pd. I' },
      data: { nama_lengkap: 'Ade Supyana, S.Pd.I' }
    });
    result.push({ target: 'Ade', count: p1.count });

    // Fix Hardiansyah
    const p2 = await prisma.pegawai.updateMany({
      where: { nama_lengkap: 'Hardiansyah, S. Pd' },
      data: { nama_lengkap: 'Hardiansyah, S.Pd' }
    });
    result.push({ target: 'Hardiansyah', count: p2.count });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}