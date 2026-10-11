import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const jadwal = await prisma.jadwalPelajaran.findMany({
    where: {
      mapel: {
        OR: [
          { nama: { contains: "kitab", mode: "insensitive" } },
          { nama: { contains: "khitob", mode: "insensitive" } }
        ]
      }
    },
    include: {
      mapel: true,
      kelas: true,
      guru: { select: { id: true, nama_lengkap: true } }
    }
  });

  const jurnal = await prisma.jurnalMengajar.findMany({
    where: {
      mapel: {
        OR: [
          { nama: { contains: "kitab", mode: "insensitive" } },
          { nama: { contains: "khitob", mode: "insensitive" } }
        ]
      }
    },
    include: {
      mapel: true,
      kelas: true,
      guru: { select: { id: true, nama_lengkap: true } }
    }
  });

  return NextResponse.json({ jadwal, jurnal });
}
