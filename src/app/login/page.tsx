// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  X,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Lock,
  User
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Role Selection State
  const [requireRoleSelection, setRequireRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Mandatory UX Rule: Modal Scroll Lock
  useEffect(() => {
    if (showForgotModal || requireRoleSelection) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showForgotModal, requireRoleSelection]);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotInput })
      });
      const json = await res.json();
      if (!res.ok) {
        setForgotMessage({ type: "error", text: json.error || "Gagal mengirim permintaan" });
      } else {
        setForgotMessage({ type: "success", text: json.message });
      }
    } catch {
      setForgotMessage({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login gagal");
        return;
      }
      if (json.requireRoleSelection) {
        setRequireRoleSelection(true);
        setAvailableRoles(json.availableRoles);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleSelect(role: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedRole: role })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login gagal");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F7FF] via-[#F8FAFC] to-white py-10 px-4 flex flex-col justify-center items-center font-sans relative overflow-hidden">
      
      {/* Background Micro-Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4wMiIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTAgNjBoNjBNNjAgMGwwIDYwIi8+PC9nPjwvc3ZnPg==')] opacity-70 pointer-events-none" />

      {/* Top Navigation Pills (OMI Standard) */}
      {/* Top Navigation Pills (OMI Standard) */}
      <div className="w-full max-w-5xl lg:max-w-6xl flex items-center justify-between gap-3 mb-4 relative z-10">
        <a
          href="https://pesantren-alimam.com"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xs text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:text-[#550000] hover:border-[#550000]/40 transition-all hover:-translate-y-0.5"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Beranda Utama</span>
        </a>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Portal SIKAP 2026/2027</span>
        </div>
      </div>

      {/* Two-Panel OMI Card (Desktop Split / Mobile Stacked) */}
      <div className="w-full max-w-5xl lg:max-w-6xl rounded-3xl overflow-hidden shadow-2xl shadow-slate-950/10 border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Sisi Kiri: Panel Identitas & 2 Bento Unggulan (Desktop: 5 Columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2D0000] via-[#400000] to-[#550000] p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ddc192]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl shadow-sm">
              <img
                src="/logo.png"
                alt="Logo Al-Imam"
                className="w-7 h-7 object-contain"
              />
              <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                SIKAP AL-IMAM
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ddc192] bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block mb-3">
                Sistem Akademik &amp; Pengasuhan
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Portal Akademik &amp; Karakter Santri
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/90 font-normal mt-2 leading-relaxed">
                Sistem terpadu pencatatan hasil belajar, mutaba'ah tahfidz harian, dan pemantauan adab santri Pesantren Islam Al-Imam Sukabumi.
              </p>
            </div>

            {/* 2 Kartu Bento Fitur Unggulan */}
            <div className="space-y-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-3.5 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-[#ddc192]/20 border border-[#ddc192]/30 flex items-center justify-center shrink-0 text-[#ddc192]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    Monitoring Portofolio Santri
                  </h4>
                  <p className="text-[11px] text-slate-300 font-normal">
                    Pantau nilai, mutaba'ah &amp; adab real-time
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-3.5 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    Evaluasi Karakter &amp; Disiplin
                  </h4>
                  <p className="text-[11px] text-slate-300 font-normal">
                    Penilaian holistik berkelanjutan
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-300/80 font-medium flex items-center justify-between">
            <span>Direktorat Tarbiyah &bull; SIKAP Al-Imam</span>
            <span className="text-[#ddc192]">&bull; Sistem Terpadu</span>
          </div>
        </div>

        {/* Sisi Kanan: White Form Body (Desktop: 7 Columns) */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 bg-white space-y-5 flex flex-col justify-center">
          
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Masuk Portal SIKAP
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
              Silakan masukkan kredensial akun Asatidzah, Musyrif, atau Wali Santri.
            </p>
          </div>
          {/* Info Banner Box */}
          <div className="p-3.5 rounded-2xl bg-[#ddc192]/15 border border-[#ddc192]/40 text-xs text-[#550000] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#550000] shrink-0" />
            <span className="font-medium leading-relaxed">
              Login staf, asatidzah, dan wali santri menggunakan <strong>Username / Email / No. WA</strong>.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                <span>Username / Email / No. WA</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username / Email / No. WA"
                  className="w-full h-12 pl-4 pr-10 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-[#550000] focus:ring-4 focus:ring-[#550000]/10 transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <span>Kata Sandi</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotMessage(null);
                    setForgotInput("");
                  }}
                  className="text-xs font-bold text-[#550000] hover:underline"
                >
                  Lupa Password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full h-12 pl-4 pr-11 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-[#550000] focus:ring-4 focus:ring-[#550000]/10 transition-all select-text"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#550000] hover:bg-[#400000] text-white font-extrabold text-sm shadow-md shadow-[#550000]/25 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem SIKAP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Card Info */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Koneksi Aman Terenkripsi SSL</span>
            </div>
          </div>

        </div>

      </div>

      <div className="text-center text-xs text-slate-400 mt-6 font-medium space-y-1">
        <p>&copy; 2026 Pesantren Islam Al-Imam Sukabumi. Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="text-[11px] text-slate-400/80">Sistem Informasi Kependidikan, Akademik &amp; Pengasuhan v2.0</p>
      </div>

      {/* ─── MODAL ROLE SELECTION (JIKA MULTI-ROLE) ─── */}
      {requireRoleSelection && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overscroll-contain">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ddc192]/20 text-[#550000] flex items-center justify-center mx-auto font-bold mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Pilih Peran Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Akun Anda memiliki lebih dari satu hak akses. Pilih dashboard yang ingin Anda tuju:
              </p>
            </div>

            <div className="space-y-2.5">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 hover:border-[#550000] hover:bg-[#ddc192]/10 text-slate-800 font-extrabold text-xs transition-all flex items-center justify-between group"
                >
                  <span className="capitalize">{role.replace(/_/g, " ")}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#550000] group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setRequireRoleSelection(false)}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL FORGOT PASSWORD ─── */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overscroll-contain">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 pr-8">
              <h3 className="text-lg font-extrabold text-slate-900">
                Lupa Kata Sandi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Masukkan NIP, NIK, atau Nomor WhatsApp terdaftar Anda. Kami akan mengirimkan tautan instruksi reset kata sandi.
              </p>
            </div>

            {forgotMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  forgotMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <span>{forgotMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  disabled={forgotLoading}
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="08123xxxx / NIK / NIP"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#550000] focus:ring-4 focus:ring-[#550000]/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading || !forgotInput}
                className="w-full h-12 rounded-xl bg-[#550000] hover:bg-[#400000] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Tautan...</span>
                  </>
                ) : (
                  <span>Kirim Tautan Reset</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
