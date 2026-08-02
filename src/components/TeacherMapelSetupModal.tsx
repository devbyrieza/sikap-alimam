"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  Save, Loader2, Edit3, X, Camera, Trash2, Users, FileText,
  Award, Phone, Mail, MapPin, Calendar, Heart, Check, Briefcase,
  GraduationCap, User2, LogOut
} from "lucide-react";
import MapelSelector from "@/components/MapelSelector";
import Swal from "sweetalert2";

interface PegawaiProfile {
  id?: string;
  nama_lengkap?: string;
  nik?: string | null;
  jenis_kelamin?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | Date | null;
  no_hp?: string | null;
  email?: string | null;
  alamat?: string | null;
  kategori_pegawai?: string | null;
  unit_kerja?: string | null;
  divisi?: string | null;
  jabatan?: string | null;
  mata_pelajaran?: string | null;
  pendidikan_terakhir?: string | null;
  status_pernikahan?: string | null;
  foto_url?: string | null;
}

interface TeacherMapelSetupModalProps {
  initialPegawai?: PegawaiProfile | null;
  initialMapel?: string | null;
  needsSetup?: boolean;
  missingFields?: string[];
  userName?: string;
  userRole?: string;
}

const KATEGORI_OPTIONS = [
  { value: "GURU", label: "Guru / Asatidz", desc: "Pengajar kelas & kajian", icon: GraduationCap, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)" },
  { value: "MUSYRIF", label: "Musyrif / Pengasuh", desc: "Pembina asrama & santri", icon: Heart, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)" },
  { value: "STAF", label: "Staf Pegawai", desc: "Keuangan, Sapras, IT, Media", icon: Briefcase, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)" },
  { value: "IBU_DAPUR", label: "Ibu Dapur", desc: "Konsumsi & dapur santri", icon: Award, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
  { value: "PIMPINAN", label: "Pimpinan / Manajemen", desc: "Mudir, Kepala Divisi, dll", icon: ShieldCheck, color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)" },
];

const DIVISI_OPTIONS = [
  "Kepengasuhan","Kurikulum","Kedisiplinan","Sarana & Prasarana",
  "Dapur & Konsumsi","IT","Media & Dokumentasi","Keuangan","Tata Usaha","Umum",
];

const PENDIDIKAN_OPTIONS = [
  "SMA / MA / Sederajat","D3","D4 / S1","S2 (Magister)","S3 (Doktor)","Pondok Pesantren / Non-Formal",
];

const DRAFT_KEY = "sikap_civitas_profile_draft";

const formatDateForInput = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch { return ""; }
};

const inputCls = "form-control";
const labelCls = "form-label";

