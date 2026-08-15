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

  return (
    <div className="page-container">
      {/* Hide on print */}
      <div className="no-print flex flex-col gap-6">
        {/* Back */}
        <Link 
          href="/halaqoh" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Halaqoh
        </Link>

        {/* ── Al-Imam Platinum Hero Banner ── */}
        <div className="hero-banner">
          <div style={{ position: "absolute", top: 0, right: 0, width: 256, height: 256, background: "rgba(221, 193, 146, 0.15)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(30%, -50%)", pointerEvents: "none" }}></div>
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 192, height: 192, background: "rgba(221, 193, 146, 0.1)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(-25%, 50%)", pointerEvents: "none" }}></div>

          <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(221, 193, 146, 0.18)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(221, 193, 146, 0.4)", width: "fit-content", marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ddc192", boxShadow: "0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Rekapitulasi &amp; Rapor</span>
            </div>
            <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
              <FileText size={26} color="#ddc192" /> Laporan &amp; Rekap Tahfidz
            </h1>
            <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
              Cetak Laporan Pekanan, Bulanan, &amp; Semesteran Santri
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <button
              onClick={handlePrint}
              style={{ background: "#ddc192", color: "#550000", padding: "11px 22px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
            >
              <Printer size={18} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_35px_rgba(85,0,0,0.06)] space-y-4">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Filter & Parameter Laporan</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Santri</label>
              <select 
                value={selectedSantriId} 
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm bg-white transition-all outline-none"
              >
                {allSantri.map(s => (
                  <option key={s.id} value={s.id}>{s.nama_lengkap}{s.kelas?.nama ? ` (${s.kelas.nama})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Jenis Laporan</label>
              <select 
                value={periode} 
                onChange={e => setPeriode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm bg-white transition-all outline-none"
              >
                <option value="pekanan">Laporan Pekanan</option>
                <option value="bulanan">Laporan Bulanan</option>
                <option value="semesteran">Laporan Semester</option>
                <option value="ujian_target">Laporan Ujian Target</option>
                <option value="ujian_itqon">Laporan Ujian Itqon</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Bulan & Tahun</label>
              <div className="flex gap-2">
                <select 
                  value={bulan} 
                  onChange={e => setBulan(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm bg-white transition-all outline-none"
                >
                  {BULAN_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select 
                  value={tahun} 
                  onChange={e => setTahun(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm bg-white transition-all outline-none"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {periode === "pekanan" && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Pekan Ke-</label>
                <select 
                  value={pekanKe} 
                  onChange={e => setPekanKe(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm bg-white transition-all outline-none"
                >
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
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl relative w-full overflow-x-auto custom-scrollbar">
        {/* Kop Surat Header */}
        <div className="text-center border-b-[3px] border-double border-[#550000] pb-5 mb-8">
          <div className="text-lg md:text-xl font-black text-[#550000] tracking-wider">
            PESANTREN AL-ANDALUS / AL-IMAM
          </div>
          <div className="text-sm md:text-base font-bold text-slate-800 mt-1">
            LAPORAN CAPAIAN TAHFIDZ & KEHADIRAN HALAQOH
          </div>
          <div className="text-xs md:text-sm font-medium text-slate-500 mt-1">
            Periode: {periode.replace("_", " ").toUpperCase()} · {BULAN_NAMES[bulan - 1]} {tahun} {periode === "pekanan" ? `(Pekan ${pekanKe})` : ""}
          </div>
        </div>

        {/* Identitas Santri */}
        <div className="bg-slate-50 rounded-2xl p-4 md:p-5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-slate-500">Nama Santri:</span>
            <strong className="text-slate-800 font-bold">{selectedSantri?.nama_lengkap || "—"}</strong>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-slate-500">NIS / Kelas:</span>
            <strong className="text-slate-800 font-bold">{selectedSantri?.nis || "—"} · {selectedSantri?.kelas?.nama || "—"}</strong>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Memuat data laporan...</div>
        ) : report ? (
          <div className="flex flex-col gap-8">
            {/* Grid 4 Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 text-center shadow-sm">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">KEHADIRAN</div>
                <div className="text-3xl font-black text-emerald-800 mt-2">
                  {summary.total_hadir || 0} <span className="text-sm font-semibold">sesi</span>
                </div>
                <div className="text-[11px] font-medium text-emerald-700 mt-2">Sakit: {summary.total_sakit || 0} · Izin: {summary.total_izin || 0} · Alfa: {summary.total_alfa || 0}</div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-center shadow-sm">
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">TOTAL CAPAIAN</div>
                <div className="text-3xl font-black text-blue-800 mt-2">
                  {summary.total_halaman || 0} <span className="text-sm font-semibold">hal.</span>
                </div>
                <div className="text-[11px] font-medium text-blue-700 mt-2">Mushaf Madinah</div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center shadow-sm">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">RATA HARIAN</div>
                <div className="text-3xl font-black text-amber-800 mt-2">
                  {summary.avg_nilai_harian || "—"}
                </div>
                <div className="text-[11px] font-medium text-amber-700 mt-2">Nilai Bacaan + Kelancaran</div>
              </div>

              <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-5 text-center shadow-sm">
                <div className="text-xs font-bold text-violet-700 uppercase tracking-wide">NILAI UJIAN</div>
                <div className="text-3xl font-black text-violet-800 mt-2">
                  {periode === "ujian_target" ? (summary.ujian_target_nilai || "—") :
                   periode === "ujian_itqon" ? (summary.ujian_itqon_nilai || "—") :
                   (summary.ujian_pekanan_nilai || summary.ujian_bulanan_nilai || "—")}
                </div>
                <div className="text-[11px] font-medium text-violet-700 mt-2">
                  {periode === "pekanan" ? "Ujian Pekanan Sabtu" : 
                   periode === "bulanan" ? "Ujian Bulanan" : 
                   periode === "ujian_target" ? "Ujian Target Capaian" :
                   periode === "ujian_itqon" ? "Ujian Itqon (Kelulusan)" :
                   "Ujian Semester"}
                </div>
              </div>
            </div>

            {/* Nilai Akhir Raport Estimasi */}
            <div className="bg-gradient-to-br from-[#550000] to-[#7a0000] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="text-sm font-bold uppercase tracking-wider text-red-100">
                  ESTIMASI NILAI RAPORT TAHFIDZ
                </div>
                <div className="text-xs font-medium text-red-200/80 mt-1.5">
                  Formula: (Rata Harian + Nilai Ujian) / 2 {summary.ujian_itqon_count > 0 ? "+ 10 Bonus Itqon" : ""}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {summary.ujian_itqon_count > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">
                    +10 ITQON
                  </span>
                )}
                <span className="text-4xl md:text-5xl font-black drop-shadow-md">{summary.nilai_raport_estimasi || "—"}</span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 mt-8 text-xs md:text-sm text-center">
              <div className="flex flex-col items-center">
                <div className="text-slate-600">Mengetahui,</div>
                <div className="font-bold text-slate-800 mt-1">Pengampu Halaqoh</div>
                <div className="h-20"></div>
                <div className="font-bold text-slate-800">( ___________________ )</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-slate-600">Mengetahui,</div>
                <div className="font-bold text-slate-800 mt-1">Kabid Pengasuhan</div>
                <div className="h-20"></div>
                <div className="font-bold text-slate-800">( ___________________ )</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-medium">Pilih santri untuk melihat laporan</div>
        )}
      </div>
    </div>
  );
}
