"use client";

import { useState, useEffect } from "react";
import { Lock, KeyRound, CheckCircle, Loader2, UserCheck, BookOpen, Edit3, ShieldAlert, Phone, Mail, Award, MapPin } from "lucide-react";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Gagal", text: "Password baru dan konfirmasi tidak cocok!" });
      return;
    }
    if (newPassword.length < 8) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Password baru minimal 8 karakter!" });
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Password baru harus mengandung kombinasi huruf besar, huruf kecil, angka, dan karakter khusus!" });
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }) });
      const data = await res.json();
      
      if (!res.ok) {
        Swal.fire({ icon: "error", title: "Gagal", text: data.error || "Gagal mengganti password" });
      } else {
        Swal.fire({ icon: "success", title: "Berhasil", text: "Password berhasil diganti!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setLoadingPassword(false);
    }
  };

  const openEditProfileModal = () => {
    window.dispatchEvent(new CustomEvent("open-teacher-mapel-modal"));
  };

  const p = profile?.pegawai;

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 pb-20 w-full overflow-hidden box-border">
      <div className="flex justify-between items-center bg-gradient-to-br from-[#0D7A5F] to-[#059669] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_10px_25px_-5px_rgba(85,0,0,0.35)] text-white flex-wrap gap-4 w-full box-border">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight m-0 mb-1">Profil &amp; Pengaturan Akun</h1>
          <p className="text-xs sm:text-sm text-emerald-100 m-0">Kelola data kepegawaian, mapel mengajar, dan keamanan akun Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start w-full">
        
        {/* ─── KARTU 1: DATA KEPEGAWAIAN & MAPEL (LEBAR 2 KOLOM) ─── */}
        <div style={{ gridColumn: "1 / -1", '@media (min-width: 1024px)': { gridColumn: "span 2" } } as React.CSSProperties} className="lg:col-span-2">
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "16px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                  <UserCheck style={{ width: "24px", height: "24px" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 4px 0" }}>Data Induk Civitas &amp; Pengajar</h2>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Terintegrasi dengan database SIMPEG &amp; SIAKAD</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfileModal}
                style={{ padding: "10px 18px", background: "#0D7A5F", color: "white", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.4)", transition: "all 0.2s" }}
                className="active:scale-95"
              >
                <Edit3 style={{ width: "14px", height: "14px" }} />
                <span>Edit &amp; Atur Mapel</span>
              </button>
            </div>

            {loadingProfile ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <Loader2 style={{ width: "28px", height: "28px", margin: "0 auto 8px auto", color: "#059669" }} className="animate-spin" />
                <p style={{ fontSize: "12px", fontWeight: 600 }}>Memuat profil...</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Header Foto + Nama */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "white", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)" }}>
                    {p?.foto_url ? (
                      <img src={p.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <UserCheck style={{ width: "28px", height: "28px", color: "#059669" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: "bold", fontSize: "16px", color: "#1e293b", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.nama_lengkap || (profile?.user?.nama ? profile.user.nama.replace(/^Wali dari\s+/i, "") : "Civitas")}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, margin: "0 0 6px 0" }}>
                      {p
                        ? `${p?.jabatan || "Pengajar"} · ${p?.unit_kerja || "Pesantren Al-Basyir"}`
                        : "Portal Resmi Wali Santri · Pesantren Al-Basyir"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {p ? (
                        (p?.kategori_pegawai || "GURU").split(",").map((k: string, i: number) => (
                          <span key={i} style={{ padding: "2px 8px", background: "#fffbeb", color: "#78350f", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                            {k.trim()}
                          </span>
                        ))
                      ) : (
                        <span style={{ padding: "2px 8px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                          Wali Santri
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "12px" }}>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>No. WhatsApp / HP</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", margin: 0 }}>
                      <Phone style={{ width: "14px", height: "14px", color: "#059669" }} />
                      {p?.no_hp || "-"}
                    </p>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Email Akun</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Mail style={{ width: "14px", height: "14px", color: "#059669" }} />
                      {p?.email || profile?.user?.email || "-"}
                    </p>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Jenis Kelamin</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", margin: 0 }}>
                      {p?.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : p?.jenis_kelamin === "PEREMPUAN" ? "Perempuan" : "-"}
                    </p>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Divisi</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", margin: 0 }}>{p?.divisi || "Umum"}</p>
                  </div>
                </div>

                {/* Penugasan Mapel Banner */}
                <div style={{ padding: "16px", background: "#fffbeb", borderRadius: "20px", border: "1px solid #fde68a", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#451a03", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                      <BookOpen style={{ width: "16px", height: "16px", color: "#b45309" }} />
                      <span>Mata Pelajaran yang Diampu</span>
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#b45309", background: "rgba(255,255,255,0.8)", padding: "2px 8px", borderRadius: "999px", border: "1px solid #fcd34d" }}>
                      Aktif di SIKAP
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#78350f", lineHeight: "1.5", margin: 0 }}>
                    {p?.mata_pelajaran || "Belum ada mata pelajaran yang dipilih."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── KARTU 2: GANTI PASSWORD ─── */}
        <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "16px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
              <Lock style={{ width: "20px", height: "20px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 4px 0" }}>Ganti Password</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Keamanan akun login</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>Password Saat Ini</label>
              <div style={{ position: "relative" }}>
                <KeyRound style={{ width: "16px", height: "16px", color: "#94a3b8", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  required
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                  placeholder="Password lama"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>Password Baru</label>
              <div style={{ position: "relative" }}>
                <KeyRound style={{ width: "16px", height: "16px", color: "#94a3b8", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  required
                  minLength={8}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                  placeholder="Password baru (min. 8 karakter, huruf & angka)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#334155", marginBottom: "4px" }}>Ulangi Password Baru</label>
              <div style={{ position: "relative" }}>
                <CheckCircle style={{ width: "16px", height: "16px", color: "#94a3b8", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  required
                  minLength={8}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              style={{ width: "100%", padding: "10px", background: "#0D7A5F", color: "white", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", border: "none", cursor: loadingPassword ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.4)", opacity: loadingPassword ? 0.5 : 1, marginTop: "8px", transition: "all 0.2s" }}
              className="active:scale-95"
            >
              {loadingPassword ? <Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" /> : <Lock style={{ width: "16px", height: "16px" }} />}
              <span>{loadingPassword ? "Menyimpan..." : "Update Password"}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
