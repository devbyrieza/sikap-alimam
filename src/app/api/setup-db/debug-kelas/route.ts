import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const ilClass = await prisma.kelas.findFirst({
    where: {
      OR: [
        { nama: "IL" },
        { jenjang: "IL" },
        { nama: { contains: "I'dad", mode: "insensitive" } }
      ]
    }
  });

  const ilMapels = ilClass ? await prisma.mataPelajaran.findMany({
    where: { kelas_id: ilClass.id },
    include: {
      asatidz_mapel: {
        include: {
          pegawai: {
            select: { id: true, nama_lengkap: true, mata_pelajaran: true }
          }
        }
      },
      _count: {
        select: {
          nilai: true,
          jurnal: true,
          jadwal: true
        }
      }
    },
    orderBy: { nama: "asc" }
  }) : [];

  const allKhitobahOrKitabah = await prisma.mataPelajaran.findMany({
    where: {
      OR: [
        { nama: { contains: "khitob", mode: "insensitive" } },
        { nama: { contains: "kitab", mode: "insensitive" } }
      ]
    },
    include: {
      kelas: true,
      asatidz_mapel: {
        include: {
          pegawai: {
            select: { id: true, nama_lengkap: true, mata_pelajaran: true }
          }
        }
      },
      _count: {
        select: {
          nilai: true,
          jurnal: true,
          jadwal: true
        }
      }
    }
  });

  const teachersWithKhitobahOrKitabah = await prisma.pegawai.findMany({
    where: {
      OR: [
        { mata_pelajaran: { contains: "khitob", mode: "insensitive" } },
        { mata_pelajaran: { contains: "kitab", mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      nama_lengkap: true,
      mata_pelajaran: true
    }
  });

  return NextResponse.json({
    ilClass,
    ilMapels,
    allKhitobahOrKitabah,
    teachersWithKhitobahOrKitabah
  });
}
