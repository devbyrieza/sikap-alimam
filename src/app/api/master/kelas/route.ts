import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeKelasList } from "@/lib/kelas";

// GET: Ambil daftar kelas (bisa semua atau hanya yang aktif)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const rawKelas = await prisma.kelas.findMany({
      where: all ? {} : { is_active: true },
      include: {
        wali_kelas: { select: { id: true, nama_lengkap: true } },
        _count: {
          select: {
            santri: true,
            MataPelajaran: true,
          },
        },
      },
    });

    const kelas = normalizeKelasList(rawKelas);

    return NextResponse.json({ kelas, success: true });
  } catch (err: any) {
    console.error("[GET /api/master/kelas]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data kelas", details: err.message },
      { status: 500 }
    );
  }
}

// POST: Tambah Kelas Baru oleh Admin Super
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, jenjang, is_active, wali_kelas_id } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama kelas wajib diisi (contoh: 7 MTs, 8 MTs, IL, 10 MA)" },
        { status: 400 }
      );
    }

    const trimmedNama = nama.trim();

    // Cek duplikasi
    const existing = await prisma.kelas.findFirst({
      where: {
        nama: {
          equals: trimmedNama,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kelas dengan nama "${trimmedNama}" sudah terdaftar.` },
        { status: 400 }
      );
    }

    const newKelas = await prisma.kelas.create({
      data: {
        nama: trimmedNama,
        jenjang: jenjang || "MTs",
        is_active: is_active ?? true,
        wali_kelas_id: wali_kelas_id || null,
      },
      include: {
        wali_kelas: { select: { id: true, nama_lengkap: true } },
        _count: {
          select: {
            santri: true,
            MataPelajaran: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, kelas: newKelas }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/master/kelas]", err);
    return NextResponse.json(
      { error: "Gagal menambahkan kelas baru", details: err.message },
      { status: 500 }
    );
  }
}
