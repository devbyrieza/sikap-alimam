import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const teachers = await prisma.pegawai.findMany({
    select: {
      id: true,
      nama_lengkap: true,
      mata_pelajaran: true
    },
    orderBy: { nama_lengkap: "asc" }
  });

  return NextResponse.json({ teachers });
}
