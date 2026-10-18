"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Lock,
  LogOut,
  MessageCircle,
  PhoneCall,
  ShieldOff,
} from "lucide-react";
import Swal from "sweetalert2";

const FINANCE_PHONE_DISPLAY = "085111403331";
const FINANCE_WA = "6285111403331";
const REKENING_ALIMAM = {
  bank: "BSI",
  bankLengkap: "BSI • Bank Syariah Indonesia",
  nomor: "4222224441",
  atasNama: "PP Al Andalus Al Imam",
};

export default function AksesDiblokirPage() {
  const [reason, setReason] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.spp_blocked_reason) setReason(d.user.spp_blocked_reason);
      })
      .catch(() => {});
  }, []);

  const copyRekening = async () => {
    try {
      await navigator.clipboard.writeText(REKENING_ALIMAM.nomor);
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
    `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam,\n\nSaya ingin mengonfirmasi bahwa saya telah melakukan transfer pembayaran SPP santri dan melampirkan bukti transfer terlampir. Mohon bantuannya untuk memverifikasi dan membukakan kembali akses akun portal SIKAP. Jazaakumullah khayran.`
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-slate-50 to-rose-100/50 p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-3xl border-2 border-rose-200/90 bg-white/95 p-6 sm:p-10 text-center shadow-2xl shadow-rose-950/10 backdrop-blur">
        {/* Ikon Gembok / Shield */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600 to-[#550000] text-white shadow-xl shadow-rose-950/20 ring-4 ring-rose-100">
          <ShieldOff size={40} className="stroke-[2.2]" />
        </div>

        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-rose-800">
          <Lock size={13} />
          <span>Akses SIKAP Dinonaktifkan</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kewajiban SPP Belum Diselesaikan
        </h1>

        {/* Description */}
        <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Akses portal SIKAP sementara dinonaktifkan karena terdapat kewajiban administrasi SPP yang belum diselesaikan.
        </p>

        {/* Reason badge */}
        {reason && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-left text-xs">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="font-semibold text-amber-900 leading-relaxed">{reason}</p>
          </div>
        )}

        {/* Box Rekening BSI */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-slate-900 p-5 text-left text-white shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-rose-300 mb-2">
            <span>Rekening Resmi Pembayaran SPP</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/90">{REKENING_ALIMAM.bankLengkap}</span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-2xl font-black tracking-wider text-white">{REKENING_ALIMAM.nomor}</div>
              <div className="text-xs text-slate-300 mt-0.5">a.n. <strong className="text-white">{REKENING_ALIMAM.atasNama}</strong></div>
            </div>
            <button
              type="button"
              onClick={copyRekening}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "Tersalin" : "Salin"}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left text-xs text-slate-600">
          <p className="font-bold text-slate-800 mb-1.5">Langkah Penyelesaian:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Lakukan transfer pembayaran SPP ke rekening BSI di atas.</li>
            <li>Simpan struk / bukti transfer pembayaran Anda.</li>
            <li>Kirimkan bukti transfer ke WhatsApp Finance resmi di bawah ini untuk aktivasi portal.</li>
          </ol>
        </div>

        {/* Contact button */}
        <div className="mt-6">
          <a
            href={`https://wa.me/${FINANCE_WA}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageCircle size={18} />
            <span>Hubungi Finance ({FINANCE_PHONE_DISPLAY}) via WhatsApp</span>
          </a>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS
        </p>

        {/* Logout link */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
          <a
            href="/api/auth/logout"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-700 transition-colors"
          >
            <LogOut size={13} />
            <span>Keluar dari Akun Ini</span>
          </a>
        </div>
      </div>
    </div>
  );
}
