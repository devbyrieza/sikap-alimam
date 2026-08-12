"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Save, Mail, Phone, RefreshCw, BookOpen, X, Sparkles, Eye, EyeOff, Download } from "lucide-react";
import Swal from "sweetalert2";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatName = (str: string) => {
  if (!str) return "-";
  return str.split(' ').map(word => {
    if (word.includes('.')) return word; // Biarkan singkatan gelar
    if (word === word.toUpperCase() || word === word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  }).join(' ');
};

export default function MasterGuruPage() {
  const [guru, setGuru] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = { nik: "", nama_lengkap: "", no_hp: "", email: "", mata_pelajaran: "", foto_url: "", roles: [] as string[], wali_kelas_id: "" };
  const [form, setForm] = useState(emptyForm);

  // Mapel Builder State
  const [newMapelClass, setNewMapelClass] = useState("");
  const [newMapelName, setNewMapelName] = useState("");
  const [showRawMapel, setShowRawMapel] = useState(false);

  const handleAddMapel = () => {
    if (!newMapelClass || !newMapelName.trim()) return;
    const kelasObj = kelasList.find(k => k.id === newMapelClass);
    
    let kelasStr = newMapelClass;
    if (kelasObj) {
      if (kelasObj.jenjang === "IL") {
        kelasStr = "IL";
      } else if (kelasObj.jenjang) {
        kelasStr = `${kelasObj.nama} ${kelasObj.jenjang}`;
      } else {
        kelasStr = kelasObj.nama;
      }
    }

    const cleanMapelName = newMapelName.trim().replace(/^\[.*?\]\s*/, "");
    const newEntry = `[${kelasStr}] ${cleanMapelName}`;
    const currentList = form.mata_pelajaran ? form.mata_pelajaran.split(",").map(s => s.trim()).filter(s => s) : [];
    currentList.push(newEntry);
    setForm({ ...form, mata_pelajaran: currentList.join(", ") });
    setNewMapelName(""); // reset input
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGuru, resKelas, resMapel] = await Promise.all([
        fetch("/api/master/guru"),
        fetch("/api/master/kelas").catch(() => null),
        fetch("/api/master/mapel").catch(() => null)
      ]);
      
      let dataGuru = [];
      if (resGuru?.ok) {
        dataGuru = await resGuru.json();
      } else {
        console.error("Gagal fetch guru");
      }
      
      let dataKelas = [];
      if (resKelas?.ok) {
        const jsonKelas = await resKelas.json();
        dataKelas = jsonKelas.kelas || jsonKelas || [];
      }

      let dataMapel = [];
      if (resMapel?.ok) {
        const jsonMapel = await resMapel.json();
        dataMapel = jsonMapel.mapel || jsonMapel || [];
      }

      if (!Array.isArray(dataGuru)) dataGuru = [];
      if (!Array.isArray(dataKelas)) dataKelas = [];
      if (!Array.isArray(dataMapel)) dataMapel = [];
      
      // Calculate which teacher is assigned to which class
      // dataKelas contains [{ id, wali_kelas: { id } }]
      const enrichedGuru = dataGuru.map((g: any) => {
        const assignedClass = dataKelas.find((k: any) => k.wali_kelas && k.wali_kelas.id === g.id);
        return { ...g, wali_kelas_id: assignedClass?.id || "" };
      });

      setGuru(enrichedGuru);
      setKelasList(dataKelas);
      setMapelList(dataMapel);
    } catch (err) { 
      console.error("Error in fetchData:", err);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchGuru = async () => {
    await fetchData();
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    Swal.fire({
      title: "Sinkronisasi...", text: "Menghubungkan ke database SIMPEG...",
      allowOutsideClick: false, didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch("/api/master/guru/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchGuru();
        Swal.fire({ icon: "success", title: "Sinkronisasi Berhasil", text: data.fallback ? data.message : `Terupdate/Tambah: ${data.updated}, Terhapus: ${data.deleted}.`, confirmButtonColor: "#059669" });
      } else {
        Swal.fire("Gagal", data.error || "Terjadi kesalahan saat sinkronisasi.", "error");
      }
    } catch { Swal.fire("Gagal", "Koneksi ke server terputus.", "error"); } finally { setIsSyncing(false); }
  };

  const handleSave = async () => {
    if (!form.nama_lengkap) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama lengkap wajib diisi", confirmButtonColor: "#059669" });
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/master/guru/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          Swal.fire({ icon: "success", title: "Berhasil", text: "Data Guru diperbarui", confirmButtonColor: "#059669", timer: 1500, showConfirmButton: false });
        } else {
          const errData = await res.json().catch(() => ({}));
          Swal.fire("Gagal", errData.error || "Gagal memperbarui data", "error");
        }
      } else {
        const res = await fetch("/api/master/guru", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
          Swal.fire({ icon: "success", title: "Berhasil", text: "Data Guru ditambahkan", confirmButtonColor: "#059669", timer: 1500, showConfirmButton: false });
        } else {
          const errData = await res.json().catch(() => ({}));
          Swal.fire("Gagal", errData.error || "Gagal menambahkan data", "error");
        }
      }
      setIsAdding(false); setEditingId(null); setForm(emptyForm); fetchGuru();
    } catch { Swal.fire("Gagal", "Terjadi kesalahan server", "error"); }
  };

  const handleEdit = (g: any) => {
    const roles = g.user?.role ? g.user.role.split(",").map((r: string) => r.trim().toUpperCase()) : [];
    setForm({ 
      nik: g.nik || "", 
      nama_lengkap: g.nama_lengkap || "", 
      no_hp: g.no_hp || "", 
      email: g.email || "", 
      mata_pelajaran: g.mata_pelajaran || "", 
      foto_url: g.foto_url || "",
      roles,
      wali_kelas_id: g.wali_kelas_id || "" 
    });
    setEditingId(g.id); setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: "Hapus Data?", text: `Anda yakin ingin menghapus ${name}?`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal"
    });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/master/guru/${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire({ icon: "success", title: "Terhapus", text: "Data guru dihapus.", confirmButtonColor: "#059669" });
          fetchGuru();
        } else { Swal.fire("Gagal", "Gagal menghapus data", "error"); }
      } catch { Swal.fire("Gagal", "Terjadi kesalahan server", "error"); }
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #3b0000 0%, #550000 60%, #7a0000 100%)",
        borderRadius: 24, padding: "32px 36px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(221,193,146,0.1)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, right:120, width:160, height:160, borderRadius:"50%", background:"rgba(221,193,146,0.05)", pointerEvents:"none" }} />
        
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <Users size={32} color="#ddc192" />
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, letterSpacing:"-0.3px" }}>Master Data Guru</h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.82)", fontSize:14, lineHeight:1.6, maxWidth:460 }}>
            Pusat registrasi dan kelola staf pengajar (Guru/Musyrif) di Pesantren Al-Imam. Atur biodata dan hak akses sistem.
          </p>
        </div>

        <div style={{ position:"relative", zIndex:1, display:"flex", gap:12, flexWrap:"wrap" }}>
          <button onClick={handleSync} disabled={isSyncing} style={{
            background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer",
            fontWeight:700, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)", transition:"all 0.2s", whiteSpace:"nowrap",
          }}>
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /> Sync SIMPEG
          </button>
          <button onClick={() => { setIsAdding(!isAdding); if (isAdding) { setEditingId(null); setForm(emptyForm); } }} style={{
            background:"#ddc192", color:"#3b0000", border:"none", cursor:"pointer",
            fontWeight:800, fontSize:14, padding:"12px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(221,193,146,0.3)", transition:"all 0.2s", whiteSpace:"nowrap",
          }}>
            {isAdding ? <X size={18} /> : <Plus size={18} />} {isAdding ? "Tutup Form" : "Tambah Guru"}
          </button>
        </div>
      </div>

      {/* ── Add Form ─────────────────────────────────────────────────────────── */}
      {isAdding && (
        <div style={{
          background:"#ecfdf5", borderRadius:20, padding:"28px 32px",
          border:"2px solid #a7f3d0", boxShadow:"0 4px 20px rgba(5,150,105,0.08)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <Sparkles size={20} color="#059669" />
            <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#059669" }}>
              {editingId ? "Form Edit Data Guru" : "Form Pendaftaran Guru Baru"}
            </h3>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16, alignItems:"flex-start" }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>NIK / Kode Identitas</label>
              <input type="text" className="form-control" placeholder="Kosong = Auto Generate" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Nama Lengkap & Gelar *</label>
              <input type="text" className="form-control" placeholder="Ust. Fulan, Lc." value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>No. WhatsApp</label>
              <input type="tel" className="form-control" placeholder="0812..." value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>Email Aktif</label>
              <input type="email" className="form-control" placeholder="fulan@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:6 }}>URL Foto Profil (Opsional)</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="text" className="form-control" placeholder="https://... /foto.jpg" value={form.foto_url || ""} onChange={e => setForm({ ...form, foto_url: e.target.value })} />
                {form.foto_url && (
                  <img src={form.foto_url} alt="Preview" style={{ width:36, height:36, borderRadius:10, objectFit:"cover", border:"1px solid #a7f3d0", flexShrink:0 }} />
                )}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", background:"#f8fafc", padding:20, borderRadius:16, border:"1px solid #e2e8f0" }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#334155", marginBottom:12 }}>Mata Pelajaran yang Diajarkan</label>
              
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                {(form.mata_pelajaran || "").split(",").map(s => s.trim()).filter(s => s).map((mapel, idx) => (
                  <div key={idx} style={{ background:"#ecfdf5", border:"1px solid #a7f3d0", color:"#047857", padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                    {mapel}
                    <button type="button" onClick={() => {
                      const currentList = (form.mata_pelajaran || "").split(",").map(s => s.trim()).filter(s => s);
                      currentList.splice(idx, 1);
                      setForm({ ...form, mata_pelajaran: currentList.join(", ") });
                    }} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#059669", padding:0, display:"flex" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {(form.mata_pelajaran || "").split(",").filter(s => s.trim()).length === 0 && (
                  <span style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>Belum ada mata pelajaran. Tambahkan di bawah.</span>
                )}
              </div>

              <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>Pilih Kelas/Jenjang</label>
                  <select className="form-control" value={newMapelClass} onChange={e => setNewMapelClass(e.target.value)}>
                    <option value="">-- Pilih --</option>
                    {kelasList.filter(k => k.nama && k.nama.trim() !== "").map(k => {
                      let tagPrefix = k.nama;
                      if (k.jenjang === "IL") tagPrefix = "IL";
                      else if (k.jenjang) tagPrefix = `${k.nama} ${k.jenjang}`;
                      
                      return (
                        <option key={k.id} value={k.id}>
                          {k.nama} {k.jenjang ? `(${k.jenjang})` : ""} 👉 [{tagPrefix}]
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div style={{ flex:2, minWidth:200 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#64748b", marginBottom:4 }}>Pilih Mata Pelajaran</label>
                  <select 
                    className="form-control" 
                    value={newMapelName} 
                    onChange={e => setNewMapelName(e.target.value)}
                    disabled={!newMapelClass}
                  >
                    <option value="">-- Pilih Mapel --</option>
                    {mapelList
                      .filter(m => m.kelas_id === newMapelClass)
                      .map(m => (
                        <option key={m.id} value={m.nama}>{m.nama}</option>
                      ))
                    }
                  </select>
                </div>
                <button type="button" onClick={handleAddMapel} disabled={!newMapelClass || !newMapelName.trim()} className="btn" style={{ background:"#3b82f6", color:"white", padding:"10px 16px", borderRadius:12, fontWeight:700 }}>
                  <Plus size={16} /> Tambah Mapel
                </button>
              </div>

              {/* Raw String Input (Optional/Hidden for Advanced Users) */}
              <div style={{ marginTop: 12 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#94a3b8", cursor:"pointer", width: "fit-content" }} onClick={() => setShowRawMapel(!showRawMapel)}>
                  {showRawMapel ? <EyeOff size={12} /> : <Eye size={12} />} Mode Edit Teks Manual
                </label>
                {showRawMapel && (
                  <input type="text" className="form-control" style={{ marginTop:6, fontSize:12 }} value={form.mata_pelajaran} onChange={e => setForm({ ...form, mata_pelajaran: e.target.value })} />
                )}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop:24, paddingTop:24, borderTop:"1px solid #d1fae5" }}>
            <label style={{ display:"block", fontSize:14, fontWeight:700, color:"#064e3b", marginBottom:12 }}>Hak Akses Sistem (Multi-Role)</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
              {[
                { value: "GURU", label: "Guru Mapel" },
                { value: "MUSYRIF", label: "Musyrif Halaqoh / Asrama" },
                { value: "WALI_KELAS", label: "Wali Kelas" },
                { value: "MUDIR", label: "Mudir Pesantren" },
                { value: "KEPALA_SEKOLAH", label: "Kepala Sekolah" },
                { value: "KABID_PENGASUHAN", label: "Kabid Pengasuhan" },
                { value: "KABID_ASRAMA", label: "Kabid Asrama" },
                { value: "KABID_KEDISIPLINAN", label: "Kabid Kedisiplinan" },
                { value: "KABID_KURIKULUM", label: "Kabid Kurikulum" },
                { value: "ADMIN_KEUANGAN", label: "Admin Keuangan" },
                { value: "ADMIN_SUPER", label: "Admin Super" },
              ].map(role => (
                <label key={role.value} style={{
                  display:"flex", alignItems:"center", gap:8, background:"white", padding:"8px 16px", borderRadius:12,
                  border:"1px solid #a7f3d0", cursor:"pointer", transition:"all 0.2s"
                }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#d1fae5"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                  <input type="checkbox" style={{ accentColor:"#059669" }} checked={form.roles.includes(role.value)} onChange={e => {
                    if (e.target.checked) setForm({ ...form, roles: [...form.roles, role.value] });
                    else {
                      // If unchecking WALI_KELAS, optionally clear wali_kelas_id
                      setForm({ ...form, roles: form.roles.filter(r => r !== role.value), ...(role.value === "WALI_KELAS" && { wali_kelas_id: "" }) });
                    }
                  }} />
                  <span style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{role.label}</span>
                </label>
              ))}
            </div>

            {/* Selector Kelas khusus jika WALI_KELAS dicentang */}
            {form.roles.includes("WALI_KELAS") && (
              <div style={{ marginTop: 20, padding: 16, background: "rgba(5, 150, 105, 0.05)", borderRadius: 12, border: "1px dashed #6ee7b7" }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#047857", marginBottom:8 }}>
                  Tugaskan sebagai Wali Kelas untuk:
                </label>
                <select 
                  className="form-control" 
                  value={form.wali_kelas_id} 
                  onChange={e => setForm({ ...form, wali_kelas_id: e.target.value })}
                  style={{ maxWidth: 300, background: "white", borderColor: "#a7f3d0" }}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList
                    .filter(k => k.nama && k.nama.trim() !== "")
                    .map(k => (
                    <option key={k.id} value={k.id}>
                      {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
                    </option>
                  ))}
                </select>
                <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#059669" }}>
                  * Mengatur ini akan memindahkan status Wali Kelas lama (jika ada) ke guru ini.
                </p>
              </div>
            )}
          </div>
          
          <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
            <button onClick={() => setIsAdding(false)} className="btn btn-ghost">Batal</button>
            <button onClick={handleSave} className="btn" style={{ background:"#059669", color:"white", fontWeight:700 }}>
              <Save size={16} /> Simpan Data
            </button>
          </div>
        </div>
      )}

      {/* ── Data Grid ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Memuat data guru...</div>
      ) : guru.length === 0 ? (
        <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>Belum ada data guru.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {guru.map(g => (
            <div key={g.id} style={{
              background: "white", borderRadius: 20, padding: 24,
              border: "1px solid #f1f5f9", boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 20,
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 24px rgba(5,150,105,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, background:"rgba(16,185,129,0.05)", borderRadius:"50%", pointerEvents:"none" }} />
              
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {g.foto_url ? (
                  <img
                    src={g.foto_url}
                    alt={g.nama_lengkap}
                    style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      border: "2px solid #ffffff"
                    }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: "linear-gradient(135deg, #7a0000 0%, #550000 100%)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, fontWeight: 800, boxShadow: "0 4px 12px rgba(85,0,0,0.3)"
                  }}>
                    {(formatName(g.nama_lengkap) || "G").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: "#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={formatName(g.nama_lengkap)}>
                    {formatName(g.nama_lengkap)}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                      {g.nik || "NO-ID"}
                    </span>
                    {g.mata_pelajaran && (
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", background: "#ecfdf5", color: "#059669", padding: "2px 6px", borderRadius: 6, border: "1px solid #a7f3d0", display:"flex", alignItems:"center", gap:4 }}>
                        <BookOpen size={10} /> {g.mata_pelajaran}
                      </span>
                    )}
                  </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8, alignItems: "center" }}>
                      {g.user?.role ? (
                        <>
                          {g.user.role.split(",").map((r: string, i: number) => (
                            <span key={i} style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5px", background:"#eff6ff", color:"#2563eb", padding:"2px 6px", borderRadius:4, border:"1px solid #bfdbfe" }}>
                              {r.trim().toUpperCase()}
                            </span>
                          ))}
                          
                          {/* TOMBOL LIHAT SANDI (KHUSUS ADMIN SUPER) */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
                            <button
                              title="Lihat Sandi"
                              onClick={() => setShowPwd(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", background: showPwd[g.id] ? "#fef2f2" : "#f1f5f9", color: showPwd[g.id] ? "#dc2626" : "#64748b", border: "1px solid", borderColor: showPwd[g.id] ? "#fecaca" : "#e2e8f0", padding: "2px 6px", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              {showPwd[g.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            {showPwd[g.id] && (
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#b91c1c", background: "#fef2f2", padding: "2px 6px", borderRadius: "4px", border: "1px dashed #fca5a5" }}>
                                {g.user.plain_password || "Tidak ada data sandi"}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5px", background:"#fef2f2", color:"#dc2626", padding:"2px 6px", borderRadius:4, border:"1px solid #fecaca" }}>NO ACCOUNT</span>
                      )}
                    </div>
                </div>
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, background: "#f8fafc", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Phone size={12} color="#94a3b8" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {g.no_hp || "Belum ada No. HP"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, background: "#f8fafc", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail size={12} color="#94a3b8" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {g.email || "Belum ada Email"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {g.foto_url && (
                    <a
                      href={g.foto_url}
                      download={`Foto_${formatName(g.nama_lengkap).replace(/\s+/g, '_')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download Foto Guru"
                      style={{
                        width: 32, height: 32, borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d1fae5"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ecfdf5"; }}
                    >
                      <Download size={14} />
                    </a>
                  )}
                  <button onClick={() => handleEdit(g)} title="Edit" style={{
                    width: 32, height: 32, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s"
                  }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef9c3"; (e.currentTarget as HTMLElement).style.borderColor = "#fcd34d"; (e.currentTarget as HTMLElement).style.color = "#92400e"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(g.id, g.nama_lengkap)} title="Hapus" style={{
                    width: 32, height: 32, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s"
                  }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
