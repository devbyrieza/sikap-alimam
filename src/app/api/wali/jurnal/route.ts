import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWaliOrStaffSantri } from "@/lib/waliAccess";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedSantriId = searchParams.get("santri_id");
    const mapelId = searchParams.get("mapel_id");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(30, Math.max(5, Number(searchParams.get("limit") || 10)));

    const auth = await authorizeWaliOrStaffSantri(requestedSantriId);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (auth.isSppLocked) {
      return NextResponse.json({ success: false, error: "Akses terkunci karena SPP" }, { status: 403 });
    }

    if (!mapelId) {
      return NextResponse.json({
        success: true,
        data: [],
        hasMore: false,
        total: 0,
      });
    }

    const santri = await prisma.santriAktif.findUnique({
      where: { id: auth.santriId },
      select: { kelas_id: true },
    });

    if (!santri) {
      return NextResponse.json({ success: false, error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const where = {
      kelas_id: santri.kelas_id,
      mapel_id: mapelId,
    };

    const [total, rows] = await Promise.all([
      prisma.jurnalMengajar.count({ where }),
      prisma.jurnalMengajar.findMany({
        where,
        include: {
          pegawai: { select: { nama_lengkap: true } },
          mapel: { select: { nama: true } },
        },
        orderBy: [{ tanggal: "desc" }, { created_at: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString().slice(0, 10),
        jamKe: r.jam_ke,
        materi: r.materi,
        subMateri: r.sub_materi,
        kegiatan: r.kegiatan,
        guru: r.pegawai?.nama_lengkap || "-",
        mapel: r.mapel?.nama || "-",
      })),
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("GET /api/wali/jurnal error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat jurnal mengajar" }, { status: 500 });
  }
}
