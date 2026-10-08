import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const kelas = await prisma.kelas.findMany({
    include: {
      _count: {
        select: { santri: true, asatidz_mapel: true }
      }
    }
  });
  return NextResponse.json({ kelas });
}
