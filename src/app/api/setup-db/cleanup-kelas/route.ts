import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KURIKULUM_7_MTS, KURIKULUM_IL } from "@/lib/kurikulum";

export async function GET() {
  try {
    // 1. Konsolidasi nama 'I'dad Lughowy' menjadi 'IL'
    await prisma.kelas.updateMany({
      where: { nama: "I'dad Lughowy" },
      data: { nama: "IL", jenjang: "Islamiyah", is_active: true } });

    // 2. Pastikan kelas '7 MTs' dan 'IL' ada dan aktif
    const kelas7 = await prisma.kelas.upsert({
      where: { nama: "7 MTs" },
      update: { jenjang: "MTs", is_active: true },
      create: { nama: "7 MTs", jenjang: "MTs", is_active: true } });

    const kelasIL = await prisma.kelas.upsert({
      where: { nama: "IL" },
      update: { jenjang: "Islamiyah", is_active: true },
      create: { nama: "IL", jenjang: "Islamiyah", is_active: true } });

    // 3. Sinkronisasi Mapel Resmi untuk 7 MTs
    for (const m of KURIKULUM_7_MTS) {
      const existing = await prisma.mataPelajaran.findFirst({
        where: { nama: m.nama, kelas_id: kelas7.id } });
      if (!existing) {
        await prisma.mataPelajaran.create({
          data: {
            nama: m.nama,
            nama_arab: m.nama_arab || null,
            kategori: m.kategori,
            kelas_id: kelas7.id,
            is_active: true } });
      }
    }

    // 4. Sinkronisasi Mapel Resmi untuk IL
    for (const m of KURIKULUM_IL) {
      const existing = await prisma.mataPelajaran.findFirst({
        where: { nama: m.nama, kelas_id: kelasIL.id } });
      if (!existing) {
        await prisma.mataPelajaran.create({
          data: {
            nama: m.nama,
            nama_arab: m.nama_arab || null,
            kategori: m.kategori,
            kelas_id: kelasIL.id,
            is_active: true } });
      }
    }

    // 5. Nonaktifkan atau bersihkan kelas dummy yang belum berjalan (8 MTs, 9 MTs, 10 MA, 11 MA, 12 MA)
    const unneededClasses = ["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"];
    for (const cName of unneededClasses) {
      const found = await prisma.kelas.findFirst({
        where: { nama: cName },
        include: { _count: { select: { santri: true, jurnal: true } } } });
      if (found) {
        if (found._count.santri === 0 && found._count.jurnal === 0) {
          await prisma.mataPelajaran.deleteMany({ where: { kelas_id: found.id } });
          await prisma.kelas.delete({ where: { id: found.id } });
        } else {
          await prisma.kelas.update({
            where: { id: found.id },
            data: { is_active: false } });
        }
      }
    }

    const activeKelas = await prisma.kelas.findMany({
      where: { is_active: true },
      select: { id: true, nama: true, jenjang: true } });

    const activeMapel = await prisma.mataPelajaran.findMany({
      where: { is_active: true },
      include: { kelas: { select: { nama: true } } } });

    return NextResponse.json({
      success: true,
      message: "Database kelas & mapel berhasil disinkronkan dengan standar kurikulum Ust Aziz.",
      activeKelas,
      totalMapel: activeMapel.length });
  } catch (err: any) {
    console.error("[GET /api/setup-db/cleanup-kelas]", err);
    return NextResponse.json(
      { error: "Gagal membersihkan data kelas", details: err.message },
      { status: 500 }
    );
  }
}
