"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ArrowLeft,
  Trash2,
  AlertCircle
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

  const [master, setMaster] = useState<{
    kelas: Kelas[];
    mapel: Record<string, MapelItem[]>;
    asatidzmMapel: { id: string; pegawai_id: string; mapel_id: string; kelas_id: string }[];
  } | null>(null);
  const [asatidId, setAsatidId] = useState("");
  const [isAdminSuper, setIsAdminSuper] = useState(false);

  const [santriList, setSantriList] = useState<Santri[]>([]);
  
  // State Input per Santri (Map)
  const [inputData, setInputData] = useState<Record<string, CapaianNilai>>({});

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch profile & master data
  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/master").then((r) => r.json()),
    ])
      .then(([profileRes, masterRes]) => {
        if (profileRes.data) {
          const role = (profileRes.data.role || "").toLowerCase();
          const isAdmin = role.includes("admin_super");
          setIsAdminSuper(isAdmin);
          if (profileRes.data.asatidz_id) {
            setAsatidId(profileRes.data.asatidz_id);
          }
        }
        if (masterRes) {
          setMaster(masterRes);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingKelas(false));
  }, []);

  // Available Jenjang
  const availableJenjangs = useMemo(() => {
    const defaultJenjangs = ["MTs", "IL", "MA"];
    if (isAdminSuper || !asatidId || !master?.asatidzmMapel || !master?.kelas) return defaultJenjangs;

    const teacherKelasIds = master.asatidzmMapel
      .filter((am) => am.pegawai_id === asatidId)
      .map((am) => am.kelas_id);

    if (teacherKelasIds.length === 0) return defaultJenjangs;

    const teacherJenjangs = master.kelas
      .filter((k) => teacherKelasIds.includes(k.id) && k.jenjang)
      .map((k) => k.jenjang as string);

    const uniqueJenjangs = Array.from(new Set(teacherJenjangs));
    return uniqueJenjangs.length > 0 ? uniqueJenjangs : defaultJenjangs;
  }, [asatidId, master, isAdminSuper]);

  // Auto-select Jenjang jika hanya ada 1 pilihan
  useEffect(() => {
    if (availableJenjangs.length === 1) {
      setJenjangFilter(availableJenjangs[0]);
    } else if (jenjangFilter && !availableJenjangs.includes(jenjangFilter)) {
      setJenjangFilter("");
    }
  }, [availableJenjangs]);

  // Filtered Kelas List
  const filteredKelasList = useMemo(() => {
    let list = master?.kelas || [];
    if (jenjangFilter) {
      list = list.filter((k) => k.jenjang === jenjangFilter);
    }

    if (!isAdminSuper && asatidId && master?.asatidzmMapel) {
      const teacherKelasIds = master.asatidzmMapel
        .filter((am) => am.pegawai_id === asatidId)
        .map((am) => am.kelas_id);

      if (teacherKelasIds.length > 0) {
        list = list.filter((k) => teacherKelasIds.includes(k.id));
      }
    }

    return list;
  }, [jenjangFilter, asatidId, master, isAdminSuper]);

  // Auto-select Kelas jika hanya ada 1 kelas
  useEffect(() => {
    if (filteredKelasList.length === 1) {
      setKelasId(filteredKelasList[0].id);
    } else if (kelas_id) {
      const exists = filteredKelasList.find((k) => k.id === kelas_id);
      if (!exists) setKelasId("");
    }
  }, [filteredKelasList]);

  // Mapel List
  const mapelList = useMemo(() => {
    let list = (kelas_id && master?.mapel?.[kelas_id]) || [];
    if (!isAdminSuper && asatidId && master?.asatidzmMapel && list.length > 0) {
      const allowedMapelIds = master.asatidzmMapel
        .filter((am) => am.pegawai_id === asatidId && am.kelas_id === kelas_id)
        .map((am) => am.mapel_id);
      if (allowedMapelIds.length > 0) {
        list = list.filter((m) => allowedMapelIds.includes(m.id));
      } else {
        list = [];
      }
    }
    return list;
  }, [kelas_id, asatidId, master, isAdminSuper]);

  // Auto-select Mapel jika hanya ada 1 mapel
  useEffect(() => {
    if (mapelList.length === 1) {
      setMapelId(mapelList[0].id);
    }
  }, [mapelList]);

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

  const handleDeleteMassal = async (santriId: string, santriName: string) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hapus Nilai?",
      text: `Yakin ingin menghapus SELURUH nilai ${santriName} untuk mapel ini di semester ${semester} tahun ${tahun_ajaran}?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/nilai/hapus?santri_id=${santriId}&mapel_id=${mapel_id}&semester=${semester}&tahun_ajaran=${tahun_ajaran}`, {
          method: "DELETE",
        });
        if (res.ok) {
          Swal.fire("Terhapus!", "Nilai santri berhasil dihapus.", "success");
          fetchStep2(); // Reload data
        } else {
          Swal.fire("Gagal", "Gagal menghapus nilai.", "error");
        }
      } catch {
        Swal.fire("Error", "Terjadi kesalahan server.", "error");
      }
    }
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

  const selectedKelasNama = master?.kelas?.find((k) => k.id === kelas_id)?.nama || "";
  const selectedMapelNama = mapelList.find((m) => m.id === mapel_id)?.nama || "";

  return (
    <div className="page-container">
      <style>{`
        .platinum-table tr {
          transition: background 0.2s;
        }
        .platinum-table tr:hover {
          background-color: #fdf8f0 !important;
        }
        .platinum-table tr:hover td.sticky-col {
          background-color: #fdf8f0 !important;
        }
      `}</style>
      
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        {/* Decorative Elements */}
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Penilaian & Evaluasi Santri</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <BookOpen size={26} color="#ddc192" /> Input Nilai Santri
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            {step === 1
              ? "Buku nilai santri berbasis capaian akademik (High-Density Gradebook)"
              : `${selectedMapelNama} · Kelas ${selectedKelasNama} · Semester ${semester} · ${tahun_ajaran}`}
          </p>
        </div>

        {step === 2 && (
          <div style={{ position: "relative", zIndex: 1 }}>
            <button
              style={{
                background: "#ffffff",
                color: "#550000",
                padding: "10px 20px",
                borderRadius: "14px",
                border: "1px solid #ddc192",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
              }}
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={16} color="#550000" /> Kembali
            </button>
          </div>
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
        <div
          className="w-full max-w-[640px] flex flex-col gap-5 sm:gap-6 box-border"
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "clamp(18px, 4vw, 32px)",
            boxShadow: "0 4px 20px rgba(85,0,0,0.03)",
            border: "1px solid #ebdcc3",
          }}
        >
          <p style={{ fontSize: "18px", fontWeight: "800", color: "#550000", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={20} color="#550000" />
            Parameter Penilaian
          </p>

          {/* Periode */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Periode Penilaian</label>
            <select
              className="w-full min-w-0 box-border"
              style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option value="PTS">Tengah Semester (PTS)</option>
              <option value="PAS">Akhir Semester (PAS)</option>
            </select>
          </div>

          {/* Jenjang & Kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Jenjang</label>
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
                value={jenjangFilter}
                onChange={(e) => setJenjangFilter(e.target.value)}
                disabled={loadingKelas}
              >
                {availableJenjangs.length > 1 && <option value="">— Semua Jenjang —</option>}
                {availableJenjangs.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas</label>
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
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

          {/* Mata Pelajaran */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Mata Pelajaran</label>
            <select
              className="w-full min-w-0 box-border"
              style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
              value={mapel_id}
              onChange={(e) => setMapelId(e.target.value)}
              disabled={!kelas_id || loadingKelas}
            >
              <option value="">— Pilih Mapel —</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Semester & Tahun Ajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Semester</label>
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
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
            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tahun Ajaran</label>
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
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

          {/* Mandatory Parameter Warning Banner */}
          {(!kelas_id || !mapel_id) && (
            <div style={{ background: "#fffbeb", borderRadius: "16px", padding: "16px 20px", border: "1.5px solid #fef08a", display: "flex", alignItems: "center", gap: "12px", color: "#92400e" }}>
              <AlertCircle size={22} style={{ color: "#d97706", flexShrink: 0 }} />
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#b45309" }}>
                {!kelas_id ? "⚠️ Silakan pilih Kelas terlebih dahulu." : "⚠️ Silakan pilih Mata Pelajaran terlebih dahulu."} Lembar nilai baru dapat dibuka setelah parameter terisi lengkap.
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end mt-2 w-full">
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              style={{
                background: !kelas_id || !mapel_id ? "#e2e8f0" : "#550000",
                color: !kelas_id || !mapel_id ? "#94a3b8" : "#ffffff",
                padding: "13px 26px",
                borderRadius: "14px",
                fontWeight: 800,
                fontSize: "14px",
                border: "none",
                cursor: !kelas_id || !mapel_id ? "not-allowed" : "pointer",
                boxShadow: !kelas_id || !mapel_id ? "none" : "0 4px 14px rgba(85, 0, 0, 0.25)",
                transition: "all 0.2s",
              }}
              disabled={!kelas_id || !mapel_id}
              onClick={() => {
                if (!kelas_id || !mapel_id) {
                  Swal.fire({
                    icon: "warning",
                    title: "Parameter Belum Lengkap",
                    text: "Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.",
                    confirmButtonColor: "var(--primary)",
                  });
                  return;
                }
                setStep(2);
              }}
            >

              <span>Lanjut ke Lembar Nilai</span>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Input Nilai High Density ────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "16px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ background: "#fdf5f5", padding: "6px 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", color: "#550000", border: "1px solid #fae4e4" }}>
                {selectedMapelNama}
              </div>
              <div style={{ background: "#fdf8f0", padding: "6px 14px", borderRadius: "10px", fontSize: "14px", color: "#b89758", fontWeight: "700", border: "1px solid #ebdcc3" }}>
                Kelas {selectedKelasNama}
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#550000", background: "#fdf8f0", padding: "6px 14px", borderRadius: "99px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", border: "1px solid #ebdcc3" }}>
              <Lightbulb size={14} color="#b89758" /> Draft Autosave Aktif
            </div>
          </div>

          {/* Banner info on mobile */}
          <div className="md:hidden text-xs text-amber-900 bg-amber-50/90 border border-amber-200/80 px-4 py-3 rounded-2xl flex items-center gap-2.5 font-medium shadow-sm">
            <Lightbulb className="w-5 h-5 text-amber-700 shrink-0" />
            <span><strong>Lebih Praktis!</strong> Isi nilai santri langsung pada kartu di bawah ini.</span>
          </div>

          {/* ── MOBILE CARD VIEW (Responsive) ── */}
          <div className="md:hidden flex flex-col gap-4">
            {loadingSantri ? (
              <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />Memuat data...
              </div>
            ) : santriList.length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">Tidak ada santri di kelas ini</div>
            ) : (
              santriList.map((s) => {
                const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", ujian: "" };
                const nilaiAkhir = hitungNilaiAkhir(data);
                const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true;

                return (
                  <div key={`mobile-${s.id}`} className="bg-white rounded-3xl border border-amber-200/60 shadow-sm overflow-hidden flex flex-col gap-4 relative p-6">
                    <div className="absolute top-6 right-6">
                      <div className={`px-3 py-2 rounded-xl text-xs font-black border flex flex-col items-center justify-center min-w-[54px] shadow-sm ${nilaiAkhir ? (isLulus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200') : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                        <span style={{ fontSize: 9, opacity: 0.8, marginBottom: 2, letterSpacing: '0.05em' }}>AKHIR</span>
                        <span style={{ fontSize: 16 }}>{nilaiAkhir ? nilaiAkhir : "-"}</span>
                      </div>
                    </div>

                    <div className="border-b border-stone-100 pb-4 pr-16">
                      <div className="font-extrabold text-stone-900 text-lg leading-snug mb-1">{s.nama_lengkap}</div>
                      <div className="text-xs text-stone-600 font-semibold bg-stone-50 inline-block px-2.5 py-1 rounded-md border border-stone-200">NIS: {s.nis || "—"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                          <span>Harian</span>
                          <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">(30%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#fdf8f0", border: "1px solid #ebdcc3", outline: "none" }} placeholder="-" value={data.harian} onChange={(e) => handleInputChange(s.id, "harian", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                          <span>Komp.</span>
                          <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">(20%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#fdf8f0", border: "1px solid #ebdcc3", outline: "none" }} placeholder="-" value={data.kompetensi} onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                          <span>Sikap</span>
                          <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">(10%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#fdf8f0", border: "1px solid #ebdcc3", outline: "none" }} placeholder="-" value={data.sikap} onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[12px] font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                          <span className="truncate max-w-[60px]">{periode}</span>
                          <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded shrink-0 border border-amber-200/60">(40%)</span>
                        </label>
                        <input type="number" inputMode="decimal" style={{ textAlign: "left", fontSize: 16, fontWeight: 800, padding: "10px 14px", height: 46, borderRadius: 14, background: "#fdf8f0", border: "1px solid #ebdcc3", outline: "none" }} placeholder="-" value={data.ujian} onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── DESKTOP TABLE VIEW (Responsive) ── */}
          <div className="hidden md:block" style={{ background: "white", borderRadius: "24px", boxShadow: "0 4px 20px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
            <div style={{ overflowX: "auto", position: "relative" }}>
              <table className="platinum-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                    <th className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 25, background: "#fdf8f0", padding: "16px 12px", textAlign: "center", width: 50, borderBottom: "1px solid #ebdcc3", color: "#550000", fontWeight: 800 }}>No</th>
                    <th className="sticky-col" style={{ position: "sticky", left: 50, zIndex: 25, background: "#fdf8f0", padding: "16px 20px", textAlign: "left", minWidth: 200, borderBottom: "1px solid #ebdcc3", borderRight: "1px solid #ebdcc3", color: "#550000", fontWeight: 800 }}>Nama Santri</th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #ebdcc3" }}>
                      <div style={{ fontWeight: "800", color: "#550000" }}>Harian</div>
                      <div style={{ fontSize: "11px", color: "#b89758", fontWeight: "bold", marginTop: "2px" }}>(30%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #ebdcc3" }}>
                       <div style={{ fontWeight: "800", color: "#550000" }}>Komp.</div>
                       <div style={{ fontSize: "11px", color: "#b89758", fontWeight: "bold", marginTop: "2px" }}>(20%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #ebdcc3" }}>
                       <div style={{ fontWeight: "800", color: "#550000" }}>Sikap</div>
                       <div style={{ fontSize: "11px", color: "#b89758", fontWeight: "bold", marginTop: "2px" }}>(10%)</div>
                    </th>
                    <th style={{ padding: "16px 12px", textAlign: "center", width: 100, borderBottom: "1px solid #ebdcc3" }}>
                      <div style={{ fontWeight: "800", color: "#550000" }}>{periode}</div>
                      <div style={{ fontSize: "11px", color: "#b89758", fontWeight: "bold", marginTop: "2px" }}>(40%)</div>
                    </th>
                    <th style={{ padding: "16px 20px", textAlign: "right", width: 120, borderBottom: "1px solid #ebdcc3" }}>
                      <div style={{ fontWeight: "800", color: "#550000" }}>Nilai Akhir</div>
                      <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold", marginTop: "2px" }}>OTOMATIS</div>
                    </th>
                    {isAdminSuper && (
                      <th style={{ padding: "16px 12px", textAlign: "center", width: 60, borderBottom: "1px solid #ebdcc3", color: "#550000", fontWeight: 800 }}>
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loadingSantri ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "#550000" }} />
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
                      const bgRow = idx % 2 === 0 ? "#ffffff" : "#fdfcf9";

                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f5ede1", background: bgRow }}>
                          <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, padding: "16px 12px", color: "#550000", fontWeight: 700, textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                            {idx + 1}
                          </td>
                          <td className="sticky-col" style={{ position: "sticky", left: 50, zIndex: 10, background: bgRow, padding: "16px 20px", minWidth: 200, borderBottom: "1px solid #f5ede1", borderRight: "1px solid #ebdcc3" }}>
                            <div style={{ fontWeight: "800", color: "#1a1a1a" }} className="truncate">
                              {s.nama_lengkap}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              NIS: {s.nis || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #ebdcc3", background: "#fdf8f0", outline: "none" }} placeholder="-" value={data.harian} onChange={(e) => handleInputChange(s.id, "harian", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #ebdcc3", background: "#fdf8f0", outline: "none" }} placeholder="-" value={data.kompetensi} onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #ebdcc3", background: "#fdf8f0", outline: "none" }} placeholder="-" value={data.sikap} onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)} />
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                            <input type="number" inputMode="decimal" style={{ fontSize: "15px", padding: "10px", textAlign: "center", fontWeight: "bold", width: "100%", maxWidth: 80, margin: "0 auto", borderRadius: "10px", border: "1px solid #ebdcc3", background: "#fdf8f0", outline: "none" }} placeholder="-" value={data.ujian} onChange={(e) => handleInputChange(s.id, "ujian", e.target.value)} />
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", borderBottom: "1px solid #f5ede1" }}>
                            <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "10px", background: nilaiAkhir ? isLulus ? "#dcfce7" : "#fee2e2" : "#fdf8f0", color: nilaiAkhir ? isLulus ? "#15803d" : "#b91c1c" : "#94a3b8", fontWeight: "800", fontSize: "14px", minWidth: 60, textAlign: "center", border: "1px solid #ebdcc3" }}>
                              {nilaiAkhir || "-"}
                            </div>
                          </td>
                          {isAdminSuper && (
                            <td style={{ padding: "16px 12px", textAlign: "center", borderBottom: "1px solid #f5ede1" }}>
                              <button 
                                onClick={() => handleDeleteMassal(s.id, s.nama_lengkap)}
                                title="Hapus Semua Nilai (Khusus Admin Super)"
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: "8px",
                                  width: "32px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  margin: "0 auto"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fee2e2";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#fef2f2";
                                  e.currentTarget.style.transform = "none";
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end items-stretch sm:items-center mt-4 w-full">
            <button
              type="button"
              className="w-full sm:w-auto"
              style={{ background: "white", color: "#550000", padding: "12px 20px", borderRadius: "14px", fontWeight: "700", border: "1px solid #ebdcc3", cursor: "pointer" }}
              onClick={() => setStep(1)}
            >
              Batal
            </button>
            <button
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              style={{ background: "#550000", color: "white", padding: "12px 26px", borderRadius: "14px", fontWeight: "800", border: "none", cursor: saving || loadingSantri ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(85,0,0,0.25)" }}
              onClick={handleSimpan}
              disabled={saving || loadingSantri}
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={18} color="#ddc192" /> Simpan Semua Nilai</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
