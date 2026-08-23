"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Plus, X, Save, AlertCircle, FileText, Trash2, User, BookOpen, BookHeart } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QURAN_SURAH } from "@/lib/quran";
import Swal from "sweetalert2";

export default function TahfidzDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const initialType = searchParams.get("type") || "ziyadah";

  const [records, setRecords] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<{
    tanggal: string;
    jenis: string;
    surat_dari: string;
    ayat_dari: number;
    surat_ke: string;
    ayat_ke: string | number;
    halaman: string;
    nilai: string;
    keterangan: string;
  }>({
    tanggal: new Date().toISOString().split("T")[0],
    jenis: initialType,
    surat_dari: "Al-Fatihah",
    ayat_dari: 1,
    surat_ke: "",
    ayat_ke: "",
    halaman: "",
    nilai: "",
    keterangan: "" });

  const [suratDariVerses, setSuratDariVerses] = useState<number>(7);
  const [suratKeVerses, setSuratKeVerses] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>("");

  // Modal scroll lock
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showModal]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.data?.role) setUserRole(d.data.role);
    }).catch(() => {});
  }, []);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tahfidz/mutabaah/${santriId}`);
      const data = await res.json();
      setRecords(data);
      if (data.length > 0) {
        setStudentInfo(data[0].santri);
      } else {
        const listRes = await fetch("/api/tahfidz/mutabaah");
        const listData = await listRes.json();
        const std = listData.find((s: any) => s.id === santriId);
        if (std) setStudentInfo(std);
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  }, [santriId]);

  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  useEffect(() => {
    const s = QURAN_SURAH.find(item => item.name === form.surat_dari);
    setSuratDariVerses(s ? s.numberOfVerses : 7);
    setForm(prev => ({ ...prev, ayat_dari: 1 }));
  }, [form.surat_dari]);

  useEffect(() => {
    if (form.surat_ke) {
      const s = QURAN_SURAH.find(item => item.name === form.surat_ke);
      setSuratKeVerses(s ? s.numberOfVerses : 0);
      setForm(prev => ({ ...prev, ayat_ke: 1 }));
    } else {
      setSuratKeVerses(0);
      setForm(prev => ({ ...prev, ayat_ke: "" }));
    }
  }, [form.surat_ke]);

  const handleDelete = async (id: string, detailStr: string) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hapus Mutabaah?",
      text: `Yakin ingin menghapus rekam ${detailStr}?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b" });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/tahfidz/mutabaah/hapus/${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
          fetchStudentData();
        } else {
          Swal.fire("Gagal", "Gagal menghapus data.", "error");
        }
      } catch {
        Swal.fire("Error", "Terjadi kesalahan server.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tahfidz/mutabaah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: santriId,
          ...form,
          ayat_dari: String(form.ayat_dari),
          ayat_ke: form.ayat_ke ? String(form.ayat_ke) : null,
          surat_ke: form.surat_ke || null }) });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        await fetchStudentData();
        Swal.fire({ title: "Berhasil", text: "Catatan Tahfidz berhasil disimpan.", icon: "success", confirmButtonColor: "#550000" });
      } else {
        Swal.fire({ title: "Gagal", text: data.error || "Gagal menyimpan.", icon: "error", confirmButtonColor: "#550000" });
      }
    } catch {
      Swal.fire({ title: "Gagal", text: "Terjadi kesalahan koneksi.", icon: "error", confirmButtonColor: "#550000" });
    }
  };

  const jenisColor: Record<string, { bg: string; color: string; border: string }> = {
    ziyadah: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    murojaah: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    tilawah: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" } };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 12, border: "1.5px solid #e2e8f0",
    padding: "10px 14px", fontSize: 14, outline: "none",
    fontFamily: "inherit", color: "#1e293b", background: "#f8fafc",
    transition: "border-color 0.2s" };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 800, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 };

  return (
    <div className="page-container">
      {/* ── BACK HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => router.push("/tahfidz/mutabaah")}
          style={{
            width: 44, height: 44, background: "white",
            border: "1.5px solid #e2e8f0", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", cursor: "pointer", flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)", transition: "all 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLElement).style.transform = "translateX(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tahfidz · Mutabaah</span>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", margin: "2px 0 0", lineHeight: 1.2 }}>Detail Perkembangan Santri</h2>
        </div>
      </div>

      {/* ── STUDENT HERO CARD ── */}
      {studentInfo && (
        <div className="hero-banner" style={{ padding: "28px 36px" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 60, height: 60, background: "rgba(255,255,255,0.12)", borderRadius: 18, border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#fcd34d", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Nama Santri</div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{studentInfo.nama_lengkap}</h1>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "3px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>
                  NIS: {studentInfo.nis || "—"}
                </span>
                <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "3px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>
                  Kelas: {studentInfo.kelas?.nama || studentInfo.kelas || "—"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setForm(prev => ({ ...prev, jenis: initialType })); setShowModal(true); }}
            style={{
              position: "relative", zIndex: 1,
              background: "#f59e0b", color: "#451a03",
              padding: "13px 22px", borderRadius: 14,
              fontWeight: 800, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, boxShadow: "0 6px 18px rgba(245,158,11,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
              whiteSpace: "nowrap", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(245,158,11,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(245,158,11,0.4)"; }}
          >
            <Plus size={20} /> Tambah Setoran
          </button>
        </div>
      )}

      {/* ── HISTORY TABLE ── */}
      <div style={{
        background: "white", borderRadius: 20,
        border: "1.5px solid #e2e8f0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        overflow: "hidden" }}>
        {/* Table header bar */}
        <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color="#f59e0b" /> Riwayat Mutabaah Tahfidz
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: 10 }}>
            {loading ? "Memuat..." : `Total: ${records.length} rekaman`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ fontWeight: 600 }}>Memuat riwayat setoran...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: 64, textAlign: "center" }}>
            <AlertCircle size={36} color="#cbd5e1" style={{ margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontWeight: 700, color: "#64748b", fontSize: 15, marginBottom: 4 }}>Belum ada riwayat setoran</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Klik tombol Tambah Setoran untuk mulai mencatat.</div>
          </div>
        ) : (
          <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 860 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Tanggal", "Kategori", "Batas Setoran", "Halaman", "Nilai", "Catatan", "Musyrif", ...(userRole?.includes("ADMIN_SUPER") ? ["Aksi"] : [])].map((h, i) => (
                    <th key={i} style={{
                      padding: "13px 18px", textAlign: i >= 3 && i <= 4 ? "center" : (i === 7 ? "center" : "left"),
                      fontSize: 11, fontWeight: 800, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const jc = jenisColor[r.jenis] || jenisColor.tilawah;
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa")}
                    >
                      <td style={{ padding: "14px 18px", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>
                        {new Date(r.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: `1px solid ${jc.border}`, background: jc.bg, color: jc.color, textTransform: "capitalize" }}>
                          {r.jenis}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#1e293b" }}>
                        {r.surat_dari} <span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>(Ayat {r.ayat_dari})</span>
                        {r.surat_ke && <> s.d {r.surat_ke} <span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>(Ayat {r.ayat_ke})</span></>}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 700, color: "#334155" }}>{r.halaman || "—"}</td>
                      <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{r.nilai || "—"}</td>
                      <td style={{ padding: "14px 18px", color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.keterangan || "—"}</td>
                      <td style={{ padding: "14px 18px", color: "#475569", fontWeight: 600 }}>{r.pegawai?.nama_lengkap || "Sistem"}</td>
                      {userRole?.includes("ADMIN_SUPER") && (
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(r.id, `${r.jenis} ${r.surat_dari}`)}
                            title="Hapus (Admin Super)"
                            style={{
                              width: 34, height: 34, background: "#fef2f2",
                              color: "#dc2626", border: "1px solid #fecaca",
                              borderRadius: 9, display: "flex", alignItems: "center",
                              justifyContent: "center", cursor: "pointer",
                              transition: "all 0.15s", margin: "0 auto" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{ background: "white", borderRadius: 24, boxShadow: "0 25px 60px rgba(0,0,0,0.2)", width: "100%", maxWidth: 520, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #550000 0%, #440000 100%)", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <BookOpen size={20} color="rgba(255,255,255,0.8)" />
                  <h3 style={{ fontWeight: 900, fontSize: 18, color: "white", margin: 0 }}>Catat Mutabaah Tahfidz</h3>
                </div>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0 }}>Input perkembangan Al-Qur'an santri</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ width: 36, height: 36, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ overflowY: "auto", flex: 1 }} className="custom-scrollbar">
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Tanggal & Kategori */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Tanggal</label>
                    <input type="date" required value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Kategori</label>
                    <select value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                      <option value="ziyadah">Ziyadah</option>
                      <option value="murojaah">Murojaah</option>
                      <option value="tilawah">Tilawah</option>
                    </select>
                  </div>
                </div>

                {/* Batas Mulai */}
                <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16, border: "1.5px solid #e2e8f0" }}>
                  <div style={{ ...labelStyle, color: "#334155", marginBottom: 12 }}>Batas Mulai (Dari)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, color: "#94a3b8" }}>Surat</label>
                      <select value={form.surat_dari} onChange={e => setForm({ ...form, surat_dari: e.target.value })} style={{ ...inputStyle, background: "white", appearance: "none" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                        {QURAN_SURAH.map(s => <option key={s.number} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: "#94a3b8" }}>Ayat</label>
                      <select value={form.ayat_dari} onChange={e => setForm({ ...form, ayat_dari: parseInt(e.target.value) })} style={{ ...inputStyle, background: "white", appearance: "none" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                        {Array.from({ length: suratDariVerses }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Batas Akhir */}
                <div style={{ background: "#f0fdf4", borderRadius: 16, padding: 16, border: "1.5px solid #bbf7d0" }}>
                  <div style={{ ...labelStyle, color: "#166534", marginBottom: 12 }}>Batas Akhir (Sampai — Opsional)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ ...labelStyle, color: "#86efac" }}>Surat</label>
                      <select value={form.surat_ke} onChange={e => setForm({ ...form, surat_ke: e.target.value })} style={{ ...inputStyle, background: "white", appearance: "none" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#16a34a")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                        <option value="">Pilih Surat...</option>
                        {QURAN_SURAH.map(s => <option key={s.number} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: "#86efac" }}>Ayat</label>
                      <select
                        disabled={!form.surat_ke}
                        value={String(form.ayat_ke)}
                        onChange={e => setForm({ ...form, ayat_ke: e.target.value ? parseInt(e.target.value) : "" })}
                        style={{ ...inputStyle, background: form.surat_ke ? "white" : "#f1f5f9", color: form.surat_ke ? "#1e293b" : "#94a3b8", appearance: "none" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "#16a34a")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                      >
                        <option value="">Pilih Ayat...</option>
                        {Array.from({ length: suratKeVerses }, (_, i) => i + 1).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Halaman & Nilai */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Jumlah Halaman</label>
                    <input type="number" min="1" step="1" placeholder="Cth: 2" value={form.halaman} onChange={e => setForm({ ...form, halaman: e.target.value })} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nilai (0–100)</label>
                    <input type="number" min="0" max="100" step="0.1" placeholder="Cth: 85.5" value={form.nilai} onChange={e => setForm({ ...form, nilai: e.target.value })} style={{ ...inputStyle, fontWeight: 700, color: "#550000" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label style={labelStyle}>Catatan / Keterangan</label>
                  <textarea value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Ketik catatan di sini..." rows={3}
                    style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div style={{ padding: "16px 28px", background: "#f8fafc", borderTop: "1.5px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
              <button
                type="button" onClick={() => setShowModal(false)}
                style={{ padding: "11px 20px", borderRadius: 12, fontWeight: 700, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontSize: 14 }}
              >
                Batal
              </button>
              <button
                type="button" onClick={handleSubmit as any}
                style={{
                  padding: "11px 24px", borderRadius: 12, fontWeight: 800,
                  border: "none", background: "#550000", color: "white",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 8, fontSize: 14, boxShadow: "0 4px 12px rgba(85,0,0,0.25)",
                  transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(85,0,0,0.35)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(85,0,0,0.25)"; }}
              >
                <Save size={17} /> Simpan Setoran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
