"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff, Loader2, AlertTriangle, X } from "lucide-react";

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
  const [forgotMessage, setForgotMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotInput }) });
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
        body: JSON.stringify({ email, password }) });
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
        body: JSON.stringify({ email, password, selectedRole: role }) });
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
          <img src="/logo.png" alt="Logo Al-Imam" style={{ width: 85, height: 85, objectFit: "contain", margin: "0 auto 16px", filter: "drop-shadow(0px 8px 16px rgba(85,0,0,0.15))" }} />
          <h1>SIKAP</h1>
          <p style={{ fontWeight: 600, fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
            Sistem Informasi Kependidikan Akademik dan Pengasuhan
          </p>
          <p style={{ marginTop: 2 }}>Pesantren Al-Imam Al-Islami</p>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginTop: 14,
              color: "#4b5563",
              fontFamily: "var(--font-arabic)" }}
          >
            Ø£Ù‡Ù„Ø§Ù‹ ÙˆØ³Ù‡Ù„Ø§Ù‹
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            (Selamat Datang)
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-main)" }}>Email / No. WA / Username</label>
            <input
              type="text"
              name="email"
              className="form-control"
              placeholder="Username / Email / No. WA"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-main)" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                  alignItems: "center" }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotMessage(null); setForgotInput(""); }}
                style={{ fontSize: 13, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Lupa Password?
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
                gap: 8 }}
            >
              <AlertTriangle size={16} className="inline mr-1" /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "12px", marginTop: 8 }}
          >
            {loading ? <Loader2 className="spin" size={18} /> : "Masuk ke Sistem"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "#f8f7f4",
            borderRadius: 12,
            fontSize: 12,
            color: "#6b7280" }}
        >
          <p style={{ fontWeight: 700, marginBottom: 4, color: "#374151" }}>
             Info Login
          </p>
          <p style={{ marginBottom: 6, lineHeight: 1.5 }}>
            Silakan login menggunakan <b>User ID</b>, <b>Email</b>, atau <b>No. WhatsApp</b> Anda.
          </p>
        </div>
      </div>

      {showForgotModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20
        }}>
          <div style={{ background: "white", padding: 24, borderRadius: 16, width: "100%", maxWidth: 400, position: "relative" }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{ position: "absolute", right: 16, top: 16, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>Lupa Kata Sandi?</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.5 }}>
              Masukkan NIP, NIK, atau Nomor WA Anda. Kami akan mengirimkan tautan reset kata sandi melalui WhatsApp.
            </p>

            {forgotMessage && (
              <div style={{
                background: forgotMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
                color: forgotMessage.type === "success" ? "#047857" : "#b91c1c",
                padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, border: `1px solid ${forgotMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`
              }}>
                {forgotMessage.text}
              </div>
            )}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="08123xxxx / NIK / NIP"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  required
                  disabled={forgotLoading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={forgotLoading || !forgotInput}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {forgotLoading ? <Loader2 size={16} className="spinner mr-2" /> : null}
                {forgotLoading ? "Mengirim..." : "Kirim Tautan Reset"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
