"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Trash2, Edit2, Save, X, Sparkles, RefreshCw, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KelasItem {
  id: string;
  nama: string;
  jenjang: string | null;
}

interface MapelItem {
  id: string;
  nama: string;
  nama_arab: string | null;
  kategori: string;
  kelas_id: string;
  is_active: boolean;
  kelas: KelasItem;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getKategoriBadge = (kategori: string) => {
  switch (kategori) {
    case "syariah":
      return <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:"#ecfdf5", color:"#047857" }}>Ilmu Syari'ah</span>;
    case "bahasa":
      return <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:"#fff7ed", color:"#c2410c" }}>Bahasa Arab</span>;
    default:
      return <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:"#f0f9ff", color:"#0369a1" }}>Ilmu Umum</span>;
  }
};

export default function MasterMapelPage() {
  const [mapel, setMapel] = useState<MapelItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filter State
  const [activeKelasTab, setActiveKelasTab] = useState<string>("all");
  const [filterKategori, setFilterKategori] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { nama: "", nama_arab: "", kategori: "umum", kelas_id: "" };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mapelRes, kelasRes] = await Promise.all([ fetch("/api/master/mapel"), fetch("/api/master/kelas") ]);
      const mapelData = await mapelRes.json();
      const kelasData = await kelasRes.json();
      if (mapelData.mapel) setMapel(mapelData.mapel);
      if (kelasData.kelas) setKelasList(kelasData.kelas);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSyncKurikulum = async () => {
    const confirm = await Swal.fire({
      title: "Sinkronkan Kurikulum Ust Aziz?",
      text: "Sistem akan memastikan seluruh mapel standar Kelas 7 MTs dan Kelas IL terdaftar dan aktif secara terpisah di database.",
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0284c7", cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Sinkronkan", cancelButtonText: "Batal" });
    if (!confirm.isConfirmed) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/setup-db/cleanup-kelas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi");
      await Swal.fire({ icon: "success", title: "Sinkronisasi Berhasil!", text: "Kurikulum resmi Ustadz Aziz untuk 7 MTs dan IL berhasil disinkronkan.", confirmButtonColor: "#0284c7" });
      fetchData();
    } catch (err: any) { Swal.fire("Gagal", err.message, "error"); } finally { setSyncing(false); }
  };

  const handleAdd = async () => {
    if (!form.nama.trim() || !form.kelas_id) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama Mata Pelajaran dan Tingkat Kelas wajib diisi.", confirmButtonColor: "#0284c7" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/master/mapel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftarkan mapel");
      Swal.fire({ icon: "success", title: "Berhasil", text: `Mapel "${form.nama}" berhasil didaftarkan!`, confirmButtonColor: "#0284c7" });
      setForm(emptyForm); setIsAdding(false); fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message, confirmButtonColor: "#0284c7" }); } finally { setSubmitting(false); }
  };

  const handleStartEdit = (m: MapelItem) => {
    setEditingId(m.id);
    setEditForm({ nama: m.nama, nama_arab: m.nama_arab || "", kategori: m.kategori || "umum", kelas_id: m.kelas_id });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.nama.trim() || !editForm.kelas_id) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama mapel dan kelas tidak boleh kosong.", confirmButtonColor: "#0284c7" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/master/mapel/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui data");
      Swal.fire({ icon: "success", title: "Tersimpan", text: "Perubahan berhasil disimpan.", confirmButtonColor: "#0284c7", timer: 1500, showConfirmButton: false });
      setEditingId(null); fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message, confirmButtonColor: "#0284c7" }); } finally { setSubmitting(false); }
  };

  const handleDelete = async (m: MapelItem) => {
    const result = await Swal.fire({
      title: `Hapus Mapel ${m.nama}?`, text: `Mata pelajaran kelas ${m.kelas?.nama} akan dihapus/dinonaktifkan.`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal" });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/master/mapel/${m.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        Swal.fire({ icon: "success", title: "Selesai", text: data.message || "Berhasil dihapus.", confirmButtonColor: "#0284c7" });
        fetchData();
      } catch (err: any) { Swal.fire("Gagal", err.message, "error"); }
    }
  };

  const filteredMapel = useMemo(() => {
    return mapel.filter(m => {
      const k = m.kelas?.nama || "";
      if (activeKelasTab === "7 MTs" && k !== "7 MTs") return false;
      if (activeKelasTab === "IL" && k !== "IL" && k !== "I'dad Lughowy") return false;
      if (filterKategori && m.kategori !== filterKategori) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.nama.toLowerCase().includes(q) && !(m.nama_arab?.toLowerCase() || "").includes(q)) return false;
      }
      return true;
    });
  }, [mapel, activeKelasTab, filterKategori, searchQuery]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #3b0000 0%, #550000 60%, #7a0000 100%)",
        borderRadius: 24, padding: "32px 36px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(221,193,146,0.1)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:120, width:160, height:160, borderRadius:"50%", background:"rgba(221,193,146,0.05)", pointerEvents:"none" }} />
        
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <BookOpen size={32} color="#ddc192" />
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:"-0.3px" }}>Master Data Mata Pelajaran</h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.82)", fontSize:14, lineHeight:1.6, maxWidth:460 }}>
            Pemisahan kurikulum resmi (Revisi 31 Juli 2026 - Ust. Aziz). Kelola mata pelajaran khusus Kelas 7 MTs dan Kelas IL secara independen.
          </p>
        </div>

        <div style={{ position:"relative", zIndex:1, display:"flex", gap:12, flexWrap:"wrap" }}>
          <button onClick={handleSyncKurikulum} disabled={syncing} style={{
            background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer",
            fontWeight:700, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)", transition:"all 0.2s", whiteSpace:"nowrap" }}>
            <RefreshCw size={18} /> Sync Kurikulum
          </button>
          <button onClick={() => { setIsAdding(!isAdding); setEditingId(null); }} style={{
            background:"#ddc192", color:"#3b0000", border:"none", cursor:"pointer",
            fontWeight:800, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(221,193,146,0.3)", transition:"all 0.2s", whiteSpace:"nowrap" }}>
            {isAdding ? <X size={18} /> : <Plus size={18} />} {isAdding ? "Tutup Form" : "Tambah Mapel"}
          </button>
        </div>
      </div>

      {/* ── Filters & Tabs ─────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:16, padding:"16px 20px", border:"1px solid #f1f5f9", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", justifyContent:"space-between" }}>
        
        {/* Kelas Tabs */}
        <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
          {[
            { id: "all", label: "Semua Kelas", count: mapel.length, activeBg: "#1e293b", activeText: "white" },
            { id: "7 MTs", label: "7 MTs", count: mapel.filter(m => m.kelas?.nama === "7 MTs").length, activeBg: "#0369a1", activeText: "white" },
            { id: "IL", label: "IL (I'dad Lughowy)", count: mapel.filter(m => m.kelas?.nama === "IL" || m.kelas?.nama === "I'dad Lughowy").length, activeBg: "#b45309", activeText: "white" }
          ].map(t => {
            const isActive = activeKelasTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveKelasTab(t.id)} style={{
                background: isActive ? t.activeBg : "#f8fafc", color: isActive ? t.activeText : "#475569",
                border: isActive ? "none" : "1px solid #e2e8f0", padding:"8px 16px", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.2s", whiteSpace:"nowrap"
              }}>
                {t.label}
                <span style={{ background: isActive ? "rgba(255,255,255,0.2)" : "#e2e8f0", padding:"2px 8px", borderRadius:20, fontSize:11 }}>{t.count}</span>
              </button>
            )
          })}
        </div>

        {/* Search & Category Filter */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <input type="text" placeholder="Cari Mapel/Arab..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding:"8px 14px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, width:180, outline:"none" }} />
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} style={{ padding:"8px 14px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, outline:"none", cursor:"pointer" }}>
            <option value="">Semua Kategori</option>
            <option value="syariah">Ilmu Syari'ah</option>
            <option value="bahasa">Ilmu Bahasa Arab</option>
            <option value="umum">Ilmu Umum</option>
          </select>
        </div>
      </div>

      {/* ── Add Form ─────────────────────────────────────────────────────────── */}
      {isAdding && (
        <div style={{
          background:"#f0f9ff", borderRadius:20, padding:"28px 32px",
          border:"2px solid #bae6fd", boxShadow:"0 4px 20px rgba(3,105,161,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <Sparkles size={20} color="#0284c7" />
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0284c7" }}>Pendaftaran Mapel Baru</h3>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, alignItems:"flex-end" }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Nama Mapel *</label>
              <input type="text" className="form-control" placeholder="Contoh: Fiqh, Nahwu" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Nama Arab (Rapor)</label>
              <input type="text" className="form-control font-arabic" dir="rtl" placeholder="الفقه" value={form.nama_arab} onChange={e => setForm({ ...form, nama_arab: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Kategori *</label>
              <select className="form-control" value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })}>
                <option value="syariah">Ilmu Syari'ah</option>
                <option value="bahasa">Ilmu Bahasa Arab</option>
                <option value="umum">Ilmu Umum</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Tingkat Kelas *</label>
              <select className="form-control" value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value })}>
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleAdd} disabled={submitting} className="btn" style={{ flex:1, justifyContent:"center", background:"#0284c7", color:"white", fontWeight:700 }}>
                <Save size={15} /> {submitting ? "Menyimpan…" : "Simpan Mapel"}
              </button>
              <button onClick={() => setIsAdding(false)} className="btn btn-ghost">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:20, overflow:"hidden", border:"1px solid #f1f5f9", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Memuat daftar mata pelajaran…</div>
        ) : filteredMapel.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Tidak ada mata pelajaran yang sesuai.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:800 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["No", "Mata Pelajaran", "Nama Arab", "Kategori", "Kelas", "Aksi"].map((h, i) => (
                    <th key={h} style={{
                      padding:"16px 20px", textAlign: i === 0 ? "center" : i === 2 ? "right" : i === 3 || i === 4 ? "center" : i === 5 ? "right" : "left",
                      fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"#64748b",
                      borderBottom:"2px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMapel.map((m, idx) => {
                  const isEditing = editingId === m.id;
                  return (
                    <tr key={m.id} style={{
                      background: isEditing ? "#f0f9ff" : idx % 2 === 0 ? "white" : "#fafafa",
                      transition:"background 0.15s" }}
                    onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; }}
                    onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? "white" : "#fafafa"; }}
                    >
                      {/* No */}
                      <td style={{ padding:"16px 20px", textAlign:"center", fontSize:13, fontWeight:600, color:"#94a3b8" }}>{idx + 1}</td>

                      {/* Nama */}
                      <td style={{ padding:"16px 20px" }}>
                        {isEditing ? (
                          <input type="text" className="form-control" value={editForm.nama} onChange={e => setEditForm({ ...editForm, nama: e.target.value })} style={{ padding:"6px 10px", fontSize:14, minWidth:140 }} />
                        ) : (
                          <span style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{m.nama}</span>
                        )}
                      </td>

                      {/* Nama Arab */}
                      <td style={{ padding:"16px 20px", textAlign:"right" }}>
                        {isEditing ? (
                          <input type="text" className="form-control font-arabic" dir="rtl" value={editForm.nama_arab} onChange={e => setEditForm({ ...editForm, nama_arab: e.target.value })} style={{ padding:"6px 10px", fontSize:14, minWidth:140 }} />
                        ) : (
                          <span className="font-arabic" style={{ fontWeight:700, fontSize:18, color:"#0f172a" }}>{m.nama_arab || "-"}</span>
                        )}
                      </td>

                      {/* Kategori */}
                      <td style={{ padding:"16px 20px", textAlign:"center" }}>
                        {isEditing ? (
                          <select className="form-control" value={editForm.kategori} onChange={e => setEditForm({ ...editForm, kategori: e.target.value })} style={{ padding:"6px 10px", fontSize:13 }}>
                            <option value="syariah">Syari'ah</option><option value="bahasa">Bahasa</option><option value="umum">Umum</option>
                          </select>
                        ) : getKategoriBadge(m.kategori)}
                      </td>

                      {/* Kelas */}
                      <td style={{ padding:"16px 20px", textAlign:"center" }}>
                        {isEditing ? (
                          <select className="form-control" value={editForm.kelas_id} onChange={e => setEditForm({ ...editForm, kelas_id: e.target.value })} style={{ padding:"6px 10px", fontSize:13, minWidth:100 }}>
                            {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                          </select>
                        ) : (
                          <span style={{ display:"inline-block", padding:"4px 12px", borderRadius:8, fontSize:12, fontWeight:700, background:"#f1f5f9", color:"#334155", border:"1px solid #e2e8f0" }}>
                            {m.kelas?.nama || "-"}
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding:"16px 24px 16px 20px", textAlign:"right" }}>
                        {isEditing ? (
                          <div style={{ display:"inline-flex", gap:8 }}>
                            <button onClick={() => handleSaveEdit(m.id)} disabled={submitting} className="btn" style={{ background:"#0284c7", color:"white", padding:"6px 14px", gap:6 }}>
                              <Save size={14} /> Simpan
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm" style={{ padding:"6px 12px" }}>Batal</button>
                          </div>
                        ) : (
                          <div style={{ display:"inline-flex", gap:6 }}>
                            <button onClick={() => handleStartEdit(m)} title="Edit" style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", color:"#64748b", transition:"all 0.2s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef9c3"; (e.currentTarget as HTMLElement).style.borderColor = "#fcd34d"; (e.currentTarget as HTMLElement).style.color = "#92400e"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                            ><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(m)} title="Hapus" style={{ padding:"7px 10px", borderRadius:10, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", color:"#64748b", transition:"all 0.2s" }}
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
