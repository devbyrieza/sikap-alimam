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
    
    const pegawai = await prisma.pegawai.findUnique({ where: { id } });
    if (pegawai) {
      // Remove dependencies
      await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: id } });
      await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: id } });
      await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: id } });
      await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: id } });
      await prisma.capaianTahfidz.deleteMany({ where: { pegawai_id: id } });
      await prisma.ibadahAdabSantri.deleteMany({ where: { pegawai_id: id } });
      await prisma.kelas.updateMany({ where: { wali_kelas_id: id }, data: { wali_kelas_id: null } });

      // Delete the Pegawai
      await prisma.pegawai.delete({ where: { id } });

      // Delete the User account if exists
      if (pegawai.user_id) {
        await prisma.user.delete({ where: { id: pegawai.user_id } }).catch(() => {});
      }
    }

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
    const { nik, nama_lengkap, no_hp, email, mata_pelajaran, roles, wali_kelas_id } = body;

    const updatedGuru = await prisma.pegawai.update({
      where: { id },
      data: { nik, nama_lengkap, no_hp, email, mata_pelajaran: mata_pelajaran || null },
    });

    // Handle wali_kelas assignment
    // First, remove this teacher from any classes they are currently wali kelas of
    await prisma.kelas.updateMany({
      where: { wali_kelas_id: id },
      data: { wali_kelas_id: null },
    });

    // Then, if they have a new class selected and the WALI_KELAS role is present, assign it
    if (roles?.includes("WALI_KELAS") && wali_kelas_id) {
      await prisma.kelas.update({
        where: { id: wali_kelas_id },
        data: { wali_kelas_id: id },
      });
    }

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
