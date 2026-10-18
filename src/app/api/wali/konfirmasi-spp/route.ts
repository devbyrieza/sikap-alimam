import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeFile, access, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const NAMA_BULAN: Record<number, string> = {
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober",
  11: "November", 12: "Desember", 1: "Januari", 2: "Februari",
  3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
};

// Tahun ajaran 2026/2027: Juli–Desember 2026, Januari–Juni 2027.
// TODO: ambil dari konfigurasi tahun ajaran aktif agar tidak perlu diubah manual.
const tahunUntukBulan = (bulan: number) => (bulan >= 7 ? 2026 : 2027);

// Nomor WA Finance: utamakan env, cadangan memakai nomor Finance yang tampil di portal.
const FINANCE_WA_FALLBACK = "6285111403331";

function normalizeWa(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
    }

    const { santri_id, bulan_list, bank_pengirim, nama_rekening_pengirim, tanggal_transfer, bukti_transfer, catatan } =
      body;
    // Catatan: `tahun` dan `nominal_per_bulan` dari klien sengaja diabaikan.
    // Tahun ditentukan dari bulan, nominal dari data resmi di database.

    if (!santri_id || typeof santri_id !== "string" || !Array.isArray(bulan_list) || bulan_list.length === 0) {
      return NextResponse.json({ error: "santri_id dan daftar bulan wajib diisi" }, { status: 400 });
    }

    const bulanUnik: number[] = Array.from(new Set(bulan_list.map((b: unknown) => Number(b))));
    if (bulanUnik.length > 12 || bulanUnik.some((b) => !Number.isInteger(b) || b < 1 || b > 12)) {
      return NextResponse.json({ error: "Daftar bulan tidak valid" }, { status: 400 });
    }

    // Pastikan user memiliki hak akses ke santri
    const akses = await prisma.orangTuaSantri.findFirst({
      where: { user_id: session.userId, santri_id },
    });
    if (!akses) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: { kelas: true },
    });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const items = bulanUnik.map((bulan) => ({ bulan, tahun: tahunUntukBulan(bulan) }));

    // Catatan pembayaran yang sudah ada untuk bulan-bulan ini
    const existing = await prisma.pembayaranSPP.findMany({
      where: { santri_id, OR: items.map((i) => ({ bulan: i.bulan, tahun: i.tahun })) },
    });
    const findExisting = (i: { bulan: number; tahun: number }) =>
      existing.find((r) => r.bulan === i.bulan && r.tahun === i.tahun);

    // Bulan yang sudah lunas tidak boleh ditimpa oleh konfirmasi wali
    const dilewati = items.filter((i) => findExisting(i)?.status === "lunas");
    const diproses = items.filter((i) => findExisting(i)?.status !== "lunas");

    if (diproses.length === 0) {
      return NextResponse.json(
        { success: false, error: "Semua bulan yang dipilih sudah tercatat lunas." },
        { status: 409 },
      );
    }

    // Nominal dari data resmi: catatan bulan itu, lalu catatan terakhir santri.
    // TODO: ganti cadangan Rp 1.000.000 dengan tabel tarif SPP per jenjang/kelas.
    const terakhir = await prisma.pembayaranSPP.findFirst({
      where: { santri_id },
      orderBy: { created_at: "desc" },
    });
    const defaultNominal = Number(terakhir?.nominal) || 1000000;
    const nominalUntuk = (i: { bulan: number; tahun: number }) => Number(findExisting(i)?.nominal) || defaultNominal;

    const parsedTgl = tanggal_transfer ? new Date(tanggal_transfer) : new Date();
    const tglTransfer = Number.isNaN(parsedTgl.getTime()) ? new Date() : parsedTgl;

    const bank = clip(bank_pengirim, 100);
    const namaPengirim = clip(nama_rekening_pengirim, 100);
    const catatanWali = clip(catatan, 500);

    const totalBayar = diproses.reduce((acc, i) => acc + nominalUntuk(i), 0);
    const bulanLabels = diproses.map((i) => `${NAMA_BULAN[i.bulan]} ${i.tahun}`).join(", ");

    // Simpan file bukti transfer jika ada (baik base64 maupun URL)
    let proofUrl = "";
    if (bukti_transfer && typeof bukti_transfer === "string") {
      if (bukti_transfer.startsWith("data:image")) {
        try {
          const matches = bukti_transfer.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === "jpeg" ? ".jpg" : `.${matches[1]}`;
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `spp_${crypto.randomUUID()}${ext}`;
            const uploadDir = process.env.NODE_ENV === "production"
              ? "/app/storage_data/uploads"
              : path.join(process.cwd(), "storage_data", "uploads");
            try {
              await access(uploadDir);
            } catch {
              await mkdir(uploadDir, { recursive: true });
            }
            await writeFile(path.join(uploadDir, fileName), buffer);
            proofUrl = `/api/uploads/${fileName}`;
          }
        } catch (e) {
          console.error("Gagal menyimpan file bukti transfer:", e);
        }
      } else if (bukti_transfer.startsWith("/api/uploads") || bukti_transfer.startsWith("http")) {
        proofUrl = bukti_transfer;
      }
    }

    const catatanFinal = proofUrl
      ? `[BUKTI_TRANSFER:${proofUrl}] Konfirmasi SPP (${bulanLabels}) Rp ${totalBayar.toLocaleString("id-ID")} via ${bank || "Transfer Bank"} a.n. ${namaPengirim || "-"}${catatanWali ? ` | Catatan: ${catatanWali}` : ""}`
      : `Konfirmasi SPP (${bulanLabels}) Rp ${totalBayar.toLocaleString("id-ID")} via ${bank || "Transfer Bank"} a.n. ${namaPengirim || "-"}${catatanWali ? ` | Catatan: ${catatanWali}` : ""}`;

    // Semua bulan disimpan sekaligus: berhasil semua atau tidak sama sekali
    const updatedRecords = await prisma.$transaction(
      diproses.map((i) => {
        const nominal = nominalUntuk(i);
        return prisma.pembayaranSPP.upsert({
          where: { santri_id_bulan_tahun: { santri_id, bulan: i.bulan, tahun: i.tahun } },
          create: {
            santri_id,
            bulan: i.bulan,
            tahun: i.tahun,
            status: "menunggu_verifikasi",
            nominal,
            tanggal_bayar: tglTransfer,
            metode_bayar: "transfer",
            catatan: catatanFinal,
          },
          update: {
            status: "menunggu_verifikasi",
            tanggal_bayar: tglTransfer,
            metode_bayar: "transfer",
            catatan: catatanFinal,
          },
        });
      }),
    );

    const cleanAdminWa = normalizeWa(process.env.ADMIN_KEUANGAN_WA || FINANCE_WA_FALLBACK);

    const waText = [
      `*KONFIRMASI PEMBAYARAN SPP SANTRI*`,
      `Pesantren Al-Imam Al-Islami Managed by Al-Andalus IIBS`,
      ``,
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Admin Keuangan,`,
      `Saya wali santri ingin mengonfirmasi bahwa telah melakukan transfer SPP ananda:`,
      ``,
      `• *Nama Santri:* ${santri.nama_lengkap}`,
      `• *NIS:* ${santri.nis}`,
      `• *Kelas:* ${santri.kelas?.nama || "-"}`,
      `• *Bulan:* ${bulanLabels}`,
      `• *Total Transfer:* Rp ${totalBayar.toLocaleString("id-ID")}`,
      `• *Dari Rekening:* ${bank || "Transfer Bank"} a.n. ${namaPengirim || santri.nama_lengkap}`,
      `• *Tanggal:* ${tglTransfer.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}`,
      catatanWali ? `• *Catatan:* "${catatanWali}"` : "",
      ``,
      `Bukti transfer saya lampirkan pada pesan ini.`,
      `Mohon bantuannya untuk verifikasi agar status di akun portal kami terbarui. Syukron wa jazakumullahu khairan.`,
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = `https://wa.me/${cleanAdminWa}?text=${encodeURIComponent(waText)}`;

    return NextResponse.json({
      success: true,
      message:
        dilewati.length > 0
          ? `Konfirmasi untuk ${diproses.length} bulan berhasil dikirim. ${dilewati.length} bulan sudah lunas dan dilewati.`
          : `Konfirmasi pembayaran untuk ${diproses.length} bulan berhasil dikirim.`,
      total_nominal: totalBayar,
      bulan_dilewati: dilewati.map((i) => ({ bulan: i.bulan, tahun: i.tahun })),
      wa_url: waUrl,
      records: updatedRecords,
    });
  } catch (error) {
    console.error("Error konfirmasi SPP:", error);
    // Jangan bocorkan pesan error internal ke klien.
    return NextResponse.json({ success: false, error: "Gagal mengirim konfirmasi pembayaran" }, { status: 500 });
  }
}