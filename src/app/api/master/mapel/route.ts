import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ambil semua Mapel
export async function GET() {
  try {
    const mapel = await prisma.mataPelajaran.findMany({
      include: {
        kelas: true,
      },
      orderBy: [
        { kelas_id: 'asc' },
        { nama: 'asc' }
      ],
    });
    return NextResponse.json(mapel);
  } catch (error) {
    console.error("Error fetching mapel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Tambah Mapel Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, nama_arab, kategori, kelas_id } = body;

    const newMapel = await prisma.mataPelajaran.create({
      data: {
        nama,
        nama_arab,
        kategori: kategori || 'umum',
        kelas_id,
      },
      include: {
        kelas: true,
      }
    });

    return NextResponse.json(newMapel, { status: 201 });
  } catch (error: any) {
    console.error("Error creating mapel:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Mata pelajaran ini sudah ada di kelas tersebut." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
