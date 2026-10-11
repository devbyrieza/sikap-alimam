import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const rifqi = await prisma.santriAktif.findFirst({
    where: { nama_lengkap: { contains: "Rifqi Arsyad", mode: "insensitive" } },
    include: { kelas: true }
  });

  const nilaiRifqi = rifqi ? await prisma.nilaiSantri.findMany({
    where: { santri_id: rifqi.id },
    include: { mapel: true }
  }) : [];

  const allDistinctTahunSemester = await prisma.nilaiSantri.findMany({
    select: { tahun_ajaran: true, semester: true },
    distinct: ["tahun_ajaran", "semester"]
  });

  return NextResponse.json({
    rifqi,
    nilaiCount: nilaiRifqi.length,
    distinctTahunSemester: allDistinctTahunSemester,
    sampleNilai: nilaiRifqi.slice(0, 10).map(n => ({
      mapel: n.mapel.nama,
      jenis: n.jenis,
      nilai: n.nilai,
      semester: n.semester,
      tahun_ajaran: n.tahun_ajaran
    }))
  });
}
