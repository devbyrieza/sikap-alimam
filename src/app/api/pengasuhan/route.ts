import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPengasuhanBySantri, savePengasuhanRecord, RaporPengasuhanData } from "@/lib/pengasuhanData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");

    if (santriId) {
      const santri = await prisma.santriAktif.findUnique({
        where: { id: santriId },
        include: { kelas: true },
      });

      if (!santri) {
        return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
      }

      const data = getPengasuhanBySantri(
        santri.id,
        santri.nama_lengkap,
        santri.kelas?.nama || "SMP IT",
        santri.jenis_kelamin || "L"
      );

      return NextResponse.json({ success: true, data });
    }

    // Ambil daftar santri aktif untuk form input pengasuh
    const kelasId = searchParams.get("kelas_id");
    const santriList = await prisma.santriAktif.findMany({
      where: {
        is_active: true,
        ...(kelasId ? { kelas_id: kelasId } : {}),
      },
      include: { kelas: true },
      orderBy: { nama_lengkap: "asc" },
    });

    const listWithPengasuhan = santriList.map((s) => {
      const p = getPengasuhanBySantri(s.id, s.nama_lengkap, s.kelas?.nama || "SMP IT", s.jenis_kelamin || "L");
      return {
        id: s.id,
        nama: s.nama_lengkap,
        nis: s.nis,
        kelas: s.kelas?.nama || "-",
        gedung: p.gedung,
        kamar: p.nama_kamar,
        nilai_angka: p.total_skor,
        nilai_huruf: p.nilai_huruf,
        predikat: p.predikat_umum,
      };
    });

    return NextResponse.json({ success: true, santri: listWithPengasuhan });
  } catch (error: any) {
    console.error("Error in GET /api/pengasuhan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RaporPengasuhanData = await req.json();

    if (!body || !body.santri_id) {
      return NextResponse.json({ error: "Data penilaian tidak valid" }, { status: 400 });
    }

    const saved = savePengasuhanRecord(body);
    return NextResponse.json({ success: true, message: "Penilaian pengasuhan berhasil disimpan", data: saved });
  } catch (error: any) {
    console.error("Error in POST /api/pengasuhan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
