import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Delete Guru (SOFT DELETE / ROLE STRIPPING)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const pegawai = await prisma.pegawai.findUnique({ where: { id } });
    if (pegawai) {
      // 1. Remove dependencies from academic assignments
      await prisma.jadwalPelajaran.deleteMany({ where: { pegawai_id: id } });
      await prisma.asatidzmMapel.deleteMany({ where: { pegawai_id: id } });
      // Keep JurnalMengajar and Presensi for history, or delete them? Usually we keep them for history.
      // But let's follow the previous logic for safety if they want clean state
      // await prisma.jurnalMengajar.deleteMany({ where: { pegawai_id: id } });
      // await prisma.presensiAsatidz.deleteMany({ where: { pegawai_id: id } });
      
      // If they were Wali Kelas, remove them
      await prisma.kelas.updateMany({ where: { wali_kelas_id: id }, data: { wali_kelas_id: null } });

      // 2. SOFT DELETE: Strip their role, DO NOT delete from Pegawai or User
      let newKategori = pegawai.kategori_pegawai || "";
      // If their category is strictly ASATIDZ, move them to PEGAWAI_UMUM.
      // If it's a comma-separated list like "ASATIDZ,MUSYRIF", remove "ASATIDZ".
      if (newKategori.includes("ASATIDZ")) {
        newKategori = newKategori.replace("ASATIDZ", "").replace(",,", ",").trim();
        if (newKategori === "" || newKategori === ",") newKategori = "PEGAWAI_UMUM";
        if (newKategori.startsWith(",")) newKategori = newKategori.substring(1);
        if (newKategori.endsWith(",")) newKategori = newKategori.substring(0, newKategori.length - 1);
      } else {
        newKategori = "PEGAWAI_UMUM";
      }

      await prisma.pegawai.update({
        where: { id },
        data: {
          kategori_pegawai: newKategori,
          mata_pelajaran: "" // Clear their mapel assignment string for SIMPEG
        }
      });
      
      // Note: We DO NOT delete the User or Profile account. SIMPEG still owns them.
    }

    return NextResponse.json({ success: true, message: "Guru berhasil dicabut tugas mengajarnya (Soft Delete)." });
  } catch (error) {
    console.error("Error soft-deleting guru:", error);
    return NextResponse.json({ error: "Gagal mencabut data guru" }, { status: 500 });
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
    const { nik, nama_lengkap, nama_panggilan, no_hp, email, mata_pelajaran, foto_url, ttd_url, roles, wali_kelas_id } = body;

    const updated = await prisma.pegawai.update({
      where: { id },
      data: {
        nik,
        nama_lengkap,
        nama_panggilan,
        no_hp,
        email,
        mata_pelajaran,
        foto_url,
        ttd_url,
      },
    });

    if (wali_kelas_id) {
      await prisma.kelas.updateMany({ where: { wali_kelas_id: id }, data: { wali_kelas_id: null } });
      await prisma.kelas.update({ where: { id: wali_kelas_id }, data: { wali_kelas_id: id } });
    }

    if (roles) {
      const user = await prisma.user.findFirst({ where: { pegawai: { id } } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { role: roles[0] || 'GURU' } });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}
