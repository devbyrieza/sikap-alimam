"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookHeart, ArrowLeft, Search, CalendarDays, Users, TrendingUp, Filter, Download, ChevronDown, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

const SESI_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  subuh:   { label: "Subuh",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  maghrib: { label: "Maghrib", color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
  dhuha:   { label: "Dhuha",   color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" } };

const KEHADIRAN_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  hadir: { label: "Hadir", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  sakit: { label: "Sakit", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  izin:  { label: "Izin",  color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" },
  alfa:  { label: "Alfa",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" } };

interface CatatanRow {
  id: string;
  tanggal: string;
  sesi: string;
  jenis: string;
  surah_nama: string;
  surah_nama_arab: string;
  ayat_dari: number;
  ayat_ke: number;
  jumlah_halaman: number;
  kehadiran: string;
  alasan?: string;
  nilai_sikap: string;
  nilai_kelancaran: number;
  nilai_bacaan: number;
  nilai_akhir: number;
  catatan?: string;
  santri: { nama_lengkap: string; nis?: string };
  pegawai: { nama_lengkap: string };
}

interface Kelompok {
  id: string;
  nama_kelompok: string;
  sesi: string;
}

export default function HalaqohRekapPage() {
  const [catatan, setCatatan] = useState<CatatanRow[]>([]);
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const todayObj = new Date();
  const today = todayObj.toISOString().split("T")[0];
  
  // Default ke 7 hari yang lalu agar saat awal bulan data bulan lalu tetap terlihat
  const lastWeekObj = new Date(todayObj);
  lastWeekObj.setDate(lastWeekObj.getDate() - 7);
  const lastWeek = lastWeekObj.toISOString().split("T")[0];

  const [filterDari, setFilterDari] = useState(lastWeek);
  const [filterSampai, setFilterSampai] = useState(today);
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterSesi, setFilterSesi] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const fetchCatatan = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDari) params.set("dari", filterDari);
      if (filterSampai) params.set("sampai", filterSampai);
      if (filterKelompok) params.set("kelompok_id", filterKelompok);
      if (filterSesi) params.set("sesi", filterSesi);
      const res = await fetch(`/api/halaqoh/catatan?${params.toString()}`);
      const data = await res.json();
      setCatatan(Array.isArray(data) ? data : data.catatan || []);
    } finally {
      setLoading(false);
    }
  }, [filterDari, filterSampai, filterKelompok, filterSesi]);

  useEffect(() => {
    fetch("/api/halaqoh/kelompok")
      .then(r => r.json())
      .then(data => setKelompokList(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => { fetchCatatan(); }, [fetchCatatan]);

  const filteredCatatan = catatan.filter(c =>
    filterSearch === "" ||
    c.santri?.nama_lengkap.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.santri?.nis || "").includes(filterSearch)
  );

  const totalHalaman = filteredCatatan.reduce((acc, c) => acc + (c.jumlah_halaman || 0), 0);
  const totalHadir = filteredCatatan.filter(c => c.kehadiran === "hadir").length;
  const totalAlfa = filteredCatatan.filter(c => c.kehadiran === "alfa").length;

  const inputStyle: React.CSSProperties = {
    borderRadius: 13, border: "1.5px solid #e2e8f0",
    padding: "10px 14px", fontSize: 13, fontWeight: 600, outline: "none",
    background: "#fdf8f0", color: "#1e293b", width: "100%" };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 800, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 };

  return (
    <div className="page-container">
      {/* ── BACK BUTTON ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/halaqoh"
          style={{
            width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0",
            borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Kembali ke Halaqoh</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="hero-banner">
        <div style={{ position: "absolute", top: 0, right: 0, width: 256, height: 256, background: "rgba(221, 193, 146, 0.15)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(30%, -50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 192, height: 192, background: "rgba(221, 193, 146, 0.1)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(-25%, 50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(221, 193, 146, 0.18)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(221, 193, 146, 0.4)", width: "fit-content", marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ddc192", boxShadow: "0 0 6px rgba(221, 193, 146, 0.9)" }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Statistik &amp; History</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
            <TrendingUp size={26} color="#ddc192" /> Rekap Catatan Halaqoh
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: 14, margin: "6px 0 0" }}>
            Riwayat &amp; statistik setoran santri secara komprehensif
          </p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Catatan", value: filteredCatatan.length, icon: <BookHeart size={20} />, bg: "#fff5f5", color: "#550000", border: "#fecaca" },
          { label: "Hadir", value: totalHadir, icon: <CheckCircle2 size={20} />, bg: "#ecfdf5", color: "#059669", border: "#d1fae5" },
          { label: "Alfa", value: totalAlfa, icon: <AlertCircle size={20} />, bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
          { label: "Total Halaman", value: totalHalaman.toFixed(1), icon: <CalendarDays size={20} />, bg: "#eff6ff", color: "#0284c7", border: "#dbeafe" },
        ].map(card => (
          <div key={card.label} style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${card.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, background: card.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{loading ? "…" : card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR CARD ── */}
      <div style={{ background: "white", borderRadius: 20, padding: "20px 24px", border: "1.5px solid #ebdcc3", boxShadow: "0 2px 12px rgba(85,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#550000", display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} color="#550000" /> Filter Parameter Jurnal
          </div>
          {/* Quick Filters */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Bulan Ini", onClick: () => { const d = new Date(); setFilterDari(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]); setFilterSampai(d.toISOString().split("T")[0]); } },
              { label: "Pekan Ini", onClick: () => { const d = new Date(); const start = new Date(d); start.setDate(d.getDate() - d.getDay()); setFilterDari(start.toISOString().split("T")[0]); setFilterSampai(d.toISOString().split("T")[0]); } },
              { label: "7 Hari Terakhir", onClick: () => { const d = new Date(); const start = new Date(d); start.setDate(d.getDate() - 7); setFilterDari(start.toISOString().split("T")[0]); setFilterSampai(d.toISOString().split("T")[0]); } }
            ].map((qf, idx) => (
              <button
                key={idx}
                onClick={qf.onClick}
                style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 700,
                  background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0",
                  borderRadius: 8, cursor: "pointer", transition: "all 0.15s"
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; }}
              >
                {qf.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div>
            <label style={labelStyle}>Dari Tanggal</label>
            <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sampai Tanggal</label>
            <input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Kelompok</label>
            <select value={filterKelompok} onChange={e => setFilterKelompok(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="">Semua Kelompok</option>
              {kelompokList.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kelompok}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sesi</label>
            <select value={filterSesi} onChange={e => setFilterSesi(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="">Semua Sesi</option>
              <option value="subuh">Subuh</option>
              <option value="dhuha">Dhuha</option>
              <option value="maghrib">Ba'da Maghrib</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Cari Santri</label>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Nama atau NIS..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color="#550000" /> Riwayat Catatan Setoran
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: 9 }}>
            {filteredCatatan.length} rekaman
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ fontWeight: 600 }}>Memuat riwayat catatan...</div>
          </div>
        ) : filteredCatatan.length === 0 ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
            <BookHeart size={36} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Belum ada catatan halaqoh</div>
            <div style={{ fontSize: 12 }}>Ubah filter tanggal atau kelompok untuk melihat riwayat lain.</div>
          </div>
        ) : (
          <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Tanggal", "Santri", "Sesi", "Jenis", "Materi", "Hlm", "Kehadiran", "Lancar", "Bacaan", "Sikap", "Akhir"].map((h, i) => (
                    <th key={i} style={{
                      padding: "12px 14px",
                      textAlign: i >= 5 ? "center" : "left",
                      fontSize: 11, fontWeight: 800, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCatatan.map((c, i) => {
                  const sBadge = SESI_BADGE[c.sesi] || SESI_BADGE.subuh;
                  const kBadge = KEHADIRAN_BADGE[c.kehadiran] || KEHADIRAN_BADGE.hadir;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {c.tanggal?.split("T")[0]}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {c.santri?.nama_lengkap}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${sBadge.border}`, background: sBadge.bg, color: sBadge.color }}>
                          {sBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textTransform: "capitalize", fontWeight: 700, color: "#475569" }}>
                        {c.jenis}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b" }}>
                        {c.surah_nama} <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>({c.ayat_dari}–{c.ayat_ke})</span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#334155" }}>
                        {c.jumlah_halaman || 0}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${kBadge.border}`, background: kBadge.bg, color: kBadge.color }}>
                          {kBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#334155" }}>
                        {c.nilai_kelancaran || "—"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#334155" }}>
                        {c.nilai_bacaan || "—"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#334155" }}>
                        {c.nilai_sikap || "—"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 900, color: "#059669", fontSize: 14 }}>
                        {c.nilai_akhir || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
