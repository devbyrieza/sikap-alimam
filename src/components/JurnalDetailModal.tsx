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
  data?: JurnalDetailData | null;
  onClose: () => void;
  isOpen?: boolean;
  isAdminSuper?: boolean;
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

const JAM_WAKTU: Record<string, { mulai: string, selesai: string }> = {
  "1": { mulai: "05:40", selesai: "06:20" },
  "2": { mulai: "06:20", selesai: "07:00" },
  "3": { mulai: "07:00", selesai: "07:40" },
  "4": { mulai: "07:40", selesai: "08:20" },
  "5": { mulai: "08:20", selesai: "09:00" },
  "6": { mulai: "09:00", selesai: "09:40" },
  "7": { mulai: "09:40", selesai: "10:20" },
  "8": { mulai: "10:20", selesai: "11:00" },
  "9": { mulai: "11:00", selesai: "11:40" },
  "10": { mulai: "13:00", selesai: "13:40" },
  "11": { mulai: "13:40", selesai: "14:20" },
};

function getDurasiJam(jamStr: string) {
  if (!jamStr || jamStr === "-" || jamStr.toLowerCase() === "khusus") return "";
  const parts = jamStr.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const last = parts[parts.length - 1];

  const mulai = JAM_WAKTU[first]?.mulai;
  const selesai = JAM_WAKTU[last]?.selesai;
  const durasiJP = parts.length;

  if (mulai && selesai) {
    return ` (${mulai} - ${selesai} · ${durasiJP} Jam Pelajaran)`;
  }
  return ` (${durasiJP} Jam Pelajaran)`;
}

const HEADER_BG = "linear-gradient(145deg, #6e0b0b 0%, #550000 50%, #751414 100%)";

export default function JurnalDetailModal({ data, onClose, isOpen, isAdminSuper }: JurnalDetailModalProps) {
  const displayData = data;

  useEffect(() => {
    if (displayData || isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [displayData, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!displayData) return null;

  const namaMapelBersih = displayData.mapel.replace(/^\[.*?\]\s*/, "");
  const formattedLO =
    displayData.learning_outcome ||
    displayData.materi ||
    "Santri memahami dan menguasai kompetensi dasar materi dengan baik.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(2, 6, 23, 0.75)", backdropFilter: "blur(6px)" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: "92vh",
          borderRadius: "24px",
          background: "#ffffff",
          boxShadow: "0 20px 70px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Top Bar (Close button & sticky title indicator) */}
        <div
          style={{
            background: "linear-gradient(90deg, #800a0a 0%, #550000 100%)",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ddc192", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              Jurnal KBM
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {namaMapelBersih}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Modal Content Container (Header Banner + Body scroll together!) */}
        <div className="overflow-y-auto overscroll-contain flex-1 flex flex-col">
          {/* Header Banner */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ background: HEADER_BG, padding: "18px 24px 20px" }}
          >
            {/* Watermark */}
            <div
              className="pointer-events-none"
              style={{
                position: "absolute",
                right: -20,
                bottom: -20,
                opacity: 0.06,
              }}
            >
              <BookOpen size={140} color="white" />
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
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
                  padding: "4px 10px",
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

            {/* Title & Date */}
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.25,
                marginBottom: 4,
                letterSpacing: "-0.02em",
              }}
            >
              {namaMapelBersih}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              <Calendar size={14} style={{ color: "#ddc192", flexShrink: 0 }} />
              <span>{formatTanggalLengkap(displayData.tanggal)}</span>
            </div>

            {/* Meta Info Grid — Compact & Clean */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {/* Kelas & Jam */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 700 }}>
                  <GraduationCap size={15} style={{ color: "#fbbf24", flexShrink: 0 }} />
                  <span>Kelas <strong style={{ color: "#fff" }}>{displayData.kelas}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: 600 }}>
                  <Clock size={14} style={{ color: "#67e8f9", flexShrink: 0 }} />
                  <span>
                    Jam ke <strong style={{ color: "#fff" }}>{displayData.jam_ke}</strong>
                    <span style={{ color: "#ddc192", fontWeight: 700 }}>{getDurasiJam(displayData.jam_ke)}</span>
                  </span>
                </div>
              </div>

              {/* Guru Pengampu */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
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
                  {displayData.asatidz.charAt(0)}
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
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                    {displayData.asatidz}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════ BODY ═══════════════════ */}
          <div
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
              {displayData.materi || "-"}
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
              {displayData.kegiatan ||
                "Guru menyampaikan penjelasan materi secara interaktif, tanya jawab santri, dan evaluasi pemahaman di kelas."}
            </p>
          </div>

          {/* Section 4 — Catatan (conditional) */}
          {displayData.catatan && (
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
                &ldquo;{displayData.catatan}&rdquo;
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
                {displayData.id.slice(0, 8)}
              </code>
            </span>
            <span>Pesantren Al-Imam Al-Islami</span>
          </div>
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

          <div style={{ display: "flex", gap: 12 }}>
            <a
              href={`/jurnal/edit/${displayData.id}`}
              className="btn btn-secondary"
              style={{
                padding: "10px 24px",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              Edit Jurnal
            </a>
            
            {isAdminSuper && (
              <button
                onClick={() => {
                  import("sweetalert2").then(({ default: Swal }) => {
                    Swal.fire({
                      title: 'Hapus Jurnal?',
                      text: "Tindakan ini tidak dapat dibatalkan!",
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#3085d6',
                      confirmButtonText: 'Ya, Hapus!',
                      cancelButtonText: 'Batal'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        fetch(`/api/jurnal/${displayData.id}`, { method: 'DELETE' })
                          .then(res => res.json())
                          .then(res => {
                            if (res.error) throw new Error(res.error);
                            Swal.fire('Terhapus!', 'Data jurnal telah dihapus.', 'success').then(() => {
                              window.location.reload();
                            });
                          })
                          .catch(err => {
                            Swal.fire('Error', err.message || 'Gagal menghapus jurnal', 'error');
                          });
                      }
                    });
                  });
                }}
                className="btn"
                style={{
                  padding: "10px 24px",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca"
                }}
              >
                Hapus Jurnal
              </button>
            )}

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
    </div>
  );
}
