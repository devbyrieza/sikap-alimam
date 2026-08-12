import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

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
            { email: { equals: session.email, mode: "insensitive" } },
            { nama_lengkap: { equals: session.nama, mode: "insensitive" } },
          ],
        },
      });

      // Fallback: jika spasi/gelar sedikit berbeda, cari berdasarkan nama utama
      if (!pegawai && session.nama) {
        const coreName = session.nama.split(",")[0].trim();
        if (coreName.length >= 3) {
          pegawai = await prisma.pegawai.findFirst({
            where: {
              nama_lengkap: { contains: coreName, mode: "insensitive" },
            },
          });
        }
      }

      // Auto-link user_id jika ketemu pegawai tapi user_id belum terhubung
      if (pegawai && (!pegawai.user_id || pegawai.user_id !== session.userId)) {
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { user_id: session.userId },
        }).catch(() => {});
      }
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
        foto_url: pegawai?.foto_url || null,
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

    // Synchronize relational asatidz_mapel if teacher
    if (savedPegawai.id) {
      await syncAsatidzMapel(savedPegawai.id, savedPegawai.mata_pelajaran);
    }

    // Update User login email
    const newEmail = email?.trim();
    if (newEmail && session.userId && newEmail !== session.email) {
      // Periksa apakah email baru sudah dipakai user lain
      const existingUserEmail = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      });
      if (!existingUserEmail || existingUserEmail.id === session.userId) {
        await prisma.user.update({
          where: { id: session.userId },
          data: { email: newEmail.toLowerCase() }
        });
      }
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
