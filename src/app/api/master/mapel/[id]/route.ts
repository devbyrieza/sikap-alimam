import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT: Update Mapel
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, nama_arab, kategori, kelas_id, is_active } = body;

    const existing = await prisma.mataPelajaran.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.mataPelajaran.update({
      where: { id },
      data: {
        nama: nama !== undefined ? nama.trim() : existing.nama,
        nama_arab: nama_arab !== undefined ? (nama_arab?.trim() || null) : existing.nama_arab,
        kategori: kategori !== undefined ? kategori : existing.kategori,
        kelas_id: kelas_id !== undefined ? kelas_id : existing.kelas_id,
        is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
      },
      include: {
        kelas: true,
      },
    });

    return NextResponse.json({ success: true, mapel: updated });
  } catch (error: any) {
    console.error("[PUT /api/master/mapel/[id]]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Mapel
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.mataPelajaran.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jurnal: true,
            nilai: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    const totalUsage = existing._count.jurnal + existing._count.nilai;

    if (totalUsage > 0) {
      // Nonaktifkan jika pernah dipakai di jurnal atau nilai
      await prisma.mataPelajaran.update({
        where: { id },
        data: { is_active: false },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Mata pelajaran memiliki ${totalUsage} catatan KBM / nilai, sehingga statusnya dinonaktifkan agar data tetap aman.`,
      });
    }

    await prisma.mataPelajaran.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/master/mapel/[id]]", error);
    return NextResponse.json(
      { error: "Gagal menghapus mata pelajaran", details: error.message },
      { status: 500 }
    );
  }
}
