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
      {/* Decorative orbs */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          right: "-10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,152,58,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          left: "-10%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,16,16,0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="login-card">
        <div className="login-logo">
          <div className="icon">
            <BookOpen size={32} color="white" />
          </div>
          <h1>SIAKAD</h1>
          <p>Pesantren Al-Imam Al-Islami</p>
          <p
            style={{
              fontSize: 16,
              marginTop: 6,
              color: "#9ca3af",
              fontFamily: "var(--font-arabic)",
            }}
          >
            السلام عليكم ورحمة الله
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="nama@pesantren-alimam.com"
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
            {loading ? "Masuk..." : "Masuk ke SIAKAD"}
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
          <p>Admin: admin@pesantren-alimam.com</p>
          <p>Guru: nama.guru@pesantren-alimam.com</p>
          <p style={{ marginTop: 4, color: "#9ca3af" }}>
            Hubungi admin jika lupa password
          </p>
        </div>
      </div>
    </div>
  );
}
