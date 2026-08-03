"use client";

import React from "react";
import ModuleTabs from "@/components/ModuleTabs";
import { Users, FileText, BarChart3, Construction } from "lucide-react";

export default function RaporWaliKelasPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Users size={16} className="inline mr-1" /> Hub Wali Kelas</h1>
          <p>Pusat kontrol data akademik untuk kelas yang Anda ampu</p>
        </div>
      </div>

      <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto w-full flex flex-col gap-5 pb-28 sm:pb-10">
        <ModuleTabs
          tabs={[
            { label: "Dashboard Kelas", href: "/wali-kelas", exact: true, icon: <Users size={16} /> },
            { label: "Cetak Rapor", href: "/wali-kelas/rapor", exact: true, icon: <FileText size={16} /> },
            { label: "Rekap Nilai Total", href: "/wali-kelas/rekap", exact: true, icon: <BarChart3 size={16} /> },
          ]}
        />
        
        <div className="card flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: "50vh" }}>
          <div style={{ background: "var(--primary-pale)", padding: 20, borderRadius: "50%", marginBottom: 20 }}>
            <Construction size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--primary-dark)", marginBottom: 12 }}>Cetak Rapor (Segera Hadir)</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 500, lineHeight: 1.6 }}>
            Modul cetak rapor untuk Wali Kelas sedang dirancang (PPDB Platinum Standard) agar terlihat sangat elegan dan siap cetak.
          </p>
        </div>
      </div>
    </div>
  );
}
