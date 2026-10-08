import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "Abdul R";

    const results = await prisma.santriAktif.findMany({
      where: {
        nama_lengkap: { contains: q, mode: 'insensitive' }
      },
      select: {
        id: true,
        nama_lengkap: true,
        is_active: true,
        kelas: { select: { nama: true } }
      },
      take: 20
    });

    return NextResponse.json({ success: true, q, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
