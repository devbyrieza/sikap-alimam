import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");
    if (!santriId) {
      return NextResponse.json({ error: "santri_id required" }, { status: 400 });
    }

    // Pastikan wali ini benar-benar memiliki akses ke santri ini
    const aksesCheck = await prisma.orangTuaSantri.findFirst({
      where: { user_id: session.userId, santri_id: santriId }
    });
    if (!aksesCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ambil santri + kelas + wali kelas info
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santriId },
      include: {
        kelas: {
          include: {
            wali_kelas: {
              select: {
                id: true,
                nama_lengkap: true,
                nama_panggilan: true,
                no_hp: true,
                foto_url: true,
              }
            }
          }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // Dapatkan nominal standar santri ini dari record DB (1,000,000 atau 500,000)
    const sampleRecord = await prisma.pembayaranSPP.findFirst({
      where: { santri_id: santriId },
      orderBy: { created_at: "desc" }
    });
    const defaultNominal = sampleRecord?.nominal || 1000000;

    // Siklus Resmi 12 Bulan Tahun Ajaran 2026/2027 (Juli 2026 s/d Juni 2027)
    const bulanItems = [
      { bulan: 7, tahun: 2026, label: "Juli 2026" },
      { bulan: 8, tahun: 2026, label: "Agustus 2026" },
      { bulan: 9, tahun: 2026, label: "September 2026" },
      { bulan: 10, tahun: 2026, label: "Oktober 2026" },
      { bulan: 11, tahun: 2026, label: "November 2026" },
      { bulan: 12, tahun: 2026, label: "Desember 2026" },
      { bulan: 1, tahun: 2027, label: "Januari 2027" },
      { bulan: 2, tahun: 2027, label: "Februari 2027" },
      { bulan: 3, tahun: 2027, label: "Maret 2027" },
      { bulan: 4, tahun: 2027, label: "April 2027" },
      { bulan: 5, tahun: 2027, label: "Mei 2027" },
      { bulan: 6, tahun: 2027, label: "Juni 2027" },
    ];

    const sppRecords = await prisma.pembayaranSPP.findMany({
      where: {
        santri_id: santriId,
        OR: bulanItems.map(b => ({ bulan: b.bulan, tahun: b.tahun }))
      }
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const sppHistory = bulanItems.map(b => {
      const record = sppRecords.find(r => r.bulan === b.bulan && r.tahun === b.tahun);
      const isBulanIni = b.bulan === currentMonth && b.tahun === currentYear;
      
      // Bulan lampau atau bulan berjalan di tahun 2026
      const isPastOrCurrent = (b.tahun < currentYear) || (b.tahun === currentYear && b.bulan <= currentMonth);

      let status: "lunas" | "belum_lunas" | "mendatang" = "mendatang";
      if (record?.status === "lunas") {
        status = "lunas";
      } else if (isPastOrCurrent) {
        status = "belum_lunas";
      }

      return {
        bulan: b.bulan,
        tahun: b.tahun,
        label: b.label,
        status,
        nominal: record?.nominal || defaultNominal,
        tanggal_bayar: record?.tanggal_bayar || null,
        metode_bayar: record?.metode_bayar || null,
        is_bulan_ini: isBulanIni,
      };
    });

    // Wali Kelas: Ambil dari relasi kelas, fallback ke Ustadz Agus (MTs) atau Ustadz Imron (IL)
    let waliKelas = santri.kelas?.wali_kelas;
    if (!waliKelas) {
      const isMTs = (santri.kelas?.nama || "").includes("7") || santri.kelas?.jenjang === "MTs";
      const targetName = isMTs ? "Agus Cahyono" : "Imron";
      const peg = await prisma.pegawai.findFirst({
        where: { nama_lengkap: { contains: targetName, mode: "insensitive" } },
        select: {
          id: true,
          nama_lengkap: true,
          nama_panggilan: true,
          no_hp: true,
          foto_url: true,
        }
      });
      if (peg) {
        waliKelas = peg;
      } else {
        waliKelas = isMTs ? {
          id: "wali-mts",
          nama_lengkap: "Ustadz Agus Cahyono",
          nama_panggilan: "Ustadz Agus",
          no_hp: "081234567890",
          foto_url: null,
        } : {
          id: "wali-il",
          nama_lengkap: "Ustadz Imron Abdillah, S.Pd.",
          nama_panggilan: "Ustadz Imron",
          no_hp: "081234567891",
          foto_url: null,
        };
      }
    }

    const totalLunasCount = sppHistory.filter(s => s.status === "lunas").length;
    const totalBelumLunasCount = sppHistory.filter(s => s.status === "belum_lunas").length;
    const totalNominalLunas = sppHistory.filter(s => s.status === "lunas").reduce((acc, s) => acc + s.nominal, 0);
    const totalNominalTunggakan = sppHistory.filter(s => s.status === "belum_lunas").reduce((acc, s) => acc + s.nominal, 0);

    return NextResponse.json({
      success: true,
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas?.nama || "7 MTs",
        jenjang: santri.kelas?.jenjang || "MTs",
      },
      wali_kelas: waliKelas,
      spp_history: sppHistory,
      spp_summary: {
        total_lunas: totalLunasCount,
        total_belum_lunas: totalBelumLunasCount,
        total_nominal_lunas: totalNominalLunas,
        total_nominal_tunggakan: totalNominalTunggakan,
      }
    });
  } catch (error: any) {
    console.error("Error fetching wali spp-history:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
