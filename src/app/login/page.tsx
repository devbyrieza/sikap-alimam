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
} from "lucide-react";

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
        body: JSON.stringify({ identifier: forgotInput }),
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
        body: JSON.stringify({ email, password }),
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
        body: JSON.stringify({ email, password, selectedRole: role }),
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a0000 0%, #3d0000 30%, #550000 60%, #7a0000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(221,193,146,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Main Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Top nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="https://pesantren-alimam.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              fontSize: "11px",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
          >
            <ArrowRight
              style={{ width: 12, height: 12, transform: "rotate(180deg)" }}
            />
            Beranda
          </a>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              Portal SIKAP 2026/2027
            </span>
          </div>
        </div>

        {/* Hero Brand Section */}
        <div style={{ textAlign: "center" }}>
          {/* Logo */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo Al-Imam"
              style={{ width: 48, height: 48, objectFit: "contain" }}
            />
          </div>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#ddc192",
              marginBottom: "6px",
            }}
          >
            Pesantren Islam Al-Imam Sukabumi
          </p>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "8px",
            }}
          >
            SIKAP Al-Imam
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Sistem Informasi Kependidikan, Akademik &amp; Pengasuhan
          </p>
        </div>

        {/* Login Form Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                marginBottom: "4px",
              }}
            >
              Masuk Portal SIKAP
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>
              Silakan masukkan kredensial akun Asatidzah, Musyrif, atau Wali Santri.
            </p>
          </div>

          {/* Info banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fff8ec 0%, #fdf4e7 100%)",
              border: "1px solid #ddc19240",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "#550000", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#550000", fontWeight: 500, lineHeight: 1.4 }}>
              Login staf, asatidzah, dan wali santri menggunakan{" "}
              <strong>Username / Email / No. WA</strong>.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Username field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Username / Email / No. WA <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 15,
                    height: 15,
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username / Email / No. WA"
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "40px",
                    paddingRight: "16px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#550000";
                    e.target.style.background = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 4px rgba(85,0,0,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.background = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Kata Sandi <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#550000",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Lupa Password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 15,
                    height: 15,
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  style={{
                    width: "100%",
                    height: "48px",
                    paddingLeft: "40px",
                    paddingRight: "44px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#550000";
                    e.target.style.background = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 4px rgba(85,0,0,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.background = "#f8fafc";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Tampilkan kata sandi"
                >
                  {showPass ? (
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <AlertTriangle style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "12px",
                background: loading
                  ? "#7a0000"
                  : "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "0.02em",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: loading ? "none" : "0 8px 24px rgba(85,0,0,0.35)",
                transition: "all 0.2s",
                fontFamily: "inherit",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem SIKAP</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#4ade80",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
              Koneksi Aman Terenkripsi SSL
            </span>
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: BookOpen, label: "Jurnal Mengajar" },
            { icon: GraduationCap, label: "Nilai & Rapor" },
            { icon: Star, label: "Mutaba'ah Tahfidz" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Icon style={{ width: 11, height: 11, color: "#ddc192" }} />
              <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.03em" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
            &copy; 2026 Pesantren Islam Al-Imam Sukabumi. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>

      {/* MODAL: Role Selection */}
      {requireRoleSelection && (
        <div
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "14px",
                  background: "#fff0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <UserCheck style={{ width: 22, height: 22, color: "#550000" }} />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                Pilih Peran Masuk
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 400, lineHeight: 1.5 }}>
                Akun Anda memiliki lebih dari satu hak akses. Pilih dashboard yang ingin Anda tuju:
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#550000";
                    (e.target as HTMLElement).style.background = "#fff8f8";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.target as HTMLElement).style.background = "#ffffff";
                  }}
                >
                  <span style={{ textTransform: "capitalize" }}>{role.replace(/_/g, " ")}</span>
                  <ArrowRight style={{ width: 14, height: 14, color: "#94a3b8" }} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRequireRoleSelection(false)}
              style={{
                width: "100%",
                marginTop: "16px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#94a3b8",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Forgot Password */}
      {showForgotModal && (
        <div
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: "absolute",
                right: 20,
                top: 20,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#f1f5f9",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
            <div style={{ marginBottom: "20px", paddingRight: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                Lupa Kata Sandi?
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, fontWeight: 400 }}>
                Masukkan NIP, NIK, atau Nomor WhatsApp terdaftar Anda. Kami akan mengirimkan tautan instruksi reset kata sandi.
              </p>
            </div>
            {forgotMessage && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  background: forgotMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${forgotMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: forgotMessage.type === "success" ? "#166534" : "#dc2626",
                  }}
                >
                  {forgotMessage.text}
                </span>
              </div>
            )}
            <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                required
                disabled={forgotLoading}
                value={forgotInput}
                onChange={(e) => setForgotInput(e.target.value)}
                placeholder="08123xxxx / NIK / NIP"
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={forgotLoading || !forgotInput}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "13px",
                  border: "none",
                  cursor: forgotLoading || !forgotInput ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: forgotLoading || !forgotInput ? 0.7 : 1,
                  fontFamily: "inherit",
                  boxShadow: "0 4px 16px rgba(85,0,0,0.3)",
                }}
              >
                {forgotLoading ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
