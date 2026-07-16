'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

const STATUS_COLORS: Record<string, { bg: string; color: string; short: string }> = {
  hadir: { bg: '#dcfce7', color: '#15803d', short: 'H' },
  telat: { bg: '#ffedd5', color: '#c2410c', short: 'T' },
  sakit: { bg: '#fef9c3', color: '#a16207', short: 'S' },
  izin: { bg: '#dbeafe', color: '#1d4ed8', short: 'I' },
  alpha: { bg: '#fee2e2', color: '#b91c1c', short: 'A' },
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
    const summary = { H: 0, T: 0, S: 0, I: 0, A: 0 };
    data.forEach((d) => {
      const found = d.presensi?.find((p) => p.asatidz_id === asatidz_id);
      if (found) {
        if (found.status === 'hadir') summary.H++;
        else if (found.status === 'telat') summary.T++;
        else if (found.status === 'sakit') summary.S++;
        else if (found.status === 'izin') summary.I++;
        else if (found.status === 'alpha') summary.A++;
      }
    });
    return summary;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rekap Presensi Asatidz</h1>
          <p>
            Kalender kehadiran bulanan · {BULAN_NAMA[bulan]} {tahun}
          </p>
        </div>
        <Link href="/presensi/asatidz" className="btn btn-ghost btn-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
          Kembali
        </Link>
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Filter */}
        <div className="card">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bulan</label>
              <select
                className="form-control"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                style={{ minWidth: 140 }}
              >
                {BULAN_NAMA.slice(1).map((b, i) => (
                  <option key={i + 1} value={i + 1}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Keterangan:</span>
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div
              key={status}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: c.bg,
                  color: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 11,
                  border: `1px solid ${c.color}33`,
                }}
              >
                {c.short}
              </div>
              <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#f3f4f6',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 11,
                border: '1px solid #e5e7eb',
              }}
            >
              -
            </div>
            <span style={{ color: '#6b7280' }}>Tidak ada data</span>
          </div>
        </div>

        {/* Tabel Heatmap */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
              <div
                className="spinner"
                style={{
                  margin: '0 auto 12px',
                  borderTopColor: '#7c1010',
                  borderColor: 'rgba(124,16,16,0.2)',
                  width: 32,
                  height: 32,
                }}
              />
              Memuat rekap {BULAN_NAMA[bulan]} {tahun}...
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        minWidth: 180,
                        position: 'sticky',
                        left: 0,
                        background: '#f8f7f4',
                        zIndex: 1,
                      }}
                    >
                      Nama Asatidz
                    </th>
                    {days.map((d) => (
                      <th
                        key={d}
                        style={{ textAlign: 'center', minWidth: 32, padding: '8px 3px' }}
                      >
                        {d}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', minWidth: 36, color: '#16a34a' }}>H</th>
                    <th style={{ textAlign: 'center', minWidth: 36, color: '#ea580c' }}>T</th>
                    <th style={{ textAlign: 'center', minWidth: 36, color: '#a16207' }}>S</th>
                    <th style={{ textAlign: 'center', minWidth: 36, color: '#1d4ed8' }}>I</th>
                    <th style={{ textAlign: 'center', minWidth: 36, color: '#dc2626' }}>A</th>
                  </tr>
                </thead>
                <tbody>
                  {allAsatidz.length === 0 ? (
                    <tr>
                      <td
                        colSpan={days.length + 6}
                        style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}
                      >
                        Tidak ada data untuk {BULAN_NAMA[bulan]} {tahun}
                      </td>
                    </tr>
                  ) : (
                    allAsatidz.map(([id, nama]) => {
                      const summary = getSummary(id);
                      return (
                        <tr key={id}>
                          <td
                            style={{
                              fontWeight: 700,
                              position: 'sticky',
                              left: 0,
                              background: 'white',
                              zIndex: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {nama}
                          </td>
                          {days.map((d) => {
                            const status = getStatus(id, d);
                            const sc = status ? STATUS_COLORS[status] : null;
                            return (
                              <td key={d} style={{ padding: '3px 2px', textAlign: 'center' }}>
                                <div
                                  title={status || 'Tidak ada data'}
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 5,
                                    background: sc ? sc.bg : '#f3f4f6',
                                    color: sc ? sc.color : '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    fontWeight: 800,
                                    fontSize: 10,
                                    border: sc
                                      ? `1px solid ${sc.color}44`
                                      : '1px solid #e5e7eb',
                                    cursor: 'default',
                                  }}
                                >
                                  {sc ? sc.short : '·'}
                                </div>
                              </td>
                            );
                          })}
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#16a34a',
                            }}
                          >
                            {summary.H}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#ea580c',
                            }}
                          >
                            {summary.T}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#a16207',
                            }}
                          >
                            {summary.S}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#1d4ed8',
                            }}
                          >
                            {summary.I}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#dc2626',
                            }}
                          >
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
    </>
  );
}
