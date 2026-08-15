"use client";
import { useEffect, useState } from "react";
import { ShieldOff, Phone, AlertCircle } from "lucide-react";

export default function AksesDiblokirPage() {
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        if (d?.user?.spp_blocked_reason) setReason(d.user.spp_blocked_reason);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)", fontFamily: "inherit", padding: 24
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%",
        boxShadow: "0 20px 60px rgba(220,38,38,0.12)", textAlign: "center", border: "1.5px solid #fecaca"
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
        }}>
          <ShieldOff size={32} color="#dc2626" />
        </div>

        {/* Title */}
        <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#991b1b" }}>
          Akses SIKAP Dinonaktifkan
        </h1>

        {/* Description */}
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          Akses Anda ke portal SIKAP Al-Imam sementara dinonaktifkan karena terdapat tagihan SPP yang belum dilunasi.
        </p>

        {/* Reason badge */}
        {reason && (
          <div style={{
            background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12,
            padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10
          }}>
            <AlertCircle size={16} color="#ea580c" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#9a3412", fontWeight: 600, textAlign: "left" }}>
              {reason}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: "#f8fafc", borderRadius: 14, padding: "16px 20px", marginBottom: 28, textAlign: "left"
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>
            Langkah selanjutnya:
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#64748b", lineHeight: 1.8 }}>
            <li>Lunasi tagihan SPP melalui transfer atau pembayaran tunai ke pesantren.</li>
            <li>Simpan bukti pembayaran Anda.</li>
            <li>Hubungi Admin Keuangan pesantren untuk konfirmasi dan aktivasi akses.</li>
          </ol>
        </div>

        {/* Contact button */}
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#16a34a", color: "white", padding: "14px 28px",
            borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 14px rgba(22,163,74,0.3)", marginBottom: 16
          }}
        >
          <Phone size={16} /> Hubungi Admin Keuangan via WhatsApp
        </a>

        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          Pesantren Al-Imam Al-Islami · Semoga segera terselesaikan.
        </p>

        {/* Logout link */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
          <a
            href="/api/auth/logout"
            style={{ fontSize: 13, color: "#94a3b8", textDecoration: "underline", cursor: "pointer" }}
          >
            Keluar dari akun ini
          </a>
        </div>
      </div>
    </div>
  );
}
