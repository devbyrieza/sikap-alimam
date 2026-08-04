"use client";

import React from "react";
import ModuleTabs from "@/components/ModuleTabs";
import { Users, FileText, BarChart3, Presentation } from "lucide-react";

export default function RekapWaliKelasPage() {
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #8b5cf6 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        color: "white"
      }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center" }}>
            <Users size={28} style={{ marginRight: 12 }} /> Hub Wali Kelas
          </h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
            Pusat kontrol data akademik untuk kelas yang Anda ampu
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <ModuleTabs
          tabs={[
            { label: "Dashboard Kelas", href: "/wali-kelas", exact: true, icon: <Users size={16} /> },
            { label: "Cetak Rapor", href: "/wali-kelas/rapor", exact: true, icon: <FileText size={16} /> },
            { label: "Rekap Nilai Total", href: "/wali-kelas/rekap", exact: true, icon: <BarChart3 size={16} /> },
          ]}
        />
        
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "48px", 
          textAlign: "center", 
          minHeight: "50vh",
          backgroundColor: "white",
          borderRadius: "24px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }}>
          <div style={{ background: "#f3f4f6", padding: 20, borderRadius: "50%", marginBottom: 20 }}>
            <Presentation size={40} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Rekap Seluruh Mapel</h2>
          <p style={{ color: "#64748b", maxWidth: 500, lineHeight: 1.6 }}>
            Modul ini akan menampilkan tabel data tinggi (high-density table) mirip desain SIAKAD lama namun dengan UI Platinum.
          </p>
        </div>
      </div>
    </div>
  );
}
