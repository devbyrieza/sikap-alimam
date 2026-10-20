import { NextRequest, NextResponse } from "next/server";
import { writeFile, access, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("foto") as File | null;
    const santriId = formData.get("santri_id") as string | null;

    if (!santriId) {
      return NextResponse.json({ success: false, error: "ID santri tidak ditemukan" }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Tidak ada file foto yang dipilih" }, { status: 400 });
    }

    // Validasi tipe file (hanya gambar)
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimeTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return NextResponse.json({ success: false, error: "Format file harus berupa gambar (JPG, PNG, atau WEBP)" }, { status: 400 });
    }

    // Validasi ukuran file (maksimal 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Ukuran foto maksimal adalah 5 MB" }, { status: 400 });
    }

    // Cek keberadaan santri
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santriId },
      select: { id: true, nama_lengkap: true, nis: true },
    });

    if (!santri) {
      return NextResponse.json({ success: false, error: "Data santri tidak ditemukan" }, { status: 404 });
    }

    // Otorisasi: periksa apakah user adalah orang tua dari santri ini, atau staf berwenang
    const isParent = await prisma.orangTuaSantri.findFirst({
      where: {
        user_id: session.userId,
        santri_id: santriId,
      },
    });

    const role = (session.role || "").toUpperCase();
    const isStaff = [
      "ADMIN", "SUPERADMIN", "ADMIN_SUPER", "MUDIR", "KEPALA_SEKOLAH",
      "KEPALA_PENGASUHAN", "KADIV_PENGASUHAN", "PENGASUHAN", "PENGASUH",
      "PENGAMPU_HALAQOH", "MUSYRIF", "WALI_KELAS", "GURU"
    ].includes(role);
    const isMatchingUsername = session.email?.startsWith(santri.nis || "") || false;

    if (!isParent && !isStaff && !isMatchingUsername) {
      return NextResponse.json({ success: false, error: "Anda tidak memiliki akses untuk mengubah foto santri ini" }, { status: 403 });
    }

    // Simpan file ke direktori uploads
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `santri_${santriId}_${crypto.randomUUID()}${ext.toLowerCase()}`;

    const uploadDir = process.env.NODE_ENV === "production"
      ? "/app/storage_data/uploads"
      : path.join(process.cwd(), "storage_data", "uploads");

    try {
      await access(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, fileName), buffer);
    const fotoUrl = `/api/uploads/${fileName}`;

    // Update database SantriAktif
    await prisma.santriAktif.update({
      where: { id: santriId },
      data: { foto_url: fotoUrl },
    });

    return NextResponse.json({
      success: true,
      message: "Foto santri berhasil diperbarui",
      foto_url: fotoUrl,
    });
  } catch (error: any) {
    console.error("Error upload foto santri:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan saat mengunggah foto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");

    if (!santriId) {
      return NextResponse.json({ success: false, error: "ID santri tidak ditemukan" }, { status: 400 });
    }

    const isParent = await prisma.orangTuaSantri.findFirst({
      where: {
        user_id: session.userId,
        santri_id: santriId,
      },
    });

    const role = (session.role || "").toUpperCase();
    const isStaff = [
      "ADMIN", "SUPERADMIN", "ADMIN_SUPER", "MUDIR", "KEPALA_SEKOLAH",
      "KEPALA_PENGASUHAN", "KADIV_PENGASUHAN", "PENGASUHAN", "PENGASUH",
      "PENGAMPU_HALAQOH", "MUSYRIF", "WALI_KELAS", "GURU"
    ].includes(role);

    if (!isParent && !isStaff) {
      return NextResponse.json({ success: false, error: "Anda tidak memiliki akses untuk menghapus foto santri ini" }, { status: 403 });
    }

    await prisma.santriAktif.update({
      where: { id: santriId },
      data: { foto_url: null },
    });

    return NextResponse.json({
      success: true,
      message: "Foto santri berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error delete foto santri:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus foto" }, { status: 500 });
  }
}
