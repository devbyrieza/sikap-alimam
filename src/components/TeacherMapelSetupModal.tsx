"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Save, Loader2, Edit3, X } from "lucide-react";
import MapelSelector from "@/components/MapelSelector";
import Swal from "sweetalert2";

interface TeacherMapelSetupModalProps {
  initialMapel?: string | null;
  needsSetup?: boolean;
  userName?: string;
  userRole?: string;
}

export default function TeacherMapelSetupModal({
  initialMapel = "",
  needsSetup = false,
  userName = "Ustadz",
  userRole = "guru",
}: TeacherMapelSetupModalProps) {
  const [isOpen, setIsOpen] = useState(needsSetup);
  const [isForced, setIsForced] = useState(needsSetup);
  const [mapelValue, setMapelValue] = useState(initialMapel || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (needsSetup) {
      setIsOpen(true);
      setIsForced(true);
    }
  }, [needsSetup]);

  // Listener untuk membuka modal dari tombol header / profile jika diinginkan
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      setIsForced(false);
    };
    window.addEventListener("open-teacher-mapel-modal", handleOpenModal);
    return () => window.removeEventListener("open-teacher-mapel-modal", handleOpenModal);
  }, []);

  const handleSave = async () => {
    if (!mapelValue || !mapelValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Pilih Minimal 1 Mata Pelajaran</span>",
        html: "<p style='color:#64748b; font-size:0.875rem'>Mohon centang jenjang, kelas, dan klik minimal satu mata pelajaran yang Anda ampu sebelum menyimpan.</p>",
        confirmButtonText: "Pilih Mapel",
        confirmButtonColor: "#3b0a0a",
        customClass: {
          popup: "rounded-3xl shadow-2xl p-6",
          confirmButton: "px-6 py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer",
        },
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mata_pelajaran: mapelValue }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsForced(false);
        setIsOpen(false);

        await Swal.fire({
          icon: "success",
          title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.25rem'>Penugasan Mapel Disimpan!</span>",
          html: `
            <div style='color:#64748b; font-size:0.875rem; text-align:left; margin-top:8px;'>
              <p>Jazakallahu Khairan, <b>${userName}</b>! Data penugasan mata pelajaran Anda telah berhasil diperbarui di sistem SIKAP.</p>
              <div style='margin-top:10px; padding:10px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; font-size:0.8rem; color:#334155;'>
                <b>Mapel Aktif:</b> ${mapelValue}
              </div>
            </div>
          `,
          confirmButtonText: "Mulai Gunakan SIKAP",
          confirmButtonColor: "#3b0a0a",
          customClass: {
            popup: "rounded-3xl shadow-2xl p-6",
            confirmButton: "px-8 py-3 rounded-2xl font-black text-sm shadow-lg cursor-pointer",
          },
          timer: 3000,
          timerProgressBar: true,
        });

        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Gagal Menyimpan</span>",
          html: `<p style='color:#64748b; font-size:0.875rem'>${data.error || "Terjadi kesalahan saat menyimpan data mapel."}</p>`,
          confirmButtonText: "Coba Lagi",
          confirmButtonColor: "#3b0a0a",
          customClass: {
            popup: "rounded-3xl shadow-2xl p-6",
            confirmButton: "px-6 py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer",
          },
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Kesalahan Jaringan</span>",
        html: "<p style='color:#64748b; font-size:0.875rem'>Gagal menghubungi server. Silakan periksa koneksi internet Anda.</p>",
        confirmButtonText: "Tutup",
        confirmButtonColor: "#3b0a0a",
        customClass: {
          popup: "rounded-3xl shadow-2xl p-6",
          confirmButton: "px-6 py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer",
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#3b0a0a] via-[#5c1313] to-[#801919] p-5 sm:p-6 text-white shrink-0 relative">
              {!isForced && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0 shadow-inner">
                  <BookOpen className="w-6 h-6 text-amber-300" />
                </div>
                <div className="pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                      {isForced ? "Wajib Dilengkapi" : "Pengaturan Mapel"}
                    </span>
                    <span className="text-xs text-amber-200/90 font-medium">
                      Ahlan wa Sahlan, {userName}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    Lengkapi Penugasan Jenjang, Kelas & Mata Pelajaran
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200/90 mt-1 leading-relaxed">
                    {isForced
                      ? "Data mata pelajaran yang Anda ampu belum terdaftar. Silakan tentukan jenjang, kelas, dan mapel yang Anda ajarkan di bawah ini agar fitur Jurnal Mengajar, Presensi Santri, Mutabaah, dan Penilaian dapat aktif."
                      : "Anda dapat memperbarui atau menambah mata pelajaran yang Anda ampu secara langsung di bawah ini."}
                  </p>
                </div>
              </div>
            </div>

            {/* Body Content (Mapel Selector) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <b>Petunjuk Cepat:</b> Centang jenjang mengajar Anda (<b>MTs</b> atau <b>IL</b>), lalu klik tombol-tombol mapel di bawahnya untuk mencentang mata pelajaran yang Anda ajar.
                </div>
              </div>

              {/* Selector */}
              <MapelSelector value={mapelValue} onChange={(v) => setMapelValue(v)} />
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Data langsung tersinkronisasi ke sistem SIKAP & SIMPEG induk.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {!isForced && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors w-full sm:w-auto cursor-pointer"
                  >
                    Batal
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !mapelValue.trim()}
                  className="px-7 py-2.5 rounded-xl bg-[#3b0a0a] hover:bg-[#5c1313] disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-[#3b0a0a]/20 transition-all hover:scale-[1.02] w-full sm:w-auto cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Data...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan & Aktifkan Fitur SIKAP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
