import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/presensi/asatidz/self
 * Cek status presensi guru yang sedang login untuk hari ini
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let pegawaiId = session.asatidz_id;
    if (!pegawaiId && session.userId) {
      const p = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: session.userId },
            { email: session.email },
            ...(session.nama
              ? [{ nama_lengkap: { contains: session.nama.split(" ")[0], mode: "insensitive" as const } }]
              : []),
          ],
        },
        select: { id: true, nama_lengkap: true },
      });
      if (p) pegawaiId = p.id;
    }

    if (!pegawaiId) {
      return NextResponse.json({
        checkedIn: false,
        pegawaiId: null,
        message: "Profil pegawai belum terhubung",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.presensiAsatidz.findUnique({
      where: {
        pegawai_id_tanggal: {
          pegawai_id: pegawaiId,
          tanggal: today,
        },
      },
      include: {
        pegawai: { select: { id: true, nama_lengkap: true } },
      },
    });

    return NextResponse.json({
      checkedIn: Boolean(existing),
      pegawaiId,
      presensi: existing || null,
    });
  } catch (err: any) {
    console.error("[GET /api/presensi/asatidz/self]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/presensi/asatidz/self
 * Guru melakukan Check-In Kehadiran Mengajar untuk hari ini langsung dari web dashboard
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let pegawaiId = session.asatidz_id;
    if (!pegawaiId && session.userId) {
      const p = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: session.userId },
            { email: session.email },
            ...(session.nama
              ? [{ nama_lengkap: { contains: session.nama.split(" ")[0], mode: "insensitive" as const } }]
              : []),
          ],
        },
        select: { id: true, nama_lengkap: true },
      });
      if (p) pegawaiId = p.id;
    }

    if (!pegawaiId) {
      return NextResponse.json(
        { error: "Profil pegawai tidak ditemukan untuk akun ini" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.presensiAsatidz.findUnique({
      where: {
        pegawai_id_tanggal: {
          pegawai_id: pegawaiId,
          tanggal: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        message: "Anda sudah melakukan presensi hari ini",
        presensi: existing,
      });
    }

    const now = new Date();
    const jamMasuk = now;
    const batasJam = new Date(now);
    batasJam.setHours(8, 0, 0, 0);
    const status = jamMasuk > batasJam ? "telat" : "hadir";

    const presensi = await prisma.presensiAsatidz.create({
      data: {
        pegawai_id: pegawaiId,
        tanggal: today,
        jam_masuk: now,
        status,
        metode: "web_dashboard",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Alhamdulillah, check-in berhasil (${status === "telat" ? "Terlambat" : "Tepat Waktu"})`,
      presensi,
    });
  } catch (err: any) {
    console.error("[POST /api/presensi/asatidz/self]", err);
    return NextResponse.json({ error: "Gagal memproses presensi guru" }, { status: 500 });
  }
}
