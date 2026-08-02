import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Konsolidasi nama 'I'dad Lughowy' menjadi 'IL'
    await prisma.kelas.updateMany({
      where: { nama: "I'dad Lughowy" },
      data: { nama: "IL", jenjang: "Islamiyah", is_active: true },
    });

    // 2. Pastikan kelas '7 MTs' dan 'IL' ada dan aktif
    const kelas7 = await prisma.kelas.upsert({
      where: { nama: "7 MTs" },
      update: { jenjang: "MTs", is_active: true },
      create: { nama: "7 MTs", jenjang: "MTs", is_active: true },
    });

    const kelasIL = await prisma.kelas.upsert({
      where: { nama: "IL" },
      update: { jenjang: "Islamiyah", is_active: true },
      create: { nama: "IL", jenjang: "Islamiyah", is_active: true },
    });

    // 3. Nonaktifkan atau bersihkan kelas dummy yang belum berjalan (8 MTs, 9 MTs, 10 MA, 11 MA, 12 MA)
    // jika tidak ada santri yang terdaftar di dalamnya
    const unneededClasses = ["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"];
    for (const cName of unneededClasses) {
      const found = await prisma.kelas.findFirst({
        where: { nama: cName },
        include: { _count: { select: { santri: true, jurnal: true } } },
      });
      if (found) {
        if (found._count.santri === 0 && found._count.jurnal === 0) {
          // Hapus jika kosong
          await prisma.mataPelajaran.deleteMany({ where: { kelas_id: found.id } });
          await prisma.kelas.delete({ where: { id: found.id } });
        } else {
          // Nonaktifkan jika ada relasi
          await prisma.kelas.update({
            where: { id: found.id },
            data: { is_active: false },
          });
        }
      }
    }

    const activeKelas = await prisma.kelas.findMany({
      where: { is_active: true },
      select: { id: true, nama: true, jenjang: true },
    });

    return NextResponse.json({
      success: true,
      message: "Database kelas berhasil dibersihkan. Hanya 7 MTs dan IL yang aktif.",
      activeKelas,
    });
  } catch (err: any) {
    console.error("[GET /api/setup-db/cleanup-kelas]", err);
    return NextResponse.json(
      { error: "Gagal membersihkan data kelas", details: err.message },
      { status: 500 }
    );
  }
}
