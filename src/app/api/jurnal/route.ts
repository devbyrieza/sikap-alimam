import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal");
    const kelas_id = searchParams.get("kelas_id");

    const where: Record<string, unknown> = {};
    if (tanggal) {
      where.tanggal = new Date(tanggal);
    }
    if (kelas_id) {
      where.kelas_id = kelas_id;
    }

    const jurnal = await prisma.jurnalMengajar.findMany({
      where,
      orderBy: { tanggal: "desc" },
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
        mapel: { select: { id: true, nama: true } },
        kelas: { select: { id: true, nama: true } },
      },
    });

    return NextResponse.json({ data: jurnal });
  } catch (err) {
    console.error("[GET /api/jurnal]", err);
    return NextResponse.json({ error: "Gagal mengambil data jurnal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pegawai_id, mapel_id, kelas_id, tanggal, jam_ke, materi, sub_materi, learning_outcome, kegiatan, catatan } = body;

    if (!pegawai_id || !mapel_id || !kelas_id || !tanggal || !materi || !kegiatan) {
      return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });
    }

    const jurnal = await prisma.jurnalMengajar.create({
      data: {
        pegawai_id,
        mapel_id,
        kelas_id,
        tanggal: new Date(tanggal),
        jam_ke: jam_ke || null,
        materi,
        sub_materi: sub_materi || null,
        learning_outcome: learning_outcome || null,
        kegiatan,
        catatan: catatan || null,
      },
    });

    return NextResponse.json({ data: jurnal }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jurnal]", err);
    return NextResponse.json({ error: "Gagal menyimpan jurnal" }, { status: 500 });
  }
}
