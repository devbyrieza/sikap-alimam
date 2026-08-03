"use client";

import React, { useEffect } from "react";
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Target,
  FileText,
  MessageSquare,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface JurnalDetailData {
  id: string;
  tanggal: string;
  asatidz: string;
  asatidz_foto?: string | null;
  mapel: string;
  mapel_kategori?: string | null;
  kelas: string;
  kelas_jenjang?: string | null;
  jam_ke: string;
  materi: string;
  learning_outcome?: string | null;
  kegiatan: string;
  catatan?: string | null;
}

interface JurnalDetailModalProps {
  jurnal: JurnalDetailData | null;
  onClose: () => void;
}

function formatTanggalLengkap(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JurnalDetailModal({ jurnal, onClose }: JurnalDetailModalProps) {
  // Lock background body scroll when modal is open
  useEffect(() => {
    if (jurnal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [jurnal]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!jurnal) return null;

  const namaMapelBersih = jurnal.mapel.replace(/^\[.*?\]\s*/, "");
  const formattedLO = jurnal.learning_outcome || jurnal.materi || "Santri memahami dan menguasai kompetensi dasar materi dengan baik.";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div 
        className="relative z-10 bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER BANNER (PLATINUM PPDB GRADIENT) ── */}
        <div 
          className="p-5 sm:p-7 text-white relative overflow-hidden shrink-0 shadow-lg shadow-primary/20"
          style={{ background: "linear-gradient(135deg, #9b1b22 0%, #7e141a 50%, #4a080d 100%)" }}
        >
          {/* Mobile Pull Handle Indicator */}
          <div className="sm:hidden w-full pb-4 flex justify-center">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Watermark Background Graphic */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none text-white">
            <BookOpen size={160} />
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 active:scale-95 z-20"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 space-y-3.5 pr-10 sm:pr-12">
            {/* Badges Pill Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border border-white/25">
                <Sparkles size={12} className="text-amber-300" />
                <span>Jurnal KBM Harian</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-bold">
                <CheckCircle2 size={12} className="text-emerald-300" />
                <span>Terverifikasi</span>
              </span>
            </div>

            {/* Mata Pelajaran Title */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                {namaMapelBersih}
              </h2>
              <div className="flex items-center gap-2 text-white/95 text-xs sm:text-sm font-medium">
                <Calendar size={14} className="text-white/85 shrink-0" />
                <span>{formatTanggalLengkap(jurnal.tanggal)}</span>
              </div>
            </div>

            {/* Teacher Info Card in Header */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <div 
                className="w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center border border-white/30 shrink-0 shadow-inner"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                {jurnal.asatidz.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-white/75 font-semibold uppercase tracking-wider">Guru Pengampu</div>
                <div className="text-xs sm:text-sm font-bold text-white leading-none mt-0.5">
                  {jurnal.asatidz}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── METADATA STRIP (KELAS, JAM KE) ── */}
        <div className="bg-slate-50 px-5 sm:px-7 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 text-slate-800 shadow-sm flex items-center gap-1.5">
              <GraduationCap size={15} style={{ color: "#9b1b22" }} />
              <span>Kelas: <b>{jurnal.kelas}</b></span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/60 text-slate-800 shadow-sm flex items-center gap-1.5">
              <Clock size={14} style={{ color: "#9b1b22" }} />
              <span>Jam Ke: <b>{jurnal.jam_ke}</b></span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Pesantren Al-Imam Al-Islami
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT BODY ── */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 sm:space-y-5 flex-1 bg-slate-50/40 overscroll-contain">
          
          {/* SECTION 1: TOPIK MATERI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm border-l-4 border-l-[#9b1b22] hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#9b1b22] mb-3">
              <div className="p-1.5 rounded-lg bg-[#9b1b22]/10 text-[#9b1b22]">
                <BookOpen size={15} />
              </div>
              <span>Topik & Materi Pembelajaran</span>
            </div>
            <div className="text-slate-900 font-extrabold text-base leading-relaxed">
              {jurnal.materi || "-"}
            </div>
          </div>

          {/* SECTION 2: TUJUAN PEMBELAJARAN (LEARNING OBJECTIVE) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700">
                <Target size={15} />
              </div>
              <span>Tujuan Pembelajaran (Learning Objective)</span>
            </div>
            <div className="text-emerald-950 font-semibold text-xs sm:text-sm leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-200/40 shadow-sm">
              {formattedLO}
            </div>
          </div>

          {/* SECTION 3: AKTIVITAS & KEGIATAN BELAJAR MENGAJAR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm border-l-4 border-l-sky-500">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
              <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                <FileText size={15} />
              </div>
              <span>Aktivitas & Langkah Pembelajaran di Kelas</span>
            </div>
            <div className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 font-normal">
              {jurnal.kegiatan || "Guru menyampaikan penjelasan materi secara interaktif, tanya jawab santri, dan evaluasi pemahaman di kelas."}
            </div>
          </div>

          {/* SECTION 4: CATATAN KHUSUS & EVALUASI GURU */}
          {jurnal.catatan && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60 shadow-sm border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800">
                  <MessageSquare size={15} />
                </div>
                <span>Catatan Khusus / Evaluasi Guru</span>
              </div>
              <div className="text-amber-950 text-xs sm:text-sm leading-relaxed bg-white/90 p-3.5 rounded-xl border border-amber-200/40 shadow-sm font-medium italic">
                &ldquo;{jurnal.catatan}&rdquo;
              </div>
            </div>
          )}

          {/* Transparansi Info Box */}
          <div className="p-3.5 rounded-2xl bg-slate-100/60 border border-slate-200/40 flex items-center justify-between text-[11px] text-slate-500">
            <span>ID Jurnal: <code className="font-mono text-slate-700">{jurnal.id.slice(0, 8)}</code></span>
            <span>Status: <b className="text-emerald-700">Terpublikasi Resmi</b></span>
          </div>
        </div>

        {/* ── MODAL FOOTER ACTION BAR ── */}
        <div className="bg-slate-50 px-5 sm:px-7 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="hidden sm:inline">Terverifikasi di SIAKAD Pesantren Al-Imam</span>
            <span className="sm:hidden">SIAKAD Al-Imam</span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
              boxShadow: "0 4px 14px rgba(155, 27, 34, 0.25)",
            }}
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
