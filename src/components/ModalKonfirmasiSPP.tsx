"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageCircle,
  Calendar,
  Building2,
  User,
  Loader2,
  Sparkles
} from "lucide-react";
import Swal from "sweetalert2";

interface ModalKonfirmasiSPPProps {
  isOpen: boolean;
  onClose: () => void;
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriKelas: string;
  sppHistoryList?: any[];
  tunggakanBulan?: string[];
  totalNominalTunggakan?: number;
  onSuccess: () => void;
}

const NAMA_BULAN_MAP: Record<number, string> = {
  7: "Juli 2026",
  8: "Agustus 2026",
  9: "September 2026",
  10: "Oktober 2026",
  11: "November 2026",
  12: "Desember 2026",
  1: "Januari 2027",
  2: "Februari 2027",
  3: "Maret 2027",
  4: "April 2027",
  5: "Mei 2027",
  6: "Juni 2027"
};

const BULAN_TO_NUM: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

export default function ModalKonfirmasiSPP({
  isOpen,
  onClose,
  santriId,
  santriNama,
  santriNis,
  santriKelas,
  sppHistoryList,
  tunggakanBulan,
  totalNominalTunggakan,
  onSuccess
}: ModalKonfirmasiSPPProps) {
  const nominalDefault = 1000000;

  // Sinkronkan bulan-bulan tunggakan secara akurat
  const unpaidMonths = useMemo(() => {
    // 1. Prioritaskan tunggakanBulan (dari cekStatusSpp) jika tersedia
    if (Array.isArray(tunggakanBulan) && tunggakanBulan.length > 0) {
      return tunggakanBulan.map((bName) => {
        const cleanName = String(bName).toLowerCase().trim();
        const bNum = BULAN_TO_NUM[cleanName] || 10;
        return {
          bulan: bNum,
          tahun: bNum >= 7 ? 2026 : 2027,
          nominal: nominalDefault,
          status: "belum_lunas" as const,
        };
      });
    }

    // 2. Jika ada sppHistoryList, filter hanya bulan yang belum lunas / menunggu verifikasi
    if (Array.isArray(sppHistoryList) && sppHistoryList.length > 0) {
      const filtered = sppHistoryList.filter(
        (item) => item.status === "belum_lunas" || item.status === "menunggu_verifikasi"
      );
      if (filtered.length > 0) return filtered;
    }

    // 3. Default ke bulan berjalan jika tidak ada rincian
    return [{ bulan: 10, tahun: 2026, nominal: nominalDefault, status: "belum_lunas" as const }];
  }, [sppHistoryList, tunggakanBulan]);

  const [selectedBulan, setSelectedBulan] = useState<number[]>([]);
  const [bankPengirim, setBankPengirim] = useState("");
  const [namaRekening, setNamaRekening] = useState("");
  const [tanggalTransfer, setTanggalTransfer] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = useState("");
  const [buktiBase64, setBuktiBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedRek, setCopiedRek] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Default pilih otomatis seluruh bulan tunggakan yang tersinkron
  useEffect(() => {
    if (unpaidMonths.length > 0) {
      setSelectedBulan(unpaidMonths.map((m) => m.bulan));
    }
  }, [unpaidMonths]);

  // Mandatory Rule: Lock background scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Mandatory Rule: Form Autosave draft
  useEffect(() => {
    if (!isOpen) return;
    const draftKey = `sikap_konfirmasi_spp_${santriId}`;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bankPengirim) setBankPengirim(parsed.bankPengirim);
        if (parsed.namaRekening) setNamaRekening(parsed.namaRekening);
        if (parsed.catatan) setCatatan(parsed.catatan);
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen, santriId]);

  useEffect(() => {
    if (!isOpen) return;
    const draftKey = `sikap_konfirmasi_spp_${santriId}`;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ bankPengirim, namaRekening, catatan })
      );
    } catch (e) {
      // ignore
    }
  }, [isOpen, santriId, bankPengirim, namaRekening, catatan]);

  if (!isOpen) return null;

  const toggleBulan = (bulanNum: number) => {
    if (selectedBulan.includes(bulanNum)) {
      setSelectedBulan(selectedBulan.filter((b) => b !== bulanNum));
    } else {
      setSelectedBulan([...selectedBulan, bulanNum]);
    }
  };

  const totalNominal = selectedBulan.length * nominalDefault;

  const handleCopyRek = () => {
    navigator.clipboard.writeText("4222224441");
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File Terlalu Besar",
        text: "Maksimal ukuran foto struk transfer adalah 5MB."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setBuktiBase64(resultStr);
      setPreviewUrl(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedBulan.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Bulan",
        text: "Silakan pilih minimal 1 bulan SPP yang telah Anda transfer."
      });
      return;
    }

    if (!bankPengirim.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Bank Pengirim Wajib Diisi",
        text: "Contoh: BSI, BCA, Mandiri, BRI, Bank Muamalat, dll."
      });
      return;
    }

    if (!buktiBase64) {
      Swal.fire({
        icon: "warning",
        title: "Foto Bukti Transfer Wajib Dilampirkan",
        text: `Silakan lampirkan foto struk ATM, screenshot m-Banking, atau resi bukti transfer untuk pelunasan ${selectedBulan.length} bulan SPP ananda agar Admin Keuangan dapat memverifikasi.`,
        confirmButtonColor: "#550000"
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wali/konfirmasi-spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: santriId,
          bulan_list: selectedBulan,
          tahun: 2026,
          nominal_per_bulan: nominalDefault,
          bank_pengirim: bankPengirim,
          nama_rekening_pengirim: namaRekening,
          tanggal_transfer: tanggalTransfer,
          bukti_transfer: buktiBase64,
          catatan
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengirim konfirmasi");
      }

      // Bersihkan draft autosave
      try {
        localStorage.removeItem(`sikap_konfirmasi_spp_${santriId}`);
      } catch (e) {}

      Swal.fire({
        icon: "success",
        title: "Konfirmasi Berhasil Terkirim!",
        html: `
          <div style="font-size: 13px; text-align: left; line-height: 1.6; color: #334155;">
            <p>Alhamdulillah! Konfirmasi transfer sebesar <strong>Rp ${totalNominal.toLocaleString(
              "id-ID"
            )}</strong> telah dicatat ke sistem.</p>
            <p style="margin-top: 8px;">Status di akun ananda kini berubah menjadi <strong>"Sedang Diverifikasi"</strong>.</p>
            <p style="margin-top: 8px; color: #047857;">Sistem akan membuka WhatsApp Admin Keuangan untuk meneruskan rincian dan bukti transfer secara langsung.</p>
          </div>
        `,
        confirmButtonText: "Buka WhatsApp Admin Keuangan",
        confirmButtonColor: "#059669",
        showCancelButton: true,
        cancelButtonText: "Selesai (Nanti Saja)"
      }).then((result) => {
        if (result.isConfirmed && json.wa_url) {
          window.open(json.wa_url, "_blank");
        }
        onSuccess();
        onClose();
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim",
        text: err.message || "Terjadi kendala jaringan."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain custom-scrollbar animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          className="p-5 sm:p-6 relative text-white"
          style={{
            background: "linear-gradient(135deg, #550000 0%, #7a0000 50%, #3a0000 100%)",
            backgroundColor: "#550000",
            color: "#ffffff",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-rose-100 mb-2">
            <CreditCard size={14} />
            <span>Konfirmasi Pembayaran Mandiri</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Konfirmasi Transfer SPP Santri
          </h3>
          <p className="text-xs text-rose-100/90 mt-1">
            Ananda: <strong>{santriNama}</strong> &bull; NIS: {santriNis} &bull; Kelas: {santriKelas}
          </p>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Rekening Tujuan Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-700" />
                <span className="font-extrabold text-emerald-950 uppercase tracking-wide text-[11px]">
                  Rekening Resmi Pesantren Al-Imam
                </span>
              </div>
              <p className="font-black text-base text-emerald-900 mt-1 tracking-wider font-mono">
                BSI: 4222224441
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                a.n. PP Al Andalus Al Imam
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyRek}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 self-start sm:self-auto"
            >
              {copiedRek ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedRek ? "Tersalin!" : "Salin No. Rek"}</span>
            </button>
          </div>

          {/* Kotak Notifikasi Sinkronisasi Tunggakan Dinamis */}
          {unpaidMonths.length > 0 && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                unpaidMonths.length > 1
                  ? "bg-rose-50/90 border-rose-200 text-rose-950"
                  : "bg-amber-50/90 border-amber-200 text-amber-950"
              }`}
            >
              <AlertCircle
                size={18}
                className={`shrink-0 mt-0.5 ${
                  unpaidMonths.length > 1 ? "text-rose-600" : "text-amber-600"
                }`}
              />
              <div className="text-xs leading-relaxed">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider mb-1 ${
                    unpaidMonths.length > 1
                      ? "bg-rose-200 text-rose-900"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  Tunggakan Terdeteksi: {unpaidMonths.length} Bulan
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  {unpaidMonths.length === 1
                    ? `Kewajiban SPP ananda saat ini hanya untuk bulan ${
                        NAMA_BULAN_MAP[unpaidMonths[0].bulan] || `Bulan ${unpaidMonths[0].bulan}`
                      } (Rp ${nominalDefault.toLocaleString("id-ID")}).`
                    : `Kewajiban SPP ananda tercatat ${unpaidMonths.length} bulan: ${unpaidMonths
                        .map((m) => NAMA_BULAN_MAP[m.bulan] || `Bulan ${m.bulan}`)
                        .join(", ")} (Total Rp ${(unpaidMonths.length * nominalDefault).toLocaleString(
                        "id-ID"
                      )}).`}
                </p>
                <p className="mt-1 text-slate-600 text-[11px]">
                  {unpaidMonths.length === 1
                    ? `Silakan unggah bukti transfer khusus pembayaran SPP bulan ${
                        NAMA_BULAN_MAP[unpaidMonths[0].bulan] || `Bulan ${unpaidMonths[0].bulan}`
                      } di bawah ini.`
                    : `Seluruh ke-${unpaidMonths.length} bulan tunggakan telah dipilih otomatis di bawah. Silakan unggah bukti transfer pelunasan ke-${unpaidMonths.length} bulan tersebut agar akses portal ananda dapat langsung dibuka kembali.`}
                </p>
              </div>
            </div>
          )}

          {/* Pilihan Bulan yang Ditransfer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block text-xs">
                1. Pilih Bulan SPP yang Telah Ditransfer: <span className="text-rose-500">*</span>
              </label>
              {unpaidMonths.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedBulan(unpaidMonths.map((m) => m.bulan))}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Pilih Semua ({unpaidMonths.length} Bulan)
                </button>
              )}
            </div>

            {unpaidMonths.length === 0 ? (
              <p className="text-slate-400 italic">Tidak ada tunggakan tercatat.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {unpaidMonths.map((m) => {
                  const isChecked = selectedBulan.includes(m.bulan);
                  return (
                    <button
                      key={m.bulan}
                      type="button"
                      onClick={() => toggleBulan(m.bulan)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isChecked
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <span className="font-bold text-xs">
                        {NAMA_BULAN_MAP[m.bulan] || `Bulan ${m.bulan}`}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isChecked ? "text-rose-100" : "text-slate-500"
                        }`}
                      >
                        Rp {m.nominal.toLocaleString("id-ID")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedBulan.length < unpaidMonths.length && selectedBulan.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Anda memilih {selectedBulan.length} dari total {unpaidMonths.length} bulan tunggakan. Akses portal yang terkunci baru dapat dibuka secara otomatis setelah seluruh tunggakan dilunasi atau diverifikasi Bagian Keuangan.
                </span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Total yang Dikonfirmasi:</span>
              <span className="text-primary font-black text-sm">
                Rp {totalNominal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Info Bank Pengirim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                2. Nama Bank Pengirim: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bankPengirim}
                onChange={(e) => setBankPengirim(e.target.value)}
                placeholder="Misal: BSI, BCA, Mandiri, BRI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-xs transition-all"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                3. Atas Nama Pemilik Rekening:
              </label>
              <input
                type="text"
                value={namaRekening}
                onChange={(e) => setNamaRekening(e.target.value)}
                placeholder="Misal: Fulan bin Fulan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-xs transition-all"
              />
            </div>
          </div>

          {/* Tanggal Transfer */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              4. Tanggal Transfer: <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalTransfer}
              onChange={(e) => setTanggalTransfer(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-xs transition-all font-sans"
            />
          </div>

          {/* Upload Foto Struk Bukti Bayar (Wajib) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              5. Foto / Screenshot Bukti Transfer: <span className="text-rose-600 font-extrabold">* (Wajib Diunggah)</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl p-4 text-center bg-slate-50/70 transition-all">
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Pratinjau Struk"
                    className="max-h-40 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setBuktiBase64(null);
                    }}
                    className="text-[11px] text-rose-600 font-bold hover:underline"
                  >
                    Ganti Foto Bukti
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                  <span className="font-bold text-slate-700 text-xs block">
                    Pilih Foto Struk Bukti Transfer
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Format JPG, PNG, atau WebP (Maks. 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              6. Catatan Tambahan (Opsional):
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Titipan SPP ananda Abdul Aziz bulan Juli s/d Oktober via mobile banking..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none text-xs transition-all"
            />
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 w-full sm:w-auto transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mengirim Konfirmasi...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Kirim Konfirmasi &amp; Hubungi WA Keuangan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
