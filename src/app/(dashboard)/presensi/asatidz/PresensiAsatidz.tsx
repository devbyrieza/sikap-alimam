'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import type { PresensiItem } from './page';
import {
  UserCheck,
  Calendar,
  Key,
  Copy,
  Plus,
  BarChart3,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  RefreshCw,
  X
} from 'lucide-react';

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
        html: `Token: <code style="font-weight:700;color:#550000;background:#fdf8f0;padding:4px 8px;border-radius:6px;border:1px solid #ebdcc3">${data.token}</code>`,
        confirmButtonColor: '#550000',
      });
      router.refresh();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: (err as Error).message,
        confirmButtonColor: '#550000',
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
        text: 'Pilih guru dan status.',
        confirmButtonColor: '#550000',
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
        confirmButtonColor: '#550000',
      });
      setShowModal(false);
      setManualForm({ asatidz_id: '', status: 'hadir', keterangan: '', jam_masuk: '' });
      router.refresh();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: (err as Error).message,
        confirmButtonColor: '#550000',
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
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Guru &amp; Asatidz Attendance</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <UserCheck size={26} color="#ddc192" /> Presensi Asatidz &amp; Guru
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Pantau dan kelola kehadiran harian dewan guru · {todayStr}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <button
            style={{ background: "rgba(253,248,240,0.15)", color: "#fdf8f0", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(221,193,146,0.35)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => router.push('/presensi/asatidz/rekap')}
          >
            <BarChart3 size={16} color="#ddc192" />
            Rekap Bulanan
          </button>
          <button
            style={{ background: "rgba(253,248,240,0.15)", color: "#fdf8f0", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(221,193,146,0.35)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} color="#ddc192" />
            Input Manual
          </button>
          <button
            style={{ background: "#ddc192", color: "#550000", padding: "10px 18px", borderRadius: "14px", border: "none", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            onClick={handleGenerateToken}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Key size={16} />
            )}
            Generate Token
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Link Absen Banner */}
        {token ? (
          <div
            style={{
              background: "white",
              border: "1px solid #ebdcc3",
              borderRadius: "20px",
              padding: "22px 24px",
              boxShadow: "0 2px 12px rgba(85,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#550000",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Key size={14} color="#ddc192" />
                  Link &amp; Token Absensi Hari Ini
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <code
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#550000",
                      background: "#fdf8f0",
                      padding: "6px 14px",
                      borderRadius: 10,
                      border: "1px solid #ebdcc3",
                    }}
                  >
                    TOKEN: {token.token}
                  </code>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    Expired tengah malam (23:59 WIB)
                  </span>
                </div>
                {absenLink && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 6,
                      wordBreak: "break-all",
                      fontWeight: 500,
                    }}
                  >
                    {absenLink}
                  </div>
                )}
              </div>
              <button
                style={{
                  background: "#550000",
                  color: "#fdf8f0",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={handleCopyLink}
              >
                <Copy size={15} color="#ddc192" />
                Salin Link
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              textAlign: "center",
              borderRadius: "20px",
              padding: "20px 24px",
            }}
          >
            <p style={{ color: "#9f1239", fontSize: 14, fontWeight: 700, margin: 0 }}>
              Belum ada token untuk hari ini. Klik tombol <strong>Generate Token</strong> di atas untuk mengaktifkan link absensi mandiri asatidz.
            </p>
          </div>
        )}

        {/* Statistik */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
          }}
        >
          {([
            { label: "Hadir", value: stats.hadir, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
            { label: "Telat", value: stats.telat, color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
            { label: "Sakit", value: stats.sakit, color: "#a16207", bg: "#fefce8", border: "#fef08a" },
            { label: "Izin", value: stats.izin, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
            { label: "Alpha", value: stats.alpha, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
            { label: "Belum Absen", value: stats.belum, color: "#550000", bg: "#fdf8f0", border: "#ebdcc3" },
          ] as const).map((s) => (
            <div
              key={s.label}
              style={{
                padding: "16px 18px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                textAlign: "center",
                borderRadius: "16px",
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabel sudah absen */}
        <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #f5ede1",
              background: "#fdfcf9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color="#ddc192" />
              Sudah Absen Hari Ini
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  borderRadius: 99,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  border: "1px solid #bbf7d0",
                }}
              >
                {presensiHariIni.length}
              </span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ fontSize: 13, width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 50 }}>#</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Nama Guru</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 120 }}>Jam Masuk</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 120 }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 120 }}>Metode</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 140 }}>Lokasi GPS</th>
                </tr>
              </thead>
              <tbody>
                {presensiHariIni.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}
                    >
                      Belum ada asatidz yang absen hari ini.
                    </td>
                  </tr>
                ) : (
                  presensiHariIni.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid #f5ede1",
                        background: i % 2 === 0 ? "white" : "#fdfcf9",
                      }}
                    >
                      <td style={{ padding: "14px 16px", color: "#550000", fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{p?.pegawai?.nama_lengkap}</div>
                        {p.pegawai.jabatan && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>{p.pegawai.jabatan}</div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a1a" }}>{formatJam(p.jam_masuk)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 14,
                            background: p.status === 'hadir' ? '#f0fdf4' : p.status === 'telat' ? '#fff7ed' : '#fef2f2',
                            color: p.status === 'hadir' ? '#15803d' : p.status === 'telat' ? '#c2410c' : '#b91c1c',
                            border: `1px solid ${p.status === 'hadir' ? '#bbf7d0' : p.status === 'telat' ? '#fed7aa' : '#fecaca'}`,
                            textTransform: "capitalize",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 14,
                            background: p.metode === "link" ? "#fdf8f0" : "#eff6ff",
                            color: p.metode === "link" ? "#550000" : "#1d4ed8",
                            border: `1px solid ${p.metode === "link" ? "#ebdcc3" : "#bfdbfe"}`,
                            textTransform: "uppercase",
                          }}
                        >
                          {p.metode}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {p.lat && p.lng ? (
                          <a
                            href={`https://maps.google.com/?q=${p.lat},${p.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#550000", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                          >
                            <MapPin size={14} color="#ddc192" />
                            Lihat Peta
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>
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
          <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f5ede1",
                background: "#fdfcf9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#b91c1c" />
                Belum Absen Hari Ini
                <span
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    borderRadius: 99,
                    padding: "2px 10px",
                    fontSize: 12,
                    fontWeight: 800,
                    border: "1px solid #fecaca",
                  }}
                >
                  {belumAbsen.length}
                </span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ fontSize: 13, width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 50 }}>#</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Nama Guru</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Jabatan / Penugasan</th>
                  </tr>
                </thead>
                <tbody>
                  {belumAbsen.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: "1px solid #f5ede1",
                        background: i % 2 === 0 ? "white" : "#fdfcf9",
                      }}
                    >
                      <td style={{ padding: "14px 16px", color: "#550000", fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a1a" }}>{a.nama_lengkap}</td>
                      <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 600 }}>{a.jabatan || '—'}</td>
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
            background: 'rgba(85,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{ background: "white", borderRadius: "24px", padding: "28px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #ebdcc3", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #f5ede1',
                paddingBottom: 14,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#550000" }}>
                Input Manual Absensi Guru
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#fdf8f0',
                  border: '1px solid #ebdcc3',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: '#550000',
                  padding: 6,
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Nama Guru</label>
              <select
                style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
                value={manualForm.asatidz_id}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, asatidz_id: e.target.value }))
                }
              >
                <option value="">— Pilih Guru —</option>
                {allAsatidz.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Status Kehadiran</label>
              <select
                style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Jam Masuk</label>
              <input
                type="time"
                style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
                value={manualForm.jam_masuk}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, jam_masuk: e.target.value }))
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#550000" }}>Keterangan</label>
              <textarea
                rows={3}
                placeholder="Catatan / alasan izin/sakit..."
                style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", resize: "vertical" }}
                value={manualForm.keterangan}
                onChange={(e) =>
                  setManualForm((f) => ({ ...f, keterangan: e.target.value }))
                }
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                style={{ flex: 1, padding: "11px 18px", borderRadius: "14px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#550000", fontWeight: 700, cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: "11px 18px", borderRadius: "14px", border: "none", background: "#550000", color: "#fdf8f0", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={handleManualSave}
                disabled={saving}
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
