import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Cari Pegawai Zeidhan Ahmad Maulana
    const pegawais = await prisma.pegawai.findMany({
      where: {
        OR: [
          { nama_lengkap: { contains: "Zeidhan", mode: "insensitive" } },
          { nama_lengkap: { contains: "Zeidan", mode: "insensitive" } },
          { email: { contains: "zimedmadinah", mode: "insensitive" } },
          { no_hp: { contains: "087788819155" } }
        ]
      },
      include: { user: true }
    });

    if (pegawais.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Pegawai Zeidhan Ahmad Maulana tidak ditemukan di database."
      }, { status: 404 });
    }

    for (const p of pegawais) {
      logs.push(`Memproses Pegawai: ${p.nama_lengkap} (ID: ${p.id}, NIK: ${p.nik})`);

      // Update kategori pegawai menjadi ASATIDZ agar diakui sebagai guru di seluruh sistem
      await prisma.pegawai.update({
        where: { id: p.id },
        data: {
          kategori_pegawai: "ASATIDZ"
        }
      });
      logs.push(`- Kategori Pegawai diset ke ASATIDZ`);

      // Cari atau buat User terkait
      let user = p.user;
      if (!user && p.user_id) {
        user = await prisma.user.findUnique({ where: { id: p.user_id } });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: p.email || "", mode: "insensitive" } },
              { phone: { equals: p.no_hp || "" } },
              { nama: { contains: "Zeidhan", mode: "insensitive" } },
              { nama: { contains: "Zeidan", mode: "insensitive" } }
            ]
          }
        });
      }

      if (user) {
        // Gabungkan role: Pastikan memiliki GURU dan MUSYRIF
        const existingRoles = (user.role || "").split(",").map(r => r.trim().toUpperCase()).filter(Boolean);
        if (!existingRoles.includes("GURU")) existingRoles.push("GURU");
        if (!existingRoles.includes("MUSYRIF")) existingRoles.push("MUSYRIF");
        const newRoleString = Array.from(new Set(existingRoles)).join(",");

        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: newRoleString,
            is_active: true
          }
        });

        if (p.user_id !== user.id) {
          await prisma.pegawai.update({
            where: { id: p.id },
            data: { user_id: user.id }
          });
        }
        logs.push(`- User ID ${user.id} diperbarui dengan role: ${newRoleString} dan ditautkan ke Pegawai`);
      } else {
        // Buat akun baru jika belum ada sama sekali
        const defaultPassword = "Paas2026!";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const userEmail = p.email || `zeidhan@pesantren-alimam.com`;

        const newUser = await prisma.user.create({
          data: {
            email: userEmail,
            phone: p.no_hp || null,
            password: passwordHash,
            plain_password: defaultPassword,
            nama: p.nama_lengkap.trim(),
            role: "GURU,MUSYRIF",
            is_active: true
          }
        });

        await prisma.pegawai.update({
          where: { id: p.id },
          data: { user_id: newUser.id }
        });
        logs.push(`- Dibuatkan akun User baru (${userEmail}) dengan role GURU,MUSYRIF`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun Zeidhan Ahmad Maulana berhasil diperbarui menjadi Multi-Role (GURU & MUSYRIF).",
      logs
    });
  } catch (error: any) {
    console.error("Fix Zeidhan error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
