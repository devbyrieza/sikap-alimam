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
  User,
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
  const formattedLO =
    jurnal.learning_outcome ||
    jurnal.materi ||
    "Santri memahami dan menguasai kompetensi dasar materi dengan baik.";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative z-10 bg-slate-50 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER BANNER (ELEGANT AL-IMAM CRIMSON) ── */}
        <div
          className="px-6 pt-5 pb-6 text-white relative overflow-hidden shrink-0"
          style={{
            background: "linear-gradient(135deg, #8B181E 0%, #681116 100%)",
          }}
        >
          {/* Mobile Pull Handle Indicator */}
          <div className="sm:hidden w-full pb-3 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* Background Decorative Watermark */}
          <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none text-white">
            <BookOpen size={140} />
          </div>

          {/* Top Bar inside Header: Category & Close */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/95 text-[11px] font-bold tracking-wide backdrop-blur-sm border border-white/20">
                <Sparkles size={12} className="text-amber-300" />
                <span>JURNAL KBM</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-100 border border-emerald-400/30 text-[11px] font-semibold">
                <CheckCircle2 size={12} className="text-emerald-300" />
                <span>Terverifikasi</span>
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup modal"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors active:scale-95 border border-white/15 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Title & Date */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
              {namaMapelBersih}
            </h2>
            <div className="flex items-center gap-1.5 text-white/85 text-xs sm:text-sm font-medium">
              <Calendar size={13} className="text-white/75 shrink-0" />
              <span>{formatTanggalLengkap(jurnal.tanggal)}</span>
            </div>
          </div>

          {/* Meta Chips in Header (Clean, Integrated & No Muddy Shadow) */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 text-white/90 font-medium">
              <GraduationCap size={14} className="text-amber-300" />
              <span>Kelas: <strong className="text-white font-bold">{jurnal.kelas}</strong></span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 text-white/90 font-medium">
              <Clock size={13} className="text-sky-300" />
              <span>Jam Ke: <strong className="text-white font-bold">{jurnal.jam_ke}</strong></span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 text-white/90 font-medium">
              <User size={13} className="text-emerald-300" />
              <span>Guru: <strong className="text-white font-bold">{jurnal.asatidz}</strong></span>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT BODY (AIRY, CLEAN & PROFESSIONAL) ── */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          
          {/* SECTION 1: TOPIK MATERI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <BookOpen size={14} className="text-[#8B181E]" />
              <span>Topik & Materi Pembelajaran</span>
            </div>
            <div className="text-slate-900 font-bold text-base sm:text-lg leading-relaxed pt-1">
              {jurnal.materi || "-"}
            </div>
          </div>

          {/* SECTION 2: TUJUAN PEMBELAJARAN (LEARNING OBJECTIVE) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Target size={14} className="text-emerald-600" />
              <span>Tujuan Pembelajaran (Learning Objective)</span>
            </div>
            <div className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/80">
              {formattedLO}
            </div>
          </div>

          {/* SECTION 3: AKTIVITAS & KEGIATAN BELAJAR MENGAJAR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <FileText size={14} className="text-sky-600" />
              <span>Aktivitas & Langkah Pembelajaran</span>
            </div>
            <div className="text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
              {jurnal.kegiatan ||
                "Guru menyampaikan penjelasan materi secara interaktif, tanya jawab santri, dan evaluasi pemahaman di kelas."}
            </div>
          </div>

          {/* SECTION 4: CATATAN KHUSUS & EVALUASI GURU */}
          {jurnal.catatan && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <MessageSquare size={14} className="text-amber-600" />
                <span>Catatan Khusus / Evaluasi Guru</span>
              </div>
              <div className="text-amber-950 text-xs sm:text-sm leading-relaxed bg-amber-50/60 p-3.5 rounded-xl border border-amber-100/80 font-medium italic">
                &ldquo;{jurnal.catatan}&rdquo;
              </div>
            </div>
          )}

          {/* Document Meta / Verification Info */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>ID Dokumen: <code className="font-mono text-slate-600">{jurnal.id.slice(0, 8)}</code></span>
            <span>Pesantren Al-Imam Al-Islami</span>
          </div>
        </div>

        {/* ── MODAL FOOTER ACTION BAR ── */}
        <div className="bg-white px-6 py-4 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>SIAKAD Al-Imam</span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "9px 24px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(139, 24, 30, 0.25)",
            }}
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
