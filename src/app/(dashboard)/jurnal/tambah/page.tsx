"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { BookOpen, ChevronLeft, Loader2, FileText, Zap, Clock, Save, Calendar, MessageSquare, Microscope, BookMarked, Edit3, Check, Trash2, RotateCcw, AlertCircle } from "lucide-react";
import Link from "next/link";

type Kelas = { id: string; nama: string; jenjang: string | null };
type Asatidz = { id: string; nama_lengkap: string; jabatan: string | null };
type Mapel = { id: string; nama: string };
type AsatidzmMapel = { pegawai_id: string; mapel_id: string; kelas_id: string };
type MasterData = {
  kelas: Kelas[];
  asatidz: Asatidz[];
  mapel: Record<string, Mapel[]>;
  asatidzmMapel: AsatidzmMapel[];
};

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const JAM_OPTIONS = ["3", "4", "5", "6", "7", "8", "9", "Khusus"];

function formatTanggalIndo(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

export default function TambahJurnalPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [master, setMaster] = useState<MasterData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Form fields
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [asatidId, setAsatidId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [jamKe, setJamKe] = useState<string[]>([]);
  const [jamKhususMulai, setJamKhususMulai] = useState("");
  const [jamKhususSelesai, setJamKhususSelesai] = useState("");
  const [materi, setMateri] = useState("");
  const [subMateri, setSubMateri] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Load draft dari localStorage (Tanggal selalu di-default ke Hari Ini / today)
  useEffect(() => {
    setTanggal(today);
    const draft = localStorage.getItem("siakad_jurnal_draft");
    if (draft) {
      try {
        const p = JSON.parse(draft);
        const hasContent = p.materi || p.learningOutcome || p.kegiatan || p.catatan || p.kelasId;
        if (p.kelasId) setKelasId(p.kelasId);
        if (p.mapelId) setMapelId(p.mapelId);
        if (p.asatidId) setAsatidId(p.asatidId);
        if (p.tanggal && p.tanggal === today) setTanggal(p.tanggal);
        if (p.jamKe) {
          if (Array.isArray(p.jamKe)) setJamKe(p.jamKe);
          else if (typeof p.jamKe === "string") setJamKe(p.jamKe.split(",").map((s: string) => s.trim()));
        }
        if (p.jamKhususMulai) setJamKhususMulai(p.jamKhususMulai);
        if (p.jamKhususSelesai) setJamKhususSelesai(p.jamKhususSelesai);
        if (p.materi) setMateri(p.materi);
        if (p.subMateri) setSubMateri(p.subMateri);
        if (p.learningOutcome) setLearningOutcome(p.learningOutcome);
        if (p.kegiatan) setKegiatan(p.kegiatan);
        if (p.catatan) setCatatan(p.catatan);
        setLastSaved(p._savedAt || null);
        if (hasContent) {
          setIsDraftRestored(true);
        }
      } catch (e) { /* ignore */ }
    }
  }, [today]);

  // Reset Draft function
  const handleResetDraft = () => {
    Swal.fire({
      title: "Kosongkan Formulir?",
      text: "Semua tulisan draf yang tersimpan otomatis di perangkat ini akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Bersihkan",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("siakad_jurnal_draft");
        setKelasId("");
        setMapelId("");
        setAsatidId("");
        setTanggal(today);
        setJamKe([]);
        setJamKhususMulai("");
        setJamKhususSelesai("");
        setMateri("");
        setLearningOutcome("");
        setKegiatan("");
        setCatatan("");
        setLastSaved(null);
        setIsDraftRestored(false);
        Swal.fire({
          icon: "success",
          title: "Draf Dibersihkan",
          text: "Formulir telah dikosongkan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Autosave draft ke localStorage
  useEffect(() => {
    if (kelasId || mapelId || asatidId || materi || subMateri || learningOutcome || kegiatan || catatan) {
      const savedAt = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const p = { kelasId, mapelId, asatidId, tanggal, jamKe, jamKhususMulai, jamKhususSelesai, materi, subMateri, learningOutcome, kegiatan, catatan, _savedAt: savedAt };
      localStorage.setItem("siakad_jurnal_draft", JSON.stringify(p));
      setLastSaved(savedAt);
    }
  }, [kelasId, mapelId, asatidId, tanggal, jamKe, jamKhususMulai, jamKhususSelesai, materi, subMateri, learningOutcome, kegiatan, catatan]);

  // Load master data
  useEffect(() => {
    Promise.all([
      fetch("/api/master", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/profile", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([masterData, profileData]) => {
        setMaster(masterData);
        if (profileData?.data) {
          setCurrentUser(profileData.data);
          
          // Auto-assign asatidId if user has asatidz_id and no draft was restored with a different ID
          const role = (profileData.data.role || "").toLowerCase();
          const isAdmin = role.includes("admin_super");
          
          if (profileData.data.asatidz_id) {
            // Only force assignment if it's not admin, or if it is admin but asatidId is empty
            if (!isAdmin || !asatidId) {
              setAsatidId(profileData.data.asatidz_id);
            }
          }
        }
        setLoadingMaster(false);
      })
      .catch(() => {
        setLoadingMaster(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data master. Coba refresh halaman.",
        });
      });
  }, []);

  // Available Jenjang Options berdasarkan guru yang dipilih / login
  const availableJenjangs = useMemo(() => {
    const defaultJenjangs = ["MTs", "IL", "MA"];
    if (!asatidId || !master?.asatidzmMapel || !master?.kelas) return defaultJenjangs;

    const teacherKelasIds = master.asatidzmMapel
      .filter((am) => am.pegawai_id === asatidId)
      .map((am) => am.kelas_id);

    if (teacherKelasIds.length === 0) return defaultJenjangs;

    const teacherJenjangs = master.kelas
      .filter((k) => teacherKelasIds.includes(k.id) && k.jenjang)
      .map((k) => k.jenjang as string);

    const uniqueJenjangs = Array.from(new Set(teacherJenjangs));
    return uniqueJenjangs.length > 0 ? uniqueJenjangs : defaultJenjangs;
  }, [asatidId, master]);

  // Auto-select Jenjang jika hanya ada 1 pilihan
  useEffect(() => {
    if (availableJenjangs.length === 1) {
      setJenjangFilter(availableJenjangs[0]);
    } else if (jenjangFilter && !availableJenjangs.includes(jenjangFilter)) {
      setJenjangFilter("");
    }
  }, [availableJenjangs]);

  const filteredKelasList = useMemo(() => {
    let list = master?.kelas || [];
    if (jenjangFilter) {
      list = list.filter((k) => k.jenjang === jenjangFilter);
    }

    if (asatidId && master?.asatidzmMapel) {
      const teacherKelasIds = master.asatidzmMapel
        .filter((am) => am.pegawai_id === asatidId)
        .map((am) => am.kelas_id);

      if (teacherKelasIds.length > 0) {
        list = list.filter((k) => teacherKelasIds.includes(k.id));
      }
    }

    return list;
  }, [jenjangFilter, asatidId, master]);

  // Auto-select Kelas jika hanya ada 1 kelas
  useEffect(() => {
    if (filteredKelasList.length === 1) {
      setKelasId(filteredKelasList[0].id);
    } else if (kelasId) {
      const exists = filteredKelasList.find((k) => k.id === kelasId);
      if (!exists) setKelasId("");
    }
  }, [filteredKelasList]);

  const mapelList = useMemo(() => {
    let list = (kelasId && master?.mapel?.[kelasId]) || [];
    
    // Filter berdasarkan AsatidzmMapel (jika asatidId terpilih)
    if (asatidId && master?.asatidzmMapel && list.length > 0) {
      const allowedMapelIds = master.asatidzmMapel
        .filter(am => am.pegawai_id === asatidId && am.kelas_id === kelasId)
        .map(am => am.mapel_id);
      
      if (allowedMapelIds.length > 0) {
        list = list.filter(m => allowedMapelIds.includes(m.id));
      } else {
        list = [];
      }
    }
    
    return list;
  }, [kelasId, asatidId, master]);

  // Auto-select Mapel jika hanya ada 1 mapel
  useEffect(() => {
    if (mapelList.length === 1) {
      setMapelId(mapelList[0].id);
    }
  }, [mapelList]);

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kelasId || !mapelId || !asatidId || !tanggal || !materi || !kegiatan) {
      Swal.fire({
        icon: "warning",
        title: "Form Tidak Lengkap",
        text: "Mohon lengkapi semua field yang wajib diisi.",
        confirmButtonColor: "#0f172a",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: asatidId,
          mapel_id: mapelId,
          kelas_id: kelasId,
          tanggal,
          jam_ke: jamKe.length > 0 ? jamKe.sort((a, b) => {
            if (a === "Khusus") return 1;
            if (b === "Khusus") return -1;
            return parseInt(a) - parseInt(b);
          }).map(j => {
            if (j === "Khusus" && jamKhususMulai && jamKhususSelesai) {
              return `Khusus (${jamKhususMulai}-${jamKhususSelesai})`;
            }
            return j;
          }).join(", ") : null,
          materi,
          sub_materi: subMateri || null,
          learning_outcome: learningOutcome || null,
          kegiatan,
          catatan: catatan || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan jurnal");
      }

      await Swal.fire({
        icon: "success",
        title: "Jurnal Tersimpan!",
        text: "Jurnal mengajar berhasil ditambahkan.",
        confirmButtonColor: "#0f172a",
        timer: 2000,
        timerProgressBar: true,
      });

      localStorage.removeItem("siakad_jurnal_draft");
      localStorage.removeItem("sikap_pending_jurnal_date");
      router.push("/jurnal");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Premium Hero Banner */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #550000 0%, #440000 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        color: "white",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/jurnal"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              height: "44px",
              width: "44px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              textDecoration: "none"
            }}
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <BookMarked size={28} /> Tambah Jurnal Mengajar
            </h1>
            <p style={{ marginTop: "8px", opacity: 0.9, fontSize: "16px" }}>Catat kegiatan belajar mengajar hari ini</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastSaved && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", background: "rgba(0,0,0,0.2)", padding: "6px 12px", borderRadius: "12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Save size={14} style={{ color: "#10b981" }} />
              <span>Draf: {lastSaved}</span>
            </div>
          )}
          {(kelasId || materi || learningOutcome || kegiatan || catatan) && (
            <button
              type="button"
              onClick={handleResetDraft}
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: "#ef4444",
                background: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              title="Kosongkan form dan hapus draf"
            >
              <RotateCcw size={14} />
              <span>Reset Form</span>
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Banner Draf Dipulihkan */}
        {isDraftRestored && (
          <div style={{ marginBottom: "20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: "bold", color: "#78350f", margin: 0 }}>Draf Belum Tersimpan Dipulihkan</p>
                <p style={{ fontSize: "13px", color: "#92400e", marginTop: "4px", margin: 0 }}>
                  Formulir ini otomatis memuat data ketikan terakhir dari perangkat Anda agar data tidak hilang jika halaman tertutup.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetDraft}
              style={{ fontSize: "13px", fontWeight: "bold", color: "#ef4444", background: "white", border: "1px solid #fca5a5", padding: "6px 12px", borderRadius: "10px", flexShrink: 0, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              Hapus Draf
            </button>
          </div>
        )}
        
        {loadingMaster ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: "#64748b", fontSize: 15, fontWeight: 500 }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "#0f172a" }} />
            Memuat data master...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Card 1: Informasi Mengajar */}
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", margin: 0 }}>
                <BookOpen size={20} color="#f59e0b" />
                Informasi Mengajar
              </div>

              {/* Tanggal + nama hari */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Tanggal <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%", maxWidth: "260px" }}
                />
                {tanggal && (
                  <div style={{ marginTop: "8px", fontSize: "14px", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={16} /> {formatTanggalIndo(tanggal)}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {/* Asatidz */}
                <div>
                  {/* Pilih Guru */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                      Nama Guru <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    {(!currentUser?.role?.toLowerCase().includes("admin_super") && currentUser?.asatidz_id) ? (
                      <div style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 600 }}>
                        {currentUser.nama}
                      </div>
                    ) : (
                      <select
                        value={asatidId}
                        onChange={(e) => setAsatidId(e.target.value)}
                        required
                        style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%", backgroundColor: "white" }}
                      >
                        <option value="">-- Pilih Guru --</option>
                        {master?.asatidz.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nama_lengkap}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Jam ke- */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#475569", margin: 0, marginBottom: "4px" }}>
                        <Clock size={16} />
                        Jam ke- (KBM Kelas)
                      </label>
                      <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, margin: 0 }}>KBM Mulai jam ke-3 (07.00 WIB)</p>
                    </div>
                    {jamKe.length > 0 && (
                      <span style={{ fontSize: "12px", fontWeight: 600, background: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                        Durasi: {jamKe.length} Jam
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {JAM_OPTIONS.map((j) => {
                      const isSelected = jamKe.includes(j);
                      const waktuMap: Record<string, string> = {
                        "3": "07.00-07.40",
                        "4": "07.40-08.20",
                        "5": "08.20-09.00",
                        "6": "09.00-09.40",
                        "7": "10.00-10.40",
                        "8": "10.40-11.20",
                        "9": "11.20-12.00",
                      };
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setJamKe(jamKe.filter(k => k !== j));
                            } else {
                              setJamKe([...jamKe, j]);
                            }
                          }}
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            fontWeight: "bold",
                            borderRadius: "12px",
                            border: "2px solid",
                            padding: "6px 12px",
                            minWidth: "64px",
                            height: "auto",
                            ...(isSelected ? {
                              background: "#ecfdf5", color: "#047857", borderColor: "#10b981", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            } : {
                              background: "white", color: "#64748b", borderColor: "#e2e8f0"
                            }),
                            cursor: "pointer"
                          }}
                        >
                          {isSelected && j !== "Khusus" && (
                            <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "#10b981", color: "white", borderRadius: "50%", padding: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", zIndex: 10 }}>
                              <Check size={12} strokeWidth={4} />
                            </div>
                          )}
                          {isSelected && j === "Khusus" && (
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
                              <Check size={14} strokeWidth={3} style={{ marginRight: "4px" }} />
                              <span style={{ fontSize: "14px" }}>{j}</span>
                            </div>
                          )}
                          {!isSelected && j === "Khusus" && <span style={{ fontSize: "14px", marginBottom: "2px" }}>{j}</span>}
                          {j === "Khusus" && <span style={{ fontSize: "9px", fontWeight: 600, color: isSelected ? "#059669" : "#94a3b8" }}>Menyesuaikan</span>}
                          
                          {/* For numbers */}
                          {j !== "Khusus" && (
                            <>
                              <span style={{ fontSize: "14px", lineHeight: 1, marginBottom: "4px" }}>{j}</span>
                              <span style={{ fontSize: "9px", fontWeight: 700, color: isSelected ? "#059669" : "#94a3b8", lineHeight: 1 }}>{waktuMap[j]}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {jamKe.includes("Khusus") && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Tentukan Waktu Khusus <span style={{ color: "#ef4444" }}>*</span></label>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <input type="time" value={jamKhususMulai} onChange={e => setJamKhususMulai(e.target.value)} required={jamKe.includes("Khusus")} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", background: "white", color: "#334155" }} />
                        <span style={{ color: "#64748b", fontWeight: 600, fontSize: "13px" }}>s.d</span>
                        <input type="time" value={jamKhususSelesai} onChange={e => setJamKhususSelesai(e.target.value)} required={jamKe.includes("Khusus")} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", background: "white", color: "#334155" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Jenjang */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    Jenjang <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={jenjangFilter}
                    onChange={(e) => setJenjangFilter(e.target.value)}
                    style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%", backgroundColor: "white" }}
                  >
                    {availableJenjangs.length > 1 && <option value="">— Semua Jenjang —</option>}
                    {availableJenjangs.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    Kelas <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    required
                    disabled={jenjangFilter !== "" && filteredKelasList.length === 0}
                    style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%", backgroundColor: (jenjangFilter !== "" && filteredKelasList.length === 0) ? "#f1f5f9" : "white" }}
                  >
                    <option value="">— Pilih Kelas —</option>
                    {filteredKelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    Mata Pelajaran <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={mapelId}
                    onChange={(e) => setMapelId(e.target.value)}
                    required
                    disabled={!kelasId}
                    style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%", backgroundColor: !kelasId ? "#f1f5f9" : "white" }}
                  >
                    <option value="">
                      {kelasId ? "— Pilih Mata Pelajaran —" : "— Pilih kelas terlebih dahulu —"}
                    </option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                  {kelasId && mapelList.length === 0 && (
                    <p style={{ fontSize: "13px", color: "#d97706", marginTop: "8px", fontWeight: 500, margin: 0 }}>
                      Belum ada mapel untuk kelas ini
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Isi Jurnal */}
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", margin: 0 }}>
                <FileText size={20} color="#f59e0b" /> Isi Jurnal
              </div>

              {/* Topik Jurnal */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Topik Jurnal <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan topik jurnal hari ini..."
                  value={materi}
                  onChange={(e) => {
                    setMateri(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px", width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" }}
                  required
                />
              </div>

              {/* Sub Topik Jurnal */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Sub Topik Jurnal <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan sub topik yang spesifik..."
                  value={subMateri}
                  onChange={(e) => {
                    setSubMateri(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "60px", width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Learning Objective (LO) / Tujuan Pembelajaran <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan learning objective atau tujuan pembelajaran yang ingin dicapai..."
                  value={learningOutcome}
                  onChange={(e) => {
                    setLearningOutcome(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px", width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Strategi Pembelajaran <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Deskripsikan strategi untuk mencapai target/tujuan pembelajaran..."
                  value={kegiatan}
                  onChange={(e) => {
                    setKegiatan(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "100px", width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                  Catatan Lainnya (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan tambahan, kendala, atau evaluasi..."
                  value={catatan}
                  onChange={(e) => {
                    setCatatan(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px", width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", alignItems: "center" }}>
              {lastSaved && (
                <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                  <Save size={14} /> Draft tersimpan pukul {lastSaved}
                </span>
              )}
              <Link href="/jurnal" style={{ background: "transparent", color: "#475569", padding: "14px 24px", borderRadius: "14px", fontWeight: 600, textDecoration: "none", border: "1px solid #cbd5e1" }}>
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "#550000",
                  color: "white",
                  padding: "14px 28px",
                  borderRadius: "14px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontSize: "15px",
                  boxShadow: "0 4px 14px rgba(85,0,0,0.25)",
                  transition: "all 0.2s"
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
                    Simpan Jurnal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
