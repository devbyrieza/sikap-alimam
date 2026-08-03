"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  ClipboardCheck,
  Loader2,
  Save,
  Users,
  CheckCircle,
  BookOpen,
  Lightbulb
} from "lucide-react";

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

// 1 Santri akan punya 1 object ini
interface CapaianNilai {
  harian: string;
  kompetensi: string;
  sikap: string;
  ujian: string; // Menyimpan nilai ujian sesuai periode aktif (PTS/PAS)
}

const SEMESTER_LIST = ["Ganjil", "Genap"];
const TAHUN_AJARAN_LIST = ["2026/2027", "2027/2028"];

export default function InputNilaiPage() {
  const [step, setStep] = useState(1);
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelas_id, setKelasId] = useState("");
  const [mapel_id, setMapelId] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahun_ajaran, setTahunAjaran] = useState("2026/2027");
  const [periode, setPeriode] = useState("PTS"); // PTS | PAS

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  
  // State Input per Santri (Map)
  const [inputData, setInputData] = useState<Record<string, CapaianNilai>>({});

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingMapel, setLoadingMapel] = useState(false);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch kelas
  useEffect(() => {
    fetch("/api/master/kelas")
      .then((r) => r.json())
      .then((d) => {
        setKelasList(d.kelas || []);
        setFilteredKelasList(d.kelas || []);
      })
      .catch(() => {})
      .finally(() => setLoadingKelas(false));
  }, []);

  // Filter kelas when jenjang changes
  useEffect(() => {
    if (!jenjangFilter) {
      setFilteredKelasList(kelasList);
    } else {
      setFilteredKelasList(kelasList.filter(k => k.jenjang === jenjangFilter));
    }
    // Auto reset kelas_id if it's no longer in the list
    if (kelas_id) {
      const exists = kelasList.find(k => k.id === kelas_id && (!jenjangFilter || k.jenjang === jenjangFilter));
      if (!exists) setKelasId("");
    }
  }, [jenjangFilter, kelasList]);

  // Fetch mapel saat kelas berubah
  useEffect(() => {
    if (!kelas_id) {
      setMapelList([]);
      return;
    }
    setLoadingMapel(true);
    setMapelId("");
    fetch(`/api/master/mapel?kelas_id=${kelas_id}`)
      .then((r) => r.json())
      .then((d) => setMapelList(d.mapel || []))
      .catch(() => {})
      .finally(() => setLoadingMapel(false));
  }, [kelas_id]);

  // AUTOSAVE: Load Draft from localStorage on mount (for Step 2)
  useEffect(() => {
    if (step === 2) {
      try {
        const draft = localStorage.getItem("nilai_form_draft");
        if (draft) {
          const parsed = JSON.parse(draft);
          if (
            parsed.kelas === kelas_id &&
            parsed.mapel === mapel_id &&
            parsed.semester === semester &&
            parsed.tahun === tahun_ajaran &&
            parsed.periode === periode
          ) {
            setInputData(parsed.data);
          }
        }
      } catch (e) {
        console.error("Gagal parse draft nilai", e);
      }
    }
  }, [step, kelas_id, mapel_id, semester, tahun_ajaran]);

  // AUTOSAVE: Save to localStorage whenever inputData changes
  useEffect(() => {
    if (step === 2 && Object.keys(inputData).length > 0) {
      localStorage.setItem(
        "nilai_form_draft",
        JSON.stringify({
          kelas: kelas_id,
          mapel: mapel_id,
          semester: semester,
          tahun: tahun_ajaran,
          periode: periode,
          data: inputData,
        })
      );
    }
  }, [inputData, step, kelas_id, mapel_id, semester, tahun_ajaran, periode]);

  // Fetch santri + nilai existing saat step 2
  const fetchStep2 = useCallback(async () => {
    if (!kelas_id || !mapel_id || !semester || !tahun_ajaran) return;
    setLoadingSantri(true);
    try {
      const [santriRes, nilaiRes] = await Promise.all([
        fetch(`/api/master/santri?kelas_id=${kelas_id}`),
        fetch(
          `/api/nilai?mapel_id=${mapel_id}&kelas_id=${kelas_id}&semester=${semester}&tahun_ajaran=${encodeURIComponent(
            tahun_ajaran
          )}`
        ),
      ]);
      const santriData = await santriRes.json();
      const nilaiData = await nilaiRes.json();

      const santri: Santri[] = santriData.santri || [];
      setSantriList(santri);

      // Cek Draft
      const draftStr = localStorage.getItem("nilai_form_draft");
      let draftData: Record<string, CapaianNilai> = {};
      if (draftStr) {
        try {
          const parsed = JSON.parse(draftStr);
          if (
            parsed.kelas === kelas_id &&
            parsed.mapel === mapel_id &&
            parsed.semester === semester &&
            parsed.tahun === tahun_ajaran &&
            parsed.periode === periode
          ) {
            draftData = parsed.data;
          }
        } catch (e) {}
      }

      const map: Record<string, CapaianNilai> = { ...draftData };

      // Map existing nilai from DB based on periode
      const dbMap: Record<string, Record<string, string>> = {};
      (nilaiData.nilai || []).forEach((n: any) => {
        if (!dbMap[n.santri.id]) dbMap[n.santri.id] = {};
        dbMap[n.santri.id][n.jenis] = String(n.nilai);
      });

      santri.forEach((s) => {
        if (!map[s.id]) {
          const sDb = dbMap[s.id] || {};
          
          // Map correctly depending on periode
          const suffix = periode === "PTS" ? "_pts" : "_pas";
          const harian = sDb[`harian${suffix}`] || "";
          const kompetensi = sDb[`kompetensi${suffix}`] || "";
          const sikap = sDb[`sikap${suffix}`] || "";
          const ujian = sDb[periode.toLowerCase()] || "";

          map[s.id] = {
            harian,
            kompetensi,
            sikap,
            ujian,
          };
        }
      });
      setInputData(map);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data";
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setLoadingSantri(false);
    }
  }, [kelas_id, mapel_id, semester, tahun_ajaran, periode]);

  useEffect(() => {
    if (step === 2) fetchStep2();
  }, [step, fetchStep2]);

  const handleInputChange = (
    santriId: string,
    field: keyof CapaianNilai,
    value: string
  ) => {
    // Hanya izinkan angka dan kosong
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setInputData((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: String(num),
      },
    }));
  };

  const hitungNilaiAkhir = (data: CapaianNilai) => {
    const h = Number(data.harian) || 0;
    const k = Number(data.kompetensi) || 0;
    const s = Number(data.sikap) || 0;
    const u = Number(data.ujian) || 0;
    
    // Jika semua kosong, return null
    if (!data.harian && !data.kompetensi && !data.sikap && !data.ujian) return null;

    return (0.3 * h + 0.2 * k + 0.1 * s + 0.4 * u).toFixed(1);
  };

  const handleSimpan = async () => {
    // Siapkan data untuk bulk upsert
    const dataToSave = santriList.map((s) => ({
      santri_id: s.id,
      nilai: inputData[s.id],
    })).filter(item => 
      // Filter hanya jika minimal 1 kolom terisi
      item.nilai.harian || item.nilai.kompetensi || item.nilai.sikap || item.nilai.ujian
    );

    if (dataToSave.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Nilai",
        text: "Isi minimal satu nilai terlebih dahulu sebelum menyimpan.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Simpan Semua Nilai?",
      html: `Menyimpan data nilai untuk <b>${dataToSave.length}</b> santri.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "var(--primary)",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch("/api/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataToSave,
          mapel_id,
          kelas_id,
          semester,
          tahun_ajaran,
          periode: periode.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Clear draft on success
      localStorage.removeItem("nilai_form_draft");

      Swal.fire({
        icon: "success",
        title: "Nilai Tersimpan!",
        html: `<b>${data.count}</b> sel nilai berhasil disimpan/diperbarui.`,
        confirmButtonColor: "var(--primary)",
      });
      fetchStep2();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedKelasNama = kelasList.find((k) => k.id === kelas_id)?.nama || "";
  const selectedMapelNama = mapelList.find((m) => m.id === mapel_id)?.nama || "";

  return (
    <>
      <div className="page-header">
        <div>
          <h1><BookOpen size={16} className="inline mr-1" /> Input Nilai Santri</h1>
          <p>
            {step === 1
              ? "Buku nilai kepadatan tinggi (High-Density Gradebook)"
              : `${selectedMapelNama} · Kelas ${selectedKelasNama} · Semester ${semester} · ${tahun_ajaran}`}
          </p>
        </div>
        {step === 2 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>
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

      <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto w-full flex flex-col gap-5 pb-28 sm:pb-10">
        {/* ── STEP 1: Pilih Parameter ─────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ maxWidth: 640 }}>
            <p className="card-title">
              <Users size={16} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
              Parameter Penilaian
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Periode Penilaian</label>
                <select
                  className="form-control"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                >
                  <option value="PTS">Tengah Semester (PTS)</option>
                  <option value="PAS">Akhir Semester (PAS)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-group">
                <label className="form-label">Jenjang</label>
                <select
                  className="form-control"
                  value={jenjangFilter}
                  onChange={(e) => setJenjangFilter(e.target.value)}
                  disabled={loadingKelas}
                >
                  <option value="">— Semua Jenjang —</option>
                  <option value="MTs">MTs</option>
                  <option value="IL">IL</option>
                  <option value="MA">MA</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kelas</label>
                <select
                  className="form-control"
                  value={kelas_id}
                  onChange={(e) => setKelasId(e.target.value)}
                  disabled={loadingKelas || (jenjangFilter !== "" && filteredKelasList.length === 0)}
                >
                  <option value="">— Pilih Kelas —</option>
                  {filteredKelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    Memuat mata pelajaran...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                disabled={!kelas_id || !mapel_id}
                onClick={() => setStep(2)}
              >
                Lanjut ke Lembar Nilai
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ marginLeft: 6 }}>
                  <path stroke="white" strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Input Nilai High Density ────────────────────────── */}
        {step === 2 && (
          <>
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
            >
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(124,16,16,0.06)", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                  {selectedMapelNama}
                </div>
                <div style={{ background: "var(--bg-body)", padding: "4px 10px", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  Kelas {selectedKelasNama}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", background: "#f8fafc", padding: "4px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
                <Lightbulb size={12} style={{ color: "var(--warning)" }} /> Draft Autosave Aktif
              </div>
            </div>

            {/* Banner info on mobile (changed for new layout) */}
            <div className="md:hidden text-xs text-sky-700 bg-sky-50/95 border border-sky-200/80 px-4 py-3 rounded-2xl flex items-center gap-2.5 font-medium shadow-sm mb-4">
              <span className="text-lg">💡</span>
              <span><strong>Lebih Mudah!</strong> Isi nilai langsung pada kartu santri di bawah.</span>
            </div>

            {/* ── MOBILE CARD VIEW (Responsive) ── */}
            <div className="md:hidden flex flex-col gap-3 mb-4">
              {loadingSantri ? (
                <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />Memuat data...
                </div>
              ) : santriList.length === 0 ? (
                <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">Tidak ada santri di kelas ini</div>
              ) : (
                santriList.map((s, idx) => {
                  const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", ujian: "" };
                  const nilaiAkhir = hitungNilaiAkhir(data);
                  const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true;

                  return (
                    <div key={`mobile-${s.id}`} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col gap-4 relative" style={{ padding: "24px" }}>
                      
                      {/* Nilai Akhir Badge (Absolute to avoid squishing the name) */}
                      <div className="absolute top-5 right-5">
                        <div className={`px-3 py-2 rounded-xl text-xs font-black border flex flex-col items-center justify-center min-w-[54px] shadow-sm ${nilaiAkhir ? (isLulus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200') : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          <span style={{ fontSize: 9, opacity: 0.8, marginBottom: 2, letterSpacing: '0.05em' }}>AKHIR</span>
                          <span style={{ fontSize: 14 }}>{nilaiAkhir ? nilaiAkhir : "-"}</span>
                        </div>
                      </div>

                      <div className="border-b border-slate-100 pb-4 pr-16">
                        <div className="font-extrabold text-slate-800 text-base leading-snug mb-1">{s.nama_lengkap}</div>
                        <div className="text-xs text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">NIS: {s.nis || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                            <span>Harian</span>
                            <span className="text-[9px] text-[#9b1b22] bg-[#9b1b22]/10 px-1.5 py-0.5 rounded">(30%)</span>
                          </label>
                          <input type="number" inputMode="decimal" className="form-control" style={{ textAlign: "left", fontSize: 15, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }} placeholder="-" value={data.harian} onChange={(e) => handleInputChange(s.id, "harian", e.target.value)} />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                            <span>Komp.</span>
                            <span className="text-[9px] text-[#9b1b22] bg-[#9b1b22]/10 px-1.5 py-0.5 rounded">(20%)</span>
                          </label>
                          <input type="number" inputMode="decimal" className="form-control" style={{ textAlign: "left", fontSize: 15, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }} placeholder="-" value={data.kompetensi} onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)} />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                            <span>Sikap</span>
                            <span className="text-[9px] text-[#9b1b22] bg-[#9b1b22]/10 px-1.5 py-0.5 rounded">(10%)</span>
                          </label>
                          <input type="number" inputMode="decimal" className="form-control" style={{ textAlign: "left", fontSize: 15, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }} placeholder="-" value={data.sikap} onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)} />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                            <span className="truncate max-w-[60px]">{periode}</span>
                            <span className="text-[9px] text-[#9b1b22] bg-[#9b1b22]/10 px-1.5 py-0.5 rounded shrink-0">(40%)</span>
                          </label>
                          <input type="number" inputMode="decimal" className="form-control" style={{ textAlign: "left", fontSize: 15, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }} placeholder="-" value={data.ujian} onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── DESKTOP TABLE VIEW (Responsive) ── */}
            <div className="hidden md:block card shadow-sm" style={{ padding: 0, overflow: "hidden", marginBottom: 16, border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto overflow-y-visible" style={{ WebkitOverflowScrolling: "touch", position: "relative" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
                      {/* Sticky Index */}
                      <th style={{ position: "sticky", left: 0, zIndex: 25, background: "#f8fafc", padding: "12px 8px", textAlign: "center", width: 40, borderBottom: "1px solid var(--border)" }}>
                        No
                      </th>
                      {/* Sticky Nama Santri */}
                      <th style={{ position: "sticky", left: 40, zIndex: 25, background: "#f8fafc", padding: "12px 12px", textAlign: "left", minWidth: 160, maxWidth: 200, borderBottom: "1px solid var(--border)", borderRight: "1px solid #e2e8f0", boxShadow: "4px 0 6px -2px rgba(0,0,0,0.05)" }}>
                        Nama Santri
                      </th>
                      <th style={{ padding: "12px 6px", textAlign: "center", width: 85, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ marginBottom: 2, fontWeight: 700, color: "var(--text-main)" }}>Harian</div>
                        <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>(30%)</div>
                      </th>
                      <th style={{ padding: "12px 6px", textAlign: "center", width: 85, borderBottom: "1px solid var(--border)" }}>
                         <div style={{ marginBottom: 2, fontWeight: 700, color: "var(--text-main)" }}>Komp.</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>(20%)</div>
                      </th>
                      <th style={{ padding: "12px 6px", textAlign: "center", width: 85, borderBottom: "1px solid var(--border)" }}>
                         <div style={{ marginBottom: 2, fontWeight: 700, color: "var(--text-main)" }}>Sikap</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>(10%)</div>
                      </th>
                      <th style={{ padding: "12px 6px", textAlign: "center", width: 85, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ marginBottom: 2, fontWeight: 700, color: "var(--text-main)" }}>{periode}</div>
                        <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700 }}>(40%)</div>
                      </th>
                      <th style={{ padding: "12px 14px", textAlign: "right", width: 100, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ marginBottom: 2, fontWeight: 700, color: "var(--text-main)" }}>Nilai Akhir</div>
                        <div style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}>OTOMATIS</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSantri ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", color: "var(--primary)" }} />
                          Memuat lembar nilai...
                        </td>
                      </tr>
                    ) : santriList.length === 0 ? (
                       <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                          Tidak ada santri di kelas ini
                        </td>
                      </tr>
                    ) : (
                      santriList.map((s, idx) => {
                        const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", ujian: "" };
                        const nilaiAkhir = hitungNilaiAkhir(data);
                        const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true; // Asumsi KKM 80

                        return (
                          <tr
                            key={s.id}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              transition: "background 0.2s",
                            }}
                            className="hover:bg-slate-50/60"
                          >
                            {/* Sticky Index in Body */}
                            <td style={{ position: "sticky", left: 0, zIndex: 10, background: "#ffffff", padding: "10px 8px", fontSize: 13, color: "var(--text-muted)", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              {idx + 1}
                            </td>
                            {/* Sticky Nama Santri in Body */}
                            <td style={{ position: "sticky", left: 40, zIndex: 10, background: "#ffffff", padding: "10px 12px", minWidth: 160, maxWidth: 200, borderBottom: "1px solid var(--border)", borderRight: "1px solid #e2e8f0", boxShadow: "4px 0 6px -2px rgba(0,0,0,0.05)" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }} className="truncate">
                                {s.nama_lengkap}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                NIS: {s.nis || "—"}
                              </div>
                            </td>
                            <td style={{ padding: "8px 6px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, minHeight: 40, width: "100%", maxWidth: 74, margin: "0 auto" }}
                                placeholder="-"
                                value={data.harian}
                                onChange={(e) => handleInputChange(s.id, "harian", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "8px 6px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, minHeight: 40, width: "100%", maxWidth: 74, margin: "0 auto" }}
                                placeholder="-"
                                value={data.kompetensi}
                                onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "8px 6px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, minHeight: 40, width: "100%", maxWidth: 74, margin: "0 auto" }}
                                placeholder="-"
                                value={data.sikap}
                                onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "8px 6px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, minHeight: 40, width: "100%", maxWidth: 74, margin: "0 auto" }}
                                placeholder="-"
                                value={data.ujian}
                                onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "8px 14px", textAlign: "right", borderBottom: "1px solid var(--border)" }}>
                              <div
                                style={{
                                  display: "inline-block",
                                  padding: "5px 12px",
                                  borderRadius: 8,
                                  background: nilaiAkhir 
                                    ? isLulus ? "var(--success-light)" : "var(--danger-light)" 
                                    : "#f8fafc",
                                  color: nilaiAkhir 
                                    ? isLulus ? "var(--success)" : "var(--danger)" 
                                    : "#94a3b8",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  minWidth: 50,
                                  textAlign: "center",
                                  border: "1px solid",
                                  borderColor: nilaiAkhir
                                    ? isLulus ? "rgba(22, 163, 74, 0.2)" : "rgba(220, 38, 38, 0.2)"
                                    : "transparent"
                                }}
                              >
                                {nilaiAkhir || "-"}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button (Desktop) */}
            {/* Actions (Standard: Batal & Simpan matching Jurnal page) */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost"
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSimpan}
                disabled={saving || loadingSantri}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Semua Nilai
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
