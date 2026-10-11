import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const jadwalKitabah = await prisma.jadwalPelajaran.findMany({
    where: {
      mapel: {
        nama: { contains: "kitab", mode: "insensitive" }
      }
    },
    include: {
      mapel: true,
      kelas: true,
      guru: {
        select: { id: true, nama_lengkap: true, mata_pelajaran: true }
      }
    }
  });

  return NextResponse.json({ jadwalKitabah });
}
