import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";

export async function GET() {
  try {
    // Cari santri aktif di database
    const santriList = await prisma.santriAktif.findMany({
      where: { is_active: true },
      include: { kelas: true },
      orderBy: { nama_lengkap: "asc" },
      take: 10,
    });

    const data = await Promise.all(
      santriList.map(async (s) => {
        const sppInfo = await cekStatusSpp(s.id);
        return {
          id: s.id,
          nama: s.nama_lengkap,
          nis: s.nis,
          kelas: s.kelas?.nama || "Kelas 7 MTs",
          jenjang: s.kelas?.jenjang || "MTs",
          foto_url: s.foto_url,
          spp: sppInfo,
          lunas: sppInfo.lunas,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching wali anak:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
