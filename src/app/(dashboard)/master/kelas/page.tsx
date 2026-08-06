"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash2, Edit2, Save, X, Sparkles, Users, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KelasItem {
  id: string;
  nama: string;
  jenjang: string | null;
  is_active: boolean;
  wali_kelas?: { id: string; nama_lengkap: string } | null;
  _count?: { santri: number; MataPelajaran: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const jenjangColor: Record<string, { bg: string; text: string }> = {
  MTs:       { bg: "#eff6ff", text: "#1d4ed8" },
  Islamiyah: { bg: "#f0fdf4", text: "#15803d" },
  MA:        { bg: "#fdf4ff", text: "#7e22ce" },
  Umum:      { bg: "#f1f5f9", text: "#475569" },
};

export default function MasterKelasPage() {
  const [kelas, setKelas]       = useState<KelasItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [guruList, setGuruList] = useState<{ id: string; nama_lengkap: string }[]>([]);

  // Form
  const [isAdding,   setIsAdding]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emptyForm = { nama: "", jenjang: "MTs", is_active: true, wali_kelas_id: "" };
  const [form,     setForm]     = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const fetchKelas = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/master/kelas?all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.kelas)) setKelas(data.kelas);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchGuruList = async () => {
    try {
      const res  = await fetch("/api/master/guru");
      const data = await res.json();
      setGuruList(data);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchKelas(); fetchGuruList(); }, []);

  const handleAdd = async () => {
    if (!form.nama.trim()) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama kelas wajib diisi (misal: 7 MTs, IL, 10 MA).", confirmButtonColor: "#7c1010" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/master/kelas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan kelas");
      Swal.fire({ icon: "success", title: "Berhasil", text: `Kelas "${form.nama}" berhasil didaftarkan!`, confirmButtonColor: "#7c1010" });
      setForm(emptyForm);
      setIsAdding(false);
      fetchKelas();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.message, confirmButtonColor: "#7c1010" });
    } finally { setSubmitting(false); }
  };

  const handleStartEdit = (k: KelasItem) => {
    setEditingId(k.id);
    setEditForm({ nama: k.nama, jenjang: k.jenjang || "MTs", is_active: k.is_active, wali_kelas_id: k.wali_kelas?.id || "" });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.nama.trim()) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama kelas tidak boleh kosong.", confirmButtonColor: "#7c1010" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/master/kelas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kelas");
      Swal.fire({ icon: "success", title: "Tersimpan", text: "Perubahan kelas berhasil disimpan.", confirmButtonColor: "#7c1010", timer: 1500, showConfirmButton: false });
      setEditingId(null);
      fetchKelas();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.message, confirmButtonColor: "#7c1010" });
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (k: KelasItem) => {
    try {
      const res = await fetch(`/api/master/kelas/${k.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !k.is_active }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchKelas();
    } catch (err: any) { Swal.fire("Gagal", err.message, "error"); }
  };

  const handleDelete = async (k: KelasItem) => {
    const result = await Swal.fire({
      title: `Hapus Kelas ${k.nama}?`,
      text: "Jika kelas memiliki santri atau mapel terkait, statusnya akan dinonaktifkan.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/master/kelas/${k.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        Swal.fire({ icon: "success", title: "Selesai", text: data.message || "Kelas berhasil diproses.", confirmButtonColor: "#7c1010" });
        fetchKelas();
      } catch (err: any) { Swal.fire("Gagal", err.message, "error"); }
    }
  };

  const stats = {
    total:       kelas.length,
    aktif:       kelas.filter(k => k.is_active).length,
    totalSantri: kelas.reduce((s, k) => s + (k._count?.santri || 0), 0),
    totalMapel:  kelas.reduce((s, k) => s + (k._count?.MataPelajaran || 0), 0),
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #3b0000 0%, #550000 60%, #7a0000 100%)",
        borderRadius: 24, padding: "32px 36px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20,
        boxShadow: "0 16px 40px rgba(85,0,0,0.28)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:120, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <GraduationCap size={32} color="#fca5a5" />
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:"-0.3px" }}>Master Data Kelas</h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.82)", fontSize:14, lineHeight:1.6, maxWidth:460 }}>
            Kelola tingkatan kelas aktif, penjenjangan (MTs, IL, MA), wali kelas, serta konfigurasi akademik santri.
          </p>
        </div>

        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
          style={{
            position:"relative", zIndex:1,
            background:"#ddc192", color:"#3b0000", border:"none", cursor:"pointer",
            fontWeight:800, fontSize:14, padding:"12px 22px", borderRadius:14,
            display:"flex", alignItems:"center", gap:8,
            boxShadow:"0 4px 16px rgba(221,193,146,0.3)", transition:"all 0.2s",
            whiteSpace:"nowrap",
          }}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? "Tutup Form" : "Tambah Kelas Baru"}
        </button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16 }}>
        {[
          { label:"Total Kelas",            value: stats.total,       unit:"Tingkat", color:"#7c1010" },
          { label:"Kelas Aktif",            value: stats.aktif,       unit:"Kelas",   color:"#16a34a" },
          { label:"Total Santri Aktif",     value: stats.totalSantri, unit:"Santri",  color:"#2563eb" },
          { label:"Mapel Terdistribusi",    value: stats.totalMapel,  unit:"Mapel",   color:"#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:16, padding:"18px 22px", border:"1px solid #f1f5f9", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>
              {s.value}
              <span style={{ fontSize:13, fontWeight:500, color:"#94a3b8", marginLeft:6 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Form ─────────────────────────────────────────────────────────── */}
      {isAdding && (
        <div style={{
          background:"white", borderRadius:20, padding:"28px 32px",
          border:"2px solid #fecaca", boxShadow:"0 4px 20px rgba(124,16,16,0.08)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <Sparkles size={20} color="#7c1010" />
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#7c1010" }}>Pendaftaran Kelas Baru</h3>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, alignItems:"flex-end" }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Nama Kelas *</label>
              <input type="text" className="form-control" placeholder="7 MTs, IL, 10 MA…" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Jenjang</label>
              <select className="form-control" value={form.jenjang} onChange={e => setForm({ ...form, jenjang: e.target.value })}>
                <option value="MTs">Madrasah Tsanawiyah (MTs)</option>
                <option value="Islamiyah">Islamiyah / I'dad Lughowy (IL)</option>
                <option value="MA">Madrasah Aliyah (MA)</option>
                <option value="Umum">Umum / Lainnya</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Status</label>
              <select className="form-control" value={form.is_active ? "true" : "false"} onChange={e => setForm({ ...form, is_active: e.target.value === "true" })}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif (Draft)</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Wali Kelas (Opsional)</label>
              <select className="form-control" value={form.wali_kelas_id} onChange={e => setForm({ ...form, wali_kelas_id: e.target.value })}>
                <option value="">-- Pilih Wali Kelas --</option>
                {guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleAdd} disabled={submitting} className="btn btn-primary" style={{ flex:1, justifyContent:"center" }}>
                <Save size={15} /> {submitting ? "Menyimpan…" : "Simpan Kelas"}
              </button>
              <button onClick={() => setIsAdding(false)} className="btn btn-ghost">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:20, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Table Header */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fafafa" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#1e293b", display:"flex", alignItems:"center", gap:8 }}>
            <CheckCircle size={16} color="#7c1010" />
            Daftar Kelas Terdaftar
            <span style={{ fontSize:12, fontWeight:600, color:"#7c1010", background:"#fef2f2", padding:"2px 10px", borderRadius:20 }}>{kelas.length}</span>
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>
            Urutan: MTs (7,8,9) → IL → MA (10,11,12)
          </div>
        </div>

        {loading ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Memuat daftar kelas…</div>
        ) : kelas.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Belum ada data kelas yang terdaftar.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["No", "Nama Kelas", "Jenjang", "Wali Kelas", "Santri", "Mapel", "Status", "Aksi"].map((h, i) => (
                    <th key={h} style={{
                      padding:"14px 16px", textAlign: i === 0 ? "center" : i >= 4 && i <= 5 ? "center" : i === 7 ? "right" : "left",
                      fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b",
                      borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kelas.map((k, idx) => {
                  const isEditing = editingId === k.id;
                  const jColor = jenjangColor[k.jenjang || "MTs"] || jenjangColor["Umum"];
                  return (
                    <tr key={k.id} style={{
                      background: isEditing ? "#fffbeb" : idx % 2 === 0 ? "white" : "#fafafa",
                      transition:"background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = "#f0f9ff"; }}
                    onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? "white" : "#fafafa"; }}
                    >
                      {/* No */}
                      <td style={{ padding:"14px 16px", textAlign:"center", fontSize:13, fontWeight:600, color:"#94a3b8" }}>{idx + 1}</td>

                      {/* Nama */}
                      <td style={{ padding:"14px 16px" }}>
                        {isEditing ? (
                          <input type="text" className="form-control" value={editForm.nama} onChange={e => setEditForm({ ...editForm, nama: e.target.value })} style={{ padding:"6px 10px", fontSize:14, minWidth:100 }} />
                        ) : (
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:10, background:"rgba(124,16,16,0.08)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7c1010", fontWeight:800, fontSize:12, flexShrink:0 }}>
                              {k.nama.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{k.nama}</span>
                          </div>
                        )}
                      </td>

                      {/* Jenjang */}
                      <td style={{ padding:"14px 16px" }}>
                        {isEditing ? (
                          <select className="form-control" value={editForm.jenjang} onChange={e => setEditForm({ ...editForm, jenjang: e.target.value })} style={{ padding:"6px 10px", fontSize:13 }}>
                            <option value="MTs">MTs</option>
                            <option value="Islamiyah">IL</option>
                            <option value="MA">MA</option>
                            <option value="Umum">Umum</option>
                          </select>
                        ) : (
                          <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:jColor.bg, color:jColor.text }}>
                            {k.jenjang || "MTs"}
                          </span>
                        )}
                      </td>

                      {/* Wali Kelas */}
                      <td style={{ padding:"14px 16px" }}>
                        {isEditing ? (
                          <select className="form-control" value={editForm.wali_kelas_id} onChange={e => setEditForm({ ...editForm, wali_kelas_id: e.target.value })} style={{ padding:"6px 10px", fontSize:13, minWidth:160 }}>
                            <option value="">- Belum Ada -</option>
                            {guruList.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize:13, fontWeight:500, color: k.wali_kelas ? "#1e293b" : "#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
                            {k.wali_kelas ? (
                              <><Users size={13} color="#7c1010" />{k.wali_kelas.nama_lengkap}</>
                            ) : "— Belum Ditentukan"}
                          </span>
                        )}
                      </td>

                      {/* Santri */}
                      <td style={{ padding:"14px 16px", textAlign:"center" }}>
                        <span style={{ fontWeight:700, fontSize:14, color:"#2563eb" }}>{k._count?.santri || 0}</span>
                        <span style={{ fontSize:11, color:"#94a3b8", marginLeft:4 }}>Santri</span>
                      </td>

                      {/* Mapel */}
                      <td style={{ padding:"14px 16px", textAlign:"center" }}>
                        <span style={{ fontWeight:700, fontSize:14, color:"#d97706" }}>{k._count?.MataPelajaran || 0}</span>
                        <span style={{ fontSize:11, color:"#94a3b8", marginLeft:4 }}>Mapel</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding:"14px 16px", textAlign:"center" }}>
                        {isEditing ? (
                          <select className="form-control" value={editForm.is_active ? "true" : "false"} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === "true" })} style={{ padding:"6px 10px", fontSize:13 }}>
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                          </select>
                        ) : (
                          <button onClick={() => handleToggleActive(k)} style={{
                            border:"none", cursor:"pointer", padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                            background: k.is_active ? "#dcfce7" : "#fee2e2", color: k.is_active ? "#15803d" : "#b91c1c",
                            transition:"all 0.2s",
                          }} title="Klik untuk toggle status">
                            {k.is_active ? "● Aktif" : "○ Nonaktif"}
                          </button>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding:"14px 20px 14px 16px", textAlign:"right" }}>
                        {isEditing ? (
                          <div style={{ display:"inline-flex", gap:8 }}>
                            <button onClick={() => handleSaveEdit(k.id)} disabled={submitting} className="btn btn-primary btn-sm" style={{ padding:"6px 14px", gap:6 }}>
                              <Save size={14} /> Simpan
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm" style={{ padding:"6px 12px" }}>Batal</button>
                          </div>
                        ) : (
                          <div style={{ display:"inline-flex", gap:6 }}>
                            <button onClick={() => handleStartEdit(k)} title="Edit" style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", color:"#64748b", transition:"all 0.2s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef9c3"; (e.currentTarget as HTMLElement).style.borderColor = "#fcd34d"; (e.currentTarget as HTMLElement).style.color = "#92400e"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                            ><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(k)} title="Hapus" style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", color:"#64748b", transition:"all 0.2s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                            ><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
