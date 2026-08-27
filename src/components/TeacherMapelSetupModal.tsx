"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, X, Camera, Trash2, ShieldCheck, User2, LogOut, Info
} from "lucide-react";
import Swal from "sweetalert2";

interface PegawaiProfile {
  id?: string;
  nama_lengkap?: string;
  nama_panggilan?: string | null;
  email?: string | null;
  no_hp?: string | null;
  foto_url?: string | null;
  kategori_pegawai?: string | null; nik?: string | null; jenis_kelamin?: string | null; tempat_lahir?: string | null; tanggal_lahir?: string | Date | null; alamat?: string | null; unit_kerja?: string | null; mata_pelajaran?: string | null; pendidikan_terakhir?: string | null; status_pernikahan?: string | null;
  jabatan?: string | null;
  divisi?: string | null;
}

interface TeacherMapelSetupModalProps {
  initialPegawai?: PegawaiProfile | null;
  needsSetup?: boolean;
  userName?: string; initialMapel?: string | null; missingFields?: string[]; userRole?: string;
}

const inputCls = "form-control";
const labelCls = "form-label";

export default function TeacherMapelSetupModal({
  initialPegawai = null,
  needsSetup = false,
  userName = "Pegawai" }: TeacherMapelSetupModalProps) {
  const [isOpen, setIsOpen] = useState(needsSetup);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nama_panggilan: initialPegawai?.nama_panggilan || "",
    email: initialPegawai?.email || "",
    no_hp: initialPegawai?.no_hp || "",
    foto_url: initialPegawai?.foto_url || null as string | null 
  });

  // Open via event
  useEffect(() => {
    const handler = () => { setIsOpen(true); };
    window.addEventListener("open-teacher-mapel-modal", handler);
    return () => window.removeEventListener("open-teacher-mapel-modal", handler);
  }, []);

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
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", confirmButtonColor: "#3b0a0a" });
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/master/guru/self-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nama_panggilan: formData.nama_panggilan,
          email: formData.email,
          no_hp: formData.no_hp,
          foto_url: formData.foto_url
        })
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Profil Tersimpan",
          text: "Data berhasil diperbarui",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          setIsOpen(false);
          window.location.reload();
        });
      } else {
        Swal.fire("Gagal", "Gagal menyimpan data", "error");
      }
    } catch {
      Swal.fire("Error", "Gagal terhubung ke server", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const doLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };
  const initials = getInitials(initialPegawai?.nama_lengkap || userName);

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
        padding: "1rem" }}>
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !needsSetup && setIsOpen(false)}
          style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)" }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{
            position: "relative", width: "100%", maxWidth: "600px",
            background: "white", borderRadius: "1.5rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column",
            maxHeight: "90vh", overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #3b0a0a, #6b1111)",
            padding: "1.5rem", color: "white", position: "relative" }}>
            
            {!needsSetup && (
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  position: "absolute", top: "1.25rem", right: "1.25rem",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", cursor: "pointer", transition: "background 0.2s" }}
              >
                <X size={18} />
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "1rem",
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User2 size={24} style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Profil Pegawai</h2>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", margin: "0.25rem 0 0 0" }}>
                  Perbarui foto dan kontak Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} className="custom-scrollbar">

            {/* Read Only Info Box */}
            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "1rem", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <Info size={16} className="text-blue-500" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>INFORMASI INDUK (READ-ONLY)</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                Nama lengkap, Jabatan, Kategori, dan Distribusi Mata Pelajaran dikelola secara terpusat oleh SIMPEG dan SIKAP.
              </p>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>{initialPegawai?.nama_lengkap || userName}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>{initialPegawai?.jabatan || "Pegawai"} • {initialPegawai?.divisi || "Umum"}</div>
              </div>
            </div>

            {/* Editable Form */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              
              {/* Foto */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{
                  position: "relative", width: 110, height: 110, borderRadius: "1.5rem",
                  boxShadow: "0 8px 32px rgba(59,10,10,0.1), 0 0 0 4px white, 0 0 0 5px rgba(59,10,10,0.05)",
                  overflow: "hidden", background: formData.foto_url ? "transparent" : "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
                  
                  {formData.foto_url ? (
                    <img src={formData.foto_url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #3b0a0a, #6b1111)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 900, color: "white" }}>
                        {initials}
                      </div>
                    </div>
                  )}
                  {uploadingFoto && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 size={20} className="animate-spin text-amber-400" />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 110 }}>
                  <button type="button" onClick={() => fotoInputRef.current?.click()} disabled={uploadingFoto}
                    style={{ padding: "6px 0", borderRadius: "0.5rem", background: "white", border: "1px solid #cbd5e1", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", gap: 4 }}>
                    <Camera size={12} /> {formData.foto_url ? "Ganti" : "Upload"}
                  </button>
                  <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadFoto} />
                  {formData.foto_url && (
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, foto_url: null }))}
                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", gap: 4 }}>
                      <Trash2 size={10} /> Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className={labelCls}>Nama Panggilan</label>
                  <input type="text" value={formData.nama_panggilan} onChange={e => setFormData({ ...formData, nama_panggilan: e.target.value })} className={inputCls} placeholder="Ust. / Ustadzah..." />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="Email aktif" />
                </div>
                <div>
                  <label className={labelCls}>Nomor WhatsApp</label>
                  <input type="text" value={formData.no_hp} onChange={e => setFormData({ ...formData, no_hp: e.target.value })} className={inputCls} placeholder="08..." />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #e2e8f0", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={doLogout}
              disabled={isLoggingOut}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: "0.75rem",
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              Keluar
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #3b0a0a, #6b1111)", border: "none",
                color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(59,10,10,0.2)" }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Profil
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
