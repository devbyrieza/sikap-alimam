'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

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

const SEMESTER_LIST = ['Ganjil', 'Genap'];
const TAHUN_AJARAN_LIST = ['2026/2027', '2027/2028'];

export default function RekapNilaiPage() {
  const [jenjangFilter, setJenjangFilter] = useState('');
  const [kelas_id, setKelasId] = useState('');
  const [semester, setSemester] = useState('Ganjil');
  const [tahun_ajaran, setTahunAjaran] = useState('2026/2027');

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [nilaiData, setNilaiData] = useState<NilaiEntry[]>([]);

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch kelas
  useEffect(() => {
    fetch('/api/master/kelas')
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
      console.error('Gagal fetch rekap nilai');
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
    if (hasPeriode('_pas', 'pas')) {
      return Math.round(calcFormula('_pas', 'pas') * 10) / 10;
    } else if (hasPeriode('_pts', 'pts')) {
      return Math.round(calcFormula('_pts', 'pts') * 10) / 10;
    }

    return null;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rekap Nilai Santri</h1>
          <p>Ringkasan nilai per mata pelajaran</p>
        </div>
      </div>

      <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto w-full flex flex-col gap-5">
        {/* Filter */}
        <div className="card">
          <div className="card-title">Filter Rekap</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label className="form-label">Kelas</label>
              <select
                className="form-control"
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Semester</label>
              <select
                className="form-control"
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tahun Ajaran</label>
              <select
                className="form-control"
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

        {/* Info */}
        {kelas_id && mapelList.length === 0 && !loadingData && (
          <div
            className="card"
            style={{
              background: '#fef9c3',
              border: '1px solid #fde047',
              textAlign: 'center',
              padding: '20px 24px',
            }}
          >
            <p style={{ color: '#a16207', fontWeight: 600, fontSize: 14 }}>
              Belum ada mata pelajaran untuk kelas ini.
            </p>
          </div>
        )}

        {/* Tabel Rekap */}
        {kelas_id && (
          <div className="card" style={{ padding: 0 }}>
            {loadingData ? (
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
                Memuat rekap nilai...
              </div>
            ) : (
              <>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e2db' }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Rekap Nilai · {kelasList.find((k) => k.id === kelas_id)?.nama} · Semester{' '}
                    {semester} · {tahun_ajaran}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Nilai ditampilkan sebagai rata-rata dari semua jenis penilaian.{' '}
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Merah</span> = nilai &lt;75
                  </p>
                </div>
                
                {/* Mobile scroll hint */}
                <div className="sm:hidden text-xs text-slate-700 bg-amber-50/95 border-b border-amber-200/80 px-4 py-2.5 flex items-center gap-2 font-medium">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span><strong>Nama santri terkunci di kiri.</strong> Geser ke samping untuk melihat seluruh mapel.</span>
                </div>

                <div className="table-wrap" style={{ border: 'none', borderRadius: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ fontSize: 13, borderCollapse: 'separate', borderSpacing: 0, minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f8fafc', width: 40, textAlign: 'center', borderBottom: '1px solid #e5e2db' }}>#</th>
                        <th style={{ position: 'sticky', left: 40, zIndex: 20, background: '#f8fafc', minWidth: 160, maxWidth: 220, borderBottom: '1px solid #e5e2db', borderRight: '1px solid #e5e2db', boxShadow: '4px 0 6px -2px rgba(0,0,0,0.05)' }}>Nama Santri</th>
                        <th style={{ width: 90, borderBottom: '1px solid #e5e2db' }}>NIS</th>
                        {mapelList.map((m) => (
                          <th
                            key={m.id}
                            style={{ textAlign: 'center', minWidth: 90, borderBottom: '1px solid #e5e2db' }}
                            title={m.nama}
                          >
                            {m.nama.length > 12 ? m.nama.substring(0, 12) + '…' : m.nama}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3 + mapelList.length}
                            style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}
                          >
                            Belum ada data nilai untuk filter ini
                          </td>
                        </tr>
                      ) : (
                        santriList.map((santri, i) => (
                          <tr key={santri.id} className="hover:bg-slate-50/60">
                            <td style={{ position: 'sticky', left: 0, zIndex: 10, background: '#ffffff', color: '#9ca3af', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{i + 1}</td>
                            <td style={{ position: 'sticky', left: 40, zIndex: 10, background: '#ffffff', fontWeight: 700, borderRight: '1px solid #e5e2db', borderBottom: '1px solid #f1f5f9', boxShadow: '4px 0 6px -2px rgba(0,0,0,0.05)' }}>
                              <div className="truncate">{santri.nama_lengkap}</div>
                            </td>
                            <td style={{ color: '#9ca3af', fontSize: 12, borderBottom: '1px solid #f1f5f9' }}>{santri.nis || '—'}</td>
                            {mapelList.map((m) => {
                              const avg = getAvg(santri.id, m.id);
                              const isBawah = avg !== null && avg < 75;
                              return (
                                <td key={m.id} style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                  {avg !== null ? (
                                    <span
                                      style={{
                                        fontWeight: 800,
                                        color: isBawah ? '#dc2626' : '#1a1a1a',
                                        background: isBawah ? '#fef2f2' : 'transparent',
                                        padding: isBawah ? '2px 8px' : '0',
                                        borderRadius: isBawah ? 6 : 0,
                                        fontSize: 14,
                                      }}
                                    >
                                      {avg}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {!kelas_id && (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '40px 24px', color: '#9ca3af' }}
          >
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}
            >
              <path
                stroke="#9ca3af"
                strokeWidth="1.5"
                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
              />
            </svg>
            <p style={{ fontWeight: 600 }}>Pilih kelas untuk melihat rekap nilai</p>
          </div>
        )}
      </div>
    </>
  );
}
