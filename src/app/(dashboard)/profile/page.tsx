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
    if (newPassword.length < 6) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Password baru minimal 6 karakter!" });
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Profil &amp; Pengaturan Akun</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola data kepegawaian, mapel mengajar, dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ─── KARTU 1: DATA KEPEGAWAIAN & MAPEL (LEBAR 2 KOLOM) ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#3b0a0a]/10 flex items-center justify-center text-[#3b0a0a]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Data Induk Civitas &amp; Pengajar</h2>
                  <p className="text-xs text-slate-500">Terintegrasi dengan database SIMPEG &amp; SIAKAD</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfileModal}
                className="px-4 py-2 bg-[#3b0a0a] hover:bg-[#520e0e] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit &amp; Atur Mapel</span>
              </button>
            </div>

            {loadingProfile ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin text-[#3b0a0a]" />
                <p className="text-xs font-semibold">Memuat profil...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Foto + Nama */}
                <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                    {p?.foto_url ? (
                      <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-slate-800 truncate">
                      {p?.nama_lengkap || profile?.user?.nama || "Civitas"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {p?.jabatan || "Pengajar"} · {p?.unit_kerja || "Pesantren Al-Imam"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(p?.kategori_pegawai || "GURU").split(",").map((k: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-bold uppercase">
                          {k.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">No. WhatsApp / HP</span>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {p?.no_hp || "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Akun</span>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {p?.email || profile?.user?.email || "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Jenis Kelamin</span>
                    <p className="font-bold text-slate-800">
                      {p?.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : p?.jenis_kelamin === "PEREMPUAN" ? "Perempuan" : "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Divisi</span>
                    <p className="font-bold text-slate-800">{p?.divisi || "Umum"}</p>
                  </div>
                </div>

                {/* Penugasan Mapel Banner */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>Mata Pelajaran yang Diampu</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-white/80 px-2 py-0.5 rounded-full border border-amber-300">
                      Aktif di SIKAP
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                    {p?.mata_pelajaran || "Belum ada mata pelajaran yang dipilih."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── KARTU 2: GANTI PASSWORD ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Ganti Password</h2>
              <p className="text-xs text-slate-400">Keamanan akun login</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Saat Ini</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                  placeholder="Password lama"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                  placeholder="Password baru (min. 6 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ulangi Password Baru</label>
              <div className="relative">
                <CheckCircle className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3b0a0a]/20"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{loadingPassword ? "Menyimpan..." : "Update Password"}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
