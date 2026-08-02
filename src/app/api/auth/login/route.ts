import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const identifier = email.trim();
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
      include: { pegawai: { select: { id: true, nama_lengkap: true } } },
    });

    // Jika tidak ditemukan via User email, coba cari di tabel Pegawai (via NIK, NIP, HP, atau Email)
    if (!user) {
      const pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { nik: identifier },
            { nip: identifier },
            { no_hp: identifier },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { user: { include: { pegawai: { select: { id: true, nama_lengkap: true } } } } },
      });

      if (pegawai?.user) {
        user = pegawai.user;
      }
    }

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Email/NIK/No HP atau password salah" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Email/NIK/No HP atau password salah" },
        { status: 401 }
      );
    }

    // Cari ID Pegawai/Asatidz jika belum terhubung langsung
    let asatidzId = user.pegawai?.id;
    if (!asatidzId) {
      const linkedPegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: { equals: user.email, mode: "insensitive" } },
            { nama_lengkap: { contains: user.nama.split(',')[0].trim(), mode: "insensitive" } },
          ],
        },
      });
      if (linkedPegawai) {
        asatidzId = linkedPegawai.id;
      }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
      asatidz_id: asatidzId,
    });

    return NextResponse.json({ success: true, role: user.role, nama: user.nama });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
