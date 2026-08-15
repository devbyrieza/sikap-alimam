"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  BookHeart,
  Award,
  CalendarDays,
  Users,
  ChevronRight,
  FileText,
  CheckCircle2,
  BarChart3,
  Filter,
  ChevronDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface SantriMutabaah {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  kelas: string;
  kelompok_halaqoh: {
    id: string;
    nama: string;
    sesi: string;
    musyrif: string;
  } | null;
  last_ziyadah: {
    tanggal: string;
    sesi: string;
    surah: string;
    ayat_dari: number;
    ayat_ke: number;
    nilai_akhir: number;
  } | null;
  last_murojaah: {
    tanggal: string;
    sesi: string;
    surah: string;
    ayat_dari: number;
    ayat_ke: number;
    nilai_akhir: number;
  } | null;
  last_ujian: {
    tanggal: string;
    jenis: string;
    nilai_akhir: number;
    is_lulus: boolean;
  } | null;
}

function NilaiBadge({ nilai }: { nilai?: number | null }) {
  if (!nilai) return <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>;
  const cfg =
    nilai >= 90
      ? { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", label: "Sangat Baik" }
      : nilai >= 80
      ? { bg: "#eff6ff", color: "#0284c7", border: "#bfdbfe", label: "Baik" }
      : nilai >= 70
      ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Cukup" }
      : { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Kurang" };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: "2px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {nilai} · {cfg.label}
    </span>
  );
}

function formatTgl(isoStr?: string | null): string {
  if (!isoStr) return "";
  try {
    const parts = isoStr.split("T")[0].split("-");
    if (parts.length < 3) return isoStr;
    return `${parts[2]}/${parts[1]}`;
  } catch {
    return isoStr;
  }
}

export default function TahfidzMutabaahPage() {
  const [santriList, setSantriList] = useState<SantriMutabaah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");

  useEffect(() => {
    fetch("/api/tahfidz/mutabaah")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setSantriList(data); })
      .catch((err) => console.error("Gagal memuat mutabaah:", err))
      .finally(() => setLoading(false));
  }, []);

  const uniqueKelas = Array.from(
    new Set(santriList.map((s) => s.kelas).filter(Boolean))
  );

  const filteredSantri = santriList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(q) ||
      (s.nis && s.nis.includes(search)) ||
      (s.kelompok_halaqoh?.musyrif &&
        s.kelompok_halaqoh.musyrif.toLowerCase().includes(q));
    const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;
    return matchSearch && matchKelas;
  });

  const statCards = [
    {
      label: "Total Santri",
      value: santriList.length,
      suffix: "Santri",
      icon: <Users size={22} />,
      bg: "#ecfdf5",
      color: "#059669",
      border: "#d1fae5",
    },
    {
      label: "Berhalaqoh",
      value: santriList.filter((s) => s.kelompok_halaqoh).length,
      suffix: "Santri",
      icon: <BookHeart size={22} />,
      bg: "#eff6ff",
      color: "#0284c7",
      border: "#dbeafe",
    },
    {
      label: "Setoran Murojaah",
      value: santriList.filter((s) => s.last_murojaah).length,
      suffix: "Santri",
      icon: <CalendarDays size={22} />,
      bg: "#fffbeb",
      color: "#d97706",
      border: "#fde68a",
    },
    {
      label: "Lulus Ujian",
      value: santriList.filter((s) => s.last_ujian?.is_lulus).length,
      suffix: "Santri",
      icon: <TrendingUp size={22} />,
      bg: "#f5f3ff",
      color: "#7c3aed",
      border: "#ede9fe",
    },
  ];

  return (
    <div className="page-container">
      {/* ── HERO BANNER ── */}
      <div className="hero-banner">
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -30, width: 180, height: 180, background: "rgba(221,193,146,0.08)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.12)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
              <BookOpen size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Mutabaah Tahfidz Al-Qur'an
              </h1>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "4px 0 0", fontWeight: 500 }}>
                Rekapitulasi Ziyadah, Murojaah & Ujian Tahfidz Santri
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0, position: "relative", zIndex: 1 }}>
          <Link
            href="/halaqoh"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
              color: "white", textDecoration: "none", padding: "10px 18px",
              borderRadius: 14, fontSize: 13, fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.25)", whiteSpace: "nowrap",
            }}
          >
            <BookHeart size={16} /> Input Halaqoh Sesi
          </Link>
          <Link
            href="/halaqoh/ujian"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#f59e0b", color: "#451a03",
              textDecoration: "none", padding: "10px 18px",
              borderRadius: 14, fontSize: 13, fontWeight: 800,
              boxShadow: "0 4px 14px rgba(245,158,11,0.4)", whiteSpace: "nowrap",
            }}
          >
            <Award size={16} /> Ujian Pekanan
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: "white", borderRadius: 20, padding: "20px 22px",
            border: `1.5px solid ${s.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", gap: 16,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ width: 50, height: 50, background: s.bg, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{loading ? "..." : `${s.value} ${s.suffix}`}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div style={{
        background: "white", borderRadius: 20, padding: "18px 24px",
        border: "1.5px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: 240 }}>
          <Search size={17} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama santri, NIS, atau pengampu..."
            style={{
              width: "100%", padding: "11px 14px 11px 42px",
              borderRadius: 13, border: "1.5px solid #e2e8f0",
              fontSize: 13, fontWeight: 500, outline: "none",
              background: "#f8fafc", color: "#1e293b",
              transition: "border-color 0.2s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
            onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Kelas Filter */}
          <div style={{ position: "relative" }}>
            <Filter size={15} color="#64748b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              style={{
                padding: "11px 36px 11px 34px",
                borderRadius: 13, border: "1.5px solid #e2e8f0",
                fontSize: 13, fontWeight: 700, color: "#334155",
                background: "white", appearance: "none", cursor: "pointer", outline: "none",
              }}
            >
              <option value="all">Semua Kelas</option>
              {uniqueKelas.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>

          {/* Rekap Link */}
          <Link
            href="/halaqoh/rekap"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff5f5", color: "#550000", textDecoration: "none",
              padding: "11px 16px", borderRadius: 13, fontSize: 13,
              fontWeight: 700, border: "1.5px solid #fecaca", whiteSpace: "nowrap",
            }}
          >
            <BarChart3 size={16} /> Rekap & Laporan <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div style={{
        background: "white", borderRadius: 20,
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>
        {/* Table Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} color="#550000" /> Data Mutabaah Tahfidz
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: 10 }}>
            {loading ? "Memuat..." : `${filteredSantri.length} dari ${santriList.length} santri`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
            <BookOpen size={36} style={{ margin: "0 auto 12px", opacity: 0.4, display: "block" }} />
            <div style={{ fontWeight: 600 }}>Memuat data mutabaah tahfidz...</div>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div style={{ padding: 64, textAlign: "center" }}>
            <AlertCircle size={36} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#64748b", fontSize: 15, marginBottom: 4 }}>Data tidak ditemukan</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Coba ubah kata kunci pencarian atau filter kelas.</div>
          </div>
        ) : (
          <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 960 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["#", "Nama Santri / NIS", "Kelas", "Kelompok & Pengampu", "Ziyadah Terakhir", "Murojaah Terakhir", "Ujian Pekanan", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "13px 18px", textAlign: i === 7 ? "right" : "left",
                      fontSize: 11, fontWeight: 800, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSantri.map((s, idx) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                  >
                    <td style={{ padding: "14px 18px", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>{s.nama_lengkap}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>NIS: {s.nis || "—"}</div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {s.kelas ? (
                        <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700 }}>
                          {s.kelas}
                        </span>
                      ) : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {s.kelompok_halaqoh ? (
                        <>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12, display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                            <BookHeart size={13} color="#550000" /> {s.kelompok_halaqoh.nama}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            Pengampu: <strong style={{ color: "#334155" }}>{s.kelompok_halaqoh.musyrif}</strong>
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum diplot</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {s.last_ziyadah ? (
                        <>
                          <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4, fontSize: 12 }}>
                            QS. {s.last_ziyadah.surah} ({s.last_ziyadah.ayat_dari}–{s.last_ziyadah.ayat_ke})
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "1px 7px", borderRadius: 7 }}>{formatTgl(s.last_ziyadah.tanggal)}</span>
                            <NilaiBadge nilai={s.last_ziyadah.nilai_akhir} />
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ada setoran</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {s.last_murojaah ? (
                        <>
                          <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4, fontSize: 12 }}>
                            QS. {s.last_murojaah.surah} ({s.last_murojaah.ayat_dari}–{s.last_murojaah.ayat_ke})
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "1px 7px", borderRadius: 7 }}>{formatTgl(s.last_murojaah.tanggal)}</span>
                            <NilaiBadge nilai={s.last_murojaah.nilai_akhir} />
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ada setoran</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {s.last_ujian ? (
                        s.last_ujian.is_lulus ? (
                          <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <CheckCircle2 size={13} /> Lulus ({s.last_ujian.nilai_akhir})
                          </span>
                        ) : (
                          <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "4px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700 }}>
                            Mengulang ({s.last_ujian.nilai_akhir})
                          </span>
                        )
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ujian</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <Link
                        href={`/tahfidz/mutabaah/detail/${s.id}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#f1f5f9", color: "#334155",
                          textDecoration: "none", padding: "7px 13px",
                          borderRadius: 10, fontSize: 12, fontWeight: 700,
                          border: "1px solid #e2e8f0", transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#550000"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.border = "1px solid #550000"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLElement).style.color = "#334155"; (e.currentTarget as HTMLElement).style.border = "1px solid #e2e8f0"; }}
                      >
                        <FileText size={14} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
