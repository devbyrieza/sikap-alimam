import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekStatusSpp } from "@/lib/keuangan";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    // Hanya pengguna yang sudah login yang boleh melihat data santri.
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Ambil hanya santri yang terhubung ke akun wali ini.
    const orangTuaRecords = await prisma.orangTuaSantri.findMany({
      where: { user_id: session.userId },
      select: { santri_id: true },
    });

    // Akun yang belum ditautkan ke santri mana pun mendapat daftar kosong,
    // bukan seluruh santri aktif.
    if (orangTuaRecords.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const santriList = await prisma.santriAktif.findMany({
      where: {
        is_active: true,
        id: { in: orangTuaRecords.map((r) => r.santri_id) },
      },
      include: {
        kelas: {
          include: {
            wali_kelas: {
              select: {
                id: true,
                nama_lengkap: true,
                nama_panggilan: true,
                no_hp: true,
              },
            },
          },
        },
      },
      orderBy: { nama_lengkap: "asc" },
    });

    const data = await Promise.all(
      santriList.map(async (s) => {
        const sppInfo = await cekStatusSpp(s.id);
        return {
          id: s.id,
          nama: s.nama_lengkap,
          nis: s.nis,
          kelas: s.kelas?.nama || "-",
          jenjang: s.kelas?.jenjang || "-",
          wali_kelas: s.kelas?.wali_kelas
            ? {
                nama: s.kelas.wali_kelas.nama_lengkap,
                nama_panggilan: s.kelas.wali_kelas.nama_panggilan,
                no_hp: s.kelas.wali_kelas.no_hp,
              }
            : null,
          foto_url: s.foto_url,
          spp: sppInfo,
          lunas: sppInfo.lunas,
        };
      }),
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching wali anak:", error);
    // Jangan bocorkan pesan error internal ke klien.
    return NextResponse.json({ success: false, error: "Gagal memuat data ananda" }, { status: 500 });
  }
}