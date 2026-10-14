import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "WALI_SANTRI",
        nama: {
          startsWith: "Wali dari "
        }
      },
      select: { id: true, nama: true }
    });

    const updated = [];
    for (const u of users) {
      const cleanNama = u.nama.replace(/^Wali dari\s+/i, "").trim();
      await prisma.user.update({
        where: { id: u.id },
        data: { nama: cleanNama }
      });
      updated.push({ id: u.id, before: u.nama, after: cleanNama });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil merapikan ${updated.length} nama akun Wali Santri menjadi nama santri langsung.`,
      total: updated.length,
      sample: updated.slice(0, 10)
    });
  } catch (error: any) {
    console.error("Error cleaning wali names:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
