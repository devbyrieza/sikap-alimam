"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, BookHeart, ArrowLeft, ChevronDown, ChevronUp, Search, Sun, Moon, Cloud, Edit2, Check, X } from "lucide-react";
import Link from "next/link";

const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  subuh:   { label: "Subuh",          icon: <Sun size={15} />,   color: "#d97706", bg: "#fffbeb" },
  maghrib: { label: "Ba'da Maghrib",  icon: <Moon size={15} />,  color: "#7c3aed", bg: "#f5f3ff" },
  dhuha:   { label: "Dhuha",          icon: <Cloud size={15} />, color: "#0284c7", bg: "#eff6ff" },
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
    return role.includes("admin_super") || role.includes("mudir") || role.includes("kabid_pengasuhan");
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
        await fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnggota = async (kelompokId: string, santriId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santri_id: santriId }),
      });
      if (res.ok) {
        setAddSantriFor(null);
        setSearchSantri("");
        await fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAnggota = async (kelompokId: string, santriId: string) => {
    if (!confirm("Hapus santri dari kelompok ini?")) return;
    await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota?santri_id=${santriId}`, {
      method: "DELETE",
    });
    await fetchAll();
  };

  const filteredSantri = (kelompokId: string) => {
    const kelompok = kelompokList.find(k => k.id === kelompokId);
    const sudahAdaIds = new Set(kelompok?.anggota.map(a => a.santri.id) || []);
    return allSantri.filter(s =>
      !sudahAdaIds.has(s.id) &&
      (searchSantri === "" || s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()) ||
        (s.nis || "").toLowerCase().includes(searchSantri.toLowerCase()))
    );
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/halaqoh" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Kembali ke Halaqoh
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
              <BookHeart size={22} color="#550000" /> Kelompok Halaqoh
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>Kelola kelompok dan anggota halaqoh pengampu</p>
          </div>
          <button
            onClick={() => setShowAddKelompok(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "#550000", color: "white",
              border: "none", borderRadius: 12, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13
            }}
          >
            <Plus size={16} /> Buat Kelompok
          </button>
        </div>
      </div>

      {/* Form Tambah Kelompok */}
      {showAddKelompok && (
        <div style={{
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 24,
          marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Buat Kelompok Baru</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Nama Kelompok *</label>
              <input
                type="text"
                value={formKelompok.nama_kelompok}
                onChange={e => setFormKelompok(f => ({ ...f, nama_kelompok: e.target.value }))}
                placeholder="Cth: Kelompok A Subuh MTs"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Sesi *</label>
              <select
                value={formKelompok.sesi}
                onChange={e => setFormKelompok(f => ({ ...f, sesi: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", background: "white" }}
              >
                <option value="subuh">Subuh (04.50–06.10)</option>
                <option value="maghrib">Ba'da Maghrib</option>
                <option value="dhuha">Dhuha (07.00–08.20)</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowAddKelompok(false)}
              style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}
            >
              Batal
            </button>
            <button
              onClick={handleAddKelompok}
              disabled={saving || !formKelompok.nama_kelompok}
              style={{
                padding: "9px 18px", borderRadius: 10, border: "none", background: "#550000", color: "white",
                cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? "Menyimpan..." : "Buat Kelompok"}
            </button>
          </div>
        </div>
      )}

      {/* Daftar Kelompok */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Memuat data kelompok...</div>
      ) : kelompokList.length === 0 ? (
        <div style={{
          background: "white", border: "1.5px dashed #e2e8f0", borderRadius: 18,
          padding: 48, textAlign: "center", color: "#94a3b8"
        }}>
          <BookHeart size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Belum ada kelompok halaqoh</div>
          <div style={{ fontSize: 13 }}>Klik "Buat Kelompok" untuk memulai</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {kelompokList.map(kelompok => {
            const sesiInfo = SESI_INFO[kelompok.sesi] || SESI_INFO.subuh;
            const isExpanded = expandedId === kelompok.id;
            const isAddingHere = addSantriFor === kelompok.id;

            return (
              <div key={kelompok.id} style={{
                background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18,
                overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}>
                {/* Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : kelompok.id)}
                  style={{ display: "flex", alignItems: "center", padding: "16px 20px", cursor: "pointer", gap: 14 }}
                >
                  <div style={{
                    background: sesiInfo.bg, color: sesiInfo.color, borderRadius: 10, padding: 8,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {sesiInfo.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{kelompok.nama_kelompok}</div>
                    <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 10, marginTop: 2 }}>
                      <span style={{ background: sesiInfo.bg, color: sesiInfo.color, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                        {sesiInfo.label}
                      </span>
                      <span><Users size={11} style={{ display: "inline", marginRight: 3 }} />{kelompok.anggota?.length || 0} santri</span>
                      {kelompok.kelas && <span>· {kelompok.kelas.nama}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                </div>

                {/* Expanded: Daftar Anggota */}
                {isExpanded && (
                  <div style={{ padding: "0 20px 20px 20px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ padding: "14px 0 10px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Daftar Anggota
                      </span>
                      {canManage() && (
                        <button
                          onClick={() => { setAddSantriFor(isAddingHere ? null : kelompok.id); setSearchSantri(""); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
                            border: "1px solid #e2e8f0", color: "#475569", padding: "6px 12px",
                            borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600
                          }}
                        >
                          {isAddingHere ? <X size={12} /> : <Plus size={12} />}
                          {isAddingHere ? "Batal" : "Tambah Santri"}
                        </button>
                      )}
                    </div>

                    {/* Search Santri */}
                    {isAddingHere && canManage() && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ position: "relative", marginBottom: 8 }}>
                          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                          <input
                            autoFocus
                            type="text"
                            value={searchSantri}
                            onChange={e => setSearchSantri(e.target.value)}
                            placeholder="Cari nama atau NIS santri..."
                            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                          {filteredSantri(kelompok.id).slice(0, 30).map(santri => (
                            <div
                              key={santri.id}
                              onClick={() => handleAddAnggota(kelompok.id, santri.id)}
                              style={{
                                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                borderBottom: "1px solid #f8fafc", transition: "background 0.1s"
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                              onMouseLeave={e => (e.currentTarget.style.background = "white")}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: "#1e293b" }}>{santri.nama_lengkap}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{santri.nis} · {santri.kelas?.nama}</div>
                              </div>
                              <Plus size={14} color="#550000" />
                            </div>
                          ))}
                          {filteredSantri(kelompok.id).length === 0 && (
                            <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                              {searchSantri ? "Tidak ditemukan" : "Semua santri sudah ditambahkan"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Anggota List */}
                    {kelompok.anggota.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>
                        Belum ada anggota. Tambahkan santri ke kelompok ini.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                        {kelompok.anggota.map(anggota => (
                          <div key={anggota.id} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "#f8fafc", borderRadius: 10, padding: "8px 12px", border: "1px solid #f1f5f9"
                          }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{anggota.santri.nama_lengkap}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{anggota.santri.nis || "—"}</div>
                            </div>
                            {canManage() && (
                              <button
                                onClick={() => handleRemoveAnggota(kelompok.id, anggota.santri.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}
                                title="Hapus dari kelompok"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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
    </div>
  );
}
