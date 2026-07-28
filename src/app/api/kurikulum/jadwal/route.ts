import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const kelas_id = searchParams.get("kelas_id");
  const pegawai_id = searchParams.get("pegawai_id");
  const tipe_pekan = searchParams.get("tipe_pekan"); // 'ganjil', 'genap', atau 'semua'

  try {
    let whereClause: any = {};

    if (kelas_id) whereClause.kelas_id = kelas_id;
    if (pegawai_id) whereClause.pegawai_id = pegawai_id;
    
    if (tipe_pekan) {
      whereClause.OR = [
        { tipe_pekan: "semua" },
        { tipe_pekan: tipe_pekan }
      ];
    }

    const jadwal = await prisma.jadwalPelajaran.findMany({
      where: whereClause,
      include: {
        kelas: true,
        pegawai: true,
        mapel: true,
      },
      orderBy: [
        { hari: 'asc' }, // In real app, you might want to map string days to integer for correct sorting
        { jam_ke: 'asc' },
      ],
    });

    return NextResponse.json(jadwal);
  } catch (error) {
    console.error("Error fetching jadwal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
