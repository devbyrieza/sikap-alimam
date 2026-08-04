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
  Lightbulb,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import ModuleTabs from "@/components/ModuleTabs";

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
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "white", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={24} /> Input Nilai Santri
          </h1>
          <p style={{ color: "#bfdbfe", margin: 0 }}>
            {step === 1
              ? "Buku nilai kepadatan tinggi (High-Density Gradebook)"
              : `${selectedMapelNama} · Kelas ${selectedKelasNama} · Semester ${semester} · ${tahun_ajaran}`}
          </p>
        </div>
        {step === 2 && (
          <button style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", padding: "10px 18px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s" }} onClick={() => setStep(1)}>
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Nilai", href: "/nilai", exact: true, icon: <BookOpen size={16} /> },
          { label: "Laporan Nilai", href: "/nilai/rekap", exact: true, icon: <BarChart3 size={16} /> },
        ]}
      />

      {/* ── STEP 1: Pilih Parameter ─────────────────────────────────── */}
      {step === 1 && (
        <div style={{ background: "white", borderRadius: "24px", padding: "32px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", border: "1px solid #f1f5f9", maxWidth: 640, display: "flex", flexDirection: "column", gap: "24px" }}>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={20} style={{ color: "#2563eb" }} />
            Parameter Penilaian
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Periode Penilaian</label>
            <select
              style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="PTS">Tengah Semester (PTS)</option>
              <option value="PAS">Akhir Semester (PAS)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Jenjang</label>
              <select
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Kelas</label>
              <select
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Mata Pelajaran</label>
            <select
              style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
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
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0 0" }}>
                Memuat mata pelajaran...
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Semester</label>
              <select
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
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
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none" }}
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

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              style={{ background: !kelas_id || !mapel_id ? "#cbd5e1" : "#2563eb", color: "white", padding: "12px 24px", borderRadius: "14px", fontWeight: "bold", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: !kelas_id || !mapel_id ? "not-allowed" : "pointer", boxShadow: !kelas_id || !mapel_id ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }}
              disabled={!kelas_id || !mapel_id}
              onClick={() => setStep(2)}
            >
              Lanjut ke Lembar Nilai
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path stroke="white" strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Input Nilai High Density ────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "16px 24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ background: "#eff6ff", padding: "6px 12px", borderRadius: "10px", fontSize: "14px", fontWeight: "bold", color: "#1d4ed8" }}>
                {selectedMapelNama}
              </div>
              <div style={{ background: "#f8fafc", padding: "6px 12px", borderRadius: "10px", fontSize: "14px", color: "#64748b", fontWeight: "600" }}>
                Kelas {selectedKelasNama}
              </div>
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", background: "#f8fafc", padding: "6px 14px", borderRadius: "99px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
              <Lightbulb size={14} style={{ color: "#eab308" }} /> Draft Autosave Aktif
            </div>
          </div>

          {/* Banner info on mobile */}
          <div className="md:hidden text-xs text-sky-700 bg-sky-50 border border-sky-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 font-medium shadow-sm">
            <Lightbulb className="w-5 h-5" />
            <span><strong>Lebih Mudah!</strong> Isi nilai langsung pada kartu santri di bawah.</span>
          </div>

          {/* ── MOBILE CARD VIEW (Responsive) ── */}
          <div className="md:hidden flex flex-col gap-4">
            {loadingSantri ? (
              <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" size={24} />Memuat data...
              </div>
            ) : santriList.length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">Tidak ada santri di kelas ini</div>
            ) : (
              santriList.map((s, idx) => {
                const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", ujian: "" };
                const nilaiAkhir = hitungNilaiAkhir(data);
                const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true;

                return (
                  <div key={`mobile-${s.id}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-4 relative p-6">
                    <div className="absolute top-6 right-6">
                      <div className={`px-3 py-2 rounded-xl text-xs font-black border flex flex-col items-center justify-center min-w-[54px] shadow-sm ${nilaiAkhir ? (isLulus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200') : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        <span style={{ fontSize: 9, opacity: 0.8, marginBottom: 2, letterSpacing: '0.05em' }}>AKHIR</span>
                        <span style={{ fontSize: 16 }}>{nilaiAkhir ? nilaiAkhir : "-"}</span>
                      </div>
                    </div>

                    <div className="border-b border-slate-100 pb-4 pr-16">
                      <div className="font-extrabold text-slate-800 text-lg leading-snug mb-1">{s.nama_lengkap}</div>
                      <div className="text-xs text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">NIS: {s.nis || "—"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>Harian</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">(30%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", outline: "none" }} placeholder="-" value={data.harian} onChange={(e) => handleInputChange(s.id, "harian", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>Komp.</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">(20%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", outline: "none" }} placeholder="-" value={data.kompetensi} onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>Sikap</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">(10%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", outline: "none" }} placeholder="-" value={data.sikap} onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span className="truncate max-w-[60px]">{periode}</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">(40%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", outline: "none" }} placeholder="-" value={data.ujian} onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── DESKTOP TABLE VIEW (Responsive) ── */}
          <div className="hidden md:block" style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <div style={{ overflowX: "auto", position: "relative" }}>
              <table className="platinum-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 25, background: "#f8fafc", padding: "16px 12px", textAlign: "center", width: 50, borderBottom: "1px solid #e2e8f0" }}>No</th>
                    <th className="sticky-col" style={{ position: "sticky", left: 50, zIndex: 25, background: "#f8fafc", padding: "16px 20px", textAlign: "left", minWidth: 200, borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>Nama Santri</th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: "bold", color: "#334155" }}>Harian</div>
                      <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold", marginTop: "4px" }}>(30%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #e2e8f0" }}>
                       <div style={{ fontWeight: "bold", color: "#334155" }}>Komp.</div>
                       <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold", marginTop: "4px" }}>(20%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #e2e8f0" }}>
                       <div style={{ fontWeight: "bold", color: "#334155" }}>Sikap</div>
                       <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold", marginTop: "4px" }}>(10%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: "bold", color: "#334155" }}>{periode}</div>
                      <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold", marginTop: "4px" }}>(40%)</div>
                    </th>
                    <th style={{ padding: "16px 20px", textAlign: "right", width: 120, borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: "bold", color: "#334155" }}>Nilai Akhir</div>
                      <div style={{ fontSize: "11px", color: "#059669", fontWeight: "bold", marginTop: "4px" }}>OTOMATIS</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSantri ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "#2563eb" }} />
                        Memuat lembar nilai...
                      </td>
                    </tr>
                  ) : santriList.length === 0 ? (
                     <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
                        Tidak ada santri di kelas ini
                      </td>
                    </tr>
                  ) : (
                    santriList.map((s, idx) => {
                      const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", ujian: "" };
                      const nilaiAkhir = hitungNilaiAkhir(data);
                      const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true;
                      const bgRow = idx % 2 === 0 ? "white" : "#fafafa";

                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: bgRow }}>
                          <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, padding: "16px 12px", color: "#64748b", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                            {idx + 1}
                          </td>
                          <td className="sticky-col" style={{ position: "sticky", left: 50, zIndex: 10, background: bgRow, padding: "16px 20px", minWidth: 200, borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: "bold", color: "#0f172a" }} className="truncate">
                              {s.nama_lengkap}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                              NIS: {s.nis || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", outline: "none" }} placeholder="-" value={data.harian} onChange={(e) => handleInputChange(s.id, "harian", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", outline: "none" }} placeholder="-" value={data.kompetensi} onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", outline: "none" }} placeholder="-" value={data.sikap} onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", outline: "none" }} placeholder="-" value={data.ujian} onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)} />
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "10px", background: nilaiAkhir ? isLulus ? "#d1fae5" : "#fee2e2" : "#f1f5f9", color: nilaiAkhir ? isLulus ? "#059669" : "#dc2626" : "#94a3b8", fontWeight: "bold", fontSize: "14px", minWidth: 60, textAlign: "center" }}>
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

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center", marginTop: "16px" }}>
            <button type="button" style={{ background: "white", color: "#334155", padding: "12px 20px", borderRadius: "14px", fontWeight: "bold", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => setStep(1)}>
              Batal
            </button>
            <button type="button" style={{ background: "#2563eb", color: "white", padding: "12px 24px", borderRadius: "14px", fontWeight: "bold", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: saving || loadingSantri ? "not-allowed" : "pointer", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" }} onClick={handleSimpan} disabled={saving || loadingSantri}>
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={18} /> Simpan Semua Nilai</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
