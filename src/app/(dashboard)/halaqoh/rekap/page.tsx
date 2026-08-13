"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookHeart, ArrowLeft, Search, CalendarDays, Users, TrendingUp, Filter, Download, ChevronDown } from "lucide-react";
import Link from "next/link";

const SESI_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  subuh:   { label: "Subuh",   color: "#d97706", bg: "#fffbeb" },
  maghrib: { label: "Maghrib", color: "#7c3aed", bg: "#f5f3ff" },
  dhuha:   { label: "Dhuha",   color: "#0284c7", bg: "#eff6ff" },
};

const KEHADIRAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  hadir: { label: "Hadir", color: "#059669", bg: "#ecfdf5" },
  sakit: { label: "Sakit", color: "#d97706", bg: "#fffbeb" },
  izin:  { label: "Izin",  color: "#0284c7", bg: "#eff6ff" },
  alfa:  { label: "Alfa",  color: "#dc2626", bg: "#fef2f2" },
};

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
  nilai_sikap: number;
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
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.substring(0, 8) + "01";
  const [filterDari, setFilterDari] = useState(firstOfMonth);
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

  const filtered = catatan.filter(c =>
    filterSearch === "" ||
    c.santri.nama_lengkap.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.santri.nis || "").toLowerCase().includes(filterSearch.toLowerCase())
  );

  // Stats
  const totalHadir = filtered.filter(c => c.kehadiran === "hadir").length;
  const totalAlfa = filtered.filter(c => c.kehadiran === "alfa").length;
  const avgNilai = filtered.length > 0
    ? (filtered.reduce((a, c) => a + c.nilai_akhir, 0) / filtered.length).toFixed(1)
    : "-";
  const totalHalaman = filtered.reduce((a, c) => a + c.jumlah_halaman, 0).toFixed(1);

  const formatTanggal = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Back */}
      <Link href="/halaqoh" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
        <ArrowLeft size={14} /> Kembali ke Halaqoh
      </Link>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 20, padding: "22px 28px", marginBottom: 24, color: "white",
        boxShadow: "0 8px 32px rgba(85,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TrendingUp size={20} />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Rekap Catatan Halaqoh</h1>
        </div>
        <p style={{ margin: "6px 0 0 0", fontSize: 13, opacity: 0.75 }}>
          Riwayat & statistik setoran santri
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Catatan", value: filtered.length, color: "#550000", icon: <BookHeart size={18} /> },
          { label: "Hadir", value: totalHadir, color: "#059669", icon: <Users size={18} /> },
          { label: "Alfa", value: totalAlfa, color: "#dc2626", icon: <Users size={18} /> },
          { label: "Total Halaman", value: totalHalaman, color: "#0284c7", icon: <CalendarDays size={18} /> },
        ].map((s, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 16, padding: "16px 20px",
            border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
              </div>
              <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: "white", borderRadius: 18, padding: "18px 24px", marginBottom: 20,
        border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Dari Tanggal</label>
            <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Sampai Tanggal</label>
            <input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Kelompok</label>
            <select value={filterKelompok} onChange={e => setFilterKelompok(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "white", minWidth: 160 }}>
              <option value="">Semua Kelompok</option>
              {kelompokList.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kelompok}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Sesi</label>
            <select value={filterSesi} onChange={e => setFilterSesi(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "white" }}>
              <option value="">Semua Sesi</option>
              <option value="subuh">Subuh</option>
              <option value="maghrib">Maghrib</option>
              <option value="dhuha">Dhuha</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Cari Santri</label>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                placeholder="Nama atau NIS..."
                style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Tanggal", "Santri", "Sesi", "Jenis", "Bacaan", "Hlm.", "Kehadiran", "Sikap", "Bacaan", "Akhir"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Memuat catatan...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                    <BookHeart size={32} style={{ marginBottom: 10, opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
                    Belum ada catatan halaqoh
                  </td>
                </tr>
              ) : filtered.map((row, i) => {
                const sesi = SESI_BADGE[row.sesi] || SESI_BADGE.subuh;
                const had = KEHADIRAN_BADGE[row.kehadiran] || KEHADIRAN_BADGE.hadir;
                const nilaiColor = row.nilai_akhir >= 85 ? "#059669" : row.nilai_akhir >= 70 ? "#0284c7" : row.nilai_akhir >= 55 ? "#d97706" : "#dc2626";
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap", color: "#475569" }}>{formatTanggal(row.tanggal)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{row.santri.nama_lengkap}</div>
                      {row.santri.nis && <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.santri.nis}</div>}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: sesi.bg, color: sesi.color, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {sesi.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: row.jenis === "ziyadah" ? "#059669" : "#7c3aed", textTransform: "capitalize" }}>
                        {row.jenis}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>{row.surah_nama}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Ayat {row.ayat_dari}–{row.ayat_ke}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: "#0284c7" }}>{row.jumlah_halaman}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: had.bg, color: had.color, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        {had.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>{row.nilai_sikap}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>{row.nilai_bacaan}</td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: nilaiColor, background: nilaiColor + "15", padding: "4px 10px", borderRadius: 8 }}>
                        {row.nilai_akhir}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Menampilkan {filtered.length} catatan</span>
            <span>Rata-rata nilai: <strong style={{ color: "#550000" }}>{avgNilai}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
