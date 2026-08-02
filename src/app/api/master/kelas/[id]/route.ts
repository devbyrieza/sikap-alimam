import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT: Update Kelas (Nama, Jenjang, Status Aktif)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, jenjang, is_active } = body;

    const existing = await prisma.kelas.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    if (nama && nama.trim()) {
      const duplicate = await prisma.kelas.findFirst({
        where: {
          nama: { equals: nama.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Kelas dengan nama "${nama.trim()}" sudah ada.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.kelas.update({
      where: { id },
      data: {
        nama: nama !== undefined ? nama.trim() : existing.nama,
        jenjang: jenjang !== undefined ? (jenjang?.trim() || null) : existing.jenjang,
        is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
      },
      include: {
        _count: {
          select: {
            santri: true,
            MataPelajaran: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, kelas: updated });
  } catch (err: any) {
    console.error("[PUT /api/master/kelas/[id]]", err);
    return NextResponse.json(
      { error: "Gagal memperbarui kelas", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Hapus Kelas (atau nonaktifkan jika ada data relasi)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.kelas.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            santri: true,
            MataPelajaran: true,
            jurnal: true,
            nilai: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const totalRelations =
      existing._count.santri +
      existing._count.MataPelajaran +
      existing._count.jurnal +
      existing._count.nilai;

    if (totalRelations > 0) {
      // Jika memiliki data relasi (santri/jurnal/mapel), nonaktifkan saja untuk keamanan data integritas
      await prisma.kelas.update({
        where: { id },
        data: { is_active: false },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Kelas memiliki ${totalRelations} data terkait (santri/mapel/jurnal), sehingga statusnya dinonaktifkan agar data historis tetap aman.`,
      });
    }

    // Hapus permanen jika belum ada relasi
    await prisma.kelas.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil dihapus secara permanen.",
    });
  } catch (err: any) {
    console.error("[DELETE /api/master/kelas/[id]]", err);
    return NextResponse.json(
      { error: "Gagal menghapus kelas", details: err.message },
      { status: 500 }
    );
  }
}
