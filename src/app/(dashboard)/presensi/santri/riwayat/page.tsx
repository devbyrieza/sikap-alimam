"use client";

import React from "react";
import ModuleTabs from "@/components/ModuleTabs";
import { Hammer, ClipboardCheck, BarChart3, UserCheck } from "lucide-react";

export default function RiwayatPresensiSantriPage() {
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #10b981 100%)", borderRadius: "24px", padding: "32px 36px", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.1)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: 700, margin: 0 }}>Riwayat Presensi</h1>
          <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>Pantau riwayat kehadiran per individu santri.</p>
        </div>
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
          { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
          { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
        ]}
      />
      
      <div style={{ background: "white", borderRadius: "24px", padding: "48px", boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "50vh", gap: "20px" }}>
        <div style={{ background: "#f0fdf4", padding: 24, borderRadius: "50%" }}>
          <Hammer size={48} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>Segera Hadir</h2>
        <p style={{ color: "#64748b", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
          Fitur <b>Riwayat Presensi per Individu Santri</b> sedang dalam tahap pengembangan dan akan dirilis pada pembaruan SIKAP berikutnya.
        </p>
      </div>
    </div>
  );
}
