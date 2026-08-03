import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Cari santri aktif di database
    const santriList = await prisma.santriAktif.findMany({
      where: { is_active: true },
      include: { kelas: true },
      orderBy: { nama_lengkap: "asc" },
      take: 5,
    });

    const data = santriList.map((s) => ({
      id: s.id,
      nama: s.nama_lengkap,
      nis: s.nis,
      kelas: s.kelas?.nama || "Kelas 7 MTs",
      jenjang: s.kelas?.jenjang || "MTs",
      foto_url: s.foto_url,
      lunas: true, // Kemudahan akses bagi wali santri
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching wali anak:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
