import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// POST /api/admin/reset-password
// Body: { user_id: string, new_password: string }
// Hanya bisa diakses oleh ADMIN / SUPER_ADMIN
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    // Hanya ADMIN / SUPER_ADMIN yang boleh
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    const userRoles = session.role?.split(",").map((r: string) => r.trim().toUpperCase()) ?? [];
    const isAuthorized = userRoles.some((r: string) => allowedRoles.includes(r));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Admin Super yang dapat mereset password akun lain." },
        { status: 403 }
      );
    }

    const { user_id, new_password } = await req.json();

    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: "user_id dan new_password wajib diisi" },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Pastikan user target ada
    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      include: { pegawai: { select: { nama_lengkap: true } } },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await prisma.user.update({
      where: { id: user_id },
      data: { password: hashedPassword },
    });

    const targetNama = targetUser.pegawai?.nama_lengkap ?? targetUser.nama;

    return NextResponse.json({
      success: true,
      message: `Password akun ${targetNama} berhasil diubah oleh Admin Super.`,
    });
  } catch (error: any) {
    console.error("[ADMIN_RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: error.message },
      { status: 500 }
    );
  }
}
