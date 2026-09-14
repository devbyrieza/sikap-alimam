"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  User,
  GraduationCap,
  Star,
  AlertCircle} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [requireRoleSelection, setRequireRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (showForgotModal || requireRoleSelection) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
        {/* Background Mesh */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
          {/* Top Nav */}
          <div className="flex items-center justify-between">
            <a
              href="https://pesantren-alimam.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary-600 shadow-sm transition-all"
            >
              <ArrowRight className="w-4 h-4 -scale-x-100" />
              Beranda Utama
            </a>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                SIKAP 2026/2027
              </span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-white rounded-3xl border border-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.08)] flex items-center justify-center mb-5 relative">
              <div className="absolute inset-0 rounded-3xl bg-primary-500/10 blur-xl -z-10" />
              <img
                src="/logo.png"
                alt="Logo Al-Imam"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2">
              Pesantren Al-Imam
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
              SIKAP Al-Imam
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Sistem Informasi Kesantrian & Prestasi
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.07)] border border-white">
            
            {/* Banner Secure */}
            <div className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-800">Gunakan kredensial resmi institusi</span>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-100 mb-5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-xs font-bold text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Username / Email / No. WA <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan Username / Email / WA"
                    disabled={loading}
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    disabled={loading}
                    className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-2 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> <span>Memverifikasi...</span></>
                ) : (
                  <><span>Masuk Portal Staf</span> <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-[11px] font-bold text-slate-400">
              &copy; {new Date().getFullYear()} Pesantren Al-Imam. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </div>
  );


}
