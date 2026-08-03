import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const { targetRole } = await req.json();
    if (!targetRole) {
      return NextResponse.json({ error: "Target role tidak valid" }, { status: 400 });
    }

    // Only allow switching if they are originally ADMIN_SUPER
    const originalRole = session.originalRole || session.role;
    if (originalRole !== "ADMIN_SUPER") {
      return NextResponse.json({ error: "Tidak memiliki hak akses multi-role" }, { status: 403 });
    }

    if (!["ADMIN_SUPER", "GURU"].includes(targetRole)) {
      return NextResponse.json({ error: "Role tidak didukung" }, { status: 400 });
    }

    // Renew session with new role
    await createSession({
      userId: session.userId,
      email: session.email,
      nama: session.nama,
      role: targetRole,
      originalRole: originalRole,
      asatidz_id: session.asatidz_id,
    });

    return NextResponse.json({ success: true, role: targetRole });
  } catch (err) {
    console.error("Switch Role error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
