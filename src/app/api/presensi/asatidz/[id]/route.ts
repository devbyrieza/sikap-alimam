import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.role?.includes("ADMIN_SUPER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    await prisma.presensiAsatidz.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ message: "Data presensi guru berhasil dihapus" }, { status: 200 });
  } catch (err) {
    console.error(`[DELETE /api/presensi/asatidz/[id]]`, err);
    return NextResponse.json({ error: "Gagal menghapus data presensi guru" }, { status: 500 });
  }
}
