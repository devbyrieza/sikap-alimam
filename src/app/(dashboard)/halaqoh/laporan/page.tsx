"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Printer, CalendarDays, Users, Award, FileText, Filter } from "lucide-react";
import Link from "next/link";

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
  kelas?: { nama: string };
}

export default function LaporanHalaqohPage() {
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [periode, setPeriode] = useState("pekanan");
  const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(() => new Date().getFullYear());
  const [pekanKe, setPekanKe] = useState(1);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/halaqoh/master").then(r => r.json()).then(d => {
      const dataSantri = d.santriAktif || d.santri || [];
      setAllSantri(dataSantri);
      if (dataSantri.length > 0) setSelectedSantriId(dataSantri[0].id);
    });
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedSantriId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        santri_id: selectedSantriId,
        bulan: String(bulan),
        tahun: String(tahun),
        pekan_ke: String(pekanKe),
        periode,
      });
      const res = await fetch(`/api/halaqoh/laporan?${params.toString()}`);
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [selectedSantriId, bulan, tahun, pekanKe, periode]);

  useEffect(() => { generateReport(); }, [generateReport]);

  const handlePrint = () => {
    window.print();
  };

  const selectedSantri = allSantri.find(s => s.id === selectedSantriId);
  const summary = report?.summary || report || {};

  const BULAN_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const selectStyle: React.CSSProperties = {
    width: "100%", borderRadius: 13, border: "1.5px solid #e2e8f0",
    padding: "11px 14px", fontSize: 13, fontWeight: 700, outline: "none",
    background: "#fdf8f0", color: "#1e293b", appearance: "none", cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 800, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
  };

  return (
    <div className="page-container">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-container { padding: 0 !important; max-width: 100% !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Hide on print */}
      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/halaqoh"
            style={{
              width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0",
              borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#475569", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
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
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Rekapitulasi &amp; Rapor</span>
            </div>
            <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
              <FileText size={26} color="#ddc192" /> Laporan &amp; Rekap Tahfidz
            </h1>
            <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: 14, margin: "6px 0 0" }}>
              Cetak Laporan Pekanan, Bulanan, &amp; Semesteran Santri
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <button
              onClick={handlePrint}
              style={{
                background: "#ddc192", color: "#550000", padding: "11px 22px",
                borderRadius: 14, border: "none", fontWeight: 800, fontSize: 14,
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              <Printer size={18} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* ── FILTER & PARAMETERS CARD ── */}
        <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", border: "1.5px solid #ebdcc3", boxShadow: "0 2px 12px rgba(85,0,0,0.03)" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#550000", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={18} color="#550000" /> Filter &amp; Parameter Laporan Santri
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {/* Santri */}
            <div>
              <label style={labelStyle}>Santri</label>
              <select value={selectedSantriId} onChange={e => setSelectedSantriId(e.target.value)} style={selectStyle}>
                {allSantri.map(s => (
                  <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.kelas?.nama || "—"})</option>
                ))}
              </select>
            </div>

            {/* Jenis Laporan */}
            <div>
              <label style={labelStyle}>Jenis Laporan</label>
              <select value={periode} onChange={e => setPeriode(e.target.value)} style={selectStyle}>
                <option value="pekanan">Laporan Pekanan</option>
                <option value="bulanan">Laporan Bulanan</option>
                <option value="semesteran">Laporan Semesteran</option>
              </select>
            </div>

            {/* Bulan & Tahun */}
            <div>
              <label style={labelStyle}>Bulan &amp; Tahun</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={{ ...selectStyle, flex: 2 }}>
                  {BULAN_NAMES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={{ ...selectStyle, flex: 1 }}>
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pekan Ke */}
            {periode === "pekanan" && (
              <div>
                <label style={labelStyle}>Pekan Ke-</label>
                <select value={pekanKe} onChange={e => setPekanKe(Number(e.target.value))} style={selectStyle}>
                  {[1, 2, 3, 4, 5].map(p => (
                    <option key={p} value={p}>Pekan {p} (Tgl {(p - 1) * 7 + 1}–{p * 7})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── REPORT PREVIEW (PRINT CONTAINER) ── */}
      <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginTop: 20 }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ fontWeight: 600 }}>Menyiapkan laporan capaian...</div>
          </div>
        ) : (
          <div>
            {/* Header Pesantren */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #550000", paddingBottom: 16, marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#550000", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PESANTREN AL-ANDALUS / AL-IMAM
              </h2>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "4px 0 0" }}>
                LAPORAN CAPAIAN TAHFIDZ &amp; KEHADIRAN HALAQOH
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontWeight: 600 }}>
                Periode: {periode.toUpperCase()} · {BULAN_NAMES[bulan - 1]} {tahun} {periode === "pekanan" ? `(Pekan ${pekanKe})` : ""}
              </p>
            </div>

            {/* Identitas Santri */}
            {selectedSantri && (
              <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "14px 20px", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 24 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Nama Santri</span>
                  <div style={{ fontWeight: 900, color: "#1e293b", fontSize: 16 }}>{selectedSantri.nama_lengkap}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>NIS / Kelas</span>
                  <div style={{ fontWeight: 800, color: "#550000", fontSize: 15 }}>
                    {selectedSantri.nis || "—"} · {selectedSantri.kelas?.nama || "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
              {/* Kehadiran */}
              <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Kehadiran</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#065f46" }}>{summary.total_hadir ?? 0} <span style={{ fontSize: 14, fontWeight: 600 }}>sesi</span></div>
                <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>Sakit: {summary.total_sakit ?? 0} · Izin: {summary.total_izin ?? 0} · Alfa: {summary.total_alfa ?? 0}</div>
              </div>

              {/* Total Capaian */}
              <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Total Capaian</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af" }}>{summary.total_halaman ?? 0} <span style={{ fontSize: 14, fontWeight: 600 }}>hal.</span></div>
                <div style={{ fontSize: 11, color: "#1d4ed8", marginTop: 4 }}>Mushaf Madinah</div>
              </div>

              {/* Rata Harian */}
              <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Rata Harian</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#92400e" }}>{summary.rata_harian ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>Nilai Bacaan + Kelancaran</div>
              </div>

              {/* Nilai Ujian */}
              <div style={{ background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Nilai Ujian</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#5b21b6" }}>{summary.nilai_ujian ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#6d28d9", marginTop: 4 }}>Ujian Pekanan Sabtu</div>
              </div>
            </div>

            {/* Estimasi Nilai Rapor */}
            <div style={{ background: "#550000", color: "white", borderRadius: 16, padding: "20px 24px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fcd34d" }}>ESTIMASI NILAI RAPORT TAHFIDZ</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Formula: (Rata Harian + Nilai Ujian) / 2</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "white" }}>
                {summary.estimasi_rapor ?? "—"}
              </div>
            </div>

            {/* Tanda Tangan */}
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginTop: 48, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Mengetahui,</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>Pengampu Halaqoh</div>
                <div style={{ marginTop: 56, fontWeight: 700, color: "#475569" }}>( ___________________ )</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Mengetahui,</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>Kabid Pengasuhan</div>
                <div style={{ marginTop: 56, fontWeight: 700, color: "#475569" }}>( ___________________ )</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
