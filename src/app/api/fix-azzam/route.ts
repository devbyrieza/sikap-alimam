import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
      `);
    } catch (_) {}

    const azzam = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: "azzam", mode: "insensitive" } },
          { email: { equals: "azzam@pesantren-alimam.com", mode: "insensitive" } },
        ]
      }
    });

    if (!azzam) {
      return NextResponse.json({ error: "User Azzam tidak ditemukan" }, { status: 404 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPwd = await bcrypt.hash("Paas2026!", 10);

    const updated = await (prisma as any).user.update({
      where: { id: azzam.id },
      data: { 
        phone: "082119136590",
        password: hashedPwd,
        plain_password: "Paas2026!",
        must_change_password: true
      }
    });

    const pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { email: { equals: "azzam@pesantren-alimam.com", mode: "insensitive" } },
          { nama_lengkap: { contains: "Azzam", mode: "insensitive" } },
        ]
      }
    });

    if (pegawai && !pegawai.user_id) {
      await prisma.pegawai.update({ where: { id: pegawai.id }, data: { user_id: azzam.id } });
    }

    return NextResponse.json({
      success: true,
      user_id: updated.id,
      email: updated.email,
      phone: updated.phone,
      hint: "Login: username=azzam atau HP=082119136590, password=Paas2026!"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
