import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.role || "").toLowerCase().trim();
    const isGuru = userRole.includes("guru") || userRole.includes("asatidz") || userRole.includes("pengajar") || userRole === "user";

    let pegawai = null;
    if (session.asatidz_id) {
      pegawai = await prisma.pegawai.findUnique({
        where: { id: session.asatidz_id },
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
      });
    }

    // Check completeness
    const missingFields: string[] = [];
    if (!pegawai?.nama_lengkap || !pegawai.nama_lengkap.trim()) missingFields.push("Nama Lengkap");
    if (!pegawai?.no_hp || !pegawai.no_hp.trim()) missingFields.push("No. WhatsApp / HP");
    if (!pegawai?.jenis_kelamin) missingFields.push("Jenis Kelamin");
    if (!pegawai?.kategori_pegawai) missingFields.push("Kategori Pegawai");
    
    const isCivitasGuru = isGuru || (pegawai?.kategori_pegawai || "").toUpperCase().includes("GURU") || (pegawai?.kategori_pegawai || "").toUpperCase().includes("ASATIDZ");
    if (isCivitasGuru && (!pegawai?.mata_pelajaran || !pegawai.mata_pelajaran.trim())) {
      missingFields.push("Penugasan Mata Pelajaran");
    }

    const isComplete = !pegawai ? false : missingFields.length === 0;

    return NextResponse.json({
      success: true,
      pegawai,
      user: {
        id: session.userId,
        nama: session.nama,
        email: session.email,
        role: session.role,
      },
      isComplete,
      missingFields,
      isGuru: isCivitasGuru,
    });
  } catch (error: any) {
    console.error("Error fetching profile in SIKAP:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      nama_lengkap,
      nik,
      jenis_kelamin,
      tempat_lahir,
      tanggal_lahir,
      no_hp,
      email,
      alamat,
      kategori_pegawai,
      unit_kerja,
      divisi,
      jabatan,
      mata_pelajaran,
      pendidikan_terakhir,
      status_pernikahan,
      foto_url,
    } = body;

    if (!nama_lengkap || !nama_lengkap.trim()) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }

    if (!no_hp || !no_hp.trim()) {
      return NextResponse.json({ error: "Nomor WhatsApp / HP aktif wajib diisi." }, { status: 400 });
    }

    const isGuru = (kategori_pegawai || "").toUpperCase().includes("GURU") || (kategori_pegawai || "").toUpperCase().includes("ASATIDZ");
    if (isGuru && (!mata_pelajaran || !mata_pelajaran.trim())) {
      return NextResponse.json({ error: "Mohon pilih minimal 1 mata pelajaran yang Anda ampu." }, { status: 400 });
    }

    // Find existing pegawai
    let existingPegawai = null;
    if (session.asatidz_id) {
      existingPegawai = await prisma.pegawai.findUnique({
        where: { id: session.asatidz_id },
      });
    }

    if (!existingPegawai && session.userId) {
      existingPegawai = await prisma.pegawai.findFirst({
        where: {
          OR: [
            { user_id: session.userId },
            { email: session.email },
            { nama_lengkap: { equals: session.nama, mode: "insensitive" } },
          ],
        },
      });
    }

    const dataPayload: any = {
      nama_lengkap: nama_lengkap.trim(),
      nik: nik?.trim() || null,
      jenis_kelamin: jenis_kelamin || null,
      tempat_lahir: tempat_lahir?.trim() || null,
      tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
      no_hp: no_hp.trim(),
      email: email?.trim() || session.email || null,
      alamat: alamat?.trim() || null,
      kategori_pegawai: kategori_pegawai || (isGuru ? "GURU,ASATIDZ" : "PEGAWAI_UMUM"),
      unit_kerja: unit_kerja?.trim() || "Pesantren Al-Imam",
      divisi: divisi?.trim() || null,
      jabatan: jabatan?.trim() || (isGuru ? "Pengajar / Guru" : "Staf"),
      mata_pelajaran: isGuru ? (mata_pelajaran?.trim() || null) : null,
      pendidikan_terakhir: pendidikan_terakhir || null,
      status_pernikahan: status_pernikahan || null,
      foto_url: foto_url || null,
      updated_at: new Date(),
    };

    let savedPegawai;
    if (existingPegawai) {
      savedPegawai = await prisma.pegawai.update({
        where: { id: existingPegawai.id },
        data: {
          ...dataPayload,
          user_id: session.userId || existingPegawai.user_id,
        },
      });
    } else {
      savedPegawai = await prisma.pegawai.create({
        data: {
          ...dataPayload,
          user_id: session.userId,
        },
      });
    }

    // Sync user table nama if changed
    if (session.userId) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { nama: nama_lengkap.trim() },
      }).catch((e) => console.warn("Failed to update user.nama:", e));
    }

    return NextResponse.json({
      success: true,
      message: "Data profil civitas berhasil disimpan!",
      pegawai: savedPegawai,
    });
  } catch (error: any) {
    console.error("Error saving profile in SIKAP:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan data profil" }, { status: 500 });
  }
}
