import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    let whereClause: any = { is_active: true };

    if (session?.userId) {
      const orangTuaRecords = await prisma.orangTuaSantri.findMany({
        where: { user_id: session.userId },
        select: { santri_id: true }
      });
      if (orangTuaRecords.length > 0) {
        whereClause.id = { in: orangTuaRecords.map(r => r.santri_id) };
      }
    }

    // Cari santri aktif milik wali santri
    const santriList = await prisma.santriAktif.findMany({
      where: whereClause,
      include: { kelas: true },
      orderBy: { nama_lengkap: "asc" }
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
          lunas: sppInfo.lunas };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching wali anak:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
