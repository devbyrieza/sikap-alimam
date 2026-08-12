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
  Clock, 
  BarChart3,
  Filter
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

export default function TahfidzMutabaahPage() {
  const [santriList, setSantriList] = useState<SantriMutabaah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");

  useEffect(() => {
    fetch("/api/tahfidz/mutabaah")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSantriList(data);
      })
      .catch((err) => console.error("Gagal memuat mutabaah:", err))
      .finally(() => setLoading(false));
  }, []);

  const uniqueKelas = Array.from(new Set(santriList.map((s) => s.kelas).filter(Boolean)));

  const filteredSantri = santriList.filter((s) => {
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      (s.nis && s.nis.includes(search)) ||
      (s.kelompok_halaqoh?.musyrif && s.kelompok_halaqoh.musyrif.toLowerCase().includes(search.toLowerCase()));

    const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;

    return matchSearch && matchKelas;
  });

  const getNilaiBadge = (nilai?: number | null) => {
    if (!nilai) return <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ada setoran</span>;
    if (nilai >= 90) return <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Sangat Baik</span>;
    if (nilai >= 80) return <span style={{ background: "#eff6ff", color: "#0284c7", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Baik</span>;
    if (nilai >= 70) return <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Cukup</span>;
    return <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Perlu Bimbingan</span>;
  };

  const formatTgl = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const parts = isoStr.split("T")[0].split("-");
      if (parts.length < 3) return isoStr;
      return `${parts[2]}/${parts[1]}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "24px 20px", boxSizing: "border-box", fontFamily: "inherit" }}>

      {/* ─── PLATINUM HERO BANNER ────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 24,
        padding: "24px 28px",
        marginBottom: 24,
        color: "white",
        boxShadow: "0 10px 30px rgba(85, 0, 0, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: "1 1 300px" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 12, backdropFilter: "blur(10px)", flexShrink: 0 }}>
              <BookOpen size={28} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Mutabaah Tahfidz Al-Qur'an</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                Pusat Rekapitulasi Catatan Ziyadah, Murojaah, dan Ujian Tahfidz Santri Pesantren Al-Imam.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            <Link
              href="/halaqoh"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                color: "white", textDecoration: "none", padding: "10px 18px", borderRadius: 14,
                fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)",
                whiteSpace: "nowrap"
              }}
            >
              <BookHeart size={16} /> Input Halaqoh Sesi
            </Link>

            <Link
              href="/halaqoh/ujian"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#f59e0b", color: "#451a03", textDecoration: "none",
                padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 800,
                boxShadow: "0 4px 12px rgba(245,158,11,0.4)", whiteSpace: "nowrap"
              }}
            >
              <Award size={16} /> Ujian Pekanan
            </Link>
          </div>
        </div>
      </div>

      {/* ─── STATS SUMMARY GRID ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24, width: "100%" }}>
        <div style={{ background: "white", borderRadius: 18, padding: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: "#ecfdf5", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Total Santri Aktif</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{santriList.length} Santri</div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 18, padding: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: "#eff6ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7", flexShrink: 0 }}>
            <BookHeart size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Ber-Kelompok</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {santriList.filter(s => s.kelompok_halaqoh).length} Santri
            </div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 18, padding: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: "#fffbeb", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Setoran Murojaah</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {santriList.filter(s => s.last_murojaah).length} Santri
            </div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 18, padding: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, background: "#f5f3ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", flexShrink: 0 }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Lulus Ujian Pekanan</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {santriList.filter(s => s.last_ujian?.is_lulus).length} Santri
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ───────────────────────────────────── */}
      <div style={{
        background: "white", borderRadius: 18, padding: 18, marginBottom: 20,
        border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between",
        width: "100%"
      }}>

        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search size={18} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama santri, NIS, atau pengampu..."
            style={{
              width: "100%", padding: "10px 14px 10px 42px", borderRadius: 12,
              border: "1.5px solid #cbd5e1", fontSize: 13, outline: "none", background: "#f8fafc"
            }}
          />
        </div>

        {/* Filter Kelas */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} color="#64748b" />
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: 12, border: "1.5px solid #cbd5e1",
              fontSize: 13, outline: "none", background: "white", fontWeight: 600, color: "#334155"
            }}
          >
            <option value="all">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <Link
          href="/halaqoh/rekap"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "#550000", fontWeight: 700, fontSize: 13, textDecoration: "none"
          }}
        >
          <BarChart3 size={16} /> Lihat Rekap Lengkap & Cetak Laporan <ChevronRight size={14} />
        </Link>
      </div>

      {/* ─── REKAP MUTABAAH DATA TABLE (SIAKAD DENSITY + PPDB PLATINUM AESTHETICS) ─── */}
      <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
            <BookOpen size={32} style={{ animation: "pulse 1.5s infinite", margin: "0 auto 12px" }} />
            <div>Memuat data mutabaah tahfidz...</div>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
            Data mutabaah santri tidak ditemukan.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }} className="custom-scrollbar">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                  <th style={{ padding: "14px 18px", width: 50 }}>#</th>
                  <th style={{ padding: "14px 18px" }}>NAMA SANTRI / NIS</th>
                  <th style={{ padding: "14px 18px" }}>KELAS</th>
                  <th style={{ padding: "14px 18px" }}>KELOMPOK HALAQOH & PENGAMPU</th>
                  <th style={{ padding: "14px 18px" }}>SETORAN ZIYADAH TERAKHIR</th>
                  <th style={{ padding: "14px 18px" }}>SETORAN MUROJAAH TERAKHIR</th>
                  <th style={{ padding: "14px 18px" }}>UJIAN PEKANAN</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredSantri.map((s, idx) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <td style={{ padding: "14px 18px", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>
                    
                    {/* Santri Name & NIS */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{s.nama_lengkap}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>NIS: {s.nis || "-"}</div>
                    </td>

                    {/* Kelas Badge */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{
                        background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
                        padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700
                      }}>
                        {s.kelas}
                      </span>
                    </td>

                    {/* Kelompok & Pengampu */}
                    <td style={{ padding: "14px 18px" }}>
                      {s.kelompok_halaqoh ? (
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <BookHeart size={14} color="#550000" /> {s.kelompok_halaqoh.nama}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            Pengampu: <strong style={{ color: "#334155" }}>{s.kelompok_halaqoh.musyrif}</strong>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum diplot</span>
                      )}
                    </td>


                    {/* Ziyadah Terakhir */}
                    <td style={{ padding: "14px 18px" }}>
                      {s.last_ziyadah ? (
                        <div>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>
                            QS. {s.last_ziyadah.surah} ({s.last_ziyadah.ayat_dari}-{s.last_ziyadah.ayat_ke})
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{formatTgl(s.last_ziyadah.tanggal)}</span>
                            {getNilaiBadge(s.last_ziyadah.nilai_akhir)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ada setoran</span>
                      )}
                    </td>

                    {/* Murojaah Terakhir */}
                    <td style={{ padding: "14px 18px" }}>
                      {s.last_murojaah ? (
                        <div>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>
                            QS. {s.last_murojaah.surah} ({s.last_murojaah.ayat_dari}-{s.last_murojaah.ayat_ke})
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{formatTgl(s.last_murojaah.tanggal)}</span>
                            {getNilaiBadge(s.last_murojaah.nilai_akhir)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ada setoran</span>
                      )}
                    </td>

                    {/* Ujian Pekanan */}
                    <td style={{ padding: "14px 18px" }}>
                      {s.last_ujian ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {s.last_ujian.is_lulus ? (
                            <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={12} /> Lulus ({s.last_ujian.nilai_akhir})
                            </span>
                          ) : (
                            <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                              Mengulang ({s.last_ujian.nilai_akhir})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ujian</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <Link
                        href={`/tahfidz/mutabaah/detail/${s.id}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#f1f5f9", color: "#334155", textDecoration: "none",
                          padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                          border: "1px solid #cbd5e1", transition: "all 0.15s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                      >
                        <FileText size={14} /> Detail Riwayat
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
