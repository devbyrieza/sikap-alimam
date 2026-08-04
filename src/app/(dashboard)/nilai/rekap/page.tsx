"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, FileText, Loader2, ArrowLeft, BookOpen, BarChart3 } from "lucide-react";
import ModuleTabs from "@/components/ModuleTabs";

interface Kelas {
  id: string;
  nama: string;
}

interface MapelItem {
  id: string;
  nama: string;
}

interface NilaiEntry {
  id: string;
  santri: { id: string; nama_lengkap: string; nis?: string };
  mapel: { id: string; nama: string };
  nilai: number;
  jenis: string;
  semester: string;
  tahun_ajaran: string;
}

const SEMESTER_LIST = ["Ganjil", "Genap"];
const TAHUN_AJARAN_LIST = ["2026/2027", "2027/2028"];

export default function RekapNilaiPage() {
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelas_id, setKelasId] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahun_ajaran, setTahunAjaran] = useState("2026/2027");

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [nilaiData, setNilaiData] = useState<NilaiEntry[]>([]);

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch kelas
  useEffect(() => {
    fetch("/api/master/kelas")
      .then((r) => r.json())
      .then((d) => setKelasList(d.kelas || []))
      .catch(() => {})
      .finally(() => setLoadingKelas(false));
  }, []);

  // Fetch mapel saat kelas berubah
  useEffect(() => {
    if (!kelas_id) {
      setMapelList([]);
      return;
    }
    fetch(`/api/master/mapel?kelas_id=${kelas_id}`)
      .then((r) => r.json())
      .then((d) => setMapelList(d.mapel || []))
      .catch(() => {});
  }, [kelas_id]);

  // Fetch nilai rekap
  const fetchRekap = useCallback(async () => {
    if (!kelas_id || !semester || !tahun_ajaran) return;
    setLoadingData(true);
    try {
      const res = await fetch(
        `/api/nilai?kelas_id=${kelas_id}&semester=${semester}&tahun_ajaran=${encodeURIComponent(tahun_ajaran)}`
      );
      const data = await res.json();
      setNilaiData(data.nilai || []);
    } catch {
      console.error("Gagal fetch rekap nilai");
    } finally {
      setLoadingData(false);
    }
  }, [kelas_id, semester, tahun_ajaran]);

  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  // Kalkulasi data tabel
  // Santri unik
  const santriMap = new Map<string, { id: string; nama_lengkap: string; nis?: string }>();
  nilaiData.forEach((n) => {
    santriMap.set(n.santri.id, n.santri);
  });
  const santriList = Array.from(santriMap.values()).sort((a, b) =>
    a.nama_lengkap.localeCompare(b.nama_lengkap)
  );

  // Kalkulasi Nilai Akhir per santri per mapel
  const getAvg = (santri_id: string, mapel_id: string): number | null => {
    const vals = nilaiData.filter(
      (n) => n.santri.id === santri_id && n.mapel.id === mapel_id
    );
    if (vals.length === 0) return null;

    // Helper untuk mengambil nilai tertentu
    const getVal = (jenis: string) => {
      const entry = vals.find(v => v.jenis === jenis);
      return entry ? Number(entry.nilai) : 0;
    };

    // Helper untuk mengecek apakah periode memiliki setidaknya 1 nilai
    const hasPeriode = (suffix: string, ujianKey: string) => {
      return vals.some(v => v.jenis === `harian${suffix}` || v.jenis === `kompetensi${suffix}` || v.jenis === `sikap${suffix}` || v.jenis === ujianKey);
    };

    // Hitung formula 30% Harian + 20% Komp + 10% Sikap + 40% Ujian
    const calcFormula = (suffix: string, ujianKey: string) => {
      const h = getVal(`harian${suffix}`);
      const k = getVal(`kompetensi${suffix}`);
      const s = getVal(`sikap${suffix}`);
      const u = getVal(ujianKey);
      return (0.3 * h) + (0.2 * k) + (0.1 * s) + (0.4 * u);
    };

    // Jika PAS ada, gunakan PAS. Jika tidak, gunakan PTS.
    if (hasPeriode("_pas", "pas")) {
      return Math.round(calcFormula("_pas", "pas") * 10) / 10;
    } else if (hasPeriode("_pts", "pts")) {
      return Math.round(calcFormula("_pts", "pts") * 10) / 10;
    }

    return null;
  };

  return (
    <div className="page-container">
      <style>{`
        .platinum-table tr {
          transition: background 0.2s;
        }
        .platinum-table tr:hover {
          background-color: #fdf8f0 !important;
        }
        .platinum-table tr:hover td.sticky-col {
          background-color: #fdf8f0 !important;
        }
      `}</style>

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
            <BarChart3 size={26} color="#ddc192" /> Rekap Nilai Santri
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Ringkasan capaian nilai seluruh mata pelajaran per kelas
          </p>
        </div>
      </div>
      
      <ModuleTabs
        tabs={[
          { label: "Input Nilai", href: "/nilai", exact: true, icon: <BookOpen size={16} /> },
          { label: "Laporan Nilai", href: "/nilai/rekap", exact: true, icon: <BarChart3 size={16} /> },
        ]}
      />

      {/* Filter */}
      <div style={{ background: "white", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000" }}>Filter Rekap Nilai</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={kelas_id}
              onChange={(e) => setKelasId(e.target.value)}
              disabled={loadingKelas}
            >
              <option value="">— Pilih Kelas —</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Semester</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              {SEMESTER_LIST.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tahun Ajaran</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={tahun_ajaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
            >
              {TAHUN_AJARAN_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {kelas_id && mapelList.length === 0 && !loadingData && (
        <div style={{ background: "#fdf8f0", borderRadius: "20px", border: "1px solid #ebdcc3", textAlign: "center", padding: "20px 24px" }}>
          <p style={{ color: "#b89758", fontWeight: "700", fontSize: "14px", margin: 0 }}>
            Belum ada mata pelajaran untuk kelas ini.
          </p>
        </div>
      )}

      {kelas_id && (
        <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 4px 16px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
          {loadingData ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px", color: "#550000" }} />
              Memuat rekap nilai...
            </div>
          ) : (
            <>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f5ede1", background: "#fdfcf9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", marginBottom: "2px" }}>
                    Rekap Nilai · {kelasList.find((k) => k.id === kelas_id)?.nama} · Semester {semester} · {tahun_ajaran}
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Nilai ditampilkan sebagai nilai akhir. <span style={{ color: "#b91c1c", fontWeight: "bold" }}>Merah</span> = nilai &lt;75
                  </p>
                </div>
              </div>

              <div className="sm:hidden text-xs text-amber-900 bg-amber-50/95 border-b border-amber-200/80 px-4 py-2.5 flex items-center gap-2 font-medium">
                <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
                <span><strong>Nama santri di kiri.</strong> Geser tabel ke kanan untuk melihat seluruh mata pelajaran.</span>
              </div>

              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table className="platinum-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#fdf8f0" }}>
                      <th className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 20, background: "#fdf8f0", width: 40, textAlign: "center", borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#550000", fontWeight: 800 }}>#</th>
                      <th className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 20, background: "#fdf8f0", minWidth: 170, maxWidth: 220, borderBottom: "1px solid #ebdcc3", borderRight: "1px solid #ebdcc3", padding: "14px 18px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Nama Santri</th>
                      <th style={{ width: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>NIS</th>
                      {mapelList.map((m) => (
                        <th key={m.id} style={{ textAlign: "center", minWidth: 100, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#550000", fontWeight: 800 }} title={m.nama}>
                          {m.nama.length > 14 ? m.nama.substring(0, 14) + "…" : m.nama}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {santriList.length === 0 ? (
                      <tr>
                        <td colSpan={3 + mapelList.length} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      santriList.map((santri, i) => {
                        const bgRow = i % 2 === 0 ? "#ffffff" : "#fdfcf9";
                        return (
                          <tr key={santri.id} style={{ background: bgRow }}>
                            <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, color: "#550000", fontWeight: "700", textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{i + 1}</td>
                            <td className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 10, background: bgRow, fontWeight: "800", borderRight: "1px solid #ebdcc3", borderBottom: "1px solid #f5ede1", padding: "14px 18px" }}>
                              <div className="truncate" style={{ color: "#1a1a1a" }}>{santri.nama_lengkap}</div>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{santri.nis || "—"}</td>
                            {mapelList.map((m) => {
                              const avg = getAvg(santri.id, m.id);
                              const isBawah = avg !== null && avg < 75;
                              return (
                                <td key={m.id} style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                  {avg !== null ? (
                                    <span style={{ fontWeight: "800", color: isBawah ? "#b91c1c" : "#1a1a1a", background: isBawah ? "#fee2e2" : "#fdf8f0", padding: "4px 8px", borderRadius: "8px", border: "1px solid #ebdcc3", fontSize: "13px" }}>
                                      {avg}
                                    </span>
                                  ) : (
                                    <span style={{ color: "#cbd5e1", fontSize: "12px" }}>—</span>
                                  )}
                                </td>
                              );
                            })}
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
      )}

      {!kelas_id && (
        <div style={{ background: "white", borderRadius: "20px", textAlign: "center", padding: "48px 24px", color: "#64748b", border: "1px dashed #ebdcc3" }}>
          <BookOpen size={40} color="#ddc192" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: "700", margin: 0, color: "#1a1a1a" }}>Pilih kelas untuk melihat rekap nilai</p>
        </div>
      )}
    </div>
  );
}
