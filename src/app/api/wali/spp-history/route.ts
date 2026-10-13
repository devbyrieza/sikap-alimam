import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAMA_BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

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

    // Ambil riwayat SPP 12 bulan terakhir
    const now = new Date();
    const bulanItems: { bulan: number; tahun: number; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bulanItems.push({ bulan: d.getMonth() + 1, tahun: d.getFullYear(), label: `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}` });
    }

    const sppRecords = await prisma.pembayaranSPP.findMany({
      where: {
        santri_id: santriId,
        OR: bulanItems.map(b => ({ bulan: b.bulan, tahun: b.tahun }))
      }
    });

    const sppHistory = bulanItems.map(b => {
      const record = sppRecords.find(r => r.bulan === b.bulan && r.tahun === b.tahun);
      const isLampau = b.tahun < now.getFullYear() || (b.tahun === now.getFullYear() && b.bulan < now.getMonth() + 1);
      const isBulanIni = b.bulan === now.getMonth() + 1 && b.tahun === now.getFullYear();
      const isMendatang = !isLampau && !isBulanIni;

      let status: "lunas" | "belum_lunas" | "mendatang" = "belum_lunas";
      if (record?.status === "lunas") status = "lunas";
      else if (isMendatang) status = "mendatang";

      return {
        bulan: b.bulan,
        tahun: b.tahun,
        label: b.label,
        status,
        nominal: record?.nominal || 1500000,
        tanggal_bayar: record?.tanggal_bayar || null,
        metode_bayar: record?.metode_bayar || null,
        is_bulan_ini: isBulanIni,
      };
    });

    const waliKelas = santri.kelas?.wali_kelas;

    return NextResponse.json({
      success: true,
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas?.nama,
        jenjang: santri.kelas?.jenjang,
      },
      wali_kelas: waliKelas ? {
        nama: waliKelas.nama_lengkap,
        nama_panggilan: waliKelas.nama_panggilan,
        no_hp: waliKelas.no_hp,
        foto_url: waliKelas.foto_url,
      } : null,
      spp_history: sppHistory,
      spp_summary: {
        total_lunas: sppHistory.filter(s => s.status === "lunas").length,
        total_belum_lunas: sppHistory.filter(s => s.status === "belum_lunas").length,
        total_nominal_lunas: sppHistory.filter(s => s.status === "lunas").reduce((acc, s) => acc + s.nominal, 0),
      }
    });
  } catch (error: any) {
    console.error("Error fetching wali spp-history:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
