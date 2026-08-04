"use client";

import React, { useState, useEffect } from "react";
import { Book, RefreshCcw, Plus, Search, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TahfidzMutabaahPage() {
  const [santri, setSantri] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSantri = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tahfidz/mutabaah");
        const data = await res.json();
        setSantri(data);
      } catch (err) {
        console.error("Gagal memuat data mutabaah tahfidz:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSantri();
  }, []);

  const filteredSantri = santri.filter(s => 
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    (s.nis && s.nis.includes(search))
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Premium Hero Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #f59e0b 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        color: "white",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
            <BookOpen size={32} style={{ color: "#fcd34d" }} />
            Mutabaah Tahfidz Al-Quran
          </h1>
          <p style={{ marginTop: "8px", opacity: 0.9, fontSize: "16px" }}>
            Pusat pemantauan setoran Ziyadah, Murojaah, dan Tilawah santri Al-Imam.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <span style={{ position: "absolute", top: 0, bottom: 0, left: 16, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <Search size={20} color="#94a3b8" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 44px",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              outline: "none",
              backgroundColor: "#f8fafc"
            }}
            placeholder="Cari nama santri atau NIS..."
          />
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", backgroundColor: "#f1f5f9", padding: "10px 18px", borderRadius: "14px" }}>
          Total Santri Aktif: <span style={{ fontWeight: 800 }}>{filteredSantri.length}</span>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        </div>
      ) : filteredSantri.length === 0 ? (
        <div style={{ background: "white", borderRadius: "16px", padding: "48px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <AlertCircle size={48} style={{ margin: "0 auto 16px", color: "#cbd5e1" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b" }}>Santri Tidak Ditemukan</h2>
          <p style={{ color: "#64748b", marginTop: "8px" }}>Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textIndent: 0, borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Nama / NIS</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Kelas</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Setoran Terakhir</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Hafalan Baru</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Murojaah</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Tilawah</th>
                </tr>
              </thead>
              <tbody>
                {filteredSantri.map((s, idx) => (
                  <tr 
                    key={s.id} 
                    style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.2s ease-in-out" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"} 
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa"}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "15px" }}>{s.nama_lengkap}</div>
                      <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{s.nis || "Belum ada NIS"}</div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "6px 12px", borderRadius: "12px", fontWeight: 600, fontSize: "13px" }}>
                        {s.kelas}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {s.last_tahfidz ? (
                        <div>
                          <div style={{ fontWeight: 600, color: "#334155", fontSize: "14px", textTransform: "capitalize" }}>
                            {s.last_tahfidz.jenis} : {s.last_tahfidz.surat}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                            Batas: Ayat {s.last_tahfidz.ayat_dari} - {s.last_tahfidz.ayat_ke} ({s.last_tahfidz.halaman} Hal)
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>Belum ada catatan setoran</span>
                      )}
                    </td>
                    
                    {/* Ziyadah Button */}
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=ziyadah`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#2563eb", color: "white", height: "40px", width: "40px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}>
                        <Plus size={18} />
                      </Link>
                    </td>

                    {/* Murojaah Button */}
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=murojaah`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#f59e0b", color: "white", height: "40px", width: "40px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(245,158,11,0.2)" }}>
                        <RefreshCcw size={16} />
                      </Link>
                    </td>

                    {/* Tilawah Button */}
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=tilawah`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#10b981", color: "white", height: "40px", width: "40px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(16,185,129,0.2)" }}>
                        <Book size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
