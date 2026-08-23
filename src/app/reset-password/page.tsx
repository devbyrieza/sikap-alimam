"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { Loader2, KeyRound, CheckCircle, ShieldAlert, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token tidak ditemukan. Tautan reset mungkin tidak lengkap.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }) });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mereset kata sandi");
      } else {
        setSuccess(true);
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Kata sandi Anda telah berhasil diubah!",
          confirmButtonColor: "var(--primary)" }).then(() => {
          router.push("/login");
        });
      }
    } catch (err: any) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4 w-12 h-12" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Berhasil!</h2>
        <p className="text-slate-600 mb-6">Kata sandi Anda telah diperbarui.</p>
        <button
          onClick={() => router.push("/login")}
          className="btn btn-primary w-full justify-center"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group mb-0">
        <label className="form-label text-slate-700">Kata Sandi Baru</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="form-control pr-10"
            placeholder="Minimal 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={!token || loading}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="form-group mb-0">
        <label className="form-label text-slate-700">Konfirmasi Kata Sandi Baru</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="form-control pr-10"
            placeholder="Ulangi kata sandi baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!token || loading}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full justify-center mt-2"
        disabled={!token || loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
        Simpan Kata Sandi Baru
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buat Sandi Baru</h1>
          <p className="text-slate-500 text-sm mt-2">
            Silakan masukkan kata sandi baru untuk akun SIAKAD Anda.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
