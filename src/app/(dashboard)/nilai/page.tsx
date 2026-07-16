'use client';

import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

interface Kelas {
  id: string;
  nama: string;
  jenjang?: string;
}

interface MapelItem {
  id: string;
  nama: string;
}

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
}

interface NilaiRow {
  santri_id: string;
  nilai: number | '';
  keterangan: string;
}

const JENIS_NILAI = ['harian', 'uts', 'uas', 'praktik', 'tugas'];
const SEMESTER_LIST = ['1', '2'];
const TAHUN_AJARAN_LIST = ['2024/2025', '2025/2026', '2026/2027'];

export default function InputNilaiPage() {
  const [step, setStep] = useState(1);
  const [kelas_id, setKelasId] = useState('');
  const [mapel_id, setMapelId] = useState('');
  const [jenis, setJenis] = useState('harian');
  const [semester, setSemester] = useState('1');
  const [tahun_ajaran, setTahunAjaran] = useState('2025/2026');

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [nilaiRows, setNilaiRows] = useState<NilaiRow[]>([]);
  const [existing, setExisting] = useState<Record<string, { nilai: number; keterangan: string }>>({});

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingMapel, setLoadingMapel] = useState(false);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setLoadingMapel(true);
    setMapelId('');
    fetch(`/api/master/mapel?kelas_id=${kelas_id}`)
      .then((r) => r.json())
      .then((d) => setMapelList(d.mapel || []))
      .catch(() => {})
      .finally(() => setLoadingMapel(false));
  }, [kelas_id]);

  // Fetch santri + nilai existing saat step 2
  const fetchStep2 = useCallback(async () => {
    if (!kelas_id || !mapel_id || !semester || !jenis || !tahun_ajaran) return;
    setLoadingSantri(true);
    try {
      const [santriRes, nilaiRes] = await Promise.all([
        fetch(`/api/master/santri?kelas_id=${kelas_id}`),
        fetch(
          `/api/nilai?mapel_id=${mapel_id}&kelas_id=${kelas_id}&semester=${semester}&jenis=${jenis}&tahun_ajaran=${encodeURIComponent(tahun_ajaran)}`
        ),
      ]);
      const santriData = await santriRes.json();
      const nilaiData = await nilaiRes.json();

      const santri: Santri[] = santriData.santri || [];
      setSantriList(santri);

      // Map existing nilai
      const existMap: Record<string, { nilai: number; keterangan: string }> = {};
      (
        nilaiData.nilai || []
      ).forEach(
        (n: { santri: { id: string }; nilai: number; keterangan: string }) => {
          existMap[n.santri.id] = { nilai: n.nilai, keterangan: n.keterangan || '' };
        }
      );
      setExisting(existMap);

      setNilaiRows(
        santri.map((s) => ({
          santri_id: s.id,
          nilai: existMap[s.id]?.nilai ?? '',
          keterangan: existMap[s.id]?.keterangan ?? '',
        }))
      );
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: 'Gagal mengambil data santri atau nilai.',
        confirmButtonColor: '#7c1010',
      });
    } finally {
      setLoadingSantri(false);
    }
  }, [kelas_id, mapel_id, semester, jenis, tahun_ajaran]);

  useEffect(() => {
    if (step === 2) fetchStep2();
  }, [step, fetchStep2]);

  const handleNilaiChange = (index: number, value: string) => {
    const num = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
    setNilaiRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, nilai: num } : r))
    );
  };

  const handleKetChange = (index: number, value: string) => {
    setNilaiRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, keterangan: value } : r))
    );
  };

  const getNilaiClass = (nilai: number | '') => {
    if (nilai === '') return 'nilai-input';
    return nilai >= 75 ? 'nilai-input lulus' : 'nilai-input tidak-lulus';
  };

  const rataRata = () => {
    const vals = nilaiRows.map((r) => r.nilai).filter((v): v is number => v !== '');
    if (vals.length === 0) return '0.0';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const rataRataNum = () => parseFloat(rataRata());

  const handleSimpan = async () => {
    const items = nilaiRows
      .filter((r) => r.nilai !== '')
      .map((r) => ({
        santri_id: r.santri_id,
        nilai: r.nilai as number,
        keterangan: r.keterangan,
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Ada Nilai',
        text: 'Isi minimal satu nilai terlebih dahulu.',
        confirmButtonColor: '#7c1010',
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Simpan Semua Nilai?',
      html: `<b>${items.length}</b> nilai akan disimpan untuk mapel <b>${mapelList.find((m) => m.id === mapel_id)?.nama}</b>`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#7c1010',
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch('/api/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, mapel_id, kelas_id, semester, jenis, tahun_ajaran }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire({
        icon: 'success',
        title: 'Nilai Tersimpan!',
        html: `<b>${data.count}</b> nilai berhasil disimpan.`,
        confirmButtonColor: '#7c1010',
      });
      fetchStep2();
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

  const selectedKelasNama = kelasList.find((k) => k.id === kelas_id)?.nama || '';
  const selectedMapelNama = mapelList.find((m) => m.id === mapel_id)?.nama || '';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Input Nilai Santri</h1>
          <p>
            {step === 1
              ? 'Langkah 1: Pilih parameter penilaian'
              : `${selectedMapelNama} · ${jenis.toUpperCase()} · Semester ${semester} · ${tahun_ajaran}`}
          </p>
        </div>
        {step === 2 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
            Kembali
          </button>
        )}
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── STEP 1: Pilih Parameter ─────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-title">Parameter Penilaian</div>

            <div className="form-group">
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

            <div className="form-group">
              <label className="form-label">Mata Pelajaran</label>
              <select
                className="form-control"
                value={mapel_id}
                onChange={(e) => setMapelId(e.target.value)}
                disabled={!kelas_id || loadingMapel}
              >
                <option value="">— Pilih Mapel —</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
              {loadingMapel && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Memuat mata pelajaran...
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Jenis Nilai</label>
                <select
                  className="form-control"
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                >
                  {JENIS_NILAI.map((j) => (
                    <option key={j} value={j}>
                      {j.toUpperCase()}
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
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
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

            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!kelas_id || !mapel_id}
                onClick={() => setStep(2)}
              >
                Lanjut Input Nilai
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M9 18l6-6-6-6"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Input Nilai ──────────────────────────────────────── */}
        {step === 2 && (
          <>
            {/* Info banner */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Kelas', value: selectedKelasNama },
                { label: 'Mapel', value: selectedMapelNama },
                { label: 'Jenis', value: jenis.toUpperCase() },
                { label: 'Semester', value: `Sem ${semester}` },
                { label: 'Tahun', value: tahun_ajaran },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e2db',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>{item.label}: </span>
                  <span style={{ fontWeight: 700, color: '#7c1010' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 0 }}>
              {/* Header tabel */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e5e2db',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Daftar Santri
                  <span
                    style={{
                      marginLeft: 8,
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: 99,
                      padding: '2px 10px',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {santriList.length}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Rata-rata Kelas:{' '}
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 20,
                      color: rataRataNum() >= 75 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {rataRata()}
                  </span>
                </div>
              </div>

              {loadingSantri ? (
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
                  Memuat data santri...
                </div>
              ) : (
                <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Nama Santri</th>
                        <th style={{ width: 100 }}>NIS</th>
                        <th style={{ textAlign: 'center', width: 110 }}>Nilai</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.map((santri, i) => {
                        const row = nilaiRows[i];
                        const isExisting = !!existing[santri.id];
                        return (
                          <tr key={santri.id}>
                            <td style={{ color: '#9ca3af', fontWeight: 600 }}>{i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{santri.nama_lengkap}</div>
                              {isExisting && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#c9983a',
                                    fontWeight: 700,
                                  }}
                                >
                                   Sudah ada nilai
                                </div>
                              )}
                            </td>
                            <td style={{ color: '#9ca3af', fontSize: 13 }}>
                              {santri.nis || '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className={getNilaiClass(row?.nilai ?? '')}
                                value={row?.nilai ?? ''}
                                onChange={(e) => handleNilaiChange(i, e.target.value)}
                                placeholder="—"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                style={{ padding: '6px 10px', fontSize: 13 }}
                                placeholder="Opsional"
                                value={row?.keterangan ?? ''}
                                onChange={(e) => handleKetChange(i, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {santriList.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                            Tidak ada santri di kelas ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {santriList.length > 0 && (
                      <tfoot>
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              padding: '12px 16px',
                              background: '#f8f7f4',
                              color: '#6b7280',
                            }}
                          >
                            Rata-rata Kelas
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: 18,
                              background: '#f8f7f4',
                              color: rataRataNum() >= 75 ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {rataRata()}
                          </td>
                          <td style={{ background: '#f8f7f4' }} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Footer actions */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e5e2db',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                }}
              >
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  Kembali
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSimpan}
                  disabled={saving || loadingSantri}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Simpan Semua Nilai
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
