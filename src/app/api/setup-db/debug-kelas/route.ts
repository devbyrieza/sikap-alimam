import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const kitabahJurnal = await prisma.jurnalMengajar.findMany({
    where: {
      mapel: {
        nama: { contains: "kitab", mode: "insensitive" }
      }
    },
    include: {
      guru: { select: { id: true, nama_lengkap: true } },
      mapel: true,
      kelas: true
    }
  });

  const kitabahNilaiSample = await prisma.nilaiSantri.findMany({
    where: {
      mapel: {
        nama: { contains: "kitab", mode: "insensitive" }
      }
    },
    take: 5,
    include: {
      mapel: true,
      kelas: true
    }
  });

  const agusCahyono = await prisma.pegawai.findFirst({
    where: {
      nama_lengkap: { contains: "Agus Cahyono", mode: "insensitive" }
    },
    include: {
      user: true,
      jurnal: {
        include: { mapel: true, kelas: true }
      }
    }
  });

  return NextResponse.json({
    kitabahJurnal,
    kitabahNilaiSample,
    agusCahyono: {
      id: agusCahyono?.id,
      nama: agusCahyono?.nama_lengkap,
      mata_pelajaran: agusCahyono?.mata_pelajaran,
      jurnalCount: agusCahyono?.jurnal.length,
      jurnals: agusCahyono?.jurnal.map(j => ({ mapel: j.mapel.nama, kelas: j.kelas.nama, materi: j.materi }))
    }
  });
}
