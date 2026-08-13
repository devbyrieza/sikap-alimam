"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ModuleTabs from "@/components/ModuleTabs";
import { ArrowRight, FileText, Loader2, ArrowLeft, ClipboardCheck, BarChart3, UserCheck, Users, Table2, AlertTriangle, PieChart } from "lucide-react";

type Kelas = { id: string; nama: string; jenjang: string | null };

interface SantriRekap {
  id: string;
  nama_lengkap: string;
  nis: string | null;
}

interface PresensiEntry {
  santri_id: string;
  tanggal: string; // "YYYY-MM-DD"
  status: string;
}

interface RekapData {
  santri: SantriRekap[];
  presensi: PresensiEntry[];
}

interface RekapSummary {
  summary: boolean;
  overall: { hadir: number; sakit: number; izin: number; alpha: number };
  perKelas: { nama: string; jenjang: string; hadir: number; sakit: number; izin: number; alpha: number }[];
  perJenjang: Record<string, { hadir: number; sakit: number; izin: number; alpha: number }>;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; short: string }> = {
  hadir: { bg: "#dcfce7", color: "#15803d", short: "H" },
  sakit: { bg: "#dbeafe", color: "#1d4ed8", short: "S" },
  izin:  { bg: "#fef3c7", color: "#d97706", short: "I" },
  alpha: { bg: "#fee2e2", color: "#b91c1c", short: "A" },
};

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function RekapPresensiSantriPage() {
  const now = new Date();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [rekapData, setRekapData] = useState<RekapData | RekapSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load kelas list
  useEffect(() => {
    fetch("/api/master")
      .then((r) => r.json())
      .then((data) => {
        setKelasList(data.kelas || []);
        setLoadingMaster(false);
      })
      .catch(() => setLoadingMaster(false));
  }, []);

  const fetchRekap = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRekapData(null);
    try {
      const url = selectedKelas 
        ? `/api/presensi/santri/rekap?kelas_id=${selectedKelas}&bulan=${bulan}&tahun=${tahun}`
        : `/api/presensi/santri/rekap?bulan=${bulan}&tahun=${tahun}`;
        
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat rekap");
      setRekapData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [selectedKelas, bulan, tahun]);

  useEffect(() => {
    fetchRekap();
  }, [selectedKelas, bulan, tahun, fetchRekap]);

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (santriId: string, day: number): string | null => {
    if (!rekapData || 'summary' in rekapData) return null;
    const dateStr = `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const found = rekapData.presensi.find(
      (p) => p.santri_id === santriId && p.tanggal === dateStr
    );
    return found ? found.status : null;
  };

  const getSummary = (santriId: string) => {
    const s = { H: 0, S: 0, I: 0, A: 0 };
    if (!rekapData || 'summary' in rekapData) return s;
    rekapData.presensi
      .filter((p) => p.santri_id === santriId)
      .forEach((p) => {
        const key = STATUS_COLORS[p.status]?.short as keyof typeof s;
        if (key) s[key]++;
      });
    return s;
  };

  const kelasNama = kelasList.find((k) => k.id === selectedKelas)?.nama;

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        {/* Decorative Elements */}
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Laporan & Rekapitulasi</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <BarChart3 size={26} color="#ddc192" /> Rekap Presensi Santri
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Rekapitulasi kehadiran harian bulanan santri per kelas & global
          </p>
        </div>
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
          { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
          { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
        ]}
      />

      {/* Filter Card */}
      <div style={{ background: "white", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} color="#ddc192" />
          Filter Rekapitulasi
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          {/* Kelas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas</label>
            {loadingMaster ? (
              <div style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                <Loader2 size={16} className="animate-spin text-amber-700" /> Memuat...
              </div>
            ) : (
              <select
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
              >
                <option value="">— Semua Kelas (Ringkasan Global) —</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}{k.jenjang ? ` (${k.jenjang})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bulan */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Bulan</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
            >
              {BULAN_NAMA.slice(1).map((b, i) => (
                <option key={i + 1} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tahun</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", background: "white", padding: "12px 20px", borderRadius: "14px", border: "1px solid #ebdcc3" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#550000" }}>Keterangan:</span>
        {Object.entries(STATUS_COLORS).map(([status, c]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: c.bg, color: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 11,
                border: `1px solid ${c.color}33`,
              }}
            >
              {c.short}
            </div>
            <span style={{ color: "#1a1a1a", textTransform: "capitalize" }}>{status}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <div
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: "#f8fafc", color: "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 11,
              border: "1px solid #e2e8f0",
            }}
          >
            ·
          </div>
          <span style={{ color: "#64748b" }}>Tidak ada data</span>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
        {/* Global Summary View */}
        {!selectedKelas && (
          rekapData && 'summary' in rekapData ? (
            <div style={{ padding: "28px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px 0", color: "#550000" }}>
                  Ringkasan Presensi Global ({BULAN_NAMA[bulan]} {tahun})
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Pilih spesifik kelas pada filter di atas untuk melihat rincian tanggal per individu santri.
                </p>
              </div>
              
              {/* Overall Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
                {Object.entries({
                  "Hadir": { val: rekapData.overall.hadir, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
                  "Sakit": { val: rekapData.overall.sakit, color: "#a16207", bg: "#fefce8", border: "#fef08a" },
                  "Izin": { val: rekapData.overall.izin, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
                  "Alpha": { val: rekapData.overall.alpha, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
                }).map(([label, info]) => {
                  const total = rekapData.overall.hadir + rekapData.overall.sakit + rekapData.overall.izin + rekapData.overall.alpha;
                  const pct = total > 0 ? Math.round((info.val / total) * 100) : 0;
                  return (
                    <div key={label} style={{ 
                      padding: "16px 14px", borderRadius: 16, background: info.bg, color: info.color,
                      border: `1px solid ${info.border}`, textAlign: "center"
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, marginBottom: 2 }}>Total {label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{info.val}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>{pct}% dari total presensi</div>
                    </div>
                  );
                })}
              </div>

              {/* Per Jenjang & Per Kelas */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                {/* Jenjang */}
                <div style={{ background: "#fdfcf9", padding: 20, borderRadius: 16, border: "1px solid #ebdcc3" }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: "#550000" }}>Persentase Kehadiran Per Jenjang</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {Object.entries(rekapData.perJenjang).map(([jenjang, stats]) => {
                      const total = stats.hadir + stats.sakit + stats.izin + stats.alpha;
                      const pctHadir = total > 0 ? (stats.hadir / total) * 100 : 0;
                      return (
                        <div key={jenjang}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
                            <span style={{ color: "#1a1a1a" }}>Jenjang {jenjang}</span>
                            <span style={{ color: "#550000" }}>{pctHadir.toFixed(1)}% Hadir</span>
                          </div>
                          <div style={{ width: "100%", height: 12, background: "#ebdcc3", borderRadius: 6, overflow: "hidden", display: "flex" }}>
                            <div style={{ width: `${pctHadir}%`, background: "#550000", transition: "width 1s ease-in-out" }} title={`Hadir: ${stats.hadir}`} />
                            {total > 0 && <div style={{ width: `${(stats.sakit / total) * 100}%`, background: "#eab308" }} title={`Sakit: ${stats.sakit}`} />}
                            {total > 0 && <div style={{ width: `${(stats.izin / total) * 100}%`, background: "#3b82f6" }} title={`Izin: ${stats.izin}`} />}
                            {total > 0 && <div style={{ width: `${(stats.alpha / total) * 100}%`, background: "#ef4444" }} title={`Alpha: ${stats.alpha}`} />}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(rekapData.perJenjang).length === 0 && (
                       <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "16px 0" }}>Belum ada data presensi</div>
                    )}
                  </div>
                </div>

                {/* Kelas */}
                <div style={{ background: "#fdfcf9", padding: 20, borderRadius: 16, border: "1px solid #ebdcc3", maxHeight: 400, overflowY: "auto" }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: "#550000", position: "sticky", top: -20, background: "#fdfcf9", padding: "10px 0 8px", zIndex: 10 }}>Kehadiran Per Kelas</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {rekapData.perKelas.sort((a, b) => a.nama.localeCompare(b.nama)).map((k) => {
                      const total = k.hadir + k.sakit + k.izin + k.alpha;
                      const pctHadir = total > 0 ? (k.hadir / total) * 100 : 0;
                      return (
                        <div key={k.nama}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
                            <span style={{ color: "#1a1a1a" }}>{k.nama} {k.jenjang ? `(${k.jenjang})` : ""}</span>
                            <span style={{ color: "#550000" }}>{pctHadir.toFixed(1)}% Hadir</span>
                          </div>
                          <div style={{ width: "100%", height: 12, background: "#ebdcc3", borderRadius: 6, overflow: "hidden", display: "flex" }}>
                            <div style={{ width: `${pctHadir}%`, background: "#550000", transition: "width 1s ease-in-out" }} title={`Hadir: ${k.hadir}`} />
                            {total > 0 && <div style={{ width: `${(k.sakit / total) * 100}%`, background: "#eab308" }} title={`Sakit: ${k.sakit}`} />}
                            {total > 0 && <div style={{ width: `${(k.izin / total) * 100}%`, background: "#3b82f6" }} title={`Izin: ${k.izin}`} />}
                            {total > 0 && <div style={{ width: `${(k.alpha / total) * 100}%`, background: "#ef4444" }} title={`Alpha: ${k.alpha}`} />}
                          </div>
                        </div>
                      );
                    })}
                    {rekapData.perKelas.length === 0 && (
                       <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "16px 0" }}>Belum ada data presensi</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            !loading && (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                <Users size={40} style={{ opacity: 0.3, color: "#ddc192", display: "block", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Pilih kelas terlebih dahulu untuk melihat rekap presensi.</p>
              </div>
            )
          )
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
            <Loader2
              size={32}
              className="animate-spin"
              style={{ margin: "0 auto 12px", display: "block", color: "#550000" }}
            />
            Memuat data presensi {BULAN_NAMA[bulan]} {tahun}...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: "center", padding: 32, color: "#b91c1c", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Table Data (Per Kelas) */}
        {!loading && !error && selectedKelas && rekapData && !('summary' in rekapData) && (
          <>
            {/* Header info */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f5ede1", background: "#fdfcf9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", marginBottom: "2px" }}>
                  Rekap Presensi · {kelasNama} · {BULAN_NAMA[bulan]} {tahun}
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Total { (rekapData as RekapData).santri.length } santri terdaftar
                </p>
              </div>
            </div>

            {/* Mobile scroll hint */}
            <div className="sm:hidden text-xs text-amber-900 bg-amber-50/95 border-b border-amber-200/80 px-4 py-2.5 flex items-center gap-2 font-medium">
              <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>Nama santri di kiri.</strong> Geser ke kanan untuk melihat tanggal 1-{days.length}.</span>
            </div>

            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ fontSize: 13, width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#fdf8f0" }}>
                    <th style={{ width: 40, textAlign: "center", position: "sticky", left: 0, background: "#fdf8f0", zIndex: 20, borderBottom: "1px solid #ebdcc3", padding: "12px 8px", color: "#550000", fontWeight: 800 }}>
                      #
                    </th>
                    <th style={{ minWidth: 170, maxWidth: 220, position: "sticky", left: 40, background: "#fdf8f0", zIndex: 20, borderBottom: "1px solid #ebdcc3", borderRight: "1px solid #ebdcc3", padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>
                      Nama Santri
                    </th>
                    {days.map((d) => (
                      <th key={d} style={{ textAlign: "center", minWidth: 32, padding: "10px 2px", borderBottom: "1px solid #ebdcc3", color: "#550000", fontWeight: 800 }}>
                        {d}
                      </th>
                    ))}
                    <th style={{ textAlign: "center", minWidth: 38, color: "#15803d", fontWeight: 800, borderBottom: "1px solid #ebdcc3", background: "#f0fdf4" }}>H</th>
                    <th style={{ textAlign: "center", minWidth: 38, color: "#a16207", fontWeight: 800, borderBottom: "1px solid #ebdcc3", background: "#fefce8" }}>S</th>
                    <th style={{ textAlign: "center", minWidth: 38, color: "#1d4ed8", fontWeight: 800, borderBottom: "1px solid #ebdcc3", background: "#eff6ff" }}>I</th>
                    <th style={{ textAlign: "center", minWidth: 38, color: "#b91c1c", fontWeight: 800, borderBottom: "1px solid #ebdcc3", background: "#fef2f2" }}>A</th>
                  </tr>
                </thead>
                <tbody>
                  {(rekapData as RekapData).santri.length === 0 ? (
                    <tr>
                      <td
                        colSpan={days.length + 6}
                        style={{ textAlign: "center", padding: 36, color: "#64748b" }}
                      >
                        Tidak ada data santri untuk kelas ini pada {BULAN_NAMA[bulan]} {tahun}
                      </td>
                    </tr>
                  ) : (
                    (rekapData as RekapData).santri.map((s, idx) => {
                      const summary = getSummary(s.id);
                      const bgRow = idx % 2 === 0 ? "#ffffff" : "#fdfcf9";
                      return (
                        <tr key={s.id} style={{ background: bgRow }}>
                          <td style={{ textAlign: "center", color: "#550000", fontWeight: 700, position: "sticky", left: 0, background: bgRow, zIndex: 10, borderBottom: "1px solid #f5ede1", padding: "12px 8px" }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: 800, position: "sticky", left: 40, background: bgRow, zIndex: 10, borderRight: "1px solid #ebdcc3", borderBottom: "1px solid #f5ede1", padding: "12px 16px" }}>
                            <div className="truncate" style={{ color: "#1a1a1a" }}>{s.nama_lengkap}</div>
                            {s.nis && (
                              <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                                NIS: {s.nis}
                              </span>
                            )}
                          </td>
                          {days.map((d) => {
                            const status = getStatus(s.id, d);
                            const sc = status ? STATUS_COLORS[status] : null;
                            return (
                              <td key={d} style={{ padding: "3px 2px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                                <div
                                  title={status ? `${d} ${BULAN_NAMA[bulan]}: ${status}` : "Tidak ada data"}
                                  style={{
                                    width: 24, height: 24, borderRadius: 6,
                                    background: sc ? sc.bg : "#f8fafc",
                                    color: sc ? sc.color : "#cbd5e1",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto",
                                    fontWeight: 800, fontSize: 10,
                                    border: sc ? `1px solid ${sc.color}44` : "1px solid #f1f5f9",
                                    cursor: "default",
                                  }}
                                >
                                  {sc ? sc.short : "·"}
                                </div>
                              </td>
                            );
                          })}
                          {/* Summary columns */}
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#15803d", borderBottom: "1px solid #f5ede1", background: idx % 2 === 0 ? "#f0fdf480" : "#f0fdf4" }}>{summary.H}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#a16207", borderBottom: "1px solid #f5ede1", background: idx % 2 === 0 ? "#fefce880" : "#fefce8" }}>{summary.S}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#1d4ed8", borderBottom: "1px solid #f5ede1", background: idx % 2 === 0 ? "#eff6ff80" : "#eff6ff" }}>{summary.I}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#b91c1c", borderBottom: "1px solid #f5ede1", background: idx % 2 === 0 ? "#fef2f280" : "#fef2f2" }}>{summary.A}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Summary Card below table */}
      {!loading && !error && selectedKelas && rekapData && !('summary' in rekapData) && (rekapData as RekapData).santri.length > 0 && (
        <div style={{ background: "white", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#550000", display: "flex", alignItems: "center", gap: 8 }}>
            <PieChart size={18} color="#ddc192" />
            Total Akumulasi Kehadiran Kelas {kelasNama}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
            {[
              { label: "Total Hadir", key: "H", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
              { label: "Total Sakit", key: "S", color: "#a16207", bg: "#fefce8", border: "#fef08a" },
              { label: "Total Izin", key: "I", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "Total Alpha", key: "A", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
            ].map(({ label, key, color, bg, border }) => {
              const total = (rekapData as RekapData).santri.reduce((sum, s) => {
                return sum + getSummary(s.id)[key as "H" | "S" | "I" | "A"];
              }, 0);
              return (
                <div
                  key={key}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: bg,
                    border: `1px solid ${border}`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>{total}</div>
                  <div style={{ fontSize: 12, color, fontWeight: 700 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
