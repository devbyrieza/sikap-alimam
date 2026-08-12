"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookHeart, ArrowLeft, Printer, CalendarDays, Users, Award, CheckCircle2, TrendingUp, Filter, FileText } from "lucide-react";
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
      setAllSantri(d.santri || []);
      if (d.santri?.length > 0) setSelectedSantriId(d.santri[0].id);
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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Hide on print */}
      <div className="no-print">
        {/* Back */}
        <Link href="/halaqoh" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Kembali ke Halaqoh
        </Link>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          borderRadius: 20, padding: "22px 28px", marginBottom: 24, color: "white",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <FileText size={22} />
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Laporan & Rekap Tahfidz</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Cetak Laporan Pekanan, Bulanan, & Semesteran Santri
            </p>
          </div>
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "#550000", color: "white",
              border: "none", borderRadius: 12, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13
            }}
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: "white", borderRadius: 18, padding: 20, marginBottom: 24,
          border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Santri</label>
              <select value={selectedSantriId} onChange={e => setSelectedSantriId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "white" }}>
                {allSantri.map(s => (
                  <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.kelas?.nama})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Jenis Laporan</label>
              <select value={periode} onChange={e => setPeriode(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "white" }}>
                <option value="pekanan">Laporan Pekanan</option>
                <option value="bulanan">Laporan Bulanan</option>
                <option value="semesteran">Laporan Semester</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Bulan & Tahun</label>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={bulan} onChange={e => setBulan(Number(e.target.value))}
                  style={{ width: "100%", padding: "9px 8px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, background: "white" }}>
                  {BULAN_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={tahun} onChange={e => setTahun(Number(e.target.value))}
                  style={{ padding: "9px 8px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, background: "white" }}>
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {periode === "pekanan" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Pekan Ke-</label>
                <select value={pekanKe} onChange={e => setPekanKe(Number(e.target.value))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, background: "white" }}>
                  <option value={1}>Pekan 1 (Tgl 1–7)</option>
                  <option value={2}>Pekan 2 (Tgl 8–14)</option>
                  <option value={3}>Pekan 3 (Tgl 15–21)</option>
                  <option value={4}>Pekan 4 (Tgl 22–Akhir)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Paper View (Printable) */}
      <div style={{
        background: "white", border: "2px solid #e2e8f0", borderRadius: 20, padding: 36,
        boxShadow: "0 8px 30px rgba(0,0,0,0.06)", position: "relative"
      }}>
        {/* Kop Surat Header */}
        <div style={{ textAlign: "center", borderBottom: "3px double #550000", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#550000", letterSpacing: "0.05em" }}>
            PESANTREN AL-ANDALUS / AL-IMAM
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
            LAPORAN CAPAIAN TAHFIDZ & KEHADIRAN HALAQOH
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Periode: {periode.toUpperCase()} · {BULAN_NAMES[bulan - 1]} {tahun} {periode === "pekanan" ? `(Pekan ${pekanKe})` : ""}
          </div>
        </div>

        {/* Identitas Santri */}
        <div style={{
          background: "#f8fafc", borderRadius: 14, padding: "16px 20px", marginBottom: 24,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13
        }}>
          <div>
            <span style={{ color: "#64748b" }}>Nama Santri: </span>
            <strong style={{ color: "#1e293b" }}>{selectedSantri?.nama_lengkap || "—"}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b" }}>NIS / Kelas: </span>
            <strong style={{ color: "#1e293b" }}>{selectedSantri?.nis || "—"} · {selectedSantri?.kelas?.nama || "—"}</strong>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Memuat data laporan...</div>
        ) : report ? (
          <div>
            {/* Grid 4 Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>KEHADIRAN</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#065f46", marginTop: 4 }}>
                  {summary.total_hadir || 0} <span style={{ fontSize: 12, fontWeight: 500 }}>sesi</span>
                </div>
                <div style={{ fontSize: 10, color: "#047857", marginTop: 2 }}>Sakit: {summary.total_sakit || 0} · Izin: {summary.total_izin || 0} · Alfa: {summary.total_alfa || 0}</div>
              </div>

              <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0284c7" }}>TOTAL CAPAIAN</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0369a1", marginTop: 4 }}>
                  {summary.total_halaman || 0} <span style={{ fontSize: 12, fontWeight: 500 }}>hal.</span>
                </div>
                <div style={{ fontSize: 10, color: "#0284c7", marginTop: 2 }}>Mushaf Madinah</div>
              </div>

              <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>RATA HARIAN</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#b45309", marginTop: 4 }}>
                  {summary.avg_nilai_harian || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#d97706", marginTop: 2 }}>Nilai Sikap + Bacaan</div>
              </div>

              <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>NILAI UJIAN</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#6d28d9", marginTop: 4 }}>
                  {summary.ujian_pekanan_nilai || summary.ujian_bulanan_nilai || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 2 }}>{periode === "pekanan" ? "Ujian Pekanan Sabtu" : "Ujian Bulanan"}</div>
              </div>
            </div>

            {/* Nilai Akhir Raport Estimasi */}
            <div style={{
              background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
              borderRadius: 16, padding: "20px 24px", color: "white",
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ESTIMASI NILAI RAPORT TAHFIDZ
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  Formula: (Rata Harian + Nilai Ujian) / 2 {summary.ujian_itqon_count > 0 ? "+ 10 Bonus Itqon" : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {summary.ujian_itqon_count > 0 && (
                  <span style={{ background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                    +10 ITQON
                  </span>
                )}
                <span style={{ fontSize: 28, fontWeight: 900 }}>{summary.nilai_raport_estimasi || "—"}</span>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 40, fontSize: 12, textAlign: "center" }}>
              <div>
                <div>Mengetahui,</div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginTop: 2 }}>Musyrif / Pengampu Halaqoh</div>
                <div style={{ height: 50 }} />
                <div style={{ fontWeight: 700 }}>( ___________________ )</div>
              </div>
              <div>
                <div>Mengetahui,</div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginTop: 2 }}>Kepala Pengasuhan</div>
                <div style={{ height: 50 }} />
                <div style={{ fontWeight: 700 }}>( ___________________ )</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Pilih santri untuk melihat laporan</div>
        )}
      </div>
    </div>
  );
}
