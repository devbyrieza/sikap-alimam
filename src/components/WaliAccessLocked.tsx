"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Lock,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";
import Swal from "sweetalert2";
import { getOfficialNis } from "@/lib/officialSantri";

export const FINANCE_PHONE_DISPLAY = "085111403331";
export const FINANCE_WA = "6285111403331";
export const REKENING_ALIMAM = {
  bank: "BSI",
  bankLengkap: "BSI • Bank Syariah Indonesia",
  nomor: "4222224441",
  atasNama: "PP Al Andalus Al Imam",
};

interface WaliAccessLockedProps {
  santri: {
    id?: string;
    nama?: string;
    kelas?: string;
    nis?: string;
  };
  spp?: any;
  featureName?: string;
  onOpenKonfirmasiModal?: () => void;
}

function formatRupiah(num: number | null | undefined): string {
  if (num === null || num === undefined) return "Rp 0";
  return `Rp ${Number(num).toLocaleString("id-ID")}`;
}

export default function WaliAccessLocked({
  santri,
  spp,
  featureName = "Laporan Perkembangan Santri",
  onOpenKonfirmasiModal,
}: WaliAccessLockedProps) {
  const [copied, setCopied] = useState(false);

  const santriNama = santri?.nama || "Ananda";
  const santriKelas = santri?.kelas || "-";
  const santriNis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri?.nis || "-";
  const santriId = santri?.id || "";

  const months = spp?.tunggakanCount || 1;
  const nominal = Number(spp?.totalTunggakanNominal) || 0;
  const bulanList: string[] = Array.isArray(spp?.tunggakanBulan) ? spp.tunggakanBulan : [];

  const copyRekening = async () => {
    const textToCopy = REKENING_ALIMAM.nomor;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      Swal.fire({
        icon: "success",
        title: "Nomor Rekening Disalin!",
        text: `${REKENING_ALIMAM.bankLengkap}: ${REKENING_ALIMAM.nomor} a.n. ${REKENING_ALIMAM.atasNama}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "info",
        title: "Nomor Rekening BSI",
        text: `${REKENING_ALIMAM.nomor} a.n. ${REKENING_ALIMAM.atasNama}`,
      });
    }
  };

  const waText = encodeURIComponent(
    `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam,\n\nSaya wali santri dari:\n• Nama: ${santriNama}\n• NIS: ${santriNis}\n• Kelas: ${santriKelas}\n\nSaya telah mentransfer pembayaran SPP${nominal ? ` sebesar ${formatRupiah(nominal)}` : ""} dan melampirkan bukti transfer terlampir. Mohon bantuannya untuk memverifikasi dan membukakan akses portal SIKAP ananda. Jazaakumullah khayran.`
  );

  return (
    <div className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-200/90 bg-white p-6 text-center shadow-xl shadow-rose-950/5 sm:p-12">
        {/* Latar artistik lembut */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 -z-10 h-96 w-96 rounded-full bg-rose-50/80 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-80 w-80 rounded-full bg-amber-50/60 blur-3xl"
          aria-hidden="true"
        />

        {/* Ikon Gembok Besar */}
        <div className="relative mb-6 inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-[#550000] text-white shadow-xl shadow-rose-950/20 ring-4 ring-rose-100">
            <Lock size={46} className="stroke-[2.2]" aria-hidden="true" />
          </div>
          <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-2 text-amber-950 shadow-md motion-safe:animate-bounce">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
        </div>

        {/* Badge Status Terkunci */}
        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-rose-300 bg-rose-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-rose-800 shadow-sm">
          <ShieldAlert size={15} className="shrink-0 text-rose-600" />
          <span>Akses Portal Dinonaktifkan Sementara</span>
        </div>

        {/* Judul & Penjelasan Tegas */}
        <h2 className="mx-auto max-w-2xl text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
          Kewajiban Administrasi SPP Ananda Belum Diselesaikan
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
          Afwan Bapak/Ibu Wali Santri dari ananda <strong className="text-slate-900">{santriNama}</strong> ({santriKelas}), seluruh akses tampilan data <strong className="text-rose-700">{featureName}</strong> dinonaktifkan sementara hingga kewajiban pembayaran SPP berjalan diselesaikan.
        </p>

        {/* Rincian Tagihan SPP */}
        <div className="mx-auto mt-7 grid max-w-xl grid-cols-1 gap-3 rounded-2xl border border-rose-200 bg-gradient-to-br from-slate-50 via-rose-50/30 to-amber-50/30 p-5 text-center shadow-inner sm:grid-cols-3 sm:gap-4 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Bulan Tunggakan</span>
            <span className="mt-1 block text-2xl font-black text-rose-600">{months} Bulan</span>
            <span className="text-[10px] text-slate-400 font-semibold">T.A. 2026/2027</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:col-span-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Kewajiban SPP</span>
            <span className="mt-1 block text-2xl font-black text-slate-900">
              {nominal ? formatRupiah(nominal) : "Lihat Rincian"}
            </span>
            <span className="block text-[11px] font-bold text-rose-700 mt-0.5">
              {bulanList.length > 0 ? `(${bulanList.join(", ")})` : "SPP Belum Lunas"}
            </span>
          </div>
        </div>

        {/* Box Rekening Resmi Pembayaran */}
        <div className="relative mx-auto mt-6 max-w-xl overflow-hidden rounded-2xl bg-slate-900 p-5 text-left text-white shadow-xl sm:p-6">
          <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-10" aria-hidden="true">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                Rekening Resmi SPP Al-Imam
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-white/90">
                {REKENING_ALIMAM.bankLengkap}
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-2xl font-black tracking-wider text-white sm:text-3xl">
                  {REKENING_ALIMAM.nomor}
                </div>
                <div className="mt-1 text-xs text-slate-300 font-medium">
                  Atas Nama: <strong className="text-white">{REKENING_ALIMAM.atasNama}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={copyRekening}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-white/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copied ? "Tersalin!" : "Salin Rekening"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hubungi Finance Al-Imam (085111403331) */}
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border-2 border-emerald-400/90 bg-gradient-to-r from-emerald-50 via-teal-50/80 to-emerald-50 p-5 text-left shadow-lg shadow-emerald-950/5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0 rounded-2xl bg-emerald-600 p-3 text-white shadow-md">
              <PhoneCall size={26} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-200 px-3 py-0.5 text-[11px] font-black text-emerald-950">
                <span>Sudah Transfer tapi Akun Masih Terkunci?</span>
              </div>
              <h3 className="text-base font-black leading-snug text-emerald-950">
                Hubungi Finance ({FINANCE_PHONE_DISPLAY}) dengan Bukti Transfer
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900/90">
                Bila Bapak/Ibu Wali Santri <strong>sudah melakukan transfer pelunasan SPP</strong> namun akun masih terkunci, silakan kirimkan foto/bukti transfer ke nomor WhatsApp Finance di bawah ini agar segera diverifikasi dan dibukakan aksesnya.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-stretch gap-2.5 border-t border-emerald-200/80 pt-4 sm:flex-row sm:items-center">
            <a
              href={`https://wa.me/${FINANCE_WA}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span>Kirim Bukti ke WhatsApp Finance</span>
            </a>
            {onOpenKonfirmasiModal ? (
              <button
                type="button"
                onClick={onOpenKonfirmasiModal}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm transition-colors hover:bg-slate-50"
              >
                <CreditCard size={16} aria-hidden="true" />
                <span>Upload Bukti di Web</span>
              </button>
            ) : (
              <Link
                href={`/wali/spp?santri_id=${santriId}`}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm transition-colors hover:bg-slate-50"
              >
                <CreditCard size={16} aria-hidden="true" />
                <span>Buka Menu SPP</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tombol Navigasi Penutup */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200/80 pt-6">
          <Link
            href={`/wali/spp?santri_id=${santriId}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#550000] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#7a0000] transition-colors"
          >
            <CreditCard size={15} />
            <span>Lihat Rincian Riwayat SPP 12 Bulan &rarr;</span>
          </Link>
          <Link
            href="/wali"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
