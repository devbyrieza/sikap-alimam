import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const santri_id = searchParams.get("santri_id");
    const kelas_id = searchParams.get("kelas_id");
    const bulan = searchParams.get("bulan") ? Number(searchParams.get("bulan")) : null;
    const tahun = searchParams.get("tahun") ? Number(searchParams.get("tahun")) : null;
    const q = searchParams.get("q") || "";

    // If no specific santri selected, return search list
    if (!santri_id) {
      const where: any = { is_active: true };
      if (kelas_id) where.kelas_id = kelas_id;
      if (q) {
        where.OR = [
          { nama_lengkap: { contains: q, mode: "insensitive" } },
          { nis: { contains: q, mode: "insensitive" } },
        ];
      }

      const santriList = await prisma.santriAktif.findMany({
        where,
        orderBy: { nama_lengkap: "asc" },
        take: 50,
        select: {
          id: true,
          nama_lengkap: true,
          nis: true,
          kelas: { select: { id: true, nama: true, jenjang: true } },
        },
      });

      return NextResponse.json({ santriList });
    }

    // Specific santri history
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      select: {
        id: true,
        nama_lengkap: true,
        nis: true,
        jenis_kelamin: true,
        foto_url: true,
        kelas: { select: { id: true, nama: true, jenjang: true } },
      },
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const wherePresensi: any = { santri_id };

    if (bulan && tahun) {
      const startDate = new Date(tahun, bulan - 1, 1);
      const endDate = new Date(tahun, bulan, 0, 23, 59, 59);
      wherePresensi.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    } else if (tahun) {
      const startDate = new Date(tahun, 0, 1);
      const endDate = new Date(tahun, 11, 31, 23, 59, 59);
      wherePresensi.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const presensiList = await prisma.presensiSiswa.findMany({
      where: wherePresensi,
      orderBy: { tanggal: "desc" },
      select: {
        id: true,
        tanggal: true,
        status: true,
        keterangan: true,
        created_at: true,
        kelas: { select: { nama: true } },
      },
    });

    // Format presensi and calculate summary
    const summary = { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0, persentaseHadir: 0 };

    const formattedPresensi = presensiList.map((p) => {
      const s = p.status.toLowerCase();
      if (s === "hadir") summary.hadir++;
      else if (s === "sakit") summary.sakit++;
      else if (s === "izin") summary.izin++;
      else if (s === "alpha") summary.alpha++;

      summary.total++;

      return {
        id: p.id,
        tanggal: p.tanggal.toISOString().split("T")[0],
        status: p.status,
        keterangan: p.keterangan,
        kelasNama: p.kelas.nama,
      };
    });

    if (summary.total > 0) {
      summary.persentaseHadir = Math.round((summary.hadir / summary.total) * 100);
    }

    return NextResponse.json({
      santri,
      presensi: formattedPresensi,
      summary,
      meta: { bulan, tahun },
    });
  } catch (err) {
    console.error("[GET /api/presensi/santri/riwayat]", err);
    return NextResponse.json({ error: "Gagal memuat riwayat presensi santri" }, { status: 500 });
  }
}
