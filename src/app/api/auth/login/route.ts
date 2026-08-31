import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Self-healing: pastikan kolom phone & must_change_password ada di tabel users
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
      `);
    } catch (_) { /* ignore */ }

    const { email, password, selectedRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const identifier = email.trim();
    const cleanPhone = identifier.replace(/\D/g, "");
    let phoneVariations: string[] = [identifier];
    if (cleanPhone.startsWith("62")) {
      phoneVariations.push("0" + cleanPhone.substring(2));
    } else if (cleanPhone.startsWith("0")) {
      phoneVariations.push("62" + cleanPhone.substring(1));
      phoneVariations.push("+62" + cleanPhone.substring(1));
    }

    // 1. Cari via User table (email, username, atau nomor HP)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
          { phone: { in: phoneVariations } },
        ] },
      include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } });

    // 2. Jika tidak ditemukan via User, cari di tabel Pegawai (NIK, NIP, HP, Email)
    if (!user) {
      const pegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { nik: identifier },
            { nip: identifier },
            { no_hp: { in: phoneVariations } },
            { email: { equals: identifier, mode: "insensitive" } },
          ] },
        include: { user: { include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } } } } });

      if (pegawai?.user) {
        // Pegawai sudah punya User terhubung
        user = pegawai.user;
      } else if (pegawai && !pegawai.user_id) {
        // Auto-provision: Pegawai ada tapi belum punya akun User — buat akun baru
        const bcrypt2 = await import("bcryptjs");
        const defaultPassword = "Paas2026!";
        const hashed = await bcrypt2.default.hash(defaultPassword, 10);
        const newUsername = (pegawai.nama_lengkap || "pegawai")
          .toLowerCase()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9._]/g, "")
          .substring(0, 30);

        const newUser = await prisma.user.create({
          data: {
            username: newUsername + Math.floor(Math.random() * 900 + 100),
            email: pegawai.email || `${newUsername}@pesantren-alimam.com`,
            phone: pegawai.no_hp || undefined,
            password: hashed,
            plain_password: defaultPassword,
            nama: pegawai.nama_lengkap || newUsername,
            role: "GURU",
            is_active: true,
            must_change_password: true,
          },
          include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
        });

        // Tautkan pegawai ke user baru
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { user_id: newUser.id }
        });

        user = newUser;
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
      password === "2026#@" ||
      password === "Paas2026!" ||
      password === "Puas2026!" ||
      password === "Andalus2026!" ||
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
          ] } });
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

    const isDefaultPassword = 
      (user as any).must_change_password === true || 
      password === "2026#@" || 
      user.plain_password === "2026#@" ||
      password === "Paas2026!" || 
      password === "Puas2026!" || 
      password === "Andalus2026!" || 
      user.plain_password === "Paas2026!" || 
      user.plain_password === "Puas2026!" || 
      user.plain_password === "Andalus2026!";

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
      is_default_password: isDefaultPassword });

    return NextResponse.json({ success: true, role: user.role, nama: formattedNama, is_default_password: isDefaultPassword });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
