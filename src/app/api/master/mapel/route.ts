import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas } from "@/lib/kelas";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");

    const whereClause: any = { is_active: true };
    if (kelas_id) {
      whereClause.kelas_id = kelas_id;
    }

    const rawMapel = await prisma.mataPelajaran.findMany({
      where: whereClause,
      include: {
        kelas: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    // Urutkan mapel berdasarkan urutan logis kelasnya
    const sortedMapel = [...rawMapel].sort((a, b) => {
      if (!a.kelas || !b.kelas) return 0;
      if (a.kelas.id === b.kelas.id) {
        return a.nama.localeCompare(b.nama, "id");
      }
      const sortedClasses = sortKelas([a.kelas, b.kelas]);
      return sortedClasses[0].id === a.kelas.id ? -1 : 1;
    });

    return NextResponse.json({ mapel: sortedMapel, success: true });
  } catch (error: any) {
    console.error("Error fetching mapel:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}

// Tambah Mapel Baru oleh Admin Super
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, nama_arab, kategori, kelas_id } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama mata pelajaran wajib diisi" }, { status: 400 });
    }

    if (!kelas_id) {
      return NextResponse.json({ error: "Tingkat kelas pengampu wajib dipilih" }, { status: 400 });
    }

    // Pastikan kelas exists
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelas_id },
    });

    if (!kelas) {
      return NextResponse.json({ error: "Kelas yang dipilih tidak valid" }, { status: 400 });
    }

    const newMapel = await prisma.mataPelajaran.create({
      data: {
        nama: nama.trim(),
        nama_arab: nama_arab?.trim() || null,
        kategori: kategori || "umum",
        kelas_id,
        is_active: true,
      },
      include: {
        kelas: true,
      },
    });

    return NextResponse.json({ success: true, mapel: newMapel }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating mapel:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Mata pelajaran ini sudah terdaftar di kelas tersebut." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menambahkan mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}
