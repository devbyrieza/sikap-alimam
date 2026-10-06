import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const isAdminSuper = session?.role?.includes("ADMIN_SUPER");

    // We use KalenderAkademik to store the lock setting
    // nama_kegiatan: "LOCK_INPUT_NILAI" 
    const setting = await prisma.kalenderAkademik.findFirst({
      where: {
        kategori: "PENGATURAN_SISTEM",
        nama_kegiatan: "LOCK_INPUT_NILAI"
      }
    });

    return NextResponse.json({
      is_locked: isAdminSuper ? false : (setting ? setting.is_libur : false)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { is_locked } = await req.json();

    const setting = await prisma.kalenderAkademik.findFirst({
      where: {
        kategori: "PENGATURAN_SISTEM",
        nama_kegiatan: "LOCK_INPUT_NILAI"
      }
    });

    let activeTahunAjaran = await prisma.tahunAjaran.findFirst({
      where: { is_active: true }
    });

    if (!activeTahunAjaran) {
        // Fallback if no active tahun ajaran
        activeTahunAjaran = await prisma.tahunAjaran.findFirst() || { id: "00000000-0000-0000-0000-000000000000" } as any;
    }

    if (setting) {
      await prisma.kalenderAkademik.update({
        where: { id: setting.id },
        data: { is_libur: is_locked }
      });
    } else {
      await prisma.kalenderAkademik.create({
        data: {
          tahun_ajaran_id: activeTahunAjaran.id,
          nama_kegiatan: "LOCK_INPUT_NILAI",
          tanggal_mulai: new Date(),
          tanggal_selesai: new Date(),
          kategori: "PENGATURAN_SISTEM",
          deskripsi: "Mengunci fitur input nilai oleh guru",
          is_libur: is_locked, // use is_libur as boolean lock
          warna_label: "red"
        }
      });
    }

    return NextResponse.json({ success: true, is_locked });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
