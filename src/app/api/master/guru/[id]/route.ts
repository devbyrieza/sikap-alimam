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
    const { nik, nama_lengkap, no_hp, email, mata_pelajaran, roles } = body;

    const updatedGuru = await prisma.pegawai.update({
      where: { id },
      data: { nik, nama_lengkap, no_hp, email, mata_pelajaran: mata_pelajaran || null },
    });

    if (roles) {
      const roleString = roles.length > 0 ? roles.join(",") : "GURU";
      if (updatedGuru.user_id) {
        await prisma.user.update({
          where: { id: updatedGuru.user_id },
          data: { role: roleString, email: email || undefined }
        });
      } else {
        // Create user if doesn't exist
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('Sikap2026!', 10);
        const nipOrNik = nik || `GURU-${Date.now()}`;
        const fallbackEmail = email || `${nipOrNik}@pesantren-alimam.com`;

        const newUser = await prisma.user.create({
          data: {
            email: fallbackEmail,
            password: passwordHash,
            nama: nama_lengkap.trim(),
            role: roleString,
            is_active: true
          }
        });

        await prisma.pegawai.update({
          where: { id: updatedGuru.id },
          data: { user_id: newUser.id }
        });
      }
    }

    return NextResponse.json(updatedGuru);
  } catch (error) {
    console.error("Error updating guru:", error);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}
