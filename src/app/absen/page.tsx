'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

interface Asatidz {
  id: string;
  nama_lengkap: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jabatan?: string;
}

interface TokenData {
  valid: boolean;
  tanggal: string;
  asatidz: Asatidz[];
}

interface SuccessData {
  nama: string;
  jam_masuk: string;
  status: string;
}

export default function AbsenPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedAsatidz, setSelectedAsatidz] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateToken = useCallback(async () => {
    if (!token) {
      setError('Link absensi tidak valid. Hubungi admin untuk mendapatkan link yang benar.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/absen?t=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Token tidak valid atau sudah kadaluarsa.');
      } else {
        setTokenData(data);
      }
    } catch {
      setError('Gagal memverifikasi link. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleAmbilGPS = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'GPS Tidak Didukung',
        text: 'Browser Anda tidak mendukung GPS.',
        confirmButtonColor: '#7c1010' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Lokasi Ditemukan!',
          text: `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`,
          confirmButtonColor: '#7c1010',
          timer: 2000,
          showConfirmButton: false });
      },
      (err) => {
        setGpsLoading(false);
        Swal.fire({
          icon: 'warning',
          title: 'GPS Gagal',
          text: err.message,
          confirmButtonColor: '#7c1010' });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsatidz) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Nama',
        text: 'Silakan pilih nama Anda terlebih dahulu.',
        confirmButtonColor: '#7c1010' });
      return;
    }

    setSubmitting(true);

    try {
      let foto_url: string | null = null;
      if (foto && fotoPreview) {
        foto_url = fotoPreview;
      }

      const res = await fetch(`/api/absen?t=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asatidz_id: selectedAsatidz,
          lat: gpsCoords?.lat ?? null,
          lng: gpsCoords?.lng ?? null,
          foto_url }) });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Absen',
          text: data.error,
          confirmButtonColor: '#7c1010' });
      } else {
        setSuccessData(data);
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan. Coba lagi.',
        confirmButtonColor: '#7c1010' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTanggal = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric' });
  };

  const formatJam = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #5a0a0a 0%, #7c1010 40%, #3d0505 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" };

  // Loading state
  if (loading) {
    return (
      <div style={pageStyle}>
        <div className="absen-card animate-fade-up" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <div
              className="spinner"
              style={{
                margin: '0 auto',
                borderTopColor: '#7c1010',
                borderColor: 'rgba(124,16,16,0.2)',
                width: 40,
                height: 40,
                borderWidth: 3 }}
            />
          </div>
          <p style={{ color: '#6b7280', fontWeight: 600 }}>Memverifikasi link absensi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={pageStyle}>
        <div className="absen-card animate-fade-up">
          <div className="absen-header">
            <div
              className="logo-box"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
            >
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                />
              </svg>
            </div>
            <h1 style={{ color: '#dc2626' }}>Link Tidak Valid</h1>
            <p>{error}</p>
          </div>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '16px 20px',
              textAlign: 'center' }}
          >
            <p style={{ fontSize: 14, color: '#b91c1c', fontWeight: 500 }}>
              Silakan hubungi Admin untuk mendapatkan link absensi yang valid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (successData) {
    const isHadir = successData.status === 'hadir';
    return (
      <div style={pageStyle}>
        <div className="absen-card animate-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: isHadir
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #d97706, #b45309)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isHadir
                  ? '0 8px 24px rgba(22,163,74,0.4)'
                  : '0 8px 24px rgba(217,119,6,0.4)' }}
              className="animate-pulse-ring"
            >
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6 9 17l-5-5"
                />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>
              Absensi Berhasil!
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              Jazakumullahu khairan
            </p>
          </div>

          <div
            style={{
              background: '#f8f7f4',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14 }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Nama</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                {successData.nama}
              </span>
            </div>
            <div style={{ borderTop: '1px solid #e5e2db' }} />
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Jam Masuk</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                {formatJam(successData.jam_masuk)}
              </span>
            </div>
            <div style={{ borderTop: '1px solid #e5e2db' }} />
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Status</span>
              <span
                className={`badge badge-${successData.status}`}
                style={{ textTransform: 'capitalize' }}
              >
                {successData.status === 'hadir' ? ' Hadir' : ' Telat'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  const today = tokenData?.tanggal
    ? formatTanggal(tokenData.tanggal)
    : new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric' });

  return (
    <div style={pageStyle}>
      <div className="absen-card animate-fade-up">
        {/* Header */}
        <div className="absen-header">
          <div className="logo-box">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
              />
            </svg>
          </div>
          <h1>Absensi Asatidz</h1>
          <p>Pesantren Al-Imam Al-Islami</p>
          <div
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(124,16,16,0.08), rgba(201,152,58,0.12))',
              border: '1px solid rgba(201,152,58,0.3)',
              borderRadius: 8,
              padding: '6px 14px',
              marginTop: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#7c1010' }}
          >
            {today}
          </div>
        </div>

        {/* Dropdown Asatidz */}
        <div className="form-group">
          <label className="form-label">
            Nama Anda <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            className="form-control"
            value={selectedAsatidz}
            onChange={(e) => setSelectedAsatidz(e.target.value)}
          >
            <option value="">— Pilih Nama —</option>
            {tokenData?.asatidz.map((a) => (
              <option key={a.id} value={a.id}>
                {a.gelar_depan ? `${a.gelar_depan} ` : ''}
                {a.nama_lengkap}
                {a.gelar_belakang ? `, ${a.gelar_belakang}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* GPS */}
        <div className="form-group">
          <label className="form-label">Lokasi GPS (Opsional)</label>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAmbilGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <span
                className="spinner"
                style={{
                  borderTopColor: '#7c1010',
                  borderColor: 'rgba(124,16,16,0.2)' }}
              />
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            {gpsLoading ? 'Mengambil Lokasi...' : 'Ambil Lokasi GPS'}
          </button>
          {gpsCoords && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 14px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: 13,
                color: '#15803d',
                fontWeight: 600 }}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                style={{ verticalAlign: 'middle', marginRight: 4 }}
              >
                <path
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6 9 17l-5-5"
                />
              </svg>
              Lat: {gpsCoords.lat.toFixed(6)}, Lng: {gpsCoords.lng.toFixed(6)}
            </div>
          )}
        </div>

        {/* Foto */}
        <div className="form-group">
          <label className="form-label">Foto Selfie (Opsional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoChange}
            style={{ display: 'none' }}
            id="foto-input"
          />
          <label
            htmlFor="foto-input"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
            {foto ? foto.name : 'Pilih / Ambil Foto'}
          </label>
          {fotoPreview && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoPreview}
                alt="Preview foto selfie"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid #e5e2db',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary btn-lg"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: 8,
            background: 'linear-gradient(135deg, #7c1010, #a31515)' }}
          onClick={handleSubmit}
          disabled={submitting || !selectedAsatidz}
        >
          {submitting ? (
            <span className="spinner" />
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {submitting ? 'Mengirim...' : 'Kirim Absensi'}
        </button>
      </div>
    </div>
  );
}
