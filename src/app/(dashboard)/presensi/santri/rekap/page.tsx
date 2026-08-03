"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Users, Table2 } from "lucide-react";

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
  sakit: { bg: "#fef9c3", color: "#a16207", short: "S" },
  izin:  { bg: "#dbeafe", color: "#1d4ed8", short: "I" },
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
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/presensi/santri" className="btn btn-ghost btn-sm" style={{ padding: "6px 10px" }}>
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1>
              <Table2 size={16} className="inline mr-1" />
              Rekap Presensi Santri
            </h1>
            <p>
              {selectedKelas && kelasNama
                ? `Kelas ${kelasNama} · `
                : ""}
              {BULAN_NAMA[bulan]} {tahun}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Filter */}
        <div className="card">
          <p className="card-title">
            <Users size={15} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
            Filter Rekap
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            {/* Kelas */}
            <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
              <label className="form-label">Kelas</label>
              {loadingMaster ? (
                <div className="form-control" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Memuat...
                </div>
              ) : (
                <select
                  className="form-control"
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  <option value="">— Pilih Kelas —</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}{k.jenjang ? ` (${k.jenjang})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Bulan */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bulan</label>
              <select
                className="form-control"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                style={{ minWidth: 140 }}
              >
                {BULAN_NAMA.slice(1).map((b, i) => (
                  <option key={i + 1} value={i + 1}>{b}</option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tahun</label>
              <select
                className="form-control"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                style={{ minWidth: 100 }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Keterangan:</span>
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
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
              <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{status}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: "#f3f4f6", color: "#9ca3af",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 11,
                border: "1px solid #e5e7eb",
              }}
            >
              ·
            </div>
            <span style={{ color: "var(--text-muted)" }}>Tidak ada data</span>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          {/* Prompt / Summary */}
          {!selectedKelas && (
            rekapData && 'summary' in rekapData ? (
              <div style={{ padding: "32px 24px" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                    Ringkasan Presensi Global ({BULAN_NAMA[bulan]} {tahun})
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                    Pilih spesifik kelas pada filter di atas untuk melihat rincian per santri.
                  </p>
                </div>
                
                {/* Overall Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 32 }}>
                  {Object.entries({
                    "Hadir": { val: rekapData.overall.hadir, color: "#15803d", bg: "#dcfce7" },
                    "Sakit": { val: rekapData.overall.sakit, color: "#a16207", bg: "#fef9c3" },
                    "Izin": { val: rekapData.overall.izin, color: "#1d4ed8", bg: "#dbeafe" },
                    "Alpha": { val: rekapData.overall.alpha, color: "#b91c1c", bg: "#fee2e2" },
                  }).map(([label, info]) => {
                    const total = rekapData.overall.hadir + rekapData.overall.sakit + rekapData.overall.izin + rekapData.overall.alpha;
                    const pct = total > 0 ? Math.round((info.val / total) * 100) : 0;
                    return (
                      <div key={label} style={{ 
                        padding: 20, borderRadius: 16, background: info.bg, color: info.color,
                        boxShadow: `0 4px 12px ${info.bg}80`, textAlign: "center"
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>Total {label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{info.val}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginTop: 4 }}>{pct}% dari total absensi</div>
                      </div>
                    );
                  })}
                </div>

                {/* Per Jenjang & Per Kelas */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                  {/* Jenjang */}
                  <div style={{ background: "#ffffff", padding: 24, borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>Persentase Kehadiran Per Jenjang</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {Object.entries(rekapData.perJenjang).map(([jenjang, stats]) => {
                        const total = stats.hadir + stats.sakit + stats.izin + stats.alpha;
                        const pctHadir = total > 0 ? (stats.hadir / total) * 100 : 0;
                        return (
                          <div key={jenjang}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                              <span>Jenjang {jenjang}</span>
                              <span style={{ color: "var(--primary)" }}>{pctHadir.toFixed(1)}% Hadir</span>
                            </div>
                            <div style={{ width: "100%", height: 14, background: "#f3f4f6", borderRadius: 7, overflow: "hidden", display: "flex" }}>
                              <div style={{ width: `${pctHadir}%`, background: "var(--primary)", transition: "width 1s ease-in-out" }} title={`Hadir: ${stats.hadir}`} />
                              {total > 0 && <div style={{ width: `${(stats.sakit / total) * 100}%`, background: "#eab308" }} title={`Sakit: ${stats.sakit}`} />}
                              {total > 0 && <div style={{ width: `${(stats.izin / total) * 100}%`, background: "#3b82f6" }} title={`Izin: ${stats.izin}`} />}
                              {total > 0 && <div style={{ width: `${(stats.alpha / total) * 100}%`, background: "#ef4444" }} title={`Alpha: ${stats.alpha}`} />}
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(rekapData.perJenjang).length === 0 && (
                         <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Belum ada data presensi</div>
                      )}
                    </div>
                  </div>

                  {/* Kelas */}
                  <div style={{ background: "#ffffff", padding: 24, borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", maxHeight: 400, overflowY: "auto" }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)", position: "sticky", top: -24, background: "#fff", padding: "24px 0 12px", zIndex: 10 }}>Kehadiran Per Kelas</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {rekapData.perKelas.sort((a, b) => a.nama.localeCompare(b.nama)).map((k) => {
                        const total = k.hadir + k.sakit + k.izin + k.alpha;
                        const pctHadir = total > 0 ? (k.hadir / total) * 100 : 0;
                        return (
                          <div key={k.nama}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                              <span>{k.nama} {k.jenjang ? `(${k.jenjang})` : ""}</span>
                              <span style={{ color: "var(--primary)" }}>{pctHadir.toFixed(1)}% Hadir</span>
                            </div>
                            <div style={{ width: "100%", height: 14, background: "#f3f4f6", borderRadius: 7, overflow: "hidden", display: "flex" }}>
                              <div style={{ width: `${pctHadir}%`, background: "var(--primary)", transition: "width 1s ease-in-out" }} title={`Hadir: ${k.hadir}`} />
                              {total > 0 && <div style={{ width: `${(k.sakit / total) * 100}%`, background: "#eab308" }} title={`Sakit: ${k.sakit}`} />}
                              {total > 0 && <div style={{ width: `${(k.izin / total) * 100}%`, background: "#3b82f6" }} title={`Izin: ${k.izin}`} />}
                              {total > 0 && <div style={{ width: `${(k.alpha / total) * 100}%`, background: "#ef4444" }} title={`Alpha: ${k.alpha}`} />}
                            </div>
                          </div>
                        );
                      })}
                      {rekapData.perKelas.length === 0 && (
                         <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Belum ada data presensi</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !loading && (
                <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                  <Users size={40} style={{ opacity: 0.2, display: "block", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14 }}>Pilih kelas terlebih dahulu untuk melihat rekap presensi.</p>
                </div>
              )
            )
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
              <Loader2
                size={32}
                style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block", color: "var(--primary)" }}
              />
              Memuat data {BULAN_NAMA[bulan]} {tahun}...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ textAlign: "center", padding: 32, color: "#b91c1c", fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Table data */}
          {!loading && !error && selectedKelas && rekapData && !('summary' in rekapData) && (
            <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: "center", position: "sticky", left: 0, background: "#f8f7f4", zIndex: 2 }}>
                      No
                    </th>
                    <th style={{ minWidth: 180, position: "sticky", left: 36, background: "#f8f7f4", zIndex: 2 }}>
                      Nama Santri
                    </th>
                    {days.map((d) => (
                      <th key={d} style={{ textAlign: "center", minWidth: 30, padding: "8px 3px" }}>
                        {d}
                      </th>
                    ))}
                    <th style={{ textAlign: "center", minWidth: 36, color: "#15803d", fontWeight: 800 }}>H</th>
                    <th style={{ textAlign: "center", minWidth: 36, color: "#a16207", fontWeight: 800 }}>S</th>
                    <th style={{ textAlign: "center", minWidth: 36, color: "#1d4ed8", fontWeight: 800 }}>I</th>
                    <th style={{ textAlign: "center", minWidth: 36, color: "#b91c1c", fontWeight: 800 }}>A</th>
                  </tr>
                </thead>
                <tbody>
                  {(rekapData as RekapData).santri.length === 0 ? (
                    <tr>
                      <td
                        colSpan={days.length + 6}
                        style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}
                      >
                        Tidak ada data santri untuk kelas ini pada {BULAN_NAMA[bulan]} {tahun}
                      </td>
                    </tr>
                  ) : (
                    (rekapData as RekapData).santri.map((s, idx) => {
                      const summary = getSummary(s.id);
                      return (
                        <tr key={s.id}>
                          <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 600, position: "sticky", left: 0, background: "white", zIndex: 1 }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: 600, position: "sticky", left: 36, background: "white", zIndex: 1, whiteSpace: "nowrap" }}>
                            {s.nama_lengkap}
                            {s.nis && (
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                                {s.nis}
                              </span>
                            )}
                          </td>
                          {days.map((d) => {
                            const status = getStatus(s.id, d);
                            const sc = status ? STATUS_COLORS[status] : null;
                            return (
                              <td key={d} style={{ padding: "3px 2px", textAlign: "center" }}>
                                <div
                                  title={status ? `${d} ${BULAN_NAMA[bulan]}: ${status}` : "Tidak ada data"}
                                  style={{
                                    width: 26, height: 26, borderRadius: 5,
                                    background: sc ? sc.bg : "#f3f4f6",
                                    color: sc ? sc.color : "#9ca3af",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto",
                                    fontWeight: 800, fontSize: 10,
                                    border: sc ? `1px solid ${sc.color}44` : "1px solid #e5e7eb",
                                    cursor: "default",
                                  }}
                                >
                                  {sc ? sc.short : "·"}
                                </div>
                              </td>
                            );
                          })}
                          {/* Summary columns */}
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#15803d" }}>{summary.H}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#a16207" }}>{summary.S}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#1d4ed8" }}>{summary.I}</td>
                          <td style={{ textAlign: "center", fontWeight: 800, color: "#b91c1c" }}>{summary.A}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Card */}
        {!loading && !error && selectedKelas && rekapData && !('summary' in rekapData) && (rekapData as RekapData).santri.length > 0 && (
          <div className="card" style={{ padding: "16px 20px" }}>
            <p className="card-title" style={{ marginBottom: 12 }}>📊 Ringkasan Kehadiran Kelas {kelasNama}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
              {[
                { label: "Total Hadir", key: "H", color: "#15803d", bg: "#dcfce7" },
                { label: "Total Sakit", key: "S", color: "#a16207", bg: "#fef9c3" },
                { label: "Total Izin", key: "I", color: "#1d4ed8", bg: "#dbeafe" },
                { label: "Total Alpha", key: "A", color: "#b91c1c", bg: "#fee2e2" },
              ].map(({ label, key, color, bg }) => {
                const total = (rekapData as RekapData).santri.reduce((sum, s) => {
                  return sum + getSummary(s.id)[key as "H" | "S" | "I" | "A"];
                }, 0);
                return (
                  <div
                    key={key}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: bg,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 800, color }}>{total}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
