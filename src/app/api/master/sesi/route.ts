import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ambil semua Sesi Waktu
export async function GET() {
  try {
    const sesi = await prisma.masterSesiWaktu.findMany({
      orderBy: { jam_ke: 'asc' } });
    return NextResponse.json(sesi);
  } catch (error) {
    console.error("Error fetching sesi waktu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Tambah Sesi Waktu Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jam_ke, waktu_mulai, waktu_selesai, durasi_menit } = body;

    const newSesi = await prisma.masterSesiWaktu.create({
      data: {
        jam_ke: parseInt(jam_ke),
        waktu_mulai,
        waktu_selesai,
        durasi_menit: parseInt(durasi_menit) || 40 } });

    return NextResponse.json(newSesi, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sesi waktu:", error);
    // Tangani kemungkinan duplikat jam_ke
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Jam pelajaran ini sudah ada." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
