import { type NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/auth";
import {
  getJurnalMonitoringReport,
  type TipePekanFilter,
} from "@/lib/jurnalMonitoring";
import { getJenjangFromKelas } from "@/lib/kelas";
import { getLaporanNilaiAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getLiveSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          ...(session.asatidz_id ? [{ id: session.asatidz_id }] : []),
          { user_id: session.userId },
          ...(session.email ? [{ email: session.email }] : []),
        ],
      },
      select: {
        id: true,
        nama_lengkap: true,
        jabatan: true,
        kategori_pegawai: true,
      },
    });

    const access = getLaporanNilaiAccess({
      user: {
        id: session.userId,
        nama: session.nama,
        email: session.email,
        role: session.role,
      },
      pegawai,
    });

    if (!access.canAccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Akses ditolak. Fitur ini khusus Kepala Kurikulum, Kepala Sekolah, Mudir, Admin Super, dan Wali Kelas.",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const rawJenjang = searchParams.get("jenjang") || "ALL";
    const rawKelas = searchParams.get("kelas_id") || "ALL";
    const rawTipePekan = searchParams.get("tipe_pekan") || "otomatis";
    const includeUnassigned =
      searchParams.get("include_unassigned") === "true" ||
      searchParams.get("include_unassigned") === "1";

    const validTipePekan: TipePekanFilter =
      rawTipePekan === "semua" ||
      rawTipePekan === "ganjil" ||
      rawTipePekan === "genap" ||
      rawTipePekan === "otomatis"
        ? rawTipePekan
        : "otomatis";

    let effectiveJenjang = rawJenjang;
    let effectiveKelas = rawKelas;

    if (access.allowedJenjang !== "ALL") {
      if (!access.allowedJenjang.includes(rawJenjang as "MTs" | "IL" | "MA")) {
        effectiveJenjang = access.allowedJenjang[0] || "ALL";
      }
      if (effectiveKelas !== "ALL") {
        const kRow = await prisma.kelas.findUnique({
          where: { id: effectiveKelas },
          select: { nama: true, jenjang: true },
        });
        const kJenjang = kRow
          ? getJenjangFromKelas(kRow.nama, kRow.jenjang)
          : null;
        if (!kJenjang || !access.allowedJenjang.includes(kJenjang)) {
          effectiveKelas = "ALL";
        }
      }
    }

    const report = await getJurnalMonitoringReport({
      startDate,
      endDate,
      jenjangFilter: effectiveJenjang,
      kelasFilter: effectiveKelas,
      tipePekan: validTipePekan,
      includeUnassigned,
    });

    if (access.allowedJenjang !== "ALL") {
      const allowedSet = new Set(access.allowedJenjang);
      report.filter_options = {
        kelas: report.filter_options.kelas.filter((k) =>
          allowedSet.has(k.jenjang),
        ),
        jenjang: report.filter_options.jenjang.filter((j) => allowedSet.has(j)),
      };
    }

    return NextResponse.json({
      success: true,
      access,
      report,
    });
  } catch (err) {
    console.error("[GET /api/jurnal/monitoring]", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat monitoring jurnal mengajar" },
      { status: 500 },
    );
  }
}
