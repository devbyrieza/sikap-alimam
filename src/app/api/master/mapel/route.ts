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

    // Auto-heal mapels across all classes to standard baku Indonesian & Kemenag terms
    const healedMapel = await Promise.all(
      rawMapel.map(async (m) => {
        const isMA = m.kelas && (
          m.kelas.jenjang === "MA" || 
          m.kelas.nama.toUpperCase().includes("MA") || 
          m.kelas.nama.startsWith("11") || 
          m.kelas.nama.startsWith("12")
        );

        let targetName = m.nama;
        const low = m.nama.toLowerCase().trim();

        // 1. General & Languages
        if (low === "b. indonesia" || low === "indonesia") targetName = "Bahasa Indonesia";
        else if (low === "b. arab" || low === "arab") targetName = "Bahasa Arab";
        else if (low === "b. inggris" || low === "inggris" || low === "english") targetName = "Bahasa Inggris";
        else if (low === "mtk") targetName = "Matematika";
        else if (low === "ipa") targetName = "IPA Terpadu";
        else if (low === "ips") targetName = "IPS Terpadu";

        // 2. Islamic Studies
        else if (low === "aqidah") targetName = "Akidah";
        else if (low === "hadits") targetName = "Hadis";
        else if (low === "siroh" || low === "siroh nabi" || low === "sirah nabi") targetName = "Sirah";
        else if (low === "akhlaq") targetName = "Akhlak";
        else if (low.includes("tahsin")) targetName = "Tahsin";
        else if (low.includes("tahfidz") || low.includes("tahfiz")) targetName = "Tahfidz";
        else if (low.includes("tadribat")) targetName = "Tadribat 'alal Anmath";

        // 3. Fikih & Ushul Fikih
        else if (low === "fiqh" || low === "fiqih" || low === "fikih" || low === "ushul fiqh" || low === "ushul fiqih" || low === "ushul fikih") {
          targetName = isMA ? "Ushul Fikih" : "Fikih";
        }

        if (targetName !== m.nama) {
          const exists = rawMapel.find(other => 
            other.kelas_id === m.kelas_id && 
            other.id !== m.id && 
            other.nama.toLowerCase() === targetName.toLowerCase()
          );
          if (!exists) {
            try {
              await prisma.mataPelajaran.update({
                where: { id: m.id },
                data: { nama: targetName }
              });
              m.nama = targetName;
            } catch (e) {
              console.error("Auto-heal rename error:", e);
            }
          }
        }
        return m;
      })
    );

    // Filter out redundant non-MA/MA duplicates
    const cleanedMapel = healedMapel.filter((m, idx, arr) => {
      const isMA = m.kelas && (
        m.kelas.jenjang === "MA" || 
        m.kelas.nama.toUpperCase().includes("MA") || 
        m.kelas.nama.startsWith("11") || 
        m.kelas.nama.startsWith("12")
      );
      if (isMA && (m.nama.toLowerCase() === "fiqh" || m.nama.toLowerCase() === "fiqih")) {
        return false;
      }
      return arr.findIndex(other => other.kelas_id === m.kelas_id && other.nama.toLowerCase() === m.nama.toLowerCase()) === idx;
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
