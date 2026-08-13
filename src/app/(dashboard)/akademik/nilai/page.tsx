"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Printer, Download, BookOpen, GraduationCap } from "lucide-react";

export default function FilterNilaiPage() {
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [santri, setSantri] = useState("");
  const [kelasList, setKelasList] = useState<{ id: string; nama: string; jenjang?: string }[]>([]);
  const [mapelByKelas, setMapelByKelas] = useState<Record<string, { id: string; nama: string; kategori?: string }[]>>({});
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/master")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.kelas) setKelasList(resData.kelas);
        if (resData.mapel) setMapelByKelas(resData.mapel);
      })
      .catch(console.error);
  }, []);

  // Filter mapel list strictly based on selected kelas
  const availableMapelList = useMemo(() => {
    if (kelas && mapelByKelas[kelas]) {
      return mapelByKelas[kelas];
    }
    // Jika tidak ada kelas dipilih, kumpulkan semua mapel unik
    const allM: { id: string; nama: string; kategori?: string }[] = [];
    const seen = new Set<string>();
    Object.values(mapelByKelas).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((m) => {
          if (!seen.has(m.nama)) {
            seen.add(m.nama);
            allM.push(m);
          }
        });
      }
    });
    return allM;
  }, [kelas, mapelByKelas]);

  // Reset mapel jika kelas berganti
  const handleKelasChange = (newKelasId: string) => {
    setKelas(newKelasId);
    setMapel("");
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kelas) params.append("kelas_id", kelas);
      if (mapel) params.append("mapel_id", mapel);
      if (santri) params.append("santri_id", santri);

      // Mock / query filter
      setTimeout(() => {
        setData([
          {
            id: "1",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7 MTs" },
            mapel: { nama: "Matematika", kategori: "umum" },
            nilai: 85,
            keterangan: "Lulus",
          },
          {
            id: "2",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7 MTs" },
            mapel: { nama: "Akidah", kategori: "syariah" },
            nilai: 92,
            keterangan: "Mumtaz",
          },
        ]);
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        .platinum-table tr {
          transition: background 0.2s;
        }
        .platinum-table tr:hover {
          background-color: #f8fafc !important;
        }
        .platinum-table tr:hover td.sticky-col {
          background-color: #f8fafc !important;
        }
      `}</style>
      <div style={{ background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)", borderRadius: "24px", padding: "32px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(85, 0, 0, 0.35)" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "white", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={24} /> Pusat Data Nilai Akademik
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", margin: 0 }}>Filter, pantau, dan unduh data nilai santri per jenjang dan mata pelajaran.</p>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", border: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
        {/* 1. Filter Kelas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Pilih Kelas</label>
          <select
            value={kelas}
            onChange={(e) => handleKelasChange(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Filter Mapel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "220px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
            Filter Mata Pelajaran {kelas ? "(Sesuai Kelas)" : ""}
          </label>
          <select
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
          >
            <option value="">{kelas ? `Semua Mapel di Kelas Ini` : "Semua Mata Pelajaran"}</option>
            {availableMapelList.map((m, idx) => (
              <option key={`${m.id}-${idx}`} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Cari Santri */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Cari Santri (NIS / Nama)</label>
          <input 
            type="text" 
            placeholder="Ketik nama santri..." 
            value={santri} 
            onChange={(e) => setSantri(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", width: "100%", outline: "none" }}
          />
        </div>

        <button onClick={handleFilter} style={{ background: "#550000", color: "white", padding: "10px 18px", borderRadius: "14px", fontWeight: "bold", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.2)", height: "42px" }}>
          <Filter size={18} />
          Terapkan Filter
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        data.length > 0 && (
          <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>Hasil Pencarian: {data.length} Data</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ background: "white", border: "1px solid #e2e8f0", color: "#334155", padding: "10px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                  <Download size={16} /> Export Excel
                </button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="platinum-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "16px 20px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Santri</th>
                    <th style={{ padding: "16px 20px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Kelas</th>
                    <th style={{ padding: "16px 20px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Mata Pelajaran</th>
                    <th style={{ padding: "16px 20px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Nilai</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "bold", color: "#0f172a" }}>{item?.santri?.nama_lengkap}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>NIS: {item.santri.nis}</div>
                      </td>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <span style={{ padding: "6px 12px", fontSize: "12px", fontWeight: "bold", borderRadius: "8px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                          {item?.kelas?.nama}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap", fontWeight: "600", color: "#1e293b" }}>
                        {item?.mapel?.nama}
                      </td>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap", fontFamily: "monospace", fontWeight: "bold", color: "#2563eb", fontSize: "16px" }}>
                        {item.nilai}
                      </td>
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap", textAlign: "center" }}>
                        <span style={{ padding: "6px 14px", fontSize: "12px", fontWeight: "bold", borderRadius: "9999px", background: "#d1fae5", color: "#065f46" }}>
                          {item.keterangan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
