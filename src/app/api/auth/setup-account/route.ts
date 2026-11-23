import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { getUserMultiRoles, ROLE_DESTINATIONS } from "@/lib/multiRole";
import { validateUsernameFormat, isUsernameStandard } from "@/lib/utils/username";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, username, new_password, chosen_role } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID wajib disertakan" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Wali santri tidak boleh mengubah username
    if (user.role?.toUpperCase() === "WALI_SANTRI") {
      return NextResponse.json(
        { error: "Akun Wali Santri menggunakan NIS dan tanggal lahir santri" },
        { status: 403 }
      );
    }

    // 1. Validasi & Normalisasi Username
    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Username wajib diisi" },
        { status: 400 }
      );
    }

    const usernameCheck = validateUsernameFormat(username);
    if (!usernameCheck.isValid || !usernameCheck.normalized) {
      return NextResponse.json(
        { error: usernameCheck.error || "Format username tidak memenuhi standar" },
        { status: 400 }
      );
    }

    const cleanUsername = usernameCheck.normalized;

    // Cek keunikan username
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: "insensitive" },
        id: { not: user.id }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" sudah digunakan oleh akun lain. Silakan pilih variasi lain.` },
        { status: 400 }
      );
    }

    // 2. Validasi Password jika ada
    let updatedPasswordHash: string | undefined = undefined;
    if (new_password) {
      if (new_password.length < 8) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 8 karakter" },
          { status: 400 }
        );
      }
      if (!/[A-Z]/.test(new_password)) {
        return NextResponse.json(
          { error: "Kata sandi harus mengandung minimal 1 huruf besar (A-Z)" },
          { status: 400 }
        );
      }
      if (!/[a-z]/.test(new_password)) {
        return NextResponse.json(
          { error: "Kata sandi harus mengandung minimal 1 huruf kecil (a-z)" },
          { status: 400 }
        );
      }
      if (!/\d/.test(new_password)) {
        return NextResponse.json(
          { error: "Kata sandi harus mengandung minimal 1 angka (0-9)" },
          { status: 400 }
        );
      }
      if (!/[!@#$%^&*(),.?":{}|<>\-_=+]/.test(new_password)) {
        return NextResponse.json(
          { error: "Kata sandi harus mengandung minimal 1 karakter khusus / simbol" },
          { status: 400 }
        );
      }
      if (cleanUsername.length >= 4 && new_password.toLowerCase().includes(cleanUsername.toLowerCase())) {
        return NextResponse.json(
          { error: "Kata sandi tidak boleh mengandung username Anda" },
          { status: 400 }
        );
      }

      updatedPasswordHash = await bcrypt.hash(new_password, 10);
    }

    // 3. Update database
    const updateData: any = {
      username: cleanUsername
    };

    if (updatedPasswordHash) {
      updateData.password = updatedPasswordHash;
      updateData.plain_password = new_password;
      updateData.must_change_password = false;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { pegawai: { select: { id: true, nama_lengkap: true, nama_panggilan: true } } }
    });

    // 4. Update session
    const multiRoles = await getUserMultiRoles(updatedUser.id);
    const effectiveRole = chosen_role ? chosen_role.toUpperCase() : (multiRoles.length > 0 ? multiRoles[0].role : updatedUser.role);
    const finalRedirectTo = ROLE_DESTINATIONS[effectiveRole] || "/dashboard";

    let asatidzId = updatedUser.pegawai?.id;
    let formattedNama = updatedUser.nama.trim();
    if (updatedUser.role?.toUpperCase() !== "WALI_SANTRI") {
      if (!/^Ust\.\s/i.test(formattedNama) && !/^Ustadz\s/i.test(formattedNama) && !/^Ustadzah\s/i.test(formattedNama)) {
        formattedNama = "Ust. " + formattedNama;
      }
    }

    await createSession({
      userId: updatedUser.id,
      email: updatedUser.email,
      nama: formattedNama,
      nama_panggilan: updatedUser.pegawai?.nama_panggilan || undefined,
      role: effectiveRole,
      originalRole: undefined,
      asatidz_id: asatidzId,
      spp_access_blocked: (updatedUser as any).spp_access_blocked ?? false,
      spp_blocked_reason: (updatedUser as any).spp_blocked_reason ?? undefined,
      is_default_password: false,
      availableRoles: multiRoles.map(r => r.role)
    });

    return NextResponse.json({
      success: true,
      message: "Kredensial akun berhasil diperbarui dan disimpan.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        nama: formattedNama,
        role: effectiveRole
      },
      redirectTo: finalRedirectTo
    });

  } catch (err: any) {
    console.error("Setup account error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui kredensial akun", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
