'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Filter
} from 'lucide-react';

interface DayData {
  presensi: {
    id: string;
    asatidz_id: string;
    tanggal: string;
    status: string;
    asatidz: { id: string; nama_lengkap: string };
  }[];
  belumAbsen: { id: string; nama_lengkap: string; jabatan: string | null }[];
  tanggal: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; short: string; label: string }> = {
  hadir: { bg: '#f0fdf4', color: '#15803d', short: 'H', label: 'Hadir' },
  telat: { bg: '#fff7ed', color: '#c2410c', short: 'T', label: 'Telat' },
  sakit: { bg: '#fefce8', color: '#a16207', short: 'S', label: 'Sakit' },
  izin: { bg: '#eff6ff', color: '#1d4ed8', short: 'I', label: 'Izin' },
  alpha: { bg: '#fef2f2', color: '#b91c1c', short: 'A', label: 'Alpha' },
};

const BULAN_NAMA = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export default function RekapBulananPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const daysInMonth = new Date(tahun, bulan, 0).getDate();

      const promises = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(tahun, bulan - 1, i + 1);
        const dateStr = d.toISOString().split('T')[0];
        return fetch(`/api/presensi/asatidz?tanggal=${dateStr}`)
          .then((r) => r.json())
          .then((json) => ({ ...json, tanggal: dateStr }));
      });

      const allData = await Promise.all(promises);
      setData(allData);
    } catch {
      console.error('Gagal fetch rekap');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Kumpulkan semua asatidz unik
  const asatidz_map = new Map<string, string>();
  data.forEach((d) => {
    d.presensi?.forEach((p) => {
      asatidz_map.set(p.asatidz.id, p.asatidz.nama_lengkap);
    });
    d.belumAbsen?.forEach((a) => {
      asatidz_map.set(a.id, a.nama_lengkap);
    });
  });
  const allAsatidz = Array.from(asatidz_map.entries()).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatus = (asatidz_id: string, day: number): string | null => {
    const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = data.find((d) => d.tanggal === dateStr);
    if (!dayData) return null;
    const found = dayData.presensi?.find((p) => p.asatidz_id === asatidz_id);
    return found ? found.status : null;
  };

  const getSummary = (asatidz_id: string) => {
    let H = 0, T = 0, S = 0, I = 0, A = 0;
    days.forEach((day) => {
      const status = getStatus(asatidz_id, day);
      if (status === 'hadir') H++;
      else if (status === 'telat') T++;
      else if (status === 'sakit') S++;
      else if (status === 'izin') I++;
      else if (status === 'alpha') A++;
    });
    return { H, T, S, I, A };
  };

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Monthly Attendance Matrix</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <BarChart3 size={26} color="#ddc192" /> Rekap Presensi Guru
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Matriks kalender kehadiran bulanan · {BULAN_NAMA[bulan]} {tahun}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", position: "relative", zIndex: 2 }}>
          <Link
            href="/presensi/asatidz"
            style={{
              background: "rgba(253,248,240,0.15)",
              color: "#fdf8f0",
              padding: "10px 18px",
              borderRadius: "14px",
              border: "1px solid rgba(221,193,146,0.35)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} color="#ddc192" />
            Kembali
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Filter Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "#550000" }}>
            <Filter size={18} color="#ddc192" />
            Pilih Periode Rekap
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Bulan:</label>
              <select
                style={{ padding: "9px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 700, color: "#1a1a1a", minWidth: 140 }}
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
              >
                {BULAN_NAMA.slice(1).map((b, i) => (
                  <option key={i + 1} value={i + 1}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Tahun:</label>
              <select
                style={{ padding: "9px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 700, color: "#1a1a1a", minWidth: 100 }}
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: '14px 20px', borderRadius: '16px', border: '1px solid #ebdcc3' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#550000' }}>Keterangan:</span>
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div
              key={status}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: c.bg,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 11,
                  border: `1px solid ${c.color}40`,
                }}
              >
                {c.short}
              </div>
              <span style={{ color: '#1a1a1a' }}>{c.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#f8fafc',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 11,
                border: '1px solid #e2e8f0',
              }}
            >
              -
            </div>
            <span style={{ color: '#64748b' }}>Belum Absen</span>
          </div>
        </div>

        {/* Tabel Heatmap */}
        <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: "56px 24px", color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: '#550000' }} />
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
                Memuat rekap kehadiran {BULAN_NAMA[bulan]} {tahun}...
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                    <th
                      style={{
                        minWidth: 180,
                        position: 'sticky',
                        left: 0,
                        background: '#fdf8f0',
                        zIndex: 2,
                        padding: '14px 16px',
                        borderBottom: '1px solid #ebdcc3',
                        color: '#550000',
                        fontWeight: 800,
                        textAlign: 'left'
                      }}
                    >
                      Nama Guru
                    </th>
                    {days.map((d) => (
                      <th
                        key={d}
                        style={{ textAlign: 'center', minWidth: 30, padding: '10px 2px', color: '#550000', fontWeight: 800 }}
                      >
                        {d}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', minWidth: 34, color: '#15803d', fontWeight: 800 }}>H</th>
                    <th style={{ textAlign: 'center', minWidth: 34, color: '#c2410c', fontWeight: 800 }}>T</th>
                    <th style={{ textAlign: 'center', minWidth: 34, color: '#a16207', fontWeight: 800 }}>S</th>
                    <th style={{ textAlign: 'center', minWidth: 34, color: '#1d4ed8', fontWeight: 800 }}>I</th>
                    <th style={{ textAlign: 'center', minWidth: 34, color: '#b91c1c', fontWeight: 800 }}>A</th>
                  </tr>
                </thead>
                <tbody>
                  {allAsatidz.length === 0 ? (
                    <tr>
                      <td
                        colSpan={days.length + 6}
                        style={{ textAlign: 'center', padding: "48px 24px", color: '#64748b' }}
                      >
                        Tidak ada data untuk {BULAN_NAMA[bulan]} {tahun}
                      </td>
                    </tr>
                  ) : (
                    allAsatidz.map(([id, nama], idx) => {
                      const summary = getSummary(id);
                      return (
                        <tr
                          key={id}
                          style={{
                            borderBottom: "1px solid #f5ede1",
                            background: idx % 2 === 0 ? "white" : "#fdfcf9",
                          }}
                        >
                          <td
                            style={{
                              fontWeight: 700,
                              position: 'sticky',
                              left: 0,
                              background: idx % 2 === 0 ? "white" : "#fdfcf9",
                              zIndex: 1,
                              whiteSpace: 'nowrap',
                              padding: '12px 16px',
                              color: '#1a1a1a',
                              borderBottom: '1px solid #f5ede1',
                            }}
                          >
                            {nama}
                          </td>
                          {days.map((d) => {
                            const status = getStatus(id, d);
                            const sc = status ? STATUS_COLORS[status] : null;
                            return (
                              <td key={d} style={{ padding: '3px 1px', textAlign: 'center' }}>
                                <div
                                  title={status ? `${nama} (${status})` : 'Belum Absen'}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 5,
                                    background: sc ? sc.bg : '#f8fafc',
                                    color: sc ? sc.color : '#cbd5e1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    fontWeight: 800,
                                    fontSize: 10,
                                    border: sc
                                      ? `1px solid ${sc.color}40`
                                      : '1px solid #f1f5f9',
                                  }}
                                >
                                  {sc ? sc.short : '·'}
                                </div>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', padding: "6px" }}>
                            {summary.H}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#c2410c', padding: "6px" }}>
                            {summary.T}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#a16207', padding: "6px" }}>
                            {summary.S}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#1d4ed8', padding: "6px" }}>
                            {summary.I}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#b91c1c', padding: "6px" }}>
                            {summary.A}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
