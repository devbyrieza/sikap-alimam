"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldOff, Users, Search, RefreshCw, CreditCard, CheckCircle2, Lock } from "lucide-react";

interface WaliSantri {
  id: string;
  nama: string;
  email: string;
  is_active: boolean;
  spp_access_blocked: boolean;
  spp_blocked_reason: string | null;
  orang_tua: {
    santri: { nama_lengkap: string; nis: string; kelas: { nama: string } | null } | null;
  }[];
}

export default function SppAccessPage() {
  const [waliList, setWaliList] = useState<WaliSantri[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBlokir, setFilterBlokir] = useState<"semua" | "diblokir" | "aktif">("semua");
  const [saving, setSaving] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{ wali: WaliSantri; action: "blokir" | "aktifkan" } | null>(null);
  const [alasan, setAlasan] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/keuangan/spp-access");
      const data = await res.json();
      setWaliList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async () => {
    if (!modalData) return;
    const { wali, action } = modalData;
    setSaving(wali.id);
    try {
      await fetch("/api/keuangan/spp-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: wali.id,
          spp_access_blocked: action === "blokir",
          spp_blocked_reason: action === "blokir" ? alasan : null,
        }),
      });
      setModalData(null);
      setAlasan("");
      await fetchData();
    } finally {
      setSaving(null);
    }
  };

  const filtered = waliList.filter(w => {
    const q = search.toLowerCase();
    const matchSearch =
      w.nama.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.orang_tua.some(o => o.santri?.nama_lengkap.toLowerCase().includes(q));
    const matchFilter =
      filterBlokir === "semua" ||
      (filterBlokir === "diblokir" && w.spp_access_blocked) ||
      (filterBlokir === "aktif" && !w.spp_access_blocked);
    return matchSearch && matchFilter;
  });

  const totalBlokir = waliList.filter(w => w.spp_access_blocked).length;
  const totalAktif = waliList.filter(w => !w.spp_access_blocked).length;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)", color: "white",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(85,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10 }}>
            <CreditCard size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Kelola Akses SPP Wali Santri</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.8 }}>
              Blokir atau aktifkan akses SIKAP berdasarkan status pembayaran SPP
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Wali Santri", val: waliList.length, color: "#0284c7", bg: "#f0f9ff" },
          { label: "Akses Aktif", val: totalAktif, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Akses Diblokir", val: totalBlokir, color: "#dc2626", bg: "#fef2f2" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.color}30`, borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{
        background: "white", borderRadius: 16, padding: "14px 18px", border: "1.5px solid #e2e8f0",
        marginBottom: 20, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12
      }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama wali, email, atau nama santri..."
            style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["semua", "aktif", "diblokir"] as const).map(f => (
            <button key={f} onClick={() => setFilterBlokir(f)} style={{
              padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              background: filterBlokir === f ? "#550000" : "#f1f5f9",
              color: filterBlokir === f ? "white" : "#64748b"
            }}>
              {f === "semua" ? "Semua" : f === "aktif" ? <><CheckCircle2 size={14} /> Aktif</> : <><Lock size={14} /> Diblokir</>}
            </button>
          ))}
        </div>
        <button onClick={fetchData} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>
          <RefreshCw size={14} color="#64748b" />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <Users size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
            <div>Tidak ada data Wali Santri</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>No</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Nama Wali</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Santri</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Keterangan Blokir</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Status Akses</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, idx) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{w.nama}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{w.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {w.orang_tua.length > 0 ? w.orang_tua.map((o, i) => (
                      <div key={i} style={{ marginBottom: i < w.orang_tua.length - 1 ? 4 : 0 }}>
                        <div style={{ fontWeight: 600, color: "#334155", fontSize: 12 }}>{o.santri?.nama_lengkap || "-"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{o.santri?.kelas?.nama || "-"} · {o.santri?.nis || "-"}</div>
                      </div>
                    )) : <span style={{ fontSize: 12, color: "#94a3b8" }}>-</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {w.spp_blocked_reason ? (
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{w.spp_blocked_reason}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {w.spp_access_blocked ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        <Lock size={11} /> Diblokir
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                        <CheckCircle2 size={11} /> Aktif
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {w.spp_access_blocked ? (
                      <button
                        onClick={() => { setModalData({ wali: w, action: "aktifkan" }); setAlasan(""); }}
                        disabled={saving === w.id}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#16a34a", color: "white", border: "none",
                          borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700
                        }}
                      >
                        <ShieldCheck size={13} /> Aktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => { setModalData({ wali: w, action: "blokir" }); setAlasan(""); }}
                        disabled={saving === w.id}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#dc2626", color: "white", border: "none",
                          borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700
                        }}
                      >
                        <ShieldOff size={13} /> Blokir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalData && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                background: modalData.action === "blokir" ? "#fef2f2" : "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {modalData.action === "blokir"
                  ? <ShieldOff size={24} color="#dc2626" />
                  : <ShieldCheck size={24} color="#16a34a" />}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
                {modalData.action === "blokir" ? "Blokir Akses SIKAP?" : "Aktifkan Akses SIKAP?"}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Wali Santri: <strong>{modalData.wali.nama}</strong>
              </p>
            </div>

            {modalData.action === "blokir" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Alasan Pemblokiran (wajib diisi)
                </label>
                <input
                  type="text"
                  value={alasan}
                  onChange={e => setAlasan(e.target.value)}
                  placeholder="cth: SPP Agustus 2026 belum lunas"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setModalData(null)}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#64748b" }}
              >
                Batal
              </button>
              <button
                onClick={handleToggle}
                disabled={modalData.action === "blokir" && !alasan.trim()}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "white",
                  background: modalData.action === "blokir" ? "#dc2626" : "#16a34a",
                  opacity: modalData.action === "blokir" && !alasan.trim() ? 0.5 : 1
                }}
              >
                {modalData.action === "blokir" ? "Ya, Blokir Akses" : "Ya, Aktifkan Akses"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