export default function TeacherMapelSetupModal({
  initialPegawai = null,
  initialMapel = "",
  needsSetup = false,
  missingFields = [],
  userName = "Ustadz",
  userRole = "guru",
}: TeacherMapelSetupModalProps) {
  const [isOpen, setIsOpen] = useState(needsSetup);
  const [isForced, setIsForced] = useState(needsSetup);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const isInitialGuru =
    (userRole || "").toLowerCase().includes("guru") ||
    (userRole || "").toLowerCase().includes("asatidz") ||
    (userRole || "").toLowerCase().includes("pengajar") ||
    (initialPegawai?.kategori_pegawai || "").toUpperCase().includes("GURU");

  const [formData, setFormData] = useState({
    nama_lengkap: initialPegawai?.nama_lengkap || userName || "",
    nik: initialPegawai?.nik || "",
    jenis_kelamin: initialPegawai?.jenis_kelamin || "LAKI_LAKI",
    tempat_lahir: initialPegawai?.tempat_lahir || "",
    tanggal_lahir: formatDateForInput(initialPegawai?.tanggal_lahir),
    no_hp: initialPegawai?.no_hp || "",
    email: initialPegawai?.email || "",
    alamat: initialPegawai?.alamat || "",
    kategori_pegawai: initialPegawai?.kategori_pegawai || (isInitialGuru ? "GURU,ASATIDZ" : "PEGAWAI_UMUM"),
    unit_kerja: initialPegawai?.unit_kerja || "Pesantren Al-Imam",
    divisi: initialPegawai?.divisi || "",
    jabatan: initialPegawai?.jabatan || (isInitialGuru ? "Pengajar / Guru" : "Staf Pegawai"),
    mata_pelajaran: initialPegawai?.mata_pelajaran || initialMapel || "",
    pendidikan_terakhir: initialPegawai?.pendidikan_terakhir || "",
    status_pernikahan: initialPegawai?.status_pernikahan || "BELUM_MENIKAH",
    foto_url: initialPegawai?.foto_url || null as string | null,
  });

  const [customKategoriInput, setCustomKategoriInput] = useState("");

  // Draft restore (Mandatory UX Rule)
  useEffect(() => {
    if (needsSetup) {
      setIsOpen(true);
      setIsForced(true);
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") setFormData(prev => ({ ...prev, ...parsed }));
        }
      } catch { /* ignore */ }
    }
  }, [needsSetup]);

  // Draft autosave (Mandatory UX Rule)
  useEffect(() => {
    if (isOpen) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch { /* ignore */ }
    }
  }, [formData, isOpen]);

  // Open via event
  useEffect(() => {
    const handler = () => { setIsOpen(true); setIsForced(false); };
    window.addEventListener("open-teacher-mapel-modal", handler);
    return () => window.removeEventListener("open-teacher-mapel-modal", handler);
  }, []);

  const selectedKategoriList = useMemo(() => {
    if (!formData.kategori_pegawai) return [];
    return formData.kategori_pegawai.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  }, [formData.kategori_pegawai]);

  const isGuruActive = useMemo(() =>
    selectedKategoriList.includes("GURU") || selectedKategoriList.includes("ASATIDZ") || isInitialGuru,
    [selectedKategoriList, isInitialGuru]
  );

  const toggleKategori = (val: string) => {
    const clean = val.trim().toUpperCase();
    if (!clean) return;
    const updated = selectedKategoriList.includes(clean)
      ? selectedKategoriList.filter(v => v !== clean)
      : [...selectedKategoriList, clean];
    setFormData({ ...formData, kategori_pegawai: updated.join(",") });
  };

  const handleAddCustomKategori = () => {
    const clean = customKategoriInput.trim().toUpperCase();
    if (!clean) return;
    if (!selectedKategoriList.includes(clean)) {
      setFormData({ ...formData, kategori_pegawai: [...selectedKategoriList, clean].join(",") });
    }
    setCustomKategoriInput("");
  };

  // Upload Foto Handler
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "Ukuran File Terlalu Besar", text: "Maks. 5MB.", confirmButtonColor: "#3b0a0a" });
      return;
    }
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, foto_url: data.url }));
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Foto berhasil diunggah!", showConfirmButton: false, timer: 2500 });
      } else {
        Swal.fire({ icon: "error", title: "Gagal Mengunggah Foto", confirmButtonColor: "#3b0a0a" });
      }
    } catch {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Gagal terhubung ke server.", showConfirmButton: false, timer: 2500 });
    } finally { setUploadingFoto(false); }
  };

  // Logout: save draft first so data is preserved when user returns
  const handleLogout = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "<span style='color:#3b0a0a;font-weight:800'>Keluar dari SIKAP?</span>",
      html: `
        <div style='color:#64748b;font-size:.875rem;text-align:left;margin-top:4px'>
          <p>Data yang <b>sudah Anda isi</b> pada form ini akan <b style='color:#16a34a'>tetap tersimpan</b> sebagai draft.</p>
          <p style='margin-top:6px'>Saat Anda login kembali, data yang sudah terisi sebelumnya tidak perlu diisi ulang — Anda hanya melengkapi yang kosong.</p>
        </div>
      `,
      confirmButtonText: "Ya, Logout Sekarang",
      cancelButtonText: "Batal, Lanjut Isi Data",
      showCancelButton: true,
      confirmButtonColor: "#7f1d1d",
      cancelButtonColor: "#1e293b",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    // Save current draft explicitly so it persists across sessions
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch { /* ignore */ }

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ } finally {
      window.location.href = "/login";
    }
  };

  const handleSave = async () => {
    if (!formData.nama_lengkap.trim()) {
      Swal.fire({ icon: "warning", title: "Nama Lengkap wajib diisi", confirmButtonColor: "#3b0a0a" }); return;
    }
    if (!formData.email?.trim()) {
      Swal.fire({ icon: "warning", title: "Email Login wajib diisi", text: "Email ini akan digunakan untuk login Anda selanjutnya.", confirmButtonColor: "#3b0a0a" }); return;
    }
    if (!formData.no_hp.trim()) {
      Swal.fire({ icon: "warning", title: "No. WhatsApp / HP wajib diisi", confirmButtonColor: "#3b0a0a" }); return;
    }
    if (isGuruActive && (!formData.mata_pelajaran || !formData.mata_pelajaran.trim())) {
      Swal.fire({ icon: "warning", title: "Pilih minimal 1 Mata Pelajaran", text: "Sebagai guru/asatidz, penugasan mapel wajib diisi.", confirmButtonColor: "#3b0a0a" }); return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        setIsForced(false);
        setIsOpen(false);
        await Swal.fire({
          icon: "success",
          title: `<span style="color:#3b0a0a;font-weight:800">Data Berhasil Disimpan!</span>`,
          html: `<p style="color:#64748b;font-size:.875rem">Jazakallahu Khairan, <b>${formData.nama_lengkap}</b>! Profil Anda telah tersimpan.</p>`,
          confirmButtonText: "Mulai Gunakan SIKAP →",
          confirmButtonColor: "#3b0a0a",
          timer: 3500, timerProgressBar: true,
        });
        window.location.reload();
      } else {
        Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: json.error || "Terjadi kesalahan.", confirmButtonColor: "#3b0a0a" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Kesalahan Jaringan", confirmButtonColor: "#3b0a0a" });
    } finally { setIsSaving(false); }
  };

  const initials = (formData.nama_lengkap || userName || "?").charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4"
          style={{ background: "rgba(2,6,23,0.82)", backdropFilter: "blur(14px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 32 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: "2rem",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            {/* ═══ HEADER ═══ */}
            <div
              className="relative overflow-hidden shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a0505 0%, #3b0a0a 40%, #6b1111 70%, #8b1a1a 100%)",
                padding: "1.5rem 2rem",
              }}
            >
              {/* Decorative mesh */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.06,
                backgroundImage: "radial-gradient(circle at 20% 50%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fde68a 0%, transparent 40%), radial-gradient(circle at 60% 80%, #f59e0b 0%, transparent 35%)",
              }} />
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "40%", opacity: 0.03,
                backgroundImage: "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 20px)",
              }} />

              {!isForced && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer z-10 transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                >
                  <X size={18} />
                </motion.button>
              )}

              <div className="relative flex items-center gap-4">
                {/* Icon badge */}
                <div style={{
                  width: 52, height: 52, borderRadius: "1rem",
                  background: "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))",
                  border: "1px solid rgba(251,191,36,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 0 20px rgba(251,191,36,0.15)",
                }}>
                  {isForced
                    ? <AlertTriangle size={26} style={{ color: "#fbbf24" }} />
                    : <Edit3 size={26} style={{ color: "#fbbf24" }} />
                  }
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "2px 10px", borderRadius: "999px",
                      background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                      color: "#fde68a", textTransform: "uppercase",
                    }}>
                      <Sparkles size={10} />
                      {isForced ? "Lengkapi Data Civitas" : "Pengaturan Profil & Mapel"}
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "white", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                    {isForced ? `Ahlan wa Sahlan, ${formData.nama_lengkap || userName}!` : "Edit Profil & Penugasan Mengajar"}
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "rgba(253,230,138,0.75)", marginTop: 4, lineHeight: 1.5 }}>
                    {isForced
                      ? "Mohon lengkapi data profil sebelum menggunakan SIKAP. Data tersinkron otomatis dengan SIMPEG."
                      : "Perbarui identitas, kontak, dan penugasan mata pelajaran Anda."}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ BODY ═══ */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Mandatory banner */}
              {isForced && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                    border: "1px solid #fcd34d",
                    borderRadius: "1rem",
                    padding: "12px 16px",
                    display: "flex", alignItems: "flex-start", gap: 12,
                    boxShadow: "0 2px 12px rgba(251,191,36,0.12)",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "0.75rem", flexShrink: 0,
                    background: "rgba(217,119,6,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ShieldCheck size={18} style={{ color: "#d97706" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: "0.85rem", color: "#92400e" }}>Pendataan Mandiri Civitas Pesantren Al-Imam</p>
                    <p style={{ fontSize: "0.775rem", color: "#b45309", marginTop: 2, lineHeight: 1.6 }}>
                      Sistem mendeteksi data Anda belum lengkap. Isi form berikut agar jadwal, presensi, dan penilaian dapat berjalan. Semua data tersinkron otomatis dengan SIMPEG.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── SECTION 1: FOTO + IDENTITAS UTAMA ─── */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "1px solid #e2e8f0",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "1rem",
              }}>
                <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Avatar Upload */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{
                      position: "relative",
                      width: 110, height: 110,
                      borderRadius: "1.5rem",
                      boxShadow: "0 8px 32px rgba(59,10,10,0.2), 0 0 0 4px white, 0 0 0 5px rgba(59,10,10,0.1)",
                      overflow: "hidden",
                      background: formData.foto_url ? "transparent" : "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                      flexShrink: 0,
                    }}>
                      {formData.foto_url ? (
                        <img src={formData.foto_url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b0a0a, #6b1111)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, fontWeight: 900, color: "white",
                            boxShadow: "0 4px 12px rgba(59,10,10,0.4)",
                          }}>
                            {initials}
                          </div>
                        </div>
                      )}
                      {uploadingFoto && (
                        <div style={{
                          position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        }}>
                          <Loader2 size={20} style={{ color: "#fbbf24" }} className="animate-spin" />
                          <span style={{ fontSize: 10, color: "white", fontWeight: 700 }}>Mengunggah...</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 110 }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => fotoInputRef.current?.click()}
                        disabled={uploadingFoto}
                        style={{
                          padding: "7px 0", borderRadius: "0.75rem",
                          background: "white", border: "1.5px solid #e2e8f0",
                          fontSize: 11, fontWeight: 700, color: "#374151",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          width: "100%",
                        }}
                      >
                        <Camera size={12} style={{ color: "#3b0a0a" }} />
                        {formData.foto_url ? "Ganti Foto" : "Upload Foto"}
                      </motion.button>
                      <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadFoto} />
                      {formData.foto_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, foto_url: null }))}
                          style={{
                            padding: "5px 0", fontSize: 10, fontWeight: 700, color: "#dc2626",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            background: "none", border: "none", cursor: "pointer",
                          }}
                        >
                          <Trash2 size={10} /> Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nama & Jabatan */}
                  <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div>
                      <label className={labelCls}>Nama Lengkap & Gelar Akademik <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        value={formData.nama_lengkap}
                        onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                        placeholder="Contoh: Ustadz Abdil Aziz, S.Pd"
                        className={inputCls}
                        style={{ fontWeight: 700, fontSize: "0.95rem" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label className={labelCls}>Jabatan / Posisi</label>
                        <input type="text" value={formData.jabatan} onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                          placeholder="Misal: Pengajar" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Divisi</label>
                        <select value={formData.divisi} onChange={e => setFormData({ ...formData, divisi: e.target.value })} className={inputCls}>
                          <option value="">— Pilih —</option>
                          {DIVISI_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Unit Kerja</label>
                        <input type="text" value={formData.unit_kerja} onChange={e => setFormData({ ...formData, unit_kerja: e.target.value })}
                          placeholder="Pesantren Al-Imam" className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kategori Civitas */}
                <div style={{
                  background: "white", borderRadius: "1.25rem",
                  border: "1px solid #e2e8f0", padding: "1rem",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Sparkles size={12} style={{ color: "#3b0a0a" }} />
                    Kategori Civitas
                    <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: 10, textTransform: "none", letterSpacing: 0 }}>(boleh pilih lebih dari 1)</span>
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {KATEGORI_OPTIONS.map(cat => {
                      const isSelected = selectedKategoriList.includes(cat.value);
                      const Icon = cat.icon;
                      return (
                        <motion.button
                          key={cat.value}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleKategori(cat.value)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 14px", borderRadius: "999px",
                            border: `1.5px solid ${isSelected ? cat.color : "#e2e8f0"}`,
                            background: isSelected ? cat.bg : "white",
                            cursor: "pointer", transition: "all 0.15s",
                            boxShadow: isSelected ? `0 0 0 3px ${cat.color}20` : "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: isSelected ? cat.color : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {isSelected
                              ? <Check size={12} style={{ color: "white", strokeWidth: 3 }} />
                              : <Icon size={12} style={{ color: "#94a3b8" }} />
                            }
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? cat.color : "#374151", lineHeight: 1.2 }}>{cat.label}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.2 }}>{cat.desc}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Custom tags */}
                  {selectedKategoriList.some(k => !KATEGORI_OPTIONS.some(o => o.value === k)) && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Lainnya:</span>
                      {selectedKategoriList
                        .filter(k => !KATEGORI_OPTIONS.some(o => o.value === k))
                        .map(custom => (
                          <span key={custom} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "3px 10px", borderRadius: "999px",
                            background: "#fef3c7", border: "1px solid #fcd34d",
                            fontSize: 11, fontWeight: 700, color: "#92400e",
                          }}>
                            {custom}
                            <button type="button" onClick={() => toggleKategori(custom)} style={{ color: "#d97706", cursor: "pointer", lineHeight: 1 }}>
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={customKategoriInput}
                      onChange={e => setCustomKategoriInput(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomKategori(); } }}
                      placeholder="Tambah kategori lain (mis: SATPAM)…"
                      style={{
                        flex: 1, padding: "7px 14px", borderRadius: "999px",
                        border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none",
                        background: "#f8fafc",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomKategori}
                      disabled={!customKategoriInput.trim()}
                      style={{
                        padding: "7px 16px", borderRadius: "999px",
                        background: "#1e293b", color: "white",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        border: "none", opacity: customKategoriInput.trim() ? 1 : 0.4,
                      }}
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 2: MAPEL (GURU) ─── */}
              {isGuruActive && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "linear-gradient(135deg, #fff7ed, #fffbeb)",
                    border: "1.5px solid #fed7aa",
                    borderRadius: "1.5rem",
                    padding: "1.25rem",
                    boxShadow: "0 4px 20px rgba(251,146,60,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "0.875rem",
                        background: "linear-gradient(135deg, #ea580c, #f97316)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(234,88,12,0.3)",
                      }}>
                        <BookOpen size={18} style={{ color: "white" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 900, fontSize: "0.875rem", color: "#9a3412" }}>Penugasan Mata Pelajaran</p>
                        <p style={{ fontSize: "0.75rem", color: "#c2410c" }}>Pilih jenjang, kelas, dan mapel yang Anda ampu</p>
                      </div>
                    </div>
                    <span style={{
                      padding: "4px 12px", borderRadius: "999px",
                      background: "#dc2626", color: "white",
                      fontSize: 10, fontWeight: 800,
                    }}>
                      Wajib Diisi
                    </span>
                  </div>
                  <MapelSelector value={formData.mata_pelajaran || ""} onChange={val => setFormData({ ...formData, mata_pelajaran: val })} />
                </motion.div>
              )}

              {/* ─── SECTION 3: DATA PRIBADI ─── */}
              <div style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: "1.5rem", padding: "1.25rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "0.75rem",
                    background: "linear-gradient(135deg, #1e293b, #334155)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <User2 size={16} style={{ color: "white" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>Data Induk Pribadi & Kontak</p>
                    <p style={{ fontSize: "0.73rem", color: "#94a3b8" }}>Data identitas resmi untuk rekam jejak kepegawaian</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {/* WA */}
                  <div>
                    <label className={labelCls}>No. WhatsApp / HP Aktif <span style={{ color: "#ef4444" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <Phone size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input type="text" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })}
                        placeholder="Contoh: 08123456789" className={inputCls} style={{ paddingLeft: 38, fontFamily: "monospace", fontWeight: 700 }} />
                    </div>
                  </div>
                  {/* Gender */}
                  <div>
                    <label className={labelCls}>Jenis Kelamin <span style={{ color: "#ef4444" }}>*</span></label>
                    <select value={formData.jenis_kelamin} onChange={e => setFormData({ ...formData, jenis_kelamin: e.target.value })} className={inputCls}>
                      <option value="LAKI_LAKI">Laki-laki</option>
                      <option value="PEREMPUAN">Perempuan</option>
                    </select>
                  </div>
                  {/* NIK */}
                  <div>
                    <label className={labelCls}>NIK (No. KTP)</label>
                    <input type="text" maxLength={16} value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="16 digit NIK KTP" className={inputCls} style={{ fontFamily: "monospace" }} />
                  </div>
                  {/* Email */}
                  <div>
                    <label className={labelCls}>Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nama@email.com" className={inputCls} style={{ paddingLeft: 38 }} />
                    </div>
                  </div>
                  {/* TTL */}
                  <div>
                    <label className={labelCls}>Tempat Lahir</label>
                    <input type="text" value={formData.tempat_lahir} onChange={e => setFormData({ ...formData, tempat_lahir: e.target.value })}
                      placeholder="Kota kelahiran" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal Lahir</label>
                    <input type="date" value={formData.tanggal_lahir} onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                      className={inputCls} />
                  </div>
                  {/* Pendidikan */}
                  <div>
                    <label className={labelCls}>Pendidikan Terakhir</label>
                    <select value={formData.pendidikan_terakhir} onChange={e => setFormData({ ...formData, pendidikan_terakhir: e.target.value })} className={inputCls}>
                      <option value="">— Pilih Pendidikan —</option>
                      {PENDIDIKAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {/* Status Pernikahan */}
                  <div>
                    <label className={labelCls}>Status Pernikahan</label>
                    <select value={formData.status_pernikahan} onChange={e => setFormData({ ...formData, status_pernikahan: e.target.value })} className={inputCls}>
                      <option value="BELUM_MENIKAH">Belum Menikah</option>
                      <option value="MENIKAH">Menikah</option>
                      <option value="DUDA_JANDA">Duda / Janda</option>
                    </select>
                  </div>
                  {/* Alamat full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className={labelCls}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={11} /> Alamat Tinggal / Domisili
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.alamat}
                      onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                      placeholder="Alamat lengkap domisili saat ini..."
                      className={inputCls}
                      style={{ resize: "none", lineHeight: 1.6 }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{
              padding: "1rem 2rem",
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              borderTop: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              {!isForced ? (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  style={{
                    padding: "10px 22px", borderRadius: "0.875rem",
                    border: "1.5px solid #e2e8f0", background: "white",
                    fontSize: 13, fontWeight: 700, color: "#64748b",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  Batal
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                  {/* Logout button */}
                  <motion.button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut || isSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px", borderRadius: "0.875rem",
                      background: "white",
                      border: "1.5px solid #fca5a5",
                      color: "#b91c1c",
                      fontSize: 12, fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(239,68,68,0.08)",
                      opacity: (isLoggingOut || isSaving) ? 0.6 : 1,
                    }}
                  >
                    {isLoggingOut
                      ? <Loader2 size={13} className="animate-spin" />
                      : <LogOut size={13} />
                    }
                    <span>{isLoggingOut ? "Keluar..." : "Logout dulu"}</span>
                  </motion.button>
                  {/* Info hint */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "0.5rem", flexShrink: 0,
                      background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShieldCheck size={12} style={{ color: "#d97706" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#a8a29e", fontWeight: 500, lineHeight: 1.4 }}>
                      Data yang sudah diisi akan tersimpan otomatis
                    </span>
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handleSave}
                disabled={isSaving || uploadingFoto}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(59,10,10,0.35)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "11px 28px", borderRadius: "0.875rem",
                  background: "linear-gradient(135deg, #3b0a0a 0%, #6b1111 50%, #8b1a1a 100%)",
                  color: "white", fontSize: 13, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 8,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(59,10,10,0.25)",
                  opacity: (isSaving || uploadingFoto) ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>{isForced ? "Simpan & Lanjutkan ke SIKAP" : "Simpan Perubahan"}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
