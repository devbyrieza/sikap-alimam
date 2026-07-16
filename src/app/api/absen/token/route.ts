import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function generateToken(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET: return token hari ini jika ada
export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tokenData = await prisma.tokenHarian.findUnique({
    where: { tanggal: today },
  });

  if (!tokenData) {
    return NextResponse.json({ token: null });
  }

  return NextResponse.json({
    token: tokenData.token,
    tanggal: tokenData.tanggal,
    expires_at: tokenData.expires_at,
    expired: new Date() > tokenData.expires_at,
  });
}

// POST: generate token baru untuk hari ini
export async function POST(req: NextRequest) {
  void req; // unused but required signature
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Expire tengah malam
  const expiresAt = new Date(today);
  expiresAt.setDate(expiresAt.getDate() + 1);
  expiresAt.setHours(0, 0, 0, 0);

  let token = generateToken();

  // Pastikan token unik
  let exists = await prisma.tokenHarian.findUnique({ where: { token } });
  while (exists) {
    token = generateToken();
    exists = await prisma.tokenHarian.findUnique({ where: { token } });
  }

  // Upsert: update jika sudah ada token hari ini
  const tokenData = await prisma.tokenHarian.upsert({
    where: { tanggal: today },
    update: { token, expires_at: expiresAt },
    create: { tanggal: today, token, expires_at: expiresAt },
  });

  return NextResponse.json({
    token: tokenData.token,
    tanggal: tokenData.tanggal,
    expires_at: tokenData.expires_at,
  });
}
