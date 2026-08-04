'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import type { PresensiItem } from './page';

interface Props {
  presensiHariIni: PresensiItem[];
  belumAbsen: { id: string; nama_lengkap: string; jabatan: string | null }[];
  tokenHariIni: { token: string; expires_at: string } | null;
  allAsatidz: { id: string; nama_lengkap: string }[];
  tanggal: string;
}

export default function PresensiAsatidz({
  presensiHariIni,
  belumAbsen,
  tokenHariIni,
  allAsatidz,
  tanggal,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState(tokenHariIni);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    asatidz_id: '',
    status: 'hadir',
    keterangan: '',
    jam_masuk: '',
  });
  const [saving, setSaving] = useState(false);

  const today = new Date(tanggal);
  const todayStr = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getAbsenLink = () => {
    if (!token) return null;
    if (typeof window === 'undefined') return `/absen?t=${token.token}`;
    return `${window.location.origin}/absen?t=${token.token}`;
  };

  const stats = {
    hadir: presensiHariIni.filter((p) => p.status === 'hadir').length,
    telat: presensiHariIni.filter((p) => p.status === 'telat').length,
    sakit: presensiHariIni.filter((p) => p.status === 'sakit').length,
    izin: presensiHariIni.filter((p) => p.status === 'izin').length,
    alpha: presensiHariIni.filter((p) => p.status === 'alpha').length,
    belum: belumAbsen.length,
  };

  const handleGenerateToken = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/absen/token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken({ token: data.token, expires_at: data.expires_at });
      Swal.fire({
        icon: 'success',
        title: 'Token Berhasil Dibuat!',
        html: `Token: <code style="font-weight:700;color:#7c1010">${data.token}</code>`,
        confirmButtonColor: '#7c1010',
      });
      router.refresh();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: (err as Error).message,
        confirmButtonColor: '#7c1010',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    const link = getAbsenLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Link Disalin!',
        timer: 1500,
        showConfirmButton: false,
      });
    });
  };

  const handleManualSave = async () => {
    if (!manualForm.asatidz_id || !manualForm.status) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Tidak Lengkap',
        text: 'Pilih asatidz dan status.',
        confirmButtonColor: '#7c1010',
      });
      return;
    }
    setSaving(true);
    try {
      const tanggalISO = today.toISOString().split('T')[0];
      const jam_masuk = manualForm.jam_masuk
        ? new Date(`${tanggalISO}T${manualForm.jam_masuk}:00`)
        : undefined;

      const res = await fetch('/api/presensi/asatidz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asatidz_id: manualForm.asatidz_id,
          tanggal: tanggalISO,
          status: manualForm.status,
          keterangan: manualForm.keterangan || null,
          jam_masuk: jam_masuk?.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan!',
        confirmButtonColor: '#7c1010',
      });
      setShowModal(false);
      setManualForm({ asatidz_id: '', status: 'hadir', keterangan: '', jam_masuk: '' });
      router.refresh();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: (err as Error).message,
        confirmButtonColor: '#7c1010',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatJam = (d: Date | null | string) => {
    if (!d) return '-';
    return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const absenLink = getAbsenLink();

  return (
    <>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #10b981 100%)", borderRadius: "24px", padding: "32px 36px", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.1)", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: 700, margin: 0 }}>Presensi Guru</h1>
          <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>Rekap kehadiran · {todayStr}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.2)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
            onClick={() => router.push('/presensi/asatidz/rekap')}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 9h18M9 4v5M15 4v5" />
            </svg>
            Rekap Bulanan
          </button>
          <button style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.2)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Input Manual
          </button>
          <button
            style={{ background: "#ffffff", color: "#10b981", padding: "10px 18px", borderRadius: "14px", border: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
            onClick={handleGenerateToken}
            disabled={generating}
          >
            {generating ? (
              <span
                className="spinner"
                style={{ borderTopColor: '#5a0a0a', borderColor: 'rgba(90,10,10,0.2)' }}
              />
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            Generate Token
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Link Absen Banner */}
        {token && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fef9ec, #fff8e7)',
              border: '1px solid rgba(201,152,58,0.35)',
              borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#c9983a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 6,
                  }}
                >
                   Link Absensi Hari Ini
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <code
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#7c1010',
                      background: 'rgba(124,16,16,0.08)',
                      padding: '5px 14px',
                      borderRadius: 8,
                    }}
                  >
                    TOKEN: {token.token}
                  </code>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    Expired tengah malam
                  </span>
                </div>
                {absenLink && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      marginTop: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    {absenLink}
                  </div>
                )}
              </div>
              <button style={{ background: "#c9983a", color: "white", padding: "10px 18px", borderRadius: "14px", border: "none", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }} onClick={handleCopyLink}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="white" strokeWidth="2" />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
                Salin Link
              </button>
            </div>
          </div>
        )}

        {!token && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              textAlign: 'center',
              borderRadius: "24px", padding: "24px", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
            }}
          >
            <p style={{ color: '#b91c1c', fontSize: 14, fontWeight: 600 }}>
              Belum ada token untuk hari ini. Klik <strong>Generate Token</strong> untuk membuat link absensi.
            </p>
          </div>
        )}

        {/* Statistik */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          {([
            { label: 'Hadir', value: stats.hadir, color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: 'Telat', value: stats.telat, color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
            { label: 'Sakit', value: stats.sakit, color: '#d97706', bg: '#fef9c3', border: '#fde047' },
            { label: 'Izin', value: stats.izin, color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
            { label: 'Alpha', value: stats.alpha, color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
            { label: 'Belum Absen', value: stats.belum, color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
          ] as const).map((s) => (
            <div
              key={s.label}
              style={{
                padding: '24px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                textAlign: 'center',
                borderRadius: "24px",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 6 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabel sudah absen */}
        <div style={{ background: "white", borderRadius: "24px", padding: "0", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e5e2db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="card-title" style={{ marginBottom: 0 }}>
              Sudah Absen
              <span
                style={{
                  marginLeft: 8,
                  background: '#f0fdf4',
                  color: '#16a34a',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {presensiHariIni.length}
              </span>
            </div>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>Jam Masuk</th>
                  <th>Status</th>
                  <th>Metode</th>
                  <th>Lokasi GPS</th>
                </tr>
              </thead>
              <tbody>
                {presensiHariIni.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}
                    >
                      Belum ada yang absen hari ini
                    </td>
                  </tr>
                ) : (
                  presensiHariIni.map((p, i) => (
                    <tr key={p.id} style={{ transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ color: '#9ca3af', fontWeight: 600, width: 48, padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>{i + 1}</td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: 700 }}>{p?.pegawai?.nama_lengkap}</div>
                        {p.pegawai.jabatan && (
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.pegawai.jabatan}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>{formatJam(p.jam_masuk)}</td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                      </td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <span
                          className="badge"
                          style={{
                            background: p.metode === 'link' ? '#ede9fe' : '#e0f2fe',
                            color: p.metode === 'link' ? '#6d28d9' : '#0369a1',
                          }}
                        >
                          {p.metode}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        {p.lat && p.lng ? (
                          <a
                            href={`https://maps.google.com/?q=${p.lat},${p.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#7c1010', fontWeight: 600, fontSize: 13 }}
                          >
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              style={{ verticalAlign: 'middle', marginRight: 4 }}
                            >
                              <path
                                stroke="currentColor"
                                strokeWidth="2"
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                              />
                            </svg>
                            Lihat Peta
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Belum absen */}
        {belumAbsen.length > 0 && (
          <div style={{ background: "white", borderRadius: "24px", padding: "0", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e2db' }}>
              <div className="card-title" style={{ marginBottom: 0, color: '#dc2626' }}>
                Belum Absen
                <span
                  style={{
                    marginLeft: 8,
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: 99,
                    padding: '2px 10px',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {belumAbsen.length}
                </span>
              </div>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                  </tr>
                </thead>
                <tbody>
                  {belumAbsen.map((a, i) => (
                    <tr key={a.id} style={{ transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ color: '#9ca3af', fontWeight: 600, width: 48, padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>{a.nama_lengkap}</td>
                      <td style={{ color: '#9ca3af', fontSize: 13, padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>{a.jabatan || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Input Manual */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div className="card-title" style={{ marginBottom: 0 }}>
                Input Manual Absensi
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 4,
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M18 6 6 18M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Guru</label>
              <select
                className="form-control"
                value={manualForm.asatidz_id}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, asatidz_id: e.target.value }))
                }
              >
                <option value="">— Pilih —</option>
                {allAsatidz.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={manualForm.status}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="hadir">Hadir</option>
                <option value="sakit">Sakit</option>
                <option value="izin">Izin</option>
                <option value="alpha">Alpha</option>
                <option value="telat">Telat</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jam Masuk</label>
              <input
                type="time"
                className="form-control"
                value={manualForm.jam_masuk}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, jam_masuk: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Opsional..."
                value={manualForm.keterangan}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, keterangan: e.target.value }))
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                style={{ background: "#10b981", color: "white", padding: "10px 18px", borderRadius: "14px", border: "none", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center" }}
                onClick={handleManualSave}
                disabled={saving}
              >
                {saving ? <span className="spinner" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
