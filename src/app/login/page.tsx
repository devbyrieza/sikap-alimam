"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <div className="login-page">

      <div className="login-card">
        <div className="login-logo">
          <div className="icon">
            <BookOpen size={32} color="white" />
          </div>
          <h1>SIKAP</h1>
          <p style={{ fontWeight: 600, fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
            Sistem Informasi Kependidikan Akademik dan Pengasuhan
          </p>
          <p style={{ marginTop: 2 }}>Pesantren Al-Imam Al-Islami</p>
          <p
            style={{
              fontSize: 18,
              marginTop: 10,
              color: "#4b5563",
              fontFamily: "var(--font-arabic)",
            }}
          >
            أهلاً وسهلاً
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            (Selamat Datang)
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#111827" }}>
              User ID / Email / No. WA
            </label>
            <input
              type="text"
              name="email"
              className="input-field"
              placeholder="User ID / nama@pesantren-alimam.com / No. WA"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#b91c1c",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} className="inline mr-1" /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            {loading ? <Loader2 size={16} className="spinner" style={{ animation: "spin 0.7s linear infinite" }} /> : null}
            {loading ? "Masuk..." : "Masuk ke SIKAP"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "#f8f7f4",
            borderRadius: 12,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 4, color: "#374151" }}>
             Info Login
          </p>
          <p style={{ marginBottom: 6, lineHeight: 1.5 }}>
            Silakan login menggunakan <b>User ID</b>, <b>Email</b>, atau <b>No. WhatsApp</b> Anda.
          </p>
          <p style={{ color: "#9ca3af", lineHeight: 1.5 }}>
            Hubungi Kasi IT jika Anda belum memiliki akun atau lupa password.
          </p>
        </div>
      </div>
    </div>
  );
}
