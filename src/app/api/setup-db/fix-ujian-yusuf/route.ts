import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Cari data ujian pra target yang memiliki ayat mundur atau 13 - 11
    const allUjian = await prisma.ujianTahfidz.findMany({
      where: {
        OR: [
          { surah_nama: { contains: "Yusuf", mode: "insensitive" } },
          { jenis_ujian: "ujian_pra_target" }
        ]
      }
    });

    const fixed = [];
    for (const u of allUjian) {
      let needUpdate = false;
      let newDari = u.ayat_dari;
      let newKe = u.ayat_ke;

      // Jika terbalik mundur (misal 13 s/d 11)
      if (u.ayat_dari && u.ayat_ke && u.ayat_dari > u.ayat_ke) {
        newDari = u.ayat_ke;
        newKe = u.ayat_dari;
        needUpdate = true;
      }

      // Jika kasus spesifik Yusuf 13-11 atau 11-13 (hanya 2 ayat hasil uji coba)
      if (u.surah_nama?.toLowerCase().includes("yusuf") && ((u.ayat_dari === 13 && u.ayat_ke === 11) || (u.ayat_dari === 11 && u.ayat_ke === 13))) {
        newDari = 1;
        newKe = 52;
        needUpdate = true;
      }

      if (needUpdate) {
        const res = await prisma.ujianTahfidz.update({
          where: { id: u.id },
          data: {
            ayat_dari: newDari,
            ayat_ke: newKe,
            jumlah_halaman: 6.6
          }
        });
        fixed.push({ id: u.id, before: `${u.ayat_dari}-${u.ayat_ke}`, after: `${newDari}-${newKe}` });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memeriksa dan mengoreksi data ujian halaqoh.`,
      total_checked: allUjian.length,
      fixed_count: fixed.length,
      fixed_items: fixed
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
