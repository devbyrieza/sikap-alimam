import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const defaultPassAlimam = "Paas2026!";
    const defaultPassWahab = "2026#@";

    const hashAlimam = await bcrypt.hash(defaultPassAlimam, 10);
    const hashWahab = await bcrypt.hash(defaultPassWahab, 10);

    const oldDefaults = [
      "GuruAlimam2026!",
      "Alimam2026!",
      "Andalus2025!",
      "Paas2025!",
      "123456",
      "password123"
    ];

    let updatedUsers = 0;
    
    // 1. Update all users in `users` table who have an old default password
    const usersToUpdate = await prisma.user.findMany({
      where: {
        plain_password: { in: oldDefaults },
        email: { not: { contains: 'wahabrajasam' } },
        username: { not: { contains: 'wahabrajasam' } }
      }
    });

    for (const u of usersToUpdate) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          plain_password: defaultPassAlimam,
          password: hashAlimam
        }
      });
      updatedUsers++;
    }

    // 2. Update Wahab explicitly in `users` if exists
    const wahabUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'wahabrajasam' } },
          { username: { contains: 'wahabrajasam' } }
        ]
      }
    });

    for (const w of wahabUsers) {
      await prisma.user.update({
        where: { id: w.id },
        data: {
          plain_password: defaultPassWahab,
          password: hashWahab
        }
      });
      updatedUsers++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengupdate ${updatedUsers} akun users ke password default baru.`,
      users: usersToUpdate.map(u => u.email)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
