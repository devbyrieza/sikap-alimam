import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas } from "@/lib/kelas";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");

    const whereClause: any = { is_active: true };
    if (kelas_id) {
      whereClause.kelas_id = kelas_id;
    }

    const session = await getSession();
    const role = (session?.role || "").toLowerCase();
    const isAdmin = role.includes("admin_super");

    if (session?.asatidz_id && !isAdmin) {
      whereClause.asatidz_mapel = {
        some: {
          pegawai_id: session.asatidz_id
        }
      };
    }

    const rawMapel = await prisma.mataPelajaran.findMany({
      where: whereClause,
      include: {
        kelas: true },
      orderBy: {
        nama: "asc" } });

    // Auto-heal MA mapels: Kelas 11 MA & 12 MA WAJIB memiliki "Ushul Fiqh", BUKAN "Fiqh"
    const healedMapel = await Promise.all(
      rawMapel.map(async (m) => {
        const isMA = m.kelas && (
          m.kelas.jenjang === "MA" || 
          m.kelas.nama.toUpperCase().includes("MA") || 
          m.kelas.nama.startsWith("11") || 
          m.kelas.nama.startsWith("12")
        );
        if (isMA && (m.nama.toLowerCase() === "fiqh" || m.nama.toLowerCase() === "fiqih" || m.nama.toLowerCase() === "ushul fiqih")) {
          // Check if Ushul Fiqh already exists for this class
          const existsUshul = rawMapel.find(other => 
            other.kelas_id === m.kelas_id && 
            other.id !== m.id && 
            other.nama.toLowerCase() === "ushul fiqh"
          );
          if (!existsUshul) {
            try {
              await prisma.mataPelajaran.update({
                where: { id: m.id },
                data: { nama: "Ushul Fiqh", nama_arab: "أصول الفقه", kategori: "syariah" }
              });
              m.nama = "Ushul Fiqh";
              m.nama_arab = "أصول الفقه";
              m.kategori = "syariah";
            } catch (e) {
              console.error("Auto-heal mapel rename error:", e);
            }
          }
        }
        return m;
      })
    );

    // Filter out any redundant "Fiqh" in MA if Ushul Fiqh is already present
    const cleanedMapel = healedMapel.filter(m => {
      const isMA = m.kelas && (
        m.kelas.jenjang === "MA" || 
        m.kelas.nama.toUpperCase().includes("MA") || 
        m.kelas.nama.startsWith("11") || 
        m.kelas.nama.startsWith("12")
      );
      if (isMA && (m.nama.toLowerCase() === "fiqh" || m.nama.toLowerCase() === "fiqih")) {
        return false;
      }
      return true;
    });

    // Urutkan mapel berdasarkan urutan logis kelasnya
    const sortedMapel = [...cleanedMapel].sort((a, b) => {
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
      where: { id: kelas_id } });

    if (!kelas) {
      return NextResponse.json({ error: "Kelas yang dipilih tidak valid" }, { status: 400 });
    }

    const newMapel = await prisma.mataPelajaran.create({
      data: {
        nama: nama.trim(),
        nama_arab: nama_arab?.trim() || null,
        kategori: kategori || "umum",
        kelas_id,
        is_active: true },
      include: {
        kelas: true } });

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
