"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, BookHeart, ArrowLeft, ChevronDown, ChevronUp, Search, Sun, Moon, Cloud, X, UserCheck, Edit2 } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  subuh:   { label: "Subuh",          icon: <Sun size={15} />,   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  maghrib: { label: "Ba'da Maghrib",  icon: <Moon size={15} />,  color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
  dhuha:   { label: "Dhuha",          icon: <Cloud size={15} />, color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" } };

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
  kelas?: { nama: string };
}

interface Kelompok {
  id: string;
  nama_kelompok: string;
  sesi: string;
  pegawai_id: string;
  kelas?: { nama: string } | null;
  pegawai?: { nama_lengkap: string };
  anggota: { id: string; santri: Santri; is_active: boolean }[];
}

interface Guru {
  id: string;
  nama_lengkap: string;
}

export default function HalaqohKelompokPage() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [showAddKelompok, setShowAddKelompok] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [addSantriFor, setAddSantriFor] = useState<string | null>(null);
  const [searchSantri, setSearchSantri] = useState("");
  const [saving, setSaving] = useState(false);

  const [formKelompok, setFormKelompok] = useState({
    id: "",
    nama_kelompok: "",
    sesi: "subuh",
    pegawai_id: "",
    kelas_id: "" });

  const [profile, setProfile] = useState<any>(null);

  const canManage = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("kadiv_pengasuhan");
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, sRes, pRes, gRes] = await Promise.all([
        fetch("/api/halaqoh/kelompok"),
        fetch("/api/halaqoh/master"),
        fetch("/api/profile"),
        fetch("/api/master/guru")
      ]);
      const kData = await kRes.json();
      const sData = await sRes.json();
      const pData = await pRes.json();
      const gData = await gRes.json();

      setKelompokList(Array.isArray(kData) ? kData : (kData.kelompok || []));
      setAllSantri(sData.santriAktif || []);
      setProfile(pData.user || pData.pegawai || pData);
      setGuruList(Array.isArray(gData) ? gData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveKelompok = async () => {
    if (!formKelompok.nama_kelompok || !formKelompok.sesi || !formKelompok.pegawai_id) {
      Swal.fire({ title: "Oops!", text: "Nama kelompok, sesi, dan pengampu wajib diisi.", icon: "error" });
      return;
    }
    setSaving(true);
    try {
      const url = "/api/halaqoh/kelompok";
      const method = editMode ? "PUT" : "POST";
      const payload = {
         ...(editMode && { id: formKelompok.id }),
         nama_kelompok: formKelompok.nama_kelompok,
         sesi: formKelompok.sesi,
         pegawai_id: formKelompok.pegawai_id
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) });
      if (res.ok) {
        setShowAddKelompok(false);
        setFormKelompok({ id: "", nama_kelompok: "", sesi: "subuh", pegawai_id: "", kelas_id: "" });
        fetchAll();
        Swal.fire({ title: "Berhasil", text: editMode ? "Kelompok diperbarui." : "Kelompok baru dibuat.", icon: "success", confirmButtonColor: "#550000" });
      } else {
        Swal.fire({ title: "Gagal", text: "Terjadi kesalahan sistem.", icon: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (k: Kelompok) => {
    setFormKelompok({
      id: k.id,
      nama_kelompok: k.nama_kelompok,
      sesi: k.sesi,
      pegawai_id: k.pegawai_id || "",
      kelas_id: ""
    });
    setEditMode(true);
    setShowAddKelompok(true);
  };

  const openCreateModal = () => {
    setFormKelompok({ id: "", nama_kelompok: "", sesi: "subuh", pegawai_id: "", kelas_id: "" });
    setEditMode(false);
    setShowAddKelompok(true);
  };

  const handleDeleteKelompok = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: "Hapus Kelompok?",
      text: `Yakin hapus kelompok ${nama}? Semua keanggotaan akan terlepas.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/halaqoh/kelompok?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAll();
        Swal.fire({ title: "Terhapus", text: "Kelompok berhasil dihapus.", icon: "success", confirmButtonColor: "#550000" });
      }
    } catch(e) {}
  };

  const handleAddSantri = async (kelompokId: string, santriId: string) => {
    const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ santri_id: santriId }) });
    if (res.ok) { fetchAll(); setSearchSantri(""); }
  };

  const handleRemoveSantri = async (kelompokId: string, santriId: string) => {
    const confirm = await Swal.fire({ title: "Keluarkan Santri?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Ya, Keluarkan" });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota?santri_id=${santriId}`, { method: "DELETE" });
    if (res.ok) fetchAll();
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, outline: "none", transition: "border-color 0.2s" };
  const labelStyle = { display: "block", marginBottom: 6, fontSize: 12, fontWeight: 800, color: "#1e293b", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

  return (
    <div className="page-container">
      {/* 🚀 HEADER 🚀 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/halaqoh"
            style={{ width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
          ><ArrowLeft size={18} /></Link>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#1e293b" }}>Kelompok Halaqoh</h1>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 4 }}>Manajemen anggota dan kelompok tahfidz</div>
          </div>
        </div>

        {canManage() && (
          <div style={{ position: "relative", zIndex: 2 }}>
            <button
              onClick={openCreateModal}
              style={{
                background: "#550000", color: "white", padding: "11px 22px",
                borderRadius: 14, border: "1px solid #ddc192", fontWeight: 800, fontSize: 14,
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(85,0,0,0.3)" }}
            >
              <Plus size={18} color="#ddc192" /> Buat Kelompok
            </button>
          </div>
        )}
      </div>

      {/* 🚀 KELOMPOK LIST CARDS 🚀 */}
      {loading ? (
        <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontWeight: 600, color: "#94a3b8" }}>Memuat kelompok halaqoh...</div>
        </div>
      ) : kelompokList.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0" }}>
          <BookHeart size={36} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Belum ada kelompok halaqoh.</div>
          {canManage() && <div style={{ fontSize: 12, color: "#94a3b8" }}>Klik tombol "Buat Kelompok" di atas untuk menambahkan.</div>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
          {kelompokList.map(k => {
            const isExpanded = expandedId === k.id;
            const isAdding = addSantriFor === k.id;
            const sesiConfig = SESI_INFO[k.sesi] || SESI_INFO.subuh;
            const unassignedSantri = allSantri
              .filter(s => !k.anggota.find(a => a.santri?.id === s.id))
              .filter(s => s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()));

            return (
              <div key={k.id} style={{ background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", overflow: "hidden", transition: "all 0.3s ease" }}>
                <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : k.id)}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: sesiConfig.bg, color: sesiConfig.color, border: `1px solid ${sesiConfig.border}`, marginBottom: 8 }}>
                      {sesiConfig.icon} {sesiConfig.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>{k.nama_kelompok}</div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <UserCheck size={14} /> {k.pegawai?.nama_lengkap || "Belum ada pengampu"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#550000", background: "#fff5f5", padding: "4px 10px", borderRadius: 8 }}>
                      {k.anggota.length} Santri
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1.5px solid #f1f5f9", padding: "20px 24px", background: "white" }}>
                    
                    {/* Toolbar Kelompok (Edit/Hapus) */}
                    {canManage() && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <button
                          onClick={() => setAddSantriFor(isAdding ? null : k.id)}
                          style={{ flex: 1, display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 6, background: "#550000", color: "white", padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                        ><Plus size={14} /> Tambah Santri</button>
                        
                        <button
                          onClick={() => handleEditClick(k)}
                          style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 6, background: "#f8fafc", color: "#1e293b", padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1.5px solid #e2e8f0", cursor: "pointer" }}
                        ><Edit2 size={14} /> Edit</button>

                        <button
                          onClick={() => handleDeleteKelompok(k.id, k.nama_kelompok)}
                          style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 6, background: "#fff1f2", color: "#e11d48", padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1.5px solid #fecdd3", cursor: "pointer" }}
                        ><Trash2 size={14} /></button>
                      </div>
                    )}

                    {/* Add Santri Form */}
                    {canManage() && isAdding && (
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>PILIH SANTRI</span>
                          <button onClick={() => setAddSantriFor(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ position: "relative", marginBottom: 12 }}>
                          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="text"
                            placeholder="Cari nama santri..."
                            value={searchSantri}
                            onChange={e => setSearchSantri(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: 32, background: "white" }}
                          />
                        </div>
                        <div style={{ maxHeight: 180, overflowY: "auto", background: "white", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                          {unassignedSantri.slice(0, 20).map(s => (
                            <div key={s.id}
                              style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            >
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{s.kelas?.nama}</div>
                              </div>
                              <button
                                onClick={() => handleAddSantri(k.id, s.id)}
                                style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >Pilih</button>
                            </div>
                          ))}
                          {unassignedSantri.length === 0 && (
                            <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>Santri tidak ditemukan</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Member List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {k.anggota.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Belum ada santri di dalam kelompok ini.</div>
                      ) : k.anggota.map(a => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                              {(a.santri?.nama_lengkap || "?").charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{a.santri?.nama_lengkap}</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{a.santri?.kelas?.nama}</div>
                            </div>
                          </div>
                          {canManage() && (
                            <button
                              onClick={() => handleRemoveSantri(k.id, a.santri?.id)}
                              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                            ><X size={16} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🚀 MODAL BUAT / EDIT KELOMPOK 🚀 */}
      {showAddKelompok && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: 24, boxShadow: "0 25px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 460, overflow: "hidden" }}>
            <div style={{ background: "#550000", padding: "20px 24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>{editMode ? "Edit Kelompok Halaqoh" : "Buat Kelompok Halaqoh Baru"}</h3>
              <button onClick={() => setShowAddKelompok(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nama Kelompok</label>
                <input
                  type="text"
                  placeholder="Cth: Halaqoh Ust. Iqbal (MTS)"
                  value={formKelompok.nama_kelompok}
                  onChange={e => setFormKelompok({ ...formKelompok, nama_kelompok: e.target.value })}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div>
                <label style={labelStyle}>Sesi Halaqoh</label>
                <select
                  value={formKelompok.sesi}
                  onChange={e => setFormKelompok({ ...formKelompok, sesi: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <option value="subuh">Sesi Subuh</option>
                  <option value="dhuha">Sesi Dhuha</option>
                  <option value="maghrib">Sesi Ba'da Maghrib</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Pengampu Halaqoh</label>
                <select
                  value={formKelompok.pegawai_id}
                  onChange={e => setFormKelompok({ ...formKelompok, pegawai_id: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <option value="" disabled>-- Pilih Pengampu --</option>
                  {guruList.map(g => (
                    <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1.5px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowAddKelompok(false)} style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Batal</button>
              <button
                onClick={handleSaveKelompok}
                disabled={saving}
                style={{ padding: "10px 22px", borderRadius: 12, border: "none", background: "#550000", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(85,0,0,0.25)" }}
              >
                {saving ? "Menyimpan..." : "Simpan Kelompok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}