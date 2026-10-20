import { NextRequest, NextResponse } from "next/server";
import { getLiveSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserMultiRoles, ROLE_DESTINATIONS } from "@/lib/multiRole";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mengambil daftar peran pribadi HANYA milik pengguna yang sedang login
    const myRoles = await getUserMultiRoles(session.userId);

    return NextResponse.json({
      success: true,
      canSwitch: myRoles.length > 1,
      currentRole: session.role,
      currentEmail: session.email,
      originalRole: session.originalRole || null,
      roles: myRoles,
    });
  } catch (error: any) {
    console.error("GET /api/auth/switch-role error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { target_role, switch_back } = body;

    // Ambil data user asli yang sedang login
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { pegawai: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const myRoles = await getUserMultiRoles(user.id);
    if (myRoles.length <= 1) {
      return NextResponse.json(
        { error: "Akun Anda tidak memiliki peran ganda untuk beralih." },
        { status: 403 }
      );
    }

    let effectiveTargetRole: string;

    if (switch_back) {
      // Kembali ke peran utama pengguna
      effectiveTargetRole = user.role.toUpperCase();
    } else {
      if (!target_role) {
        return NextResponse.json({ error: "target_role wajib diisi" }, { status: 400 });
      }

      const isAllowedRole = myRoles.some(
        (r) => r.role.toUpperCase() === target_role.toUpperCase()
      );

      if (!isAllowedRole) {
        return NextResponse.json(
          { error: "Anda hanya berwenang beralih ke peran yang terdaftar pada akun Anda sendiri." },
          { status: 403 }
        );
      }

      effectiveTargetRole = target_role.toUpperCase();
    }

    const isDifferentFromPrimary = effectiveTargetRole !== user.role.toUpperCase();

    // Sesi baru: Identitas pengguna (userId, email, nama) TETAP SAMA 100%!
    // Hanya peran aktif (role) yang berganti.
    const updatedPayload = {
      ...session,
      userId: user.id,
      email: user.email,
      nama: user.nama,
      role: effectiveTargetRole,
      originalRole: isDifferentFromPrimary ? user.role.toUpperCase() : undefined,
      originalUserId: undefined,
      originalNama: undefined,
      asatidz_id: user.pegawai?.id || session.asatidz_id,
      availableRoles: myRoles.map((r) => r.role),
    };

    await createSession(updatedPayload);

    const redirectTo = ROLE_DESTINATIONS[effectiveTargetRole] || "/dashboard";

    return NextResponse.json({
      success: true,
      switched: true,
      role: effectiveTargetRole,
      nama: user.nama,
      redirectTo,
    });
  } catch (error: any) {
    console.error("POST /api/auth/switch-role error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
