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

    if (!bulan || !tahun) {
      return NextResponse.json(
        { error: "bulan dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // Rentang tanggal: awal - akhir bulan
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    if (!kelas_id) {
      // Return global stats
      const presensi = await prisma.presensiSiswa.findMany({
        where: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          kelas: { select: { id: true, nama: true, jenjang: true } },
        },
      });

      // Calculate overall stats
      const overall = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
      const perKelas: Record<string, { nama: string; jenjang: string; hadir: 0; sakit: 0; izin: 0; alpha: 0 }> = {};
      const perJenjang: Record<string, { hadir: 0; sakit: 0; izin: 0; alpha: 0 }> = {};

      presensi.forEach((p) => {
        const s = p.status.toLowerCase();
        if (["hadir", "sakit", "izin", "alpha"].includes(s)) {
          overall[s as keyof typeof overall]++;
          
          if (!perKelas[p.kelas.id]) {
            perKelas[p.kelas.id] = { nama: p.kelas.nama, jenjang: p.kelas.jenjang || "Lainnya", hadir: 0, sakit: 0, izin: 0, alpha: 0 };
          }
          perKelas[p.kelas.id][s as keyof typeof overall]++;
          
          const jenjang = p.kelas.jenjang || "Lainnya";
          if (!perJenjang[jenjang]) {
            perJenjang[jenjang] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
          }
          perJenjang[jenjang][s as keyof typeof overall]++;
        }
      });

      return NextResponse.json({
        summary: true,
        overall,
        perKelas: Object.values(perKelas),
        perJenjang,
        meta: { bulan, tahun },
      });
    }

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
