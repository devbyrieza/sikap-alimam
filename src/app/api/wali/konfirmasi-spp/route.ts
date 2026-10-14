import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      santri_id,
      bulan_list, // array of number e.g. [7, 8, 9, 10]
      tahun = 2026,
      nominal_per_bulan,
      bank_pengirim,
      nama_rekening_pengirim,
      tanggal_transfer,
      bukti_transfer, // base64 string or url
      catatan
    } = body;

    if (!santri_id || !bulan_list || !Array.isArray(bulan_list) || bulan_list.length === 0) {
      return NextResponse.json({ error: "santri_id dan daftar bulan wajib diisi" }, { status: 400 });
    }

    // Pastikan user memiliki hak akses ke santri
    const akses = await prisma.orangTuaSantri.findFirst({
      where: { user_id: session.userId, santri_id }
    });
    if (!akses) {
      return NextResponse.json({ error: "Unauthorized access to santri" }, { status: 403 });
    }

    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: { kelas: true }
    });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const nominalFix = Number(nominal_per_bulan) || 1000000;
    const tglTransfer = tanggal_transfer ? new Date(tanggal_transfer) : new Date();

    const infoMetadata = JSON.stringify({
      bank_pengirim: bank_pengirim || "-",
      nama_pengirim: nama_rekening_pengirim || "-",
      tanggal_transfer: tglTransfer.toISOString(),
      catatan_wali: catatan || "",
      waktu_konfirmasi: new Date().toISOString(),
      ada_bukti_foto: !!bukti_transfer
    });

    const updatedRecords = [];

    for (const b of bulan_list) {
      const bulanNum = Number(b);
      const rec = await prisma.pembayaranSPP.upsert({
        where: {
          santri_id_bulan_tahun: {
            santri_id,
            bulan: bulanNum,
            tahun: Number(tahun)
          }
        },
        create: {
          santri_id,
          bulan: bulanNum,
          tahun: Number(tahun),
          status: "menunggu_verifikasi",
          nominal: nominalFix,
          tanggal_bayar: tglTransfer,
          metode_bayar: "transfer",
          catatan: infoMetadata
        },
        update: {
          status: "menunggu_verifikasi",
          nominal: nominalFix,
          tanggal_bayar: tglTransfer,
          metode_bayar: "transfer",
          catatan: infoMetadata
        }
      });
      updatedRecords.push(rec);
    }

    // Nomor WhatsApp resmi Admin Keuangan Al-Imam (Default: 081234567890 atau dari env)
    const adminFinanceWa = process.env.ADMIN_KEUANGAN_WA || "6281234567890";
    const cleanAdminWa = adminFinanceWa.replace(/[^0-9]/g, "").replace(/^0/, "62");

    const namaBulanMap: Record<number, string> = {
      7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober",
      11: "November", 12: "Desember", 1: "Januari", 2: "Februari",
      3: "Maret", 4: "April", 5: "Mei", 6: "Juni"
    };

    const bulanLabels = bulan_list.map((m: number) => `${namaBulanMap[m] || m} ${tahun}`).join(", ");
    const totalBayar = bulan_list.length * nominalFix;

    // Template pesan WhatsApp resmi otomatis untuk Admin Keuangan
    const waText = [
      `*KONFIRMASI PEMBAYARAN SPP SANTRI*`,
      `Pesantren Islam Al-Imam`,
      ``,
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Keuangan,`,
      `Saya wali santri ingin mengonfirmasi bahwa telah melakukan transfer SPP ananda:`,
      ``,
      `• *Nama Santri:* ${santri.nama_lengkap}`,
      `• *NIS:* ${santri.nis}`,
      `• *Kelas:* ${santri.kelas?.nama || "7 MTs"}`,
      `• *Bulan:* ${bulanLabels}`,
      `• *Total Transfer:* Rp ${totalBayar.toLocaleString("id-ID")}`,
      `• *Dari Rekening:* ${bank_pengirim || "Transfer Bank"} a.n. ${nama_rekening_pengirim || santri.nama_lengkap}`,
      `• *Tanggal:* ${tglTransfer.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      catatan ? `• *Catatan:* "${catatan}"` : "",
      ``,
      `Data konfirmasi dan bukti transfer telah diunggah ke sistem SIKAP.`,
      `Mohon bantuannya untuk verifikasi agar status di akun portal kami terbarui. Syukron wa jazakumullahu khairan.`
    ].filter(Boolean).join("\n");

    const waUrl = `https://wa.me/${cleanAdminWa}?text=${encodeURIComponent(waText)}`;

    return NextResponse.json({
      success: true,
      message: `Konfirmasi pembayaran untuk ${bulan_list.length} bulan berhasil dikirim.`,
      total_nominal: totalBayar,
      wa_url: waUrl,
      records: updatedRecords
    });
  } catch (error: any) {
    console.error("Error konfirmasi SPP:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
