"use client";

import React, { useState, useEffect } from "react";
import { Search, Sun, Moon, Cloud, ArrowLeft, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";


const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  subuh:   { label: "Subuh",          icon: <Sun size={15} />,   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  maghrib: { label: "Ba'da Maghrib",  icon: <Moon size={15} />,  color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
  dhuha:   { label: "Dhuha",          icon: <Cloud size={15} />, color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" } };

export default function BadalHalaqohPage() {
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // mode=all ensures we get ALL groups regardless of who is logged in
    fetch("/api/halaqoh/kelompok?mode=all")
      .then(res => res.json())
      .then(data => {
        setKelompokList(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = kelompokList.filter(k => 
    k.nama_kelompok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.pegawai?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link
          href="/halaqoh"
          style={{ width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
        ><ArrowLeft size={18} /></Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#1e293b" }}>Setor Badal (Gantikan Pengampu)</h1>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 4 }}>Cari kelompok ustaz yang berhalangan hadir dan input setorannya.</div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 24, maxWidth: 500 }}>
        <Search size={18} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Cari nama kelompok atau nama ustaz..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "14px 20px 14px 44px", borderRadius: 16, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, outline: "none", transition: "border-color 0.2s" }}
          onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
          onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontWeight: 600, color: "#94a3b8" }}>Mencari data kelompok...</div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>
          Tidak ada kelompok yang cocok dengan pencarian.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredGroups.map(k => {
            const info = SESI_INFO[k.sesi] || SESI_INFO.subuh;
            return (
              <div key={k.id} style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8d5b7", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: info.bg, color: info.color, border: `1.5px solid ${info.border}` }}>
                      {info.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{k.nama_kelompok}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#1e293b" }}>{info.label}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                    <UserCheck size={14} /> {k.pegawai?.nama_lengkap || "Tanpa Pengampu"}
                  </div>
                </div>
                
                <Link
                  href={`/halaqoh/input?kelompok=${k.id}&sesi=${k.sesi}&tanggal=${`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#f8fafc", color: "#550000", border: "1.5px solid #e2e8f0", padding: "12px 20px", borderRadius: 13, fontWeight: 700, fontSize: 13, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#550000"; (e.currentTarget as HTMLElement).style.color = "white"; (e.currentTarget as HTMLElement).style.borderColor = "#550000"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#550000"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
                >
                  Isi Catatan Sesi <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}