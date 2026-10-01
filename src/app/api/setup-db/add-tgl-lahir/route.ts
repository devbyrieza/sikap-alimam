import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE santri_aktif ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
    `);
    return NextResponse.json({ success: true, message: 'Column tanggal_lahir added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
