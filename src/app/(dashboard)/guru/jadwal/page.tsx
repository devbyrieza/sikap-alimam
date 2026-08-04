"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Info } from "lucide-react";

export default function GuruJadwalPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPekan, setCurrentPekan] = useState("ganjil");

  useEffect(() => {
    // In real app, calculate whether this week is Ganjil or Genap based on Academic Calendar
    // and pass the logged-in Guru's ID to the API.
    const weekNumber = 1; // Mock: Pekan 1
    setCurrentPekan(weekNumber % 2 !== 0 ? "ganjil" : "genap");

    setLoading(true);
    setTimeout(() => {
      // Data statis untuk demo
      setJadwal([
        { id: "1", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran" } },
        { id: "2", jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran" } },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Welcome Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        color: "white",
        flexWrap: "wrap",
        gap: "24px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>Jadwal Mengajar Anda Hari Ini</h1>
          <p style={{ color: "#cbd5e1", margin: 0, fontSize: "14px" }}>Selamat bertugas mencetak generasi Rabbani, Ustadz!</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "14px", color: "#bae6fd", margin: "0 0 4px 0" }}>Status Pekan Saat Ini</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "12px", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <Info size={18} />
            <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "14px" }}>
              {currentPekan === "ganjil" ? "Pekan Ganjil (1/3)" : "Pekan Genap (2/4)"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "stretch" }}>
          {jadwal.length === 0 ? (
            <div style={{ background: "white", borderRadius: "24px", padding: "48px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", gridColumn: "1 / -1" }}>
              <CheckCircle style={{ margin: "0 auto", color: "#22c55e", marginBottom: "16px" }} size={48} />
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>Alhamdulillah!</h2>
              <p style={{ color: "#64748b", marginTop: "8px" }}>Anda tidak memiliki jadwal mengajar pada hari ini.</p>
            </div>
          ) : (
            jadwal.map((j) => (
              <div key={j.id} style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "24px", transition: "box-shadow 0.2s" }} className="hover:shadow-lg">
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#1d4ed8", height: "64px", width: "64px", borderRadius: "16px", border: "1px solid #dbeafe" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" }}>Jam Ke</span>
                    <span style={{ fontSize: "24px", fontWeight: "900" }}>{j.jam_ke}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>{j?.mapel?.nama}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "14px", fontWeight: 500, color: "#64748b" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "4px 12px", borderRadius: "8px" }}>
                        <Clock size={14} /> {j.waktu_mulai} - {j.waktu_selesai}
                      </span>
                      <span style={{ color: "#2563eb", background: "#eff6ff", padding: "4px 12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                        Kelas: {j?.kelas?.nama}
                      </span>
                    </div>
                  </div>
                </div>
                <button style={{ backgroundColor: "#0284c7", color: "white", padding: "10px 18px", borderRadius: "14px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "background-color 0.2s", width: "100%", boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.4)" }} className="hover:bg-sky-700">
                  Isi Jurnal
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
