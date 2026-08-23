"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Edit2, Save } from "lucide-react";
import Swal from "sweetalert2";

export default function MasterSesiPage() {
  const [sesi, setSesi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ jam_ke: "", waktu_mulai: "", waktu_selesai: "", durasi_menit: "40" });

  useEffect(() => {
    // Mock Fetching initial data
    setLoading(true);
    setTimeout(() => {
      setSesi([
        { id: "1", jam_ke: 1, waktu_mulai: "04:50", waktu_selesai: "05:30", durasi_menit: 40 },
        { id: "2", jam_ke: 2, waktu_mulai: "05:30", waktu_selesai: "06:10", durasi_menit: 40 },
        { id: "3", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", durasi_menit: 40 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = () => {
    if (!form.jam_ke || !form.waktu_mulai || !form.waktu_selesai) {
      Swal.fire("Error", "Semua kolom wajib diisi", "error");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      jam_ke: parseInt(form.jam_ke),
      waktu_mulai: form.waktu_mulai,
      waktu_selesai: form.waktu_selesai,
      durasi_menit: parseInt(form.durasi_menit) };

    setSesi([...sesi, newEntry].sort((a, b) => a.jam_ke - b.jam_ke));
    setIsAdding(false);
    setForm({ jam_ke: "", waktu_mulai: "", waktu_selesai: "", durasi_menit: "40" });
    Swal.fire("Berhasil", "Sesi jam pelajaran berhasil ditambahkan", "success");
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Hapus Sesi?",
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal" }).then((result) => {
      if (result.isConfirmed) {
        setSesi(sesi.filter((s) => s.id !== id));
        Swal.fire("Terhapus!", "Sesi berhasil dihapus.", "success");
      }
    });
  };

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
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={28} /> Master Sesi Waktu
          </h1>
          <p style={{ color: "#cbd5e1", margin: "8px 0 0 0", fontSize: "14px" }}>
            Kelola slot jam pelajaran KBM per harinya secara dinamis.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{
            padding: "10px 18px",
            borderRadius: "14px",
            backgroundColor: isAdding ? "#475569" : "#0ea5e9",
            color: "white",
            border: "none",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.2s"
          }}
        >
          {isAdding ? "Batal" : <><Plus size={16} /> Tambah Sesi</>}
        </button>
      </div>

      {isAdding && (
        <div style={{ background: "white", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }} className="animate-in fade-in slide-in-from-top-4">
          <h3 style={{ fontWeight: "bold", fontSize: "18px", color: "#1e293b", margin: "0 0 16px 0", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>Form Tambah Sesi Baru</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Jam Ke-</label>
              <input type="number" value={form.jam_ke} onChange={(e) => setForm({...form, jam_ke: e.target.value})} style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px" }} placeholder="Misal: 11" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Waktu Mulai</label>
              <input type="time" value={form.waktu_mulai} onChange={(e) => setForm({...form, waktu_mulai: e.target.value})} style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Waktu Selesai</label>
              <input type="time" value={form.waktu_selesai} onChange={(e) => setForm({...form, waktu_selesai: e.target.value})} style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>Durasi (Menit)</label>
              <input type="number" value={form.durasi_menit} onChange={(e) => setForm({...form, durasi_menit: e.target.value})} style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px" }} />
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ backgroundColor: "#10b981", color: "white", padding: "10px 18px", borderRadius: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)" }}>
              <Save size={18} /> Simpan Data
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>Memuat data...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jam Ke</th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rentang Waktu</th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Durasi</th>
                <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sesi.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[#f0fdf4] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                    <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "6px 16px", borderRadius: "999px", fontWeight: "bold", fontSize: "14px" }}>Sesi {s.jam_ke}</span>
                  </td>
                  <td style={{ padding: "16px 20px", whiteSpace: "nowrap", color: "#1e293b", fontWeight: 600, fontFamily: "monospace", fontSize: "15px" }}>
                    {s.waktu_mulai} - {s.waktu_selesai}
                  </td>
                  <td style={{ padding: "16px 20px", whiteSpace: "nowrap", textAlign: "center", color: "#64748b", fontWeight: 500 }}>
                    {s.durasi_menit} Menit
                  </td>
                  <td style={{ padding: "16px 20px", whiteSpace: "nowrap", textAlign: "right" }}>
                    <button style={{ color: "#f59e0b", background: "transparent", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", margin: "0 4px" }} className="hover:bg-amber-50">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{ color: "#ef4444", background: "transparent", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer" }} className="hover:bg-red-50">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
