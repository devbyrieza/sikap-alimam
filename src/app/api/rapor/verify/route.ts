import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOfficialNis } from "@/lib/officialSantri";
import { isSealConfigured, verifyDocument } from "@/lib/docSeal";

export const dynamic = "force-dynamic";

const DEFAULT_JENIS = "tahfidz-halaqoh";
const JSON_HEADERS = { "Cache-Control": "no-store" };

/** NIS ditampilkan sebagian saja: cukup untuk dicocokkan dengan dokumen cetak, tidak untuk didata ulang. */
const maskNis = (nis: string | null | undefined) => {
  if (!nis) return "—";
  return nis.length > 3 ? `${"•".repeat(nis.length - 3)}${nis.slice(-3)}` : nis;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || searchParams.get("doc_id") || "").trim();
  const jenis = (searchParams.get("jenis") || DEFAULT_JENIS).slice(0, 64);
  const periode = (searchParams.get("periode") || "").slice(0, 64);
  const sig = (searchParams.get("sig") || "").slice(0, 128);

  if (!id || id.length > 64) {
    return NextResponse.json(
      { status: "INVALID", valid: false, message: "ID Dokumen tidak ditemukan." },
      { status: 400, headers: JSON_HEADERS },
    );
  }

  try {
    // Hanya ID dokumen/santri. NIS tidak lagi diterima sebagai kunci pencarian:
    // NIS berurutan sehingga mudah ditebak dan bisa dipakai menelusuri data santri satu per satu.
    const santri = await prisma.santriAktif.findUnique({
      where: { id },
      include: {
        kelas: true,
        halaqoh_anggota: {
          where: { is_active: true },
          include: { kelompok: { include: { pegawai: true } } },
        },
      },
    });

    if (!santri) {
      return NextResponse.json(
        {
          status: "NOT_FOUND",
          valid: false,
          message: "Dokumen tidak terdaftar di server resmi Pesantren Al-Imam.",
        },
        { status: 404, headers: JSON_HEADERS },
      );
    }

    // Segel digital: hanya ini yang benar-benar membuktikan isi dokumen asli.
    let sealed = false;
    if (sig) {
      if (!verifyDocument(santri.id, jenis, periode, sig)) {
        return NextResponse.json(
          {
            status: "SIGNATURE_MISMATCH",
            valid: false,
            message: "Segel digital tidak cocok. Dokumen ini kemungkinan telah diubah atau dipalsukan.",
          },
          { status: 422, headers: JSON_HEADERS },
        );
      }
      sealed = true;
    }

    // Pengampu hanya dari data sebenarnya; tanpa tebakan nama pada dokumen resmi.
    const pengampu = santri.halaqoh_anggota[0]?.kelompok?.pegawai?.nama_lengkap || null;

    return NextResponse.json(
      {
        status: sealed ? "VERIFIED_OFFICIAL" : "REGISTERED_UNSIGNED",
        valid: true,
        sealed,
        message: sealed
          ? "Dokumen asli: segel digital cocok dengan data resmi Pesantren Al-Imam."
          : isSealConfigured()
            ? "Santri terdaftar di Pesantren Al-Imam, tetapi dokumen ini tidak membawa segel digital sehingga isinya tidak dapat diverifikasi."
            : "Santri terdaftar di Pesantren Al-Imam. Verifikasi segel digital belum diaktifkan di server.",
        dokumen: {
          jenis: "Laporan Capaian Tahfidz & Kehadiran Halaqoh",
          institusi: "Pesantren Al-Imam Al-Islami",
          santri: {
            nama: santri.nama_lengkap,
            nis: maskNis(getOfficialNis(santri.nama_lengkap) || santri.nis),
            kelas: santri.kelas?.nama || "—",
          },
          penandatangan: {
            pengampu_halaqoh: pengampu,
            // TODO: pindahkan ke konfigurasi pejabat agar tidak perlu ubah kode saat berganti.
            kadiv_pengasuhan: "Wahyudi Pranata, Lc.",
          },
          ...(sealed ? { keamanan: "Segel digital HMAC-SHA256 valid" } : {}),
          timestamp_verifikasi: new Date().toISOString(),
        },
      },
      { headers: JSON_HEADERS },
    );
  } catch (error) {
    console.error("Error verifikasi dokumen:", error);
    // Jangan bocorkan pesan error internal ke publik.
    return NextResponse.json(
      { status: "ERROR", valid: false, message: "Verifikasi sementara tidak tersedia." },
      { status: 500, headers: JSON_HEADERS },
    );
  }
}