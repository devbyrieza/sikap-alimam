"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Printer, CalendarDays, Users, Award, FileText, Filter } from "lucide-react";
import Link from "next/link";

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
  kelas?: string | { nama: string };
  kelompok_halaqoh?: {
    nama: string;
    musyrif: string;
  } | null;
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

  // Dynamic signature names & TTD Digital
  const [pengampuNama, setPengampuNama] = useState("Muhammad Iqbal, S.Pd");
  const [kabidNama, setKabidNama] = useState("Wahyudi Pranata, Lc");
  const [showDigitalSignature, setShowDigitalSignature] = useState(true);

  useEffect(() => {
    fetch("/api/tahfidz/mutabaah").then(r => r.json()).then(d => {
      const dataSantri = Array.isArray(d) ? d : [];
      setAllSantri(dataSantri);
      if (dataSantri.length > 0) {
        setSelectedSantriId(dataSantri[0].id);
        if (dataSantri[0].kelompok_halaqoh?.musyrif) {
          setPengampuNama(dataSantri[0].kelompok_halaqoh.musyrif);
        }
      }
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
              <select
                value={selectedSantriId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedSantriId(id);
                  const s = allSantri.find(item => item.id === id);
                  if (s?.kelompok_halaqoh?.musyrif) {
                    setPengampuNama(s.kelompok_halaqoh.musyrif);
                  }
                }}
                style={selectStyle}
              >
                {allSantri.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nama_lengkap} ({typeof s.kelas === "string" ? s.kelas : s.kelas?.nama || "—"})
                  </option>
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

          {/* Edit Nama TTD & Toggle */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, alignItems: "center" }}>
            <div>
              <label style={labelStyle}>Nama Pengampu Halaqoh (TTD)</label>
              <input
                type="text"
                value={pengampuNama}
                onChange={e => setPengampuNama(e.target.value)}
                style={{ ...selectStyle, background: "white" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Nama Kabid Pengasuhan (TTD)</label>
              <input
                type="text"
                value={kabidNama}
                onChange={e => setKabidNama(e.target.value)}
                style={{ ...selectStyle, background: "white" }}
              />
            </div>
            <div style={{ paddingTop: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#550000" }}>
                <input
                  type="checkbox"
                  checked={showDigitalSignature}
                  onChange={e => setShowDigitalSignature(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#550000" }}
                />
                Sertakan TTD Digital &amp; Stempel Pesantren
              </label>
            </div>
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
                    {selectedSantri.nis || "—"} · {typeof selectedSantri.kelas === "string" ? selectedSantri.kelas : selectedSantri.kelas?.nama || "—"}
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
                <div style={{ fontSize: 26, fontWeight: 900, color: "#92400e" }}>{summary.avg_nilai_harian ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>Nilai Bacaan + Kelancaran</div>
              </div>

              {/* Nilai Ujian */}
              <div style={{ background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Nilai Ujian</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#5b21b6" }}>{summary.ujian_pekanan_nilai || summary.nilai_ujian || "—"}</div>
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
                {summary.nilai_raport_estimasi ?? summary.estimasi_rapor ?? "—"}
              </div>
            </div>

            {/* Tanda Tangan & QR Code Verifikasi */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", textAlign: "center", marginTop: 40, paddingTop: 24, borderTop: "1.5px solid #e2e8f0", flexWrap: "wrap", gap: 24 }}>
              
              {/* QR Code Verifikasi Sah */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                {/* SVG QR Code Illustration */}
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}>
                  <rect width="100" height="100" rx="10" fill="white" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Outer corner blocks */}
                  <rect x="10" y="10" width="26" height="26" fill="#1e293b" rx="4" />
                  <rect x="14" y="14" width="18" height="18" fill="white" rx="2" />
                  <rect x="18" y="18" width="10" height="10" fill="#1e293b" rx="1" />
                  
                  <rect x="64" y="10" width="26" height="26" fill="#1e293b" rx="4" />
                  <rect x="68" y="14" width="18" height="18" fill="white" rx="2" />
                  <rect x="72" y="18" width="10" height="10" fill="#1e293b" rx="1" />
                  
                  <rect x="10" y="64" width="26" height="26" fill="#1e293b" rx="4" />
                  <rect x="14" y="68" width="18" height="18" fill="white" rx="2" />
                  <rect x="18" y="72" width="10" height="10" fill="#1e293b" rx="1" />
                  
                  {/* Data dots */}
                  <rect x="44" y="14" width="8" height="8" fill="#550000" rx="1" />
                  <rect x="44" y="28" width="8" height="8" fill="#1e293b" rx="1" />
                  <rect x="14" y="44" width="8" height="8" fill="#1e293b" rx="1" />
                  <rect x="28" y="44" width="8" height="8" fill="#550000" rx="1" />
                  <rect x="44" y="44" width="12" height="12" fill="#550000" rx="2" />
                  <rect x="64" y="44" width="8" height="8" fill="#1e293b" rx="1" />
                  <rect x="78" y="44" width="8" height="8" fill="#1e293b" rx="1" />
                  <rect x="44" y="64" width="8" height="8" fill="#1e293b" rx="1" />
                  <rect x="64" y="64" width="12" height="12" fill="#550000" rx="2" />
                  <rect x="80" y="78" width="8" height="8" fill="#1e293b" rx="1" />
                </svg>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#550000", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    ✓ Dokumen Sah &amp; Terverifikasi
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", margin: "2px 0" }}>
                    Scan QR Code untuk cek keaslian rapor di server resmi SIKAP
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "#94a3b8" }}>
                    ID: SIKAP-TAHFIDZ-{(selectedSantri?.id || "000").substring(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Pengampu TTD */}
              <div style={{ minWidth: 180, position: "relative" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Mengetahui,</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>Pengampu Halaqoh</div>
                
                <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {showDigitalSignature && (
                    <svg width="120" height="45" viewBox="0 0 200 70" fill="none" style={{ opacity: 0.85 }}>
                      <path d="M 20 40 C 40 10, 60 65, 80 30 C 100 5, 110 50, 130 25 C 150 45, 170 15, 185 40" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 35 48 C 65 38, 125 58, 165 42" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, textDecoration: "underline" }}>
                  {pengampuNama || "___________________"}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Musyrif Halaqoh</div>
              </div>

              {/* Kabid Pengasuhan & Stempel */}
              <div style={{ minWidth: 180, position: "relative" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Mengetahui,</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>Kabid Pengasuhan</div>
                
                <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {showDigitalSignature && (
                    <>
                      <svg width="120" height="45" viewBox="0 0 200 70" fill="none" style={{ opacity: 0.85, position: "relative", zIndex: 2 }}>
                        <path d="M 15 45 C 35 15, 55 55, 75 20 C 95 60, 125 10, 145 35 C 165 20, 175 50, 190 30" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 25 55 C 75 42, 135 48, 175 38" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" />
                      </svg>

                      {/* STEMPEL BASAH PESANTREN */}
                      <div
                        style={{
                          position: "absolute", left: -15, top: -5,
                          width: 74, height: 74, borderRadius: "50%",
                          border: "2px solid #991b1b", color: "#991b1b",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          transform: "rotate(-12deg)", opacity: 0.75, pointerEvents: "none", zIndex: 1,
                          fontSize: 6, fontWeight: 900, textTransform: "uppercase", textAlign: "center", padding: 2,
                        }}
                      >
                        <div style={{ fontSize: 5, borderBottom: "1px solid #991b1b", paddingBottom: 1, marginBottom: 1 }}>PESANTREN AL-IMAM</div>
                        <div style={{ fontSize: 6, fontWeight: 900, color: "#991b1b" }}>TERVERIFIKASI</div>
                        <div style={{ fontSize: 5, marginTop: 1 }}>DIGITAL STAMP</div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, textDecoration: "underline" }}>
                  {kabidNama || "___________________"}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Kabid Pengasuhan Pesantren</div>
              </div>
            </div>

            {/* Document Verification Footer */}
            {showDigitalSignature && (
              <div style={{ marginTop: 20, paddingTop: 10, borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#94a3b8" }}>
                <span>✓ Terverifikasi Digital oleh Sistem Informasi Pesantren Al-Imam (SIKAP)</span>
                <span>Dokumen Resmi Pesantren Al-Imam Al-Islami</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
