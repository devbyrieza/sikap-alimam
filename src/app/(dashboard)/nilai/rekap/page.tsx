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
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        .platinum-table tr {
          transition: background 0.2s;
        }
        .platinum-table tr:hover {
          background-color: #f8fafc !important;
        }
        .platinum-table tr:hover td.sticky-col {
          background-color: #f8fafc !important;
        }
      `}</style>
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #2563eb 100%)", borderRadius: "24px", padding: "32px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.2), 0 10px 10px -5px rgba(37, 99, 235, 0.1)" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "white", margin: "0 0 8px 0" }}>Rekap Nilai Santri</h1>
          <p style={{ color: "#bfdbfe", margin: 0 }}>Ringkasan nilai per mata pelajaran</p>
        </div>
      </div>
      
      <ModuleTabs
        tabs={[
          { label: "Input Nilai", href: "/nilai", exact: true, icon: <BookOpen size={16} /> },
          { label: "Laporan Nilai", href: "/nilai/rekap", exact: true, icon: <BarChart3 size={16} /> },
        ]}
      />

      {/* Filter */}
      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", marginBottom: "-8px" }}>Filter Rekap</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Kelas</label>
            <select
              style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Semester</label>
            <select
              style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Tahun Ajaran</label>
            <select
              style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
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
        <div style={{ background: "#fef9c3", borderRadius: "24px", border: "1px solid #fde047", textAlign: "center", padding: "20px 24px" }}>
          <p style={{ color: "#a16207", fontWeight: "600", fontSize: "14px", margin: 0 }}>
            Belum ada mata pelajaran untuk kelas ini.
          </p>
        </div>
      )}

      {kelas_id && (
        <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          {loadingData ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px", color: "#2563eb" }} />
              Memuat rekap nilai...
            </div>
          ) : (
            <>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", marginBottom: "4px" }}>
                  Rekap Nilai · {kelasList.find((k) => k.id === kelas_id)?.nama} · Semester {semester} · {tahun_ajaran}
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Nilai ditampilkan sebagai rata-rata dari semua jenis penilaian. <span style={{ color: "#dc2626", fontWeight: "bold" }}>Merah</span> = nilai &lt;75
                </p>
              </div>

              <div className="sm:hidden text-xs text-slate-700 bg-amber-50/95 border-b border-amber-200/80 px-4 py-2.5 flex items-center gap-2 font-medium">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span><strong>Nama santri terkunci di kiri.</strong> Geser ke samping untuk melihat seluruh mapel.</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="platinum-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 20, background: "#f8fafc", width: 40, textAlign: "center", borderBottom: "1px solid #e2e8f0", padding: "16px 20px" }}>#</th>
                      <th className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 20, background: "#f8fafc", minWidth: 160, maxWidth: 220, borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", padding: "16px 20px", textAlign: "left", color: "#64748b" }}>Nama Santri</th>
                      <th style={{ width: 90, borderBottom: "1px solid #e2e8f0", padding: "16px 20px", textAlign: "left", color: "#64748b" }}>NIS</th>
                      {mapelList.map((m) => (
                        <th key={m.id} style={{ textAlign: "center", minWidth: 100, borderBottom: "1px solid #e2e8f0", padding: "16px 20px", color: "#64748b" }} title={m.nama}>
                          {m.nama.length > 12 ? m.nama.substring(0, 12) + "…" : m.nama}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {santriList.length === 0 ? (
                      <tr>
                        <td colSpan={3 + mapelList.length} style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      santriList.map((santri, i) => {
                        const bgRow = i % 2 === 0 ? "white" : "#fafafa";
                        return (
                          <tr key={santri.id} style={{ background: bgRow }}>
                            <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, color: "#64748b", fontWeight: "600", textAlign: "center", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>{i + 1}</td>
                            <td className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 10, background: bgRow, fontWeight: "bold", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                              <div className="truncate" style={{ color: "#0f172a" }}>{santri.nama_lengkap}</div>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>{santri.nis || "—"}</td>
                            {mapelList.map((m) => {
                              const avg = getAvg(santri.id, m.id);
                              const isBawah = avg !== null && avg < 75;
                              return (
                                <td key={m.id} style={{ textAlign: "center", borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
                                  {avg !== null ? (
                                    <span style={{ fontWeight: "bold", color: isBawah ? "#dc2626" : "#1e293b", background: isBawah ? "#fef2f2" : "transparent", padding: isBawah ? "4px 8px" : "0", borderRadius: isBawah ? "6px" : "0", fontSize: "14px" }}>
                                      {avg}
                                    </span>
                                  ) : (
                                    <span style={{ color: "#d1d5db", fontSize: "12px" }}>—</span>
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
        <div style={{ background: "white", borderRadius: "24px", textAlign: "center", padding: "48px 24px", color: "#9ca3af", border: "1px dashed #e2e8f0" }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
            <path stroke="#9ca3af" strokeWidth="1.5" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          </svg>
          <p style={{ fontWeight: "600", margin: 0 }}>Pilih kelas untuk melihat rekap nilai</p>
        </div>
      )}
    </div>
  );
}
