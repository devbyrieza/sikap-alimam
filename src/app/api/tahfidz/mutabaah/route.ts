import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ambil daftar santri aktif beserta info tahfidz terakhir
export async function GET(req: NextRequest) {
  try {
    const santriList = await prisma.santriAktif.findMany({
      where: { is_active: true },
      include: {
        kelas: true,
        capaian_tahfidz: {
          orderBy: { tanggal: "desc" },
          take: 1
        }
      },
      orderBy: { nama_lengkap: "asc" }
    });

    // Format data agar UI mudah konsumsi
    const formatted = santriList.map(s => {
      const lastTahfidz = s.capaian_tahfidz[0] || null;
      return {
        id: s.id,
        nis: s.nis,
        nama_lengkap: s.nama_lengkap,
        kelas: s.kelas.nama,
        last_tahfidz: lastTahfidz ? {
          tanggal: lastTahfidz.tanggal,
          jenis: lastTahfidz.jenis,
          surat: lastTahfidz.surat,
          surat_dari: lastTahfidz.surat_dari,
          surat_ke: lastTahfidz.surat_ke,
          ayat_dari: lastTahfidz.ayat_dari,
          ayat_ke: lastTahfidz.ayat_ke,
          halaman: lastTahfidz.halaman,
          nilai: lastTahfidz.nilai,
          keterangan: lastTahfidz.keterangan
        } : null
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error fetching mutabaah tahfidz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Tambah Catatan Tahfidz Baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      santri_id, 
      pegawai_id, // Musyrif yang menginput
      tanggal, 
      jenis, // 'ziyadah' | 'murojaah' | 'tilawah'
      surat_dari,
      ayat_dari,
      surat_ke,
      ayat_ke,
      halaman,
      nilai,
      keterangan 
    } = body;

    if (!santri_id || !jenis || !surat_dari) {
      return NextResponse.json({ error: "Kolom wajib belum lengkap." }, { status: 400 });
    }

    // Set default tanggal = hari ini jika tidak diset
    const recordDate = tanggal ? new Date(tanggal) : new Date();

    // Konstruksi string surat gabungan (misal: "Al-Baqarah - Ali Imran") untuk backward compatibility
    const suratGabungan = surat_ke ? `${surat_dari} - ${surat_ke}` : surat_dari;
    const ayatGabungan = ayat_ke ? `${ayat_dari} - ${ayat_ke}` : ayat_dari;

    // Musyrif ID Fallback - Ambil musyrif pertama jika tidak diset demi kemudahan demo
    let activeMusyrifId = pegawai_id;
    if (!activeMusyrifId) {
      const musyrif = await prisma.pegawai.findFirst({
        where: { kategori_pegawai: 'ASATIDZ' }
      });
      activeMusyrifId = musyrif?.id;
    }

    if (!activeMusyrifId) {
      return NextResponse.json({ error: "Belum ada data asatidz di database." }, { status: 400 });
    }

    const newRecord = await prisma.capaianTahfidz.create({
      data: {
        santri_id,
        pegawai_id: activeMusyrifId,
        tanggal: recordDate,
        jenis,
        surat: suratGabungan,
        ayat: ayatGabungan,
        halaman: halaman ? String(halaman) : null,
        nilai: nilai ? parseFloat(nilai) : null,
        keterangan,
        surat_dari,
        ayat_dari: String(ayat_dari),
        surat_ke,
        ayat_ke: String(ayat_ke),
      }
    });

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    console.error("Error logging tahfidz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
