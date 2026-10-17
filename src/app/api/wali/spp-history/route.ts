import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Bulan & tahun saat ini menurut WIB, bukan zona waktu server (yang biasanya UTC). */
function getJakartaYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

// Siklus resmi 12 bulan Tahun Ajaran 2026/2027 (Juli 2026 s/d Juni 2027)
const BULAN_ITEMS = [
  { bulan: 7, tahun: 2026, label: "Juli 2026" },
  { bulan: 8, tahun: 2026, label: "Agustus 2026" },
  { bulan: 9, tahun: 2026, label: "September 2026" },
  { bulan: 10, tahun: 2026, label: "Oktober 2026" },
  { bulan: 11, tahun: 2026, label: "November 2026" },
  { bulan: 12, tahun: 2026, label: "Desember 2026" },
  { bulan: 1, tahun: 2027, label: "Januari 2027" },
  { bulan: 2, tahun: 2027, label: "Februari 2027" },
  { bulan: 3, tahun: 2027, label: "Maret 2027" },
  { bulan: 4, tahun: 2027, label: "April 2027" },
  { bulan: 5, tahun: 2027, label: "Mei 2027" },
  { bulan: 6, tahun: 2027, label: "Juni 2027" },
];

type SppStatus = "lunas" | "menunggu_verifikasi" | "belum_lunas" | "mendatang";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const santriId = searchParams.get("santri_id");
    if (!santriId) {
      return NextResponse.json({ error: "santri_id required" }, { status: 400 });
    }

    // Pastikan wali ini benar-benar memiliki akses ke santri ini
    const aksesCheck = await prisma.orangTuaSantri.findFirst({
      where: { user_id: session.userId, santri_id: santriId },
    });
    if (!aksesCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Santri + kelas + wali kelas
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santriId },
      include: {
        kelas: {
          include: {
            wali_kelas: {
              select: {
                id: true,
                nama_lengkap: true,
                nama_panggilan: true,
                no_hp: true,
                foto_url: true,
              },
            },
          },
        },
      },
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // Nominal standar santri ini dari catatan pembayaran terakhir
    const sampleRecord = await prisma.pembayaranSPP.findFirst({
      where: { santri_id: santriId },
      orderBy: { created_at: "desc" },
    });
    // TODO: ambil dari tabel tarif SPP per jenjang/kelas. Angka ini hanya cadangan
    // dan akan tampil sebagai tagihan bila santri belum punya catatan pembayaran sama sekali.
    const defaultNominal = sampleRecord?.nominal || 1000000;

    const sppRecords = await prisma.pembayaranSPP.findMany({
      where: {
        santri_id: santriId,
        OR: BULAN_ITEMS.map((b) => ({ bulan: b.bulan, tahun: b.tahun })),
      },
    });

    const { year: currentYear, month: currentMonth } = getJakartaYearMonth();

    const sppHistory = BULAN_ITEMS.map((b) => {
      const record = sppRecords.find((r) => r.bulan === b.bulan && r.tahun === b.tahun);
      const isBulanIni = b.bulan === currentMonth && b.tahun === currentYear;
      const isPastOrCurrent =
        b.tahun < currentYear || (b.tahun === currentYear && b.bulan <= currentMonth);

      let status: SppStatus = "mendatang";
      if (record?.status === "lunas") status = "lunas";
      else if (record?.status === "menunggu_verifikasi") status = "menunggu_verifikasi";
      else if (isPastOrCurrent) status = "belum_lunas";

      return {
        bulan: b.bulan,
        tahun: b.tahun,
        label: b.label,
        status,
        nominal: record?.nominal || defaultNominal,
        tanggal_bayar: record?.tanggal_bayar || null,
        metode_bayar: record?.metode_bayar || null,
        is_bulan_ini: isBulanIni,
      };
    });

    // Wali kelas hanya dari relasi kelas. Bila belum diatur, kirim null agar halaman
    // menampilkan "kontak via Kesantrian" — bukan menebak nama atau nomor HP.
    const waliKelas = santri.kelas?.wali_kelas ?? null;

    const lunas = sppHistory.filter((s) => s.status === "lunas");
    const belumLunas = sppHistory.filter((s) => s.status === "belum_lunas");
    const sum = (rows: { nominal: number }[]) => rows.reduce((acc, s) => acc + Number(s.nominal || 0), 0);

    return NextResponse.json({
      success: true,
      santri: {
        id: santri.id,
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas?.nama || "-",
        jenjang: santri.kelas?.jenjang || "-",
      },
      wali_kelas: waliKelas,
      spp_history: sppHistory,
      spp_summary: {
        total_lunas: lunas.length,
        total_menunggu_verifikasi: sppHistory.filter((s) => s.status === "menunggu_verifikasi").length,
        total_belum_lunas: belumLunas.length,
        total_nominal_lunas: sum(lunas),
        total_nominal_tunggakan: sum(belumLunas),
      },
    });
  } catch (error) {
    console.error("Error fetching wali spp-history:", error);
    // Jangan bocorkan pesan error internal ke klien.
    return NextResponse.json({ success: false, error: "Gagal memuat riwayat SPP" }, { status: 500 });
  }
}