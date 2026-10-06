import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List of supported keys
const SUPPORTED_KEYS = [
  "LOCK_INPUT_NILAI",
  "LOCK_INPUT_JURNAL",
  "LOCK_INPUT_HALAQOH",
  "LOCK_INPUT_IBADAH",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const isAdminSuper = session?.role?.includes("ADMIN_SUPER");

    const settings = await prisma.kalenderAkademik.findMany({
      where: {
        kategori: "PENGATURAN_SISTEM",
        nama_kegiatan: { in: SUPPORTED_KEYS }
      }
    });

    const config: Record<string, boolean> = {};
    SUPPORTED_KEYS.forEach((key) => {
      config[key] = false;
    });

    settings.forEach((s) => {
      config[s.nama_kegiatan] = s.is_libur;
    });

    return NextResponse.json({
      config,
      isAdminSuper
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (!session.role?.includes("ADMIN_SUPER") && !session.role?.includes("KADIV_KURIKULUM"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, is_locked } = await req.json();
    if (!SUPPORTED_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
    }

    const setting = await prisma.kalenderAkademik.findFirst({
      where: {
        kategori: "PENGATURAN_SISTEM",
        nama_kegiatan: key
      }
    });

    let activeTahunAjaran = await prisma.tahunAjaran.findFirst({
      where: { is_active: true }
    });

    const finalTahunAjaranId = activeTahunAjaran 
      ? activeTahunAjaran.id 
      : (await prisma.tahunAjaran.findFirst())?.id || "00000000-0000-0000-0000-000000000000";

    if (setting) {
      await prisma.kalenderAkademik.update({
        where: { id: setting.id },
        data: { is_libur: is_locked }
      });
    } else {
      await prisma.kalenderAkademik.create({
        data: {
          tahun_ajaran_id: finalTahunAjaranId,
          nama_kegiatan: key,
          tanggal_mulai: new Date(),
          tanggal_selesai: new Date(),
          kategori: "PENGATURAN_SISTEM",
          deskripsi: `Sistem Lock untuk ${key}`,
          is_libur: is_locked,
          warna_label: "red"
        }
      });
    }

    return NextResponse.json({ success: true, key, is_locked });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
