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
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 10px 25px -5px rgba(85, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        color: "white",
        flexWrap: "wrap",
        gap: "24px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>Profil &amp; Pengaturan Akun</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "14px" }}>Kelola data kepegawaian, mapel mengajar, dan keamanan akun Anda</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
        
        {/* ─── KARTU 1: DATA KEPEGAWAIAN & MAPEL (LEBAR 2 KOLOM) ─── */}
        <div style={{ gridColumn: "1 / -1", '@media (min-width: 1024px)': { gridColumn: "span 2" } } as React.CSSProperties} className="lg:col-span-2">
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "16px", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a0000" }}>
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
                style={{ padding: "10px 18px", background: "#550000", color: "white", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.4)", transition: "all 0.2s" }}
                className="active:scale-95"
              >
                <Edit3 style={{ width: "14px", height: "14px" }} />
                <span>Edit &amp; Atur Mapel</span>
              </button>
            </div>

            {loadingProfile ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <Loader2 style={{ width: "28px", height: "28px", margin: "0 auto 8px auto", color: "#7a0000" }} className="animate-spin" />
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
                      <UserCheck style={{ width: "28px", height: "28px", color: "#7a0000" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: "bold", fontSize: "16px", color: "#1e293b", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.nama_lengkap || profile?.user?.nama || "Civitas"}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, margin: "0 0 6px 0" }}>
                      {p?.jabatan || "Pengajar"} · {p?.unit_kerja || "Pesantren Al-Imam"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {(p?.kategori_pegawai || "GURU").split(",").map((k: string, i: number) => (
                        <span key={i} style={{ padding: "2px 8px", background: "#fffbeb", color: "#78350f", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                          {k.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "12px" }}>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>No. WhatsApp / HP</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", margin: 0 }}>
                      <Phone style={{ width: "14px", height: "14px", color: "#7a0000" }} />
                      {p?.no_hp || "-"}
                    </p>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Email Akun</span>
                    <p style={{ fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Mail style={{ width: "14px", height: "14px", color: "#7a0000" }} />
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
            <div style={{ width: "40px", height: "40px", borderRadius: "16px", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a0000" }}>
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
              style={{ width: "100%", padding: "10px", background: "#550000", color: "white", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", border: "none", cursor: loadingPassword ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.4)", opacity: loadingPassword ? 0.5 : 1, marginTop: "8px", transition: "all 0.2s" }}
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
