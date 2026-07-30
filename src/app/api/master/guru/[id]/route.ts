import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete Guru
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pegawai.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Guru berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting guru:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}

// Update Guru
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nik, nama_lengkap, no_hp, email, mata_pelajaran } = body;

    const updatedGuru = await prisma.pegawai.update({
      where: { id },
      data: { nik, nama_lengkap, no_hp, email, mata_pelajaran: mata_pelajaran || null },
    });

    return NextResponse.json(updatedGuru);
  } catch (error) {
    console.error("Error updating guru:", error);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}
