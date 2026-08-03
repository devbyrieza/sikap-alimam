"use client";

import React from "react";
import ModuleTabs from "@/components/ModuleTabs";
import { Hammer, ClipboardCheck, BarChart3, UserCheck } from "lucide-react";

export default function RiwayatPresensiSantriPage() {
  return (
    <div>
      <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto w-full flex flex-col gap-5">
        <ModuleTabs
          tabs={[
            { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
            { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
            { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
          ]}
        />
        
        <div className="card flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: "50vh" }}>
          <div style={{ background: "var(--primary-pale)", padding: 20, borderRadius: "50%", marginBottom: 20 }}>
            <Hammer size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--primary-dark)", marginBottom: 12 }}>Segera Hadir</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 400, lineHeight: 1.6 }}>
            Fitur <b>Riwayat Presensi per Individu Santri</b> sedang dalam tahap pengembangan dan akan dirilis pada pembaruan SIKAP berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
