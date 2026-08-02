"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  Save, Loader2, Edit3, X, Camera, Trash2, Users, FileText, 
  Award, Phone, Mail, MapPin, Calendar, Heart, Check, Briefcase
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
  { value: "GURU", label: "Guru / Asatidz", desc: "Pengajar kelas & kajian", color: "blue" },
  { value: "MUSYRIF", label: "Musyrif / Pengasuh", desc: "Pembina asrama & santri", color: "purple" },
  { value: "STAF", label: "Staf Pegawai", desc: "Keuangan, Sapras, IT, Media", color: "emerald" },
  { value: "IBU_DAPUR", label: "Ibu Dapur", desc: "Konsumsi & dapur santri", color: "amber" },
  { value: "PIMPINAN", label: "Pimpinan / Manajemen", desc: "Mudir, Kepala Divisi, dll", color: "rose" },
];

const DIVISI_OPTIONS = [
  "Kepengasuhan",
  "Kurikulum",
  "Kedisiplinan",
  "Sarana & Prasarana",
  "Dapur & Konsumsi",
  "IT",
  "Media & Dokumentasi",
  "Keuangan",
  "Tata Usaha",
  "Umum",
];

const PENDIDIKAN_OPTIONS = [
  "SMA / MA / Sederajat",
  "D3",
  "D4 / S1",
  "S2 (Magister)",
  "S3 (Doktor)",
  "Pondok Pesantren / Non-Formal",
];

const DRAFT_KEY = "sikap_civitas_profile_draft";

const formatDateForInput = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

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
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const isInitialGuru = (userRole || "").toLowerCase().includes("guru") || 
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
    foto_url: initialPegawai?.foto_url || null,
  });

  const [customKategoriInput, setCustomKategoriInput] = useState("");

  // Restore draft if available when in forced/setup mode (Mandatory UX Rule)
  useEffect(() => {
    if (needsSetup) {
      setIsOpen(true);
      setIsForced(true);
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === "object") {
            setFormData((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, [needsSetup]);

  // Draft autosave subscription (Mandatory UX Rule)
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch (err) {
        console.error("Autosave draft failed", err);
      }
    }
  }, [formData, isOpen]);

  // Listener untuk membuka modal dari sidebar / profil
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      setIsForced(false);
    };
    window.addEventListener("open-teacher-mapel-modal", handleOpenModal);
    return () => window.removeEventListener("open-teacher-mapel-modal", handleOpenModal);
  }, []);

  // Parse list of selected categories
  const selectedKategoriList = useMemo(() => {
    if (!formData.kategori_pegawai) return [];
    return formData.kategori_pegawai
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s);
  }, [formData.kategori_pegawai]);

  const isGuruActive = useMemo(() => {
    return selectedKategoriList.includes("GURU") || selectedKategoriList.includes("ASATIDZ") || isInitialGuru;
  }, [selectedKategoriList, isInitialGuru]);

  const toggleKategori = (val: string) => {
    const cleanVal = val.trim().toUpperCase();
    if (!cleanVal) return;

    let updated: string[];
    if (selectedKategoriList.includes(cleanVal)) {
      updated = selectedKategoriList.filter((v) => v !== cleanVal);
    } else {
      updated = [...selectedKategoriList, cleanVal];
    }
    setFormData({ ...formData, kategori_pegawai: updated.join(",") });
  };

  const handleAddCustomKategori = () => {
    const clean = customKategoriInput.trim().toUpperCase();
    if (!clean) return;
    if (!selectedKategoriList.includes(clean)) {
      const updated = [...selectedKategoriList, clean];
      setFormData({ ...formData, kategori_pegawai: updated.join(",") });
    }
    setCustomKategoriInput("");
  };

