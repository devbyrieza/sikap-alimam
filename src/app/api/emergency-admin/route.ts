import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.user.upsert({
      where: { email: 'admin@pesantren-alimam.com' },
      update: { password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq' },
      create: {
        email: 'admin@pesantren-alimam.com',
        password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq',
        nama: 'Administrator',
        role: 'admin',
        is_active: true
      }
    });
    
    await prisma.user.upsert({
      where: { email: 'riezaekatomara@gmail.com' },
      update: { password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq' },
      create: {
        email: 'riezaekatomara@gmail.com',
        password: '$2b$10$.mwj/3z7MWut6TzUJ5Mz0e9UuaLIp68XNdu7us2vkcg645F2EZYuq',
        nama: 'Rieza Eka Tomara',
        role: 'GURU',
        is_active: true
      }
    });

    return NextResponse.json({ success: true, message: 'Admin & Rieza accounts created/updated successfully with password AdminAlimam2026!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
