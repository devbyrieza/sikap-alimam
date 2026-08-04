"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Filter, Users, BookOpen } from "lucide-react";

export default function KurikulumJadwalPage() {
  const [kelas, setKelas] = useState("all");
  const [tipePekan, setTipePekan] = useState("ganjil");
  const [loading, setLoading] = useState(false);
  const [jadwalList, setJadwalList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    fetch("/api/master/kelas")
      .then((res) => res.json())
      .then((data) => {
        if (data.kelas) setKelasList(data.kelas);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Simulasi Fetch API `/api/kurikulum/jadwal?tipe_pekan=${tipePekan}`
    setLoading(true);
    setTimeout(() => {
      // Data statis untuk demo UI sesuai seed
      setJadwalList([
        { id: "1", hari: "Senin", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran", kategori: "syariah" }, pegawai: { nama_lengkap: "Abdil Aziz, B.A." }, tipe_pekan: "ganjil" },
        { id: "2", hari: "Senin", jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Indonesia", kategori: "umum" }, pegawai: { nama_lengkap: "Ade Supiana" }, tipe_pekan: "ganjil" },
        { id: "3", hari: "Senin", jam_ke: 5, waktu_mulai: "08:20", waktu_selesai: "09:00", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Indonesia", kategori: "umum" }, pegawai: { nama_lengkap: "Ade Supiana" }, tipe_pekan: "ganjil" },
        { id: "4", hari: "Senin", jam_ke: 6, waktu_mulai: "09:00", waktu_selesai: "09:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Arab", kategori: "bahasa" }, pegawai: { nama_lengkap: "Wahyudi Pranata, B.A." }, tipe_pekan: "ganjil" },
        { id: "5", hari: "Selasa", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Hadis", kategori: "syariah" }, pegawai: { nama_lengkap: "Muhammad Thoriq, Lc." }, tipe_pekan: "ganjil" },
      ]);
      setLoading(false);
    }, 800);
  }, [tipePekan]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <Calendar size={32} style={{ color: "#a7f3d0" }} />
            <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>Pusat Jadwal Pelajaran</h1>
          </div>
          <p style={{ color: "#cbd5e1", margin: 0, fontSize: "14px" }}>Manajemen jadwal KBM Pesantren Al-Imam Al-Islami (Sistem Pekan Ganjil & Genap).</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Pilih Kelas</label>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)} style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", background: "#f8fafc", outline: "none" }}>
            <option value="all">-- Semua Kelas --</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Filter Pekan</label>
          <div style={{ display: "flex", borderRadius: "12px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
            <button 
              onClick={() => setTipePekan("ganjil")}
              style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 500, transition: "background-color 0.2s", background: tipePekan === 'ganjil' ? '#0ea5e9' : '#f8fafc', color: tipePekan === 'ganjil' ? 'white' : '#334155', border: "none", cursor: "pointer" }}
            >
              Pekan 1 & 3 (Ganjil)
            </button>
            <button 
              onClick={() => setTipePekan("genap")}
              style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 500, transition: "background-color 0.2s", background: tipePekan === 'genap' ? '#0ea5e9' : '#f8fafc', color: tipePekan === 'genap' ? 'white' : '#334155', border: "none", cursor: "pointer" }}
            >
              Pekan 2 & 4 (Genap)
            </button>
          </div>
        </div>
      </div>

      {/* Jadwal Table View */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <h3 style={{ fontWeight: "bold", color: "#1e293b", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <BookOpen size={20} style={{ color: "#0ea5e9" }} />
              Tabel Jadwal {tipePekan === "ganjil" ? "Pekan Ganjil" : "Pekan Genap"}
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#f1f5f9", color: "#475569", textTransform: "uppercase", fontSize: "12px", fontWeight: "bold" }}>
                <tr>
                  <th style={{ padding: "16px 20px" }}>Hari</th>
                  <th style={{ padding: "16px 20px" }}>Jam Ke</th>
                  <th style={{ padding: "16px 20px" }}>Waktu</th>
                  <th style={{ padding: "16px 20px" }}>Kelas</th>
                  <th style={{ padding: "16px 20px" }}>Mata Pelajaran</th>
                  <th style={{ padding: "16px 20px" }}>Guru Pengampu</th>
                </tr>
              </thead>
              <tbody>
                {jadwalList.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-[#f0fdf4] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", fontWeight: "bold", color: "#1e293b" }}>{j.hari}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "#f1f5f9", color: "#334155", padding: "4px 12px", borderRadius: "999px", fontWeight: "bold" }}>
                        {j.jam_ke}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", color: "#64748b", fontFamily: "monospace" }}>
                      {j.waktu_mulai} - {j.waktu_selesai}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: "8px", fontWeight: 600 }}>
                        {j.kelas.nama}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{j.mapel.nama}</div>
                      <div style={{ fontSize: "12px", color: "#0ea5e9", textTransform: "uppercase", fontWeight: 500, marginTop: "2px" }}>{j.mapel.kategori}</div>
                    </td>
                    <td style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Users size={16} style={{ color: "#94a3b8" }} />
                      <span style={{ color: "#334155", fontWeight: 500 }}>{j.pegawai.nama_lengkap}</span>
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
