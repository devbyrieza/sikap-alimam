import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, selectedRole } = await req.json();

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
      include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } },
    });

    // Jika tidak ditemukan via User email, coba cari di tabel Pegawai (via NIK, NIP, HP, atau Email)
    if (!user) {
      const cleanPhone = identifier.replace(/\D/g, "");
      let phoneVariations = [identifier];
      if (cleanPhone.startsWith("62")) {
        phoneVariations.push("0" + cleanPhone.substring(2));
      } else if (cleanPhone.startsWith("0")) {
        phoneVariations.push("62" + cleanPhone.substring(1));
        phoneVariations.push("+62" + cleanPhone.substring(1));
      }

      const pegawai = await prisma.pegawai.findFirst({
        where: {
          user_id: { not: null },
          OR: [
            { nik: identifier },
            { nip: identifier },
            { no_hp: { in: phoneVariations } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { user: { include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } } },
      });

      if (pegawai?.user) {
        user = pegawai.user;
      }
    }

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "User ID / Email / No. WA atau password salah" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    
    // DEMO BACKDOOR: Allow master passwords for easy testing during demo
    const isMasterPassword = 
      password === "Sikap2026!" || 
      password === "GuruAlimam2026!" || 
      password === "AdminAlimam2026!";

    if (!valid && !isMasterPassword) {
      return NextResponse.json(
        { error: "User ID / Email / No. WA atau password salah" },
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
        user.pegawai = linkedPegawai as any;
      }
    }

    // Format nama dengan sapaan Ust. jika belum ada
    let formattedNama = user.nama.trim();
    if (!/^Ust\.\s/i.test(formattedNama) && !/^Ustadz\s/i.test(formattedNama) && !/^Ustadzah\s/i.test(formattedNama)) {
      formattedNama = "Ust. " + formattedNama;
    }

    await createSession({
      userId: user.id,
      email: user.email,
      nama: formattedNama,
      nama_panggilan: user.pegawai?.nama_panggilan || undefined,
      role: user.role,
      originalRole: user.role,
      asatidz_id: asatidzId,
      spp_access_blocked: (user as any).spp_access_blocked ?? false,
      spp_blocked_reason: (user as any).spp_blocked_reason ?? undefined,
    });

    return NextResponse.json({ success: true, role: user.role, nama: formattedNama });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
