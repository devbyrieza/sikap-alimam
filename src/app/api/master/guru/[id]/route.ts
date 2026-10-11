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

    const isGuru = Array.isArray(roles) && roles.some((r: string) => r.toUpperCase() === "GURU");

    const updated = await prisma.pegawai.update({
      where: { id },
      data: {
        nik: nik || null,
        nama_lengkap,
        nama_panggilan: nama_panggilan || null,
        no_hp: no_hp || null,
        email: email || null,
        mata_pelajaran: mata_pelajaran || null,
        foto_url: foto_url || null,
        ttd_url: ttd_url || null,
        ...(isGuru && { kategori_pegawai: "ASATIDZ" })
      },
    });

    // Clear their existing wali kelas status
    await prisma.kelas.updateMany({ where: { wali_kelas_id: id }, data: { wali_kelas_id: null } });
    
    // Assign new wali kelas if provided
    if (wali_kelas_id && wali_kelas_id !== "") {
      await prisma.kelas.update({ where: { id: wali_kelas_id }, data: { wali_kelas_id: id } });
    }

    if (roles && roles.length > 0) {
      const roleString = Array.from(new Set(roles.map((r: string) => r.trim().toUpperCase()))).filter(Boolean).join(",");
      
      let user = updated.user_id 
        ? await prisma.user.findUnique({ where: { id: updated.user_id } }) 
        : null;
        
      if (!user) {
        user = await prisma.user.findFirst({ where: { pegawai: { id } } });
      }
      if (!user && (email || updated.email)) {
        user = await prisma.user.findFirst({ where: { email: { equals: email || updated.email, mode: "insensitive" } } });
      }
      if (!user) {
        user = await prisma.user.findFirst({ where: { nama: { equals: nama_lengkap.trim(), mode: "insensitive" } } });
      }

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: roleString }
        });
        if (!updated.user_id) {
          await prisma.pegawai.update({
            where: { id },
            data: { user_id: user.id }
          });
        }
      } else {
        const bcrypt = require('bcryptjs');
        const defaultPassword = "Paas2026!";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const fallbackEmail = email || updated.email || `${updated.nik || id}@pesantren-alimam.com`;
        
        user = await prisma.user.create({
          data: {
            email: fallbackEmail,
            password: passwordHash,
            plain_password: defaultPassword,
            nama: nama_lengkap.trim(),
            role: roleString,
            is_active: true
          }
        });
        await prisma.pegawai.update({
          where: { id },
          data: { user_id: user.id }
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT Guru Error:", error);
    return NextResponse.json({ error: "Gagal update data", detail: error.message }, { status: 500 });
  }
}

