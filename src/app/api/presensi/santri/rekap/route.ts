import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/presensi/santri/rekap
 * Query params: kelas_id, bulan (1-12), tahun (YYYY)
 *
 * Returns:
 *   - santri: list santri aktif di kelas
 *   - presensi: semua record presensi di bulan tersebut
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kelas_id = searchParams.get("kelas_id");
    const bulan = Number(searchParams.get("bulan"));
    const tahun = Number(searchParams.get("tahun"));

    if (!kelas_id || !bulan || !tahun) {
      return NextResponse.json(
        { error: "kelas_id, bulan, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // Rentang tanggal: awal - akhir bulan
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    // Santri aktif di kelas
    const santri = await prisma.santriAktif.findMany({
      where: { kelas_id, is_active: true },
      orderBy: { nama_lengkap: "asc" },
      select: { id: true, nama_lengkap: true, nis: true },
    });

    // Presensi di bulan tersebut
    const presensi = await prisma.presensiSiswa.findMany({
      where: {
        kelas_id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        santri_id: true,
        tanggal: true,
        status: true,
      },
      orderBy: { tanggal: "asc" },
    });

    // Format tanggal sebagai string YYYY-MM-DD
    const presensiFormatted = presensi.map((p) => ({
      santri_id: p.santri_id,
      tanggal: p.tanggal.toISOString().split("T")[0],
      status: p.status,
    }));

    return NextResponse.json({
      santri,
      presensi: presensiFormatted,
      meta: { kelas_id, bulan, tahun },
    });
  } catch (err) {
    console.error("[GET /api/presensi/santri/rekap]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data rekap presensi" },
      { status: 500 }
    );
  }
}
