"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Users, Plus, Trash2, Save, Upload, Download, CheckCircle, Search, UserCheck } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DistribusiHalaqohPage() {
  const [asatidz, setAsatidz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/halaqoh/distribusi");
      const data = await res.json();
      if (data.success) {
        setAsatidz(data.asatidz);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuru = (guru: any) => {
    setSelectedGuru(guru);
    // clone assignments from halaqoh_kelompok
    const initialAssignments = (guru.halaqoh_kelompok || []).map((k: any) => ({
      id: k.id,
      nama_kelompok: k.nama_kelompok,
      sesi: k.sesi
    }));
    setAssignments(initialAssignments);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { id: null, nama_kelompok: "", sesi: "subuh" }]);
  };

  const updateAssignment = (index: number, field: string, value: string) => {
    const newArr = [...assignments];
    newArr[index][field] = value;
    setAssignments(newArr);
  };

  const removeAssignment = (index: number) => {
    const newArr = [...assignments];
    newArr.splice(index, 1);
    setAssignments(newArr);
  };

  const handleSave = async () => {
    if (!selectedGuru) return;
    
    // Validasi
    for (const a of assignments) {
      if (!a.nama_kelompok || !a.sesi) {
        Swal.fire("Peringatan", "Semua baris kelompok harus memiliki Nama Kelompok dan Sesi yang valid.", "warning");
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/halaqoh/distribusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: selectedGuru.id,
          kelompok: assignments
        })
      });
      
      const result = await res.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Disimpan",
          text: result.message,
          showConfirmButton: false,
          timer: 1500
        });
        await fetchData();
        // keep selected guru active, but refresh data
        // note: fetchData will override asatidz. We can update selectedGuru locally to avoid jump
      } else {
        Swal.fire("Gagal", result.error || "Terjadi kesalahan", "error");
      }
    } catch (e) {
      Swal.fire("Gagal", "Terjadi kesalahan sistem", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXCEL IMPORT EXPORT FEATURE ---
  const downloadTemplate = () => {
    const data = [
      { "Nama Pengampu": "Imran Abdillah", "Nama Kelompok": "Halaqoh Subuh 1", "Sesi": "Subuh" },
      { "Nama Pengampu": "Imran Abdillah", "Nama Kelompok": "Halaqoh Dhuha", "Sesi": "Dhuha" },
      { "Nama Pengampu": "Wahyudi Pranata", "Nama Kelompok": "Halaqoh Maghrib MTS", "Sesi": "Maghrib" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    
    ws["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DistribusiHalaqoh");
    XLSX.writeFile(wb, "Template_Distribusi_Halaqoh.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: "Membaca File...",
      text: "Sedang memproses dokumen Excel.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire("Gagal", "File Excel kosong atau format tidak sesuai.", "error");
          return;
        }

        const res = await fetch("/api/halaqoh/distribusi/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data })
        });
        const result = await res.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diimpor!",
            html: `Berhasil plot: <b>${result.results.berhasil}</b> baris.<br/>Gagal/Lewat: <b>${result.results.gagal}</b> baris.<br/><br/><span style="font-size:12px; color:#ef4444">${result.results.log_gagal.slice(0,5).join("<br/>")}</span>`,
            confirmButtonColor: "#550000"
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire("Gagal", result.message || "Terjadi kesalahan saat memproses data.", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Gagal membaca file Excel. Pastikan format benar.", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <div style={{ fontWeight: 600, color: "#94a3b8" }}>Memuat daftar pengampu...</div>
      </div>
    );
  }

  const filteredAsatidz = asatidz.filter(g => g.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #550000, #3a0000)", color: "white", padding: "32px 36px", borderRadius: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, boxShadow: "0 10px 25px rgba(85,0,0,0.2)", position: "relative", overflow: "hidden", marginBottom: 32 }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(221,193,146,0.1)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: 120, width: 160, height: 160, borderRadius: "50%", background: "rgba(221,193,146,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Link
              href="/halaqoh"
              style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.2s" }}
            ><ArrowLeft size={16} /></Link>
            <BookOpen size={30} color="#ddc192" />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-0.3px" }}>Distribusi Halaqoh</h1>
          </div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6, maxWidth: 460 }}>
            Atur beban dan ploting kelompok halaqoh tahfidz untuk setiap pengampu / ustaz.
          </p>
        </div>
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={downloadTemplate} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontWeight: 700, fontSize: 14, padding: "12px 22px", borderRadius: 14, display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)", transition: "all 0.2s" }}>
            <Download size={18} /> Template Excel
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "linear-gradient(135deg, #ddc192, #c6a673)", color: "#550000", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 14, padding: "12px 22px", borderRadius: 14, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(221,193,146,0.3)", transition: "all 0.2s" }}>
            <Upload size={18} /> Import Massal
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>
        
        {/* Left Col: Teacher List */}
        <div style={{ background: "white", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", overflow: "hidden", display: "flex", flexDirection: "column", height: 700 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #f1f5f9", background: "#f8fafc" }}>
            <h2 style={{ margin: 0, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
              <Users size={20} color="#550000" /> Daftar Pengampu
            </h2>
            <div style={{ position: "relative", marginTop: 16 }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Cari nama ustaz..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, outline: "none" }}
              />
            </div>
          </div>
          <div className="custom-scrollbar" style={{ overflowY: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredAsatidz.map(guru => {
              const active = selectedGuru?.id === guru.id;
              const hasGroups = guru.halaqoh_kelompok?.length > 0;
              return (
                <div 
                  key={guru.id}
                  onClick={() => handleSelectGuru(guru)}
                  style={{
                    padding: "16px", borderRadius: 16, cursor: "pointer", transition: "all 0.2s",
                    border: active ? "2px solid #550000" : "2px solid #f1f5f9",
                    background: active ? "#fffafa" : "white",
                    display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden"
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: active ? "#550000" : "#f1f5f9", color: active ? "white" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {guru.nama_lengkap.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: active ? "#550000" : "#1e293b" }}>{guru.nama_lengkap}</h3>
                    <div style={{ fontSize: 12, color: hasGroups ? "#059669" : "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <BookOpen size={12} /> {guru.halaqoh_kelompok?.length || 0} Kelompok
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredAsatidz.length === 0 && (
              <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontWeight: 600, fontSize: 13 }}>Tidak ada ustaz ditemukan.</div>
            )}
          </div>
        </div>

        {/* Right Col: Editor */}
        <div style={{ background: "white", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", overflow: "hidden", display: "flex", flexDirection: "column", height: 700 }}>
          {selectedGuru ? (
            <>
              <div style={{ padding: "20px 28px", borderBottom: "1.5px solid #f1f5f9", background: "#fffafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: "0 0 6px", fontWeight: 900, color: "#550000", fontSize: 20 }}>
                    {selectedGuru.nama_lengkap}
                  </h2>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <UserCheck size={14} /> Atur Plot Kelompok Halaqoh
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ background: "#550000", color: "#ddc192", padding: "12px 24px", borderRadius: 14, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(85,0,0,0.25)" }}
                >
                  {isSaving ? "Menyimpan..." : <><Save size={18} /> Simpan Distribusi</>}
                </button>
              </div>
              
              <div className="custom-scrollbar" style={{ padding: 28, flex: 1, overflowY: "auto", background: "#f8fafc" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Daftar Kelompok Halaqoh</h3>
                  <button onClick={addAssignment} style={{ background: "white", border: "1.5px solid #e2e8f0", color: "#334155", padding: "8px 16px", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Plus size={16} /> Tambah Kelompok
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {assignments.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", border: "2px dashed #cbd5e1", borderRadius: 16, background: "white" }}>
                      <CheckCircle size={32} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
                      <div style={{ fontWeight: 700, color: "#64748b", fontSize: 14 }}>Belum ada kelompok.</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Klik tombol Tambah Kelompok di atas.</div>
                    </div>
                  ) : assignments.map((asg, idx) => (
                    <div key={idx} style={{ background: "white", border: "1.5px solid #e2e8f0", padding: "16px 20px", borderRadius: 16, display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nama Kelompok</label>
                        <input 
                          type="text"
                          value={asg.nama_kelompok}
                          placeholder="Cth: Halaqoh Subuh MTs 1"
                          onChange={e => updateAssignment(idx, "nama_kelompok", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, outline: "none" }}
                          onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                          onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                        />
                      </div>
                      <div style={{ width: 180 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sesi</label>
                        <select
                          value={asg.sesi}
                          onChange={e => updateAssignment(idx, "sesi", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700, outline: "none", cursor: "pointer", background: "white" }}
                          onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                          onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                        >
                          <option value="subuh">Subuh</option>
                          <option value="dhuha">Dhuha</option>
                          <option value="maghrib">Ba'da Maghrib</option>
                        </select>
                      </div>
                      <div style={{ paddingTop: 22 }}>
                        <button onClick={() => removeAssignment(idx)} style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6", padding: 10, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: "#f8fafc" }}>
              <div style={{ width: 80, height: 80, background: "white", borderRadius: "50%", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Users size={36} color="#cbd5e1" />
              </div>
              <p style={{ margin: "0 0 8px", fontWeight: 800, color: "#475569", fontSize: 18 }}>Pilih Pengampu di Sebelah Kiri</p>
              <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>Anda dapat mengatur plot kelompok halaqoh untuk setiap ustaz, atau gunakan tombol <b style={{ color: "#550000" }}>Import Massal</b> untuk upload data Excel secara otomatis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}