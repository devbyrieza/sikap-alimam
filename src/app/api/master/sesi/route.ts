import { type NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultSesiWaktu } from "@/lib/syncScheduleFromPDF";

async function canManageKurikulum() {
  const session = await getLiveSession();
  if (!session) return { allowed: false, status: 401 as const };
  const roleStr = (session.role || "").toLowerCase();
  const namaStr = (session.nama || "").toLowerCase();
  const isAllowed =
    roleStr.includes("admin_super") ||
    roleStr.includes("mudir") ||
    roleStr.includes("kepala_sekolah") ||
    roleStr.includes("kepala_kurikulum") ||
    roleStr.includes("kadiv_kurikulum") ||
    namaStr.includes("imron");
  return {
    allowed: isAllowed,
    status: isAllowed ? (200 as const) : (403 as const),
  };
}

// Ambil semua Sesi Waktu (auto-seed bila tabel masih kosong agar sinkron dengan Jadwal & Jurnal)
export async function GET() {
  try {
    const sesi = await ensureDefaultSesiWaktu();
    return NextResponse.json(sesi);
  } catch (error) {
    console.error("Error fetching sesi waktu:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Tambah Sesi Waktu Baru
export async function POST(req: NextRequest) {
  try {
    const auth = await canManageKurikulum();
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status },
      );
    }

    const body = await req.json();
    const { jam_ke, waktu_mulai, waktu_selesai, durasi_menit } = body;

    const jamInt = Number.parseInt(String(jam_ke), 10);
    if (
      !Number.isFinite(jamInt) ||
      jamInt < 1 ||
      !waktu_mulai ||
      !waktu_selesai
    ) {
      return NextResponse.json(
        { error: "Data sesi tidak valid" },
        { status: 400 },
      );
    }

    const newSesi = await prisma.masterSesiWaktu.create({
      data: {
        jam_ke: jamInt,
        waktu_mulai: String(waktu_mulai).trim(),
        waktu_selesai: String(waktu_selesai).trim(),
        durasi_menit: Number.parseInt(String(durasi_menit), 10) || 40,
        is_active: true,
      },
    });

    return NextResponse.json(newSesi, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating sesi waktu:", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Jam pelajaran ini sudah ada." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update Sesi Waktu + sinkronkan waktu ke jadwal_pelajaran terkait
export async function PATCH(req: NextRequest) {
  try {
    const auth = await canManageKurikulum();
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status },
      );
    }

    const body = await req.json();
    const { id, jam_ke, waktu_mulai, waktu_selesai, durasi_menit } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID sesi wajib diisi" },
        { status: 400 },
      );
    }

    const existing = await prisma.masterSesiWaktu.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Sesi waktu tidak ditemukan" },
        { status: 404 },
      );
    }

    const nextJamKe =
      jam_ke !== undefined
        ? Number.parseInt(String(jam_ke), 10)
        : existing.jam_ke;
    const nextMulai = waktu_mulai
      ? String(waktu_mulai).trim()
      : existing.waktu_mulai;
    const nextSelesai = waktu_selesai
      ? String(waktu_selesai).trim()
      : existing.waktu_selesai;
    const nextDurasi =
      durasi_menit !== undefined
        ? Number.parseInt(String(durasi_menit), 10) || 40
        : existing.durasi_menit;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.masterSesiWaktu.update({
        where: { id: String(id) },
        data: {
          jam_ke: nextJamKe,
          waktu_mulai: nextMulai,
          waktu_selesai: nextSelesai,
          durasi_menit: nextDurasi,
        },
      });

      await tx.jadwalPelajaran.updateMany({
        where: { jam_ke: existing.jam_ke },
        data: {
          jam_ke: nextJamKe,
          waktu_mulai: nextMulai,
          waktu_selesai: nextSelesai,
        },
      });

      return row;
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Error updating sesi waktu:", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Nomor Jam Ke tersebut sudah dipakai sesi lain." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Gagal memperbarui sesi waktu" },
      { status: 500 },
    );
  }
}

// Hapus Sesi Waktu
export async function DELETE(req: NextRequest) {
  try {
    const auth = await canManageKurikulum();
    if (!auth.allowed) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status },
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID sesi wajib diisi" },
        { status: 400 },
      );
    }

    await prisma.masterSesiWaktu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sesi waktu:", error);
    return NextResponse.json(
      { error: "Gagal menghapus sesi waktu" },
      { status: 500 },
    );
  }
}
