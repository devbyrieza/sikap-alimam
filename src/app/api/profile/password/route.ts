import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru harus diisi" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password baru harus mengandung kombinasi huruf besar, huruf kecil, angka, dan karakter khusus" }, { status: 400 });
    }

    // Ambil data user dari DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.username && newPassword.toLowerCase().includes(user.username.toLowerCase())) {
      return NextResponse.json({ error: "Password tidak boleh mengandung username Anda" }, { status: 400 });
    }

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Password lama tidak sesuai" }, { status: 400 });
    }

    // Hash dan simpan password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { 
        password: hashedNewPassword,
        plain_password: newPassword,
      } });

    return NextResponse.json({ message: "Password berhasil diganti" });
  } catch (error) {
    console.error("Ganti Password Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