// Upload Foto Handler
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "<span class='text-slate-800 font-extrabold text-lg'>Ukuran File Terlalu Besar</span>",
        html: "<p class='text-slate-500 text-sm'>Ukuran foto profil maksimal adalah <b>5MB</b>.</p>",
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#3b0a0a",
      });
      return;
    }

    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const resData = await res.json();
        setFormData((prev) => ({ ...prev, foto_url: resData.url }));
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Foto profil berhasil diunggah!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "rounded-2xl shadow-xl" },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Mengunggah Foto",
          text: "Terjadi kesalahan saat memproses file foto.",
          confirmButtonColor: "#3b0a0a",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Gagal terhubung ke server upload.",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSave = async () => {
    // Validasi Field Wajib
    if (!formData.nama_lengkap.trim()) {
      Swal.fire({
        icon: "warning",
        title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Nama Lengkap Wajib Diisi</span>",
        html: "<p style='color:#64748b; font-size:0.875rem'>Mohon masukkan nama lengkap dan gelar Anda.</p>",
        confirmButtonText: "Lengkapi",
        confirmButtonColor: "#3b0a0a",
      });
      return;
    }

    if (!formData.no_hp.trim()) {
      Swal.fire({
        icon: "warning",
        title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>No. WhatsApp / HP Wajib Diisi</span>",
        html: "<p style='color:#64748b; font-size:0.875rem'>Nomor WhatsApp aktif diperlukan untuk notifikasi sistem dan koordinasi pengasuhan.</p>",
        confirmButtonText: "Isi No. HP",
        confirmButtonColor: "#3b0a0a",
      });
      return;
    }

    if (isGuruActive && (!formData.mata_pelajaran || !formData.mata_pelajaran.trim())) {
      Swal.fire({
        icon: "warning",
        title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Pilih Minimal 1 Mata Pelajaran</span>",
        html: "<p style='color:#64748b; font-size:0.875rem'>Sebagai guru / pengajar, silakan pilih jenjang, kelas, dan minimal satu mata pelajaran yang Anda ampu.</p>",
        confirmButtonText: "Pilih Mapel",
        confirmButtonColor: "#3b0a0a",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resJson = await res.json();

      if (res.ok) {
        // Clear autosave draft on success (Mandatory UX Rule)
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (e) {
          console.error(e);
        }

        setIsForced(false);
        setIsOpen(false);

        await Swal.fire({
          icon: "success",
          title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.25rem'>Data Civitas Berhasil Disimpan!</span>",
          html: `
            <div style='color:#64748b; font-size:0.875rem; text-align:left; margin-top:8px;'>
              <p>Jazakallahu Khairan, <b>${formData.nama_lengkap}</b>! Data profil dan penugasan Anda telah berhasil disimpan di database SIKAP.</p>
              ${formData.mata_pelajaran ? `
                <div style='margin-top:10px; padding:10px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; font-size:0.8rem; color:#334155;'>
                  <b>Mapel Aktif:</b> ${formData.mata_pelajaran}
                </div>
              ` : ""}
            </div>
          `,
          confirmButtonText: "Mulai Gunakan SIKAP",
          confirmButtonColor: "#3b0a0a",
          customClass: {
            popup: "rounded-3xl shadow-2xl p-6",
            confirmButton: "px-8 py-3 rounded-2xl font-black text-sm shadow-lg cursor-pointer",
          },
          timer: 3000,
          timerProgressBar: true,
        });

        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          title: "<span style='color:#3b0a0a; font-weight:800; font-size:1.2rem'>Gagal Menyimpan</span>",
          html: `<p style='color:#64748b; font-size:0.875rem'>${resJson.error || "Terjadi kesalahan saat menyimpan data profil."}</p>`,
          confirmButtonText: "Coba Lagi",
          confirmButtonColor: "#3b0a0a",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Gagal menghubungi server. Silakan periksa koneksi internet Anda.",
        confirmButtonColor: "#3b0a0a",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#3b0a0a] via-[#5c1313] to-[#801919] p-5 sm:p-6 text-white shrink-0 relative">
              {!isForced && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                  {isForced ? <AlertTriangle size={24} /> : <Edit3 size={24} />}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400/20 text-amber-200 border border-amber-400/30 uppercase tracking-wider mb-1">
                    <Sparkles size={12} />
                    <span>{isForced ? "Lengkapi Data Profil Civitas" : "Pengaturan Data & Mapel"}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                    {isForced ? `Ahlan wa Sahlan, ${formData.nama_lengkap || userName}!` : "Edit Profil & Penugasan Mengajar"}
                  </h2>
                  <p className="text-xs text-amber-100/80 mt-0.5 leading-relaxed">
                    {isForced 
                      ? "Sebelum dapat menggunakan fitur aplikasi SIKAP, mohon lengkapi data profil dan penugasan mengajar Anda di bawah ini." 
                      : "Perbarui identitas, kontak, dan pilihan mata pelajaran yang Anda ampu."}
                  </p>
                </div>
              </div>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Alert Banner jika Wajib Lengkapi Data */}
              {isForced && (
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950 text-sm">Pendataan Mandiri Civitas Pesantren Al-Imam</p>
                    <p className="mt-0.5 text-amber-800">
                      Sistem mendeteksi beberapa data penting Anda belum lengkap di database induk SIKAP. Silakan isi form di bawah ini agar jadwal, presensi, dan penilaian santri dapat berjalan otomatis.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── BAGIAN 1: FOTO & NAMA UTAMA ─── */}
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                {/* Upload Foto */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-white border-2 border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {formData.foto_url ? (
                      <img
                        src={formData.foto_url}
                        alt={formData.nama_lengkap}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-1" />
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Belum Ada Foto</span>
                      </div>
                    )}

                    {uploadingFoto && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                        <span>Mengunggah...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <button
                      type="button"
                      onClick={() => fotoInputRef.current?.click()}
                      disabled={uploadingFoto}
                      className="w-full py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-primary-800" />
                      <span>{formData.foto_url ? "Ganti Foto" : "Upload Foto"}</span>
                    </button>
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFoto}
                    />

                    {formData.foto_url && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, foto_url: null }))}
                        className="w-full py-0.5 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Nama & Kategori */}
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                      Nama Lengkap &amp; Gelar Akademik <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                      placeholder="Contoh: Ustadz Abdil Aziz, S.Pd, B.A"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 focus:border-[#3b0a0a]"
                    />
                  </div>

                  {/* Kategori Civitas Multi-Selector */}
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#3b0a0a]" />
                      <span>Kategori Civitas (Bisa Pilih Lebih Dari 1):</span>
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {KATEGORI_OPTIONS.map((cat) => {
                        const isSelected = selectedKategoriList.includes(cat.value);
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => toggleKategori(cat.value)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-amber-50/60 border-[#3b0a0a] ring-2 ring-[#3b0a0a]/20 shadow-sm"
                                : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? "bg-[#3b0a0a] text-white" : "border border-slate-300 bg-white"
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <div className={`text-xs font-bold ${isSelected ? "text-[#3b0a0a]" : "text-slate-800"}`}>
                                {cat.label}
                              </div>
                              <div className="text-[10px] text-slate-400 leading-tight">
                                {cat.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tag Kustom */}
                    <div className="pt-2 space-y-2">
                      {selectedKategoriList.some((k) => !KATEGORI_OPTIONS.some((opt) => opt.value === k)) && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Kategori Lain:</span>
                          {selectedKategoriList
                            .filter((k) => !KATEGORI_OPTIONS.some((opt) => opt.value === k))
                            .map((custom) => (
                              <span
                                key={custom}
                                className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg"
                              >
                                {custom}
                                <button
                                  type="button"
                                  onClick={() => toggleKategori(custom)}
                                  className="text-amber-700 hover:text-red-600"
                                  title="Hapus"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customKategoriInput}
                          onChange={(e) => setCustomKategoriInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomKategori();
                            }
                          }}
                          placeholder="Tambah kategori kustom lainnya (misal: SATPAM, SOPIR)..."
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomKategori}
                          disabled={!customKategoriInput.trim()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>+ Tambah</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Jabatan & Divisi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Jabatan / Posisi</label>
                      <input 
                        type="text" 
                        value={formData.jabatan}
                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                        placeholder="Contoh: Pengajar, Wali Kelas"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Divisi</label>
                      <select
                        value={formData.divisi}
                        onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-semibold"
                      >
                        <option value="">— Pilih Divisi —</option>
                        {DIVISI_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Unit Kerja</label>
                      <input 
                        type="text" 
                        value={formData.unit_kerja}
                        onChange={(e) => setFormData({ ...formData, unit_kerja: e.target.value })}
                        placeholder="Pesantren Al-Imam"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── BAGIAN 2: PENUGASAN MAPEL (JIKA GURU / ASATIDZ) ─── */}
              {isGuruActive && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#3b0a0a]" />
                      <span>Penugasan Mata Pelajaran Mengajar (Khusus Guru / Asatidz)</span>
                    </label>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Wajib Diisi Guru
                    </span>
                  </div>
                  <MapelSelector 
                    value={formData.mata_pelajaran || ""} 
                    onChange={(val) => setFormData({ ...formData, mata_pelajaran: val })} 
                  />
                </div>
              )}

              {/* ─── BAGIAN 3: DATA INDUK PRIBADI & KONTAK ─── */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-[#3b0a0a]" />
                  <span>Data Induk Pribadi &amp; Kontak</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* WhatsApp / No HP (Wajib) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      No. WhatsApp / HP Aktif <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.no_hp}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Jenis Kelamin (Wajib) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.jenis_kelamin}
                      onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-semibold"
                    >
                      <option value="LAKI_LAKI">Laki-laki</option>
                      <option value="PEREMPUAN">Perempuan</option>
                    </select>
                  </div>

                  {/* NIK */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">NIK (No. KTP)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="16 digit NIK KTP"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nama@email.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                      />
                    </div>
                  </div>

                  {/* Tempat Lahir */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempat_lahir}
                      onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                      placeholder="Kota kelahiran"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.tanggal_lahir}
                      onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 font-medium"
                    />
                  </div>

                  {/* Pendidikan Terakhir */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Pendidikan Terakhir</label>
                    <select
                      value={formData.pendidikan_terakhir}
                      onChange={(e) => setFormData({ ...formData, pendidikan_terakhir: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                    >
                      <option value="">— Pilih Pendidikan —</option>
                      {PENDIDIKAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Pernikahan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Status Pernikahan</label>
                    <select
                      value={formData.status_pernikahan}
                      onChange={(e) => setFormData({ ...formData, status_pernikahan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                    >
                      <option value="BELUM_MENIKAH">Belum Menikah</option>
                      <option value="MENIKAH">Menikah</option>
                      <option value="DUDA_JANDA">Duda / Janda</option>
                    </select>
                  </div>

                  {/* Alamat */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Alamat Tinggal / Domisili</label>
                    <textarea
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      placeholder="Alamat lengkap domisili saat ini..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              {!isForced ? (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Wajib melengkapi data sebelum masuk ke aplikasi</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || uploadingFoto}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#3b0a0a] to-[#701515] hover:from-[#4d0e0e] hover:to-[#8a1a1a] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{isForced ? "Simpan & Lanjutkan ke SIKAP" : "Simpan Perubahan"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
