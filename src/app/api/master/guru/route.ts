export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ambil semua data Guru (Pegawai Kategori ASATIDZ / GURU dari SIMPEG)
export async function GET() {
  try {
    let guru = await prisma.pegawai.findMany({
      where: {
        AND: [
          {
            OR: [
              { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR", "MUSYRIF", "musyrif"] } },
              { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
              { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
              { kategori_pegawai: { contains: "MUSYRIF", mode: "insensitive" } },
              { jabatan: { contains: "Guru", mode: "insensitive" } },
              { jabatan: { contains: "Pengajar", mode: "insensitive" } },
              { jabatan: { contains: "Asatidz", mode: "insensitive" } },
              { jabatan: { contains: "Ustadz", mode: "insensitive" } },
              { jabatan: { contains: "Musyrif", mode: "insensitive" } },
              { jabatan: { contains: "Halaqoh", mode: "insensitive" } },
              { mata_pelajaran: { not: null } },
            ]
          },
          { kategori_pegawai: { not: "PEGAWAI_UMUM" } }
        ]
      },
      include: { user: true },
      orderBy: { nama_lengkap: "asc" } 
    });

    // Auto-heal guru accounts & multi-roles (termasuk Zeidhan Ahmad Maulana)
    const healedGuru = await Promise.all(
      guru.map(async (g) => {
        try {
          const isZeidhan = g.nama_lengkap.toLowerCase().includes("zeidhan") || g.nama_lengkap.toLowerCase().includes("zeidan");
          const hasMapel = g.mata_pelajaran && g.mata_pelajaran.trim().length > 0;
          
          let targetUser = g.user;
          if (!targetUser && g.user_id) {
            targetUser = await prisma.user.findUnique({ where: { id: g.user_id } });
          }
          if (!targetUser) {
            targetUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { pegawai: { id: g.id } },
                  { email: { equals: g.email || "", mode: "insensitive" } },
                  { nama: { equals: g.nama_lengkap, mode: "insensitive" } }
                ]
              }
            });
            if (targetUser && !g.user_id) {
              await prisma.pegawai.update({
                where: { id: g.id },
                data: { user_id: targetUser.id }
              });
            }
          }

          if (targetUser && (isZeidhan || hasMapel)) {
            const currentRoles = (targetUser.role || "").split(",").map(r => r.trim().toUpperCase()).filter(Boolean);
            if (!currentRoles.includes("GURU")) {
              currentRoles.push("GURU");
              const newRole = Array.from(new Set(currentRoles)).join(",");
              targetUser = await prisma.user.update({
                where: { id: targetUser.id },
                data: { role: newRole }
              });
              g.user = targetUser;
            }
          }
        } catch (healErr) {
          console.error("Auto-heal guru error:", healErr);
        }
        return g;
      })
    );

    return NextResponse.json(healedGuru);
  } catch (error: any) {
    console.error("Error fetching guru:", error);
    return NextResponse.json({ error: "Gagal mengambil data guru", details: error.message }, { status: 500 });
  }
}

// Tambah Guru Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nik, nama_lengkap, nama_panggilan, no_hp, email, mata_pelajaran, foto_url, roles, wali_kelas_id } = body;

    if (!nama_lengkap || !nama_lengkap.trim()) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    }

    const nipOrNik = nik || `GURU-${Date.now()}`;
    const fallbackEmail = email || `${nipOrNik}@pesantren-alimam.com`;

    // 1. Create Pegawai
    const newGuru = await prisma.pegawai.create({
      data: {
        nik: nipOrNik,
        nama_lengkap: nama_lengkap.trim(),
        nama_panggilan: nama_panggilan ? nama_panggilan.trim() : null,
        no_hp: no_hp || null,
        email: email || null,
        mata_pelajaran: mata_pelajaran || null,
        foto_url: foto_url?.trim() || null,
        kategori_pegawai: "ASATIDZ" } });

    // Handle wali_kelas assignment for newly created teacher
    if (roles?.includes("WALI_KELAS") && wali_kelas_id) {
      await prisma.kelas.update({
        where: { id: wali_kelas_id },
        data: { wali_kelas_id: newGuru.id } });
    }

    // 2. Create User if roles provided
    if (roles && roles.length > 0) {
      const roleString = roles.join(",");
      const bcrypt = require('bcryptjs');
      const defaultPlainPassword = roleString.includes("ADMIN_SUPER") ? "AdminAlimam2026!" : "GuruAlimam2026!";
      const passwordHash = await bcrypt.hash(defaultPlainPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          email: fallbackEmail,
          password: passwordHash,
          plain_password: defaultPlainPassword,
          nama: nama_lengkap.trim(),
          role: roleString,
          is_active: true
        }
      });

      await prisma.pegawai.update({
        where: { id: newGuru.id },
        data: { user_id: newUser.id }
      });
    }

    return NextResponse.json(newGuru, { status: 201 });
  } catch (error: any) {
    console.error("Error creating guru:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "NIK atau Email sudah terdaftar." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
