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

    const bcrypt = await import("bcryptjs");
    const hashedPwd = await bcrypt.hash("Paas2026!", 10);

    // Cari pegawai Azzam
    const pegawai = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: "Azzam", mode: "insensitive" } }
    });

    if (!pegawai) {
      return NextResponse.json({ error: "Pegawai Azzam tidak ditemukan di database" }, { status: 404 });
    }

    // Cari User
    let user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: "azzam", mode: "insensitive" } },
          { email: { equals: "azzam@pesantren-alimam.com", mode: "insensitive" } },
          { phone: { equals: "082119136590" } }
        ]
      }
    });

    if (!user) {
      // Create user
      user = await (prisma as any).user.create({
        data: {
          username: "azzam",
          email: "azzamaghnia926@gmail.com",
          phone: "082119136590",
          password: hashedPwd,
          plain_password: "Paas2026!",
          nama: pegawai.nama_lengkap,
          role: "guru",
          must_change_password: true
        }
      });
    } else {
      // Update existing user
      user = await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          phone: "082119136590",
          email: "azzamaghnia926@gmail.com", // update email too
          password: hashedPwd,
          plain_password: "Paas2026!",
          must_change_password: true
        }
      });
    }

    // Link Pegawai to User
    if (pegawai.user_id !== user.id) {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { user_id: user.id }
      });
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      email: user.email,
      phone: user.phone,
      hint: "Login: username=azzam atau HP=082119136590, password=Paas2026!"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
