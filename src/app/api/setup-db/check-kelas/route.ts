import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const classes = await prisma.kelas.findMany({
    where: { nama: { contains: 'MA' } }
  });
  return NextResponse.json(classes);
}
