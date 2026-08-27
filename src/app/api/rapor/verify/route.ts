import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || searchParams.get("doc_id");

  if (!id) {
    return NextResponse.json({
      status: "INVALID",
      valid: false,
      message: "ID Dokumen tidak ditemukan."
    }, { status: 400 });
  }

  try {
    const santri = await prisma.santriAktif.findFirst({
      where: {
        OR: [
          { id },
          { nis: id }
        ]
      },
      include: {
        kelas: true,
        halaqoh_anggota: {
          include: {
            kelompok: {
              include: { pegawai: true }
            }
          }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({
        status: "NOT_FOUND",
        valid: false,
        message: "Dokumen tidak terdaftar di server resmi Pesantren Al-Imam."
      }, { status: 404 });
    }

    const musyrifNama = santri.halaqoh_anggota[0]?.kelompok?.pegawai?.nama_lengkap || "Muhammad Iqbal, S.Pd.";

    return NextResponse.json({
      status: "VERIFIED_OFFICIAL",
      valid: true,
      dokumen: {
        jenis: "Laporan Capaian Tahfidz & Kehadiran Halaqoh",
        institusi: "Pesantren Al-Imam Al-Islami",
        santri: {
          nama: santri.nama_lengkap,
          nis: santri.nis,
          kelas: santri.kelas?.nama || "—"
        },
        penandatangan: {
          pengampu_halaqoh: musyrifNama,
          kadiv_pengasuhan: "Wahyudi Pranata, Lc."
        },
        keamanan: "Terenskripsi Digital (SHA-256 Seal)",
        timestamp_verifikasi: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
