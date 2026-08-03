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

const HEADER_BG = "linear-gradient(145deg, #9b1b22 0%, #7e141a 60%, #4d0c10 100%)";

export default function JurnalDetailModal({ jurnal, onClose }: JurnalDetailModalProps) {
  useEffect(() => {
    if (jurnal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [jurnal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(2, 6, 23, 0.75)", backdropFilter: "blur(6px)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: "90vh",
          borderRadius: "28px 28px 0 0",
          background: "#ffffff",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ background: HEADER_BG, padding: "20px 24px 24px" }}
        >
          {/* Pull handle (mobile) */}
          <div className="flex justify-center mb-4">
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 99,
                background: "rgba(255,255,255,0.25)",
              }}
            />
          </div>

          {/* Watermark */}
          <div
            className="pointer-events-none"
            style={{
              position: "absolute",
              right: -20,
              bottom: -20,
              opacity: 0.07,
            }}
          >
            <BookOpen size={150} color="white" />
          </div>

          {/* Top row: badge + close */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={11} style={{ color: "#fbbf24" }} />
                Jurnal KBM Harian
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "rgba(34,197,94,0.2)",
                  border: "1px solid rgba(134,239,172,0.3)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#86efac",
                }}
              >
                <CheckCircle2 size={11} />
                Terverifikasi
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup modal"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Subject title */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {namaMapelBersih}
          </h2>

          {/* Date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            <Calendar size={14} style={{ color: "rgba(255,255,255,0.65)", flexShrink: 0 }} />
            <span>{formatTanggalLengkap(jurnal.tanggal)}</span>
          </div>

          {/* Meta chips — one per row for clarity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Kelas & Jam (same row — short values) */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <GraduationCap size={15} style={{ color: "#fbbf24", flexShrink: 0 }} />
                <span>
                  Kelas&nbsp;<strong style={{ color: "#fff" }}>{jurnal.kelas}</strong>
                </span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Clock size={14} style={{ color: "#67e8f9", flexShrink: 0 }} />
                <span>
                  Jam Ke&nbsp;<strong style={{ color: "#fff" }}>{jurnal.jam_ke}</strong>
                </span>
              </div>
            </div>

            {/* Guru — full width row so name is never cut off */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {jurnal.asatidz.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 2,
                  }}
                >
                  Guru Pengampu
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {jurnal.asatidz}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ BODY ═══════════════════ */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ flex: 1, padding: "20px 24px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Section 1 — Topik & Materi */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              padding: "18px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(155,27,34,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BookOpen size={16} style={{ color: "#9b1b22" }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#9b1b22",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Topik & Materi Pembelajaran
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {jurnal.materi || "-"}
            </p>
          </div>

          {/* Section 2 — Tujuan Pembelajaran */}
          <div
            style={{
              background: "#f0fdf4",
              borderRadius: 20,
              border: "1px solid #bbf7d0",
              padding: "18px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(22,163,74,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Target size={16} style={{ color: "#15803d" }} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#15803d",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Tujuan Pembelajaran (Learning Objective)
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#14532d",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {formattedLO}
            </p>
          </div>

          {/* Section 3 — Aktivitas */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              padding: "18px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "rgba(2,132,199,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={16} style={{ color: "#0369a1" }} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#0369a1",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Aktivitas & Langkah Pembelajaran
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#334155",
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {jurnal.kegiatan ||
                "Guru menyampaikan penjelasan materi secara interaktif, tanya jawab santri, dan evaluasi pemahaman di kelas."}
            </p>
          </div>

          {/* Section 4 — Catatan (conditional) */}
          {jurnal.catatan && (
            <div
              style={{
                background: "#fffbeb",
                borderRadius: 20,
                border: "1px solid #fde68a",
                padding: "18px 20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "rgba(217,119,6,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={16} style={{ color: "#b45309" }} />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#b45309",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Catatan Khusus / Evaluasi Guru
                </div>
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#78350f",
                  lineHeight: 1.65,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                &ldquo;{jurnal.catatan}&rdquo;
              </p>
            </div>
          )}

          {/* Document info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 4px",
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            <span>
              ID Dokumen:{" "}
              <code style={{ color: "#64748b", fontFamily: "monospace" }}>
                {jurnal.id.slice(0, 8)}
              </code>
            </span>
            <span>Pesantren Al-Imam Al-Islami</span>
          </div>
        </div>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <div
          style={{
            padding: "16px 24px",
            background: "#fff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#16a34a",
            }}
          >
            <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
            <span>SIAKAD Al-Imam</span>
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "10px 28px",
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 4px 16px rgba(155, 27, 34, 0.3)",
            }}
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
