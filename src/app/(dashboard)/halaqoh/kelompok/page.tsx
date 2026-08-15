"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, BookHeart, ArrowLeft, ChevronDown, ChevronUp, Search, Sun, Moon, Cloud, X, UserCheck } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  subuh:   { label: "Subuh",          icon: <Sun size={15} />,   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  maghrib: { label: "Ba'da Maghrib",  icon: <Moon size={15} />,  color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
  dhuha:   { label: "Dhuha",          icon: <Cloud size={15} />, color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" },
};

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
  kelas?: { nama: string } | null;
  pegawai?: { nama_lengkap: string };
  anggota: { id: string; santri: Santri; is_active: boolean }[];
}

export default function HalaqohKelompokPage() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddKelompok, setShowAddKelompok] = useState(false);
  const [addSantriFor, setAddSantriFor] = useState<string | null>(null);
  const [searchSantri, setSearchSantri] = useState("");
  const [saving, setSaving] = useState(false);

  const [formKelompok, setFormKelompok] = useState({
    nama_kelompok: "",
    sesi: "subuh",
    kelas_id: "",
  });

  const [profile, setProfile] = useState<any>(null);

  const canManage = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("kabid_pengasuhan");
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, sRes, pRes] = await Promise.all([
        fetch("/api/halaqoh/kelompok"),
        fetch("/api/halaqoh/master"),
        fetch("/api/profile"),
      ]);
      const kData = await kRes.json();
      const sData = await sRes.json();
      const pData = await pRes.json();
      setKelompokList(Array.isArray(kData) ? kData : kData.kelompok || []);
      setAllSantri(sData.santri || []);
      setProfile(pData?.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddKelompok = async () => {
    if (!formKelompok.nama_kelompok || !formKelompok.sesi) return;
    setSaving(true);
    try {
      const res = await fetch("/api/halaqoh/kelompok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formKelompok),
      });
      if (res.ok) {
        setShowAddKelompok(false);
        setFormKelompok({ nama_kelompok: "", sesi: "subuh", kelas_id: "" });
        fetchAll();
        Swal.fire({ title: "Berhasil", text: "Kelompok baru telah dibuat.", icon: "success", confirmButtonColor: "#550000" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKelompok = async (id: string, nama: string) => {
    const confirm = await Swal.fire({
      title: "Hapus Kelompok?",
      text: `Yakin hapus kelompok ${nama}? Semua keanggotaan akan terlepas.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/halaqoh/kelompok?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAll();
        Swal.fire({ title: "Terhapus", text: "Kelompok berhasil dihapus.", icon: "success", confirmButtonColor: "#550000" });
      }
    } catch {
      Swal.fire({ title: "Error", text: "Gagal menghapus kelompok.", icon: "error", confirmButtonColor: "#550000" });
    }
  };

  const handleAddSantri = async (kelompokId: string, santriId: string) => {
    try {
      const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santri_id: santriId }),
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSantri = async (kelompokId: string, santriId: string) => {
    try {
      const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota?santri_id=${santriId}`, { method: "DELETE" });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 13, border: "1.5px solid #e2e8f0",
    padding: "11px 14px", fontSize: 13, fontWeight: 600, outline: "none",
    background: "#fdf8f0", color: "#1e293b",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 800, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
  };

  return (
    <div className="page-container">
      {/* ── BACK BUTTON ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/halaqoh"
          style={{
            width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0",
            borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Kembali ke Halaqoh</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="hero-banner">
        <div style={{ position: "absolute", top: 0, right: 0, width: 256, height: 256, background: "rgba(221, 193, 146, 0.15)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(30%, -50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 192, height: 192, background: "rgba(221, 193, 146, 0.1)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(-25%, 50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(221, 193, 146, 0.18)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(221, 193, 146, 0.4)", width: "fit-content", marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ddc192", boxShadow: "0 0 6px rgba(221, 193, 146, 0.9)" }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Manajemen Halaqoh</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
            <Users size={26} color="#ddc192" /> Kelompok Halaqoh
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: 14, margin: "6px 0 0" }}>
            Kelola kelompok dan anggota halaqoh pengampu
          </p>
        </div>

        {canManage() && (
          <div style={{ position: "relative", zIndex: 2 }}>
            <button
              onClick={() => setShowAddKelompok(true)}
              style={{
                background: "#550000", color: "white", padding: "11px 22px",
                borderRadius: 14, border: "1px solid #ddc192", fontWeight: 800, fontSize: 14,
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(85,0,0,0.3)",
              }}
            >
              <Plus size={18} color="#ddc192" /> Buat Kelompok
            </button>
          </div>
        )}
      </div>

      {/* ── KELOMPOK LIST CARDS ── */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {kelompokList.map(k => {
            const sesiInfo = SESI_INFO[k.sesi] || SESI_INFO.subuh;
            const isExpanded = expandedId === k.id;
            const isAdding = addSantriFor === k.id;
            const memberIds = new Set(k.anggota.map(a => a.santri?.id).filter(Boolean));
            const availableSantri = allSantri.filter(s =>
              !memberIds.has(s.id) &&
              (searchSantri === "" || s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()) || (s.nis || "").includes(searchSantri))
            );

            return (
              <div
                key={k.id}
                style={{
                  background: "white", borderRadius: 20,
                  border: "1.5px solid #e8d5b7",
                  boxShadow: "0 2px 12px rgba(85,0,0,0.04)",
                  overflow: "hidden", transition: "all 0.2s",
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    padding: "20px 24px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: 12, cursor: "pointer",
                    background: isExpanded ? "#fdf8f0" : "white",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : k.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, background: sesiInfo.bg, color: sesiInfo.color, borderRadius: 14, border: `1px solid ${sesiInfo.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sesiInfo.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: "#1e293b", fontSize: 16 }}>{k.nama_kelompok}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2, fontSize: 12, color: "#64748b" }}>
                        <span style={{ fontWeight: 700, color: sesiInfo.color }}>Sesi {sesiInfo.label}</span>
                        <span>·</span>
                        <span style={{ fontWeight: 600 }}>{k.anggota.length} Santri</span>
                        {k.pegawai?.nama_lengkap && <><span>·</span><span>Pengampu: {k.pegawai.nama_lengkap}</span></>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={e => e.stopPropagation()}>
                    {canManage() && (
                      <button
                        onClick={() => handleDeleteKelompok(k.id, k.nama_kelompok)}
                        title="Hapus Kelompok"
                        style={{ width: 36, height: 36, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : k.id)}
                      style={{ width: 36, height: 36, background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Member List */}
                {isExpanded && (
                  <div style={{ borderTop: "1.5px solid #f1f5f9", padding: "20px 24px", background: "white" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontWeight: 800, color: "#550000", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Daftar Santri Anggota ({k.anggota.length})
                      </div>
                      <button
                        onClick={() => setAddSantriFor(isAdding ? null : k.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#550000", color: "white", padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        <Plus size={14} /> Tambah Santri
                      </button>
                    </div>

                    {/* Add Santri Form */}
                    {isAdding && (
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>PILIH SANTRI UNTUK DITAMBAHKAN</span>
                          <button onClick={() => setAddSantriFor(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                        <div style={{ position: "relative", marginBottom: 8 }}>
                          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="text"
                            placeholder="Cari nama santri..."
                            value={searchSantri}
                            onChange={e => setSearchSantri(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: 32, background: "white" }}
                          />
                        </div>
                        <div className="custom-scrollbar" style={{ maxHeight: 180, overflowY: "auto" }}>
                          {availableSantri.slice(0, 15).map(s => (
                            <div
                              key={s.id}
                              style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>NIS: {s.nis || "—"} · {s.kelas?.nama}</div>
                              </div>
                              <button
                                onClick={() => handleAddSantri(k.id, s.id)}
                                style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                + Tambah
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Grid */}
                    {k.anggota.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Belum ada santri di dalam kelompok ini.</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        {k.anggota.map((a, idx) => (
                          <div
                            key={a.id}
                            style={{
                              padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0",
                              background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 30, height: 30, background: "#f1f5f9", color: "#550000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                {idx + 1}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13 }}>{a.santri?.nama_lengkap}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>
                                  {a.santri?.kelas?.nama ? `Kelas ${a.santri.kelas.nama}` : (a.santri?.nis ? `NIS: ${a.santri.nis}` : "")}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSantri(k.id, a.santri?.id)}
                              title="Lepas dari kelompok"
                              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL BUAT KELOMPOK ── */}
      {showAddKelompok && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: 24, boxShadow: "0 25px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 460, overflow: "hidden" }}>
            <div style={{ background: "#550000", padding: "20px 24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>Buat Kelompok Halaqoh Baru</h3>
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
            </div>
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1.5px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowAddKelompok(false)} style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Batal</button>
              <button
                onClick={handleAddKelompok}
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
