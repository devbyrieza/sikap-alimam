import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let result = [];
    
    const p1 = await prisma.pegawai.updateMany({
      where: { nama_lengkap: { startsWith: 'Ade Supyana' } },
      data: { nama_lengkap: 'Ade Supyana, S.Pd.I' }
    });
    result.push({ target: 'Ade', count: p1.count });

    const p2 = await prisma.pegawai.updateMany({
      where: { nama_lengkap: { startsWith: 'Hardiansyah' } },
      data: { nama_lengkap: 'Hardiansyah, S.Pd' }
    });
    result.push({ target: 'Hardiansyah', count: p2.count });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}