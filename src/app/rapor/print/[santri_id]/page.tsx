"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowLeft, MessageCircle, AlertTriangle } from "lucide-react";
import RaporOfficialSheet from "@/components/RaporOfficialSheet";

export default function CetakRaporPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const semester = searchParams.get("semester") || "Ganjil";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!santriId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rapor/cetak?santri_id=${santriId}&semester=${semester}&tahun_ajaran=${encodeURIComponent(tahun_ajaran)}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch rapor data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [santriId, semester, tahun_ajaran]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="p-8 text-center bg-white rounded-2xl shadow-md border border-slate-200">
          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={32} />
          <p className="font-bold text-slate-700 text-sm">Memuat Rapor Resmi...</p>
        </div>
      </div>
    );
  }

  // Jika akses terkunci karena SPP
  if (data?.error === "SPP_TERKUNCI" || (data?.spp && !data.spp.lunas && data.spp.status !== "menunggu_verifikasi" && !data.spp.isUnlockedManual)) {
    const santriNama = data?.santri?.nama || "Santri";
    const santriNis = data?.santri?.nis || "-";
    const santriKelas = data?.santri?.kelas || "-";
    const waText = encodeURIComponent(
      `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam, saya wali santri dari:\n• Nama: ${santriNama}\n• NIS: ${santriNis}\n• Kelas: ${santriKelas}\n\nSaya telah mentransfer pembayaran SPP dan melampirkan bukti transfer terlampir. Mohon bantuannya untuk membukakan akses cetak lembar rapor SIKAP ananda. Jazaakumullah khayran.`
    );

    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-100 via-rose-50/40 to-slate-200 p-4 sm:p-6">
        <div className="max-w-xl w-full bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-rose-200/80 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-rose-600 to-rose-900 text-white flex items-center justify-center shadow-xl shadow-rose-950/20 mb-6">
            <Lock size={36} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider mb-3">
            <AlertTriangle size={14} />
            <span>Akses Cetak Rapor Terkunci</span>
          </div>

          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
            Kewajiban SPP Belum Terselesaikan
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            Afwan, lembar rapor resmi ananda <strong className="text-slate-800">{santriNama}</strong> ({santriKelas}) tidak dapat dicetak atau diunduh saat ini karena masih terdapat kewajiban administrasi SPP yang belum diselesaikan.
          </p>

          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl text-left mb-6 shadow-sm">
            <h4 className="font-extrabold text-emerald-950 text-sm mb-1">
              Sudah Membayar tapi Akun Masih Terkunci?
            </h4>
            <p className="text-emerald-900/90 text-xs leading-relaxed mb-4">
              Jika Anda telah mentransfer SPP namun akses cetak masih terkunci, silakan langsung menghubungi nomor WhatsApp <strong>Finance (085111403331)</strong> dengan mengirimkan bukti transfer agar dapat segera diverifikasi dan dibukakan aksesnya.
            </p>
            <a
              href={`https://wa.me/6285111403331?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle size={18} />
              <span>Hubungi Finance (085111403331) via WA</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-3">
            <a
              href="/wali"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Portal Wali</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="p-8 text-center bg-white rounded-2xl shadow-md border border-rose-200 text-rose-600 font-bold">
          Data rapor tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div id="rapor-print-container" className="min-h-dvh bg-slate-100/70 p-2 sm:p-8 print:p-0 print:m-0 print:min-h-0 print:bg-white overflow-x-hidden print:overflow-visible">
      <RaporOfficialSheet data={data} showPrintToolbar={true} />
    </div>
  );
}
