import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ambil riwayat lengkap Tahfidz per santri
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ santri_id: string }> }
) {
  const { santri_id } = await params;

  try {
    const records = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      include: {
        pegawai: true,
        santri: true
      },
      orderBy: { tanggal: "desc" }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("Error fetching student tahfidz log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
