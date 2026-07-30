import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ambil semua data Guru (Pegawai Kategori ASATIDZ)
export async function GET() {
  try {
    const guru = await prisma.pegawai.findMany({
      where: {
        kategori_pegawai: 'ASATIDZ'
      },
      orderBy: { nama_lengkap: 'asc' },
    });
    return NextResponse.json(guru);
  } catch (error) {
    console.error("Error fetching guru:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Tambah Guru Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nik, nama_lengkap, no_hp, email, mata_pelajaran } = body;

    const newGuru = await prisma.pegawai.create({
      data: {
        nik: nik || `GURU-${Date.now()}`,
        nama_lengkap,
        no_hp,
        email,
        mata_pelajaran: mata_pelajaran || null,
        kategori_pegawai: 'ASATIDZ',
      },
    });

    return NextResponse.json(newGuru, { status: 201 });
  } catch (error: any) {
    console.error("Error creating guru:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "NIK atau Email sudah terdaftar." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
