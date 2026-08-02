import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Ambil status mapel guru saat ini
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cari pegawai terkait user
  let pegawai = null;
  if (session.asatidz_id) {
    pegawai = await prisma.pegawai.findUnique({
      where: { id: session.asatidz_id },
      select: { id: true, nama_lengkap: true, mata_pelajaran: true, kategori_pegawai: true, jabatan: true },
    });
  }

  if (!pegawai && session.userId) {
    pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { user_id: session.userId },
          { email: session.email },
          { nama_lengkap: { equals: session.nama, mode: "insensitive" } },
        ],
      },
      select: { id: true, nama_lengkap: true, mata_pelajaran: true, kategori_pegawai: true, jabatan: true },
    });
  }

  return NextResponse.json({
    success: true,
    pegawai,
    hasMapel: Boolean(pegawai?.mata_pelajaran && pegawai.mata_pelajaran.trim().length > 0),
  });
}

// POST / PATCH: Update penugasan mapel oleh guru sendiri atau admin
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mata_pelajaran } = body;

  if (typeof mata_pelajaran !== "string" || !mata_pelajaran.trim()) {
    return NextResponse.json(
      { error: "Mohon pilih minimal 1 mata pelajaran yang Anda ampu." },
      { status: 400 }
    );
  }

  // Cari pegawai
  let pegawaiId = session.asatidz_id;
  if (!pegawaiId && session.userId) {
    const p = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { user_id: session.userId },
          { email: session.email },
          { nama_lengkap: { equals: session.nama, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (p) pegawaiId = p.id;
  }

  if (!pegawaiId) {
    // Jika data pegawai belum terhubung ke akun user, buatkan data pegawai otomatis
    const newPegawai = await prisma.pegawai.create({
      data: {
        user_id: session.userId,
        nama_lengkap: session.nama,
        email: session.email,
        kategori_pegawai: "GURU,ASATIDZ",
        jabatan: "Pengajar / Guru",
        mata_pelajaran: mata_pelajaran.trim(),
      },
    });
    return NextResponse.json({
      success: true,
      message: "Data mapel berhasil disimpan!",
      pegawai: newPegawai,
    });
  }

  const updatedPegawai = await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: {
      mata_pelajaran: mata_pelajaran.trim(),
      updated_at: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: "Data mapel berhasil disimpan!",
    pegawai: updatedPegawai,
  });
}
