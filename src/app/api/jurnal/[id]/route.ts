import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { pegawai_id, mapel_id, kelas_id, tanggal, jam_ke, materi, learning_outcome, kegiatan, catatan } = body;
    const resolvedParams = await params;

    const jurnal = await prisma.jurnalMengajar.update({
      where: { id: resolvedParams.id },
      data: {
        pegawai_id,
        mapel_id,
        kelas_id,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        jam_ke: jam_ke || null,
        materi,
        learning_outcome: learning_outcome || null,
        kegiatan,
        catatan: catatan || null,
      },
    });

    return NextResponse.json({ data: jurnal }, { status: 200 });
  } catch (err) {
    console.error(`[PATCH /api/jurnal]`, err);
    return NextResponse.json({ error: "Gagal memperbarui jurnal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.jurnalMengajar.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ message: "Jurnal berhasil dihapus" }, { status: 200 });
  } catch (err) {
    console.error(`[DELETE /api/jurnal]`, err);
    return NextResponse.json({ error: "Gagal menghapus jurnal" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const jurnal = await prisma.jurnalMengajar.findUnique({
      where: { id: resolvedParams.id },
    });
    
    if (!jurnal) {
      return NextResponse.json({ error: "Jurnal tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json({ data: jurnal }, { status: 200 });
  } catch (err) {
    console.error(`[GET /api/jurnal]`, err);
    return NextResponse.json({ error: "Gagal mengambil jurnal" }, { status: 500 });
  }
}
