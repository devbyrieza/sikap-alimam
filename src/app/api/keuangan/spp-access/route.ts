export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Daftar semua Wali Santri beserta status akses SPP
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.role?.toLowerCase();
  if (!role?.includes("admin_keuangan") && !role?.includes("admin_super") && !role?.includes("mudir")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const waliList = await prisma.user.findMany({
    where: { role: { in: ["wali_santri", "WALI_SANTRI"] } },
    select: {
      id: true,
      nama: true,
      email: true,
      is_active: true,
      spp_access_blocked: true,
      spp_blocked_reason: true,
      orang_tua: {
        select: {
          santri: { select: { nama_lengkap: true, nis: true, kelas: { select: { nama: true } } } }
        }
      }
    },
    orderBy: { nama: "asc" }
  });

  return NextResponse.json(waliList);
}

// PATCH: Toggle blokir/aktifkan akses Wali Santri
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.role?.toLowerCase();
  if (!role?.includes("admin_keuangan") && !role?.includes("admin_super") && !role?.includes("mudir")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id, spp_access_blocked, spp_blocked_reason } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id wajib" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user_id },
    data: {
      spp_access_blocked: !!spp_access_blocked,
      spp_blocked_reason: spp_access_blocked ? (spp_blocked_reason || null) : null },
    select: { id: true, nama: true, spp_access_blocked: true, spp_blocked_reason: true }
  });

  return NextResponse.json({ success: true, user: updated });
}
