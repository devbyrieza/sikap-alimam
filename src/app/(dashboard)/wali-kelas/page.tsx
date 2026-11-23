"use client";

import React from "react";
import ModuleTabs from "@/components/ModuleTabs";
import { Users, FileText, BarChart3, Hammer } from "lucide-react";

export default function WaliKelasHubPage() {
  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 pb-20 w-full overflow-hidden box-border">
      <div className="flex items-center justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-lg w-full box-border">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black m-0 flex items-center gap-3">
            <Users size={28} /> Hub Wali Kelas
          </h1>
          <p className="m-0 mt-1.5 opacity-90 text-xs sm:text-sm">
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
            <Hammer size={40} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Under Construction</h2>
          <p style={{ color: "#64748b", maxWidth: 500, lineHeight: 1.6 }}>
            Halaman pusat kontrol Wali Kelas sedang dalam tahap pengembangan.
            Di sini nantinya Bapak/Ibu dapat memantau seluruh statistik siswa, absensi gabungan, grafik nilai, dan mencetak rapor untuk kelas Bapak/Ibu.
          </p>
        </div>
      </div>
    </div>
  );
}
