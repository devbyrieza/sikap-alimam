"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Printer,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  Check,
  Building,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";

interface Santri {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  kelas_id: string;
  jenis_kelamin: string | null;
  foto_url: string | null;
  is_active: boolean;
  status_kesiswaan: "aktif" | "mengundurkan_diri" | "dikeluarkan" | "mutasi" | "lulus";
  tanggal_keluar: string | null;
  alasan_keluar: string | null;
  no_sk_keluar: string | null;
  catatan_keluar: string | null;
  kelas?: { id: string; nama: string; jenjang: string | null };
  halaqoh_anggota?: {
    kelompok?: {
      nama_kelompok: string;
      sesi: string;
      pegawai?: { nama_lengkap: string };
    };
  }[];
}

interface KelasOption {
  id: string;
  nama: string;
  jenjang: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  aktif: {
    label: "Aktif",
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    icon: CheckCircle2
  },
  dikeluarkan: {
    label: "Dikeluarkan (DO)",
    bg: "#fff1f2",
    text: "#be123c",
    border: "#fecdd3",
    icon: XCircle
  },
  mengundurkan_diri: {
    label: "Mengundurkan Diri",
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    icon: Clock
  },
  mutasi: {
    label: "Mutasi Keluar",
    bg: "#f5f3ff",
    text: "#6d28d9",
    border: "#ddd6fe",
    icon: ArrowRightLeft
  },
  lulus: {
    label: "Lulus (Alumni)",
    bg: "#eff6ff",
    text: "#1d4ed8",
    border: "#bfdbfe",
    icon: GraduationCap
  }
};

export default function MasterSantriPage() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    mengundurkan_diri: 0,
    mutasi: 0,
    dikeluarkan: 0
  });

  // Modal State: Ubah Status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedSantriForStatus, setSelectedSantriForStatus] = useState<Santri | null>(null);
  const [statusForm, setStatusForm] = useState({
    status_kesiswaan: "dikeluarkan" as Santri["status_kesiswaan"],
    tanggal_keluar: new Date().toISOString().split("T")[0],
    no_sk_keluar: "",
    alasan_keluar: "",
    catatan_keluar: ""
  });
  const [savingStatus, setSavingStatus] = useState(false);

  // Modal State: Cetak Dokumen / Surat
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedSantriForDoc, setSelectedSantriForDoc] = useState<Santri | null>(null);

  // Body Scroll Lock for Modals (Mandatory UX Rule)
  useEffect(() => {
    if (statusModalOpen || docModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [statusModalOpen, docModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSantri, resKelas] = await Promise.all([
        fetch("/api/master/santri?status=all"),
        fetch("/api/master/kelas?all=true")
      ]);

      if (resSantri.ok) {
        const json = await resSantri.json();
        const rawS = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.santri)
          ? json.santri
          : Array.isArray(json)
          ? json
          : [];
        setSantriList(rawS);
        if (json.stats) setStats(json.stats);
      }

      if (resKelas.ok) {
        const jsonK = await resKelas.json();
        const rawK = Array.isArray(jsonK)
          ? jsonK
          : Array.isArray(jsonK.kelas)
          ? jsonK.kelas
          : Array.isArray(jsonK.data)
          ? jsonK.data
          : [];
        setKelasList(rawK);
      }
    } catch (err) {
      console.error("Gagal memuat data santri:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredSantri = useMemo(() => {
    return (santriList || []).filter((s) => {
      const matchSearch =
        searchQuery === "" ||
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.includes(searchQuery));

      const matchKelas = selectedKelas === "all" || s.kelas_id === selectedKelas;

      const matchStatus =
        selectedStatus === "all" || s.status_kesiswaan === selectedStatus;

      return matchSearch && matchKelas && matchStatus;
    });
  }, [santriList, searchQuery, selectedKelas, selectedStatus]);

  // Open Ubah Status Modal
  const openStatusModal = (santri: Santri) => {
    setSelectedSantriForStatus(santri);
    setStatusForm({
      status_kesiswaan: (santri.status_kesiswaan === "aktif" ? "dikeluarkan" : santri.status_kesiswaan) as any,
      tanggal_keluar: santri.tanggal_keluar
        ? new Date(santri.tanggal_keluar).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      no_sk_keluar:
        santri.no_sk_keluar ||
        (santri.status_kesiswaan === "dikeluarkan" ? "SK/DIR/ALIMAM/2026/088" : ""),
      alasan_keluar: santri.alasan_keluar || "",
      catatan_keluar: santri.catatan_keluar || ""
    });
    setStatusModalOpen(true);
  };

  // Submit Status Change
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriForStatus) return;

    const isDeactivating = statusForm.status_kesiswaan !== "aktif";
    const result = await Swal.fire({
      title: isDeactivating ? "Konfirmasi Perubahan Status" : "Aktifkan Kembali Santri?",
      html: `
        <div style="text-align: left; font-size: 13px; color: #475569; line-height: 1.6;">
          <p>Anda akan mengubah status santri <b>${selectedSantriForStatus.nama_lengkap}</b> menjadi: <span style="font-weight: 800; color: #550000; text-transform: uppercase;">${statusForm.status_kesiswaan.replace("_", " ")}</span>.</p>
          ${
            isDeactivating
              ? "<div style='padding: 10px 14px; background: #fffbeb; color: #92400e; border-radius: 12px; margin-top: 8px; border: 1px solid #fde68a; font-size: 12px;'><b>Peringatan:</b> Santri ini otomatis dikeluarkan dari jadwal halaqoh harian, absensi kelas, dan tagihan SPP berikutnya akan dihentikan.</div>"
              : ""
          }
        </div>
      `,
      icon: isDeactivating ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: isDeactivating ? "#550000" : "#059669"
    });

    if (!result.isConfirmed) return;

    setSavingStatus(true);
    try {
      const res = await fetch("/api/master/santri/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: selectedSantriForStatus.id,
          ...statusForm
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");

      Swal.fire({
        icon: "success",
        title: "Status Berhasil Diperbarui!",
        text: data.message,
        confirmButtonColor: "#550000"
      });

      setStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#550000"
      });
    } finally {
      setSavingStatus(false);
    }
  };

  // Open Doc Modal
  const openDocModal = (santri: Santri) => {
    setSelectedSantriForDoc(santri);
    setDocModalOpen(true);
  };

  return (
    <div style={{ padding: "0 28px 48px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── 1. Hero Banner (Platinum Standard) ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #3b0000 0%, #550000 60%, #7a0000 100%)",
          borderRadius: 24,
          padding: "32px 36px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 16px 40px rgba(85,0,0,0.28)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Decorative Circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: 140, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, background: "rgba(221, 193, 146, 0.2)", border: "1px solid rgba(221, 193, 146, 0.3)", color: "#fef08a", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            <Users size={14} />
            <span>Pusat Data Induk Kesiswaan</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.3px" }}>
            Data Santri &amp; Status Kesiswaan
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>
            Kelola data induk santri, pemetaan kelas &amp; halaqoh, serta tata kelola status mutasi dan pemberhentian santri terintegrasi ke seluruh ekosistem Al-Imam.
          </p>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Santri", value: stats.total, unit: "Santri", color: "#1e293b", icon: Users, bg: "#ffffff", border: "#f1f5f9" },
          { label: "Santri Aktif", value: stats.aktif, unit: "Aktif", color: "#047857", icon: CheckCircle2, bg: "#f0fdf4", border: "#dcfce7" },
          { label: "Dikeluarkan (DO)", value: stats.dikeluarkan, unit: "Santri", color: "#be123c", icon: XCircle, bg: "#fff1f2", border: "#ffe4e6" },
          { label: "Undur Diri", value: stats.mengundurkan_diri, unit: "Santri", color: "#b45309", icon: Clock, bg: "#fffbeb", border: "#fef3c7" },
          { label: "Mutasi Keluar", value: stats.mutasi, unit: "Santri", color: "#6d28d9", icon: ArrowRightLeft, bg: "#f5f3ff", border: "#ede9fe" }
        ].map((s) => {
          const IconComponent = s.icon;
          return (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 18,
                padding: "20px 22px",
                border: `1px solid ${s.border}`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  {s.label}
                </span>
                <IconComponent size={18} color={s.color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
                <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>
                  {s.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Filter Toolbar & Status Pills ──────────────────────────────────── */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "20px 24px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 16px 11px 40px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 14,
                color: "#1e293b",
                outline: "none",
                transition: "all 0.2s"
              }}
            />
          </div>

          {/* Filter Dropdown Kelas */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} color="#64748b" />
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              style={{
                padding: "11px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Kelas</option>
              {(kelasList || []).map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama} ({k.jenjang || "MTs"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { id: "all", label: "Semua Status", count: stats.total },
            { id: "aktif", label: "Aktif", count: stats.aktif },
            { id: "dikeluarkan", label: "Dikeluarkan (DO)", count: stats.dikeluarkan },
            { id: "mengundurkan_diri", label: "Mengundurkan Diri", count: stats.mengundurkan_diri },
            { id: "mutasi", label: "Mutasi Keluar", count: stats.mutasi },
            { id: "lulus", label: "Lulus", count: 0 }
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  border: isSelected ? "none" : "1px solid #e2e8f0",
                  background: isSelected ? "#550000" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(85,0,0,0.2)" : "none"
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 800,
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    color: isSelected ? "#ffffff" : "#64748b"
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Data Table ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid #f1f5f9",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }} className="custom-scrollbar">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "14px 18px", width: 50, textAlign: "center", color: "#475569", fontWeight: 700 }}>NO</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 700 }}>NAMA SANTRI &amp; NIS</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 700 }}>KELAS</th>
                <th style={{ padding: "14px 18px", color: "#475569", fontWeight: 700 }}>KELOMPOK HALAQOH</th>
                <th style={{ padding: "14px 18px", textAlign: "center", color: "#475569", fontWeight: 700 }}>STATUS KESISWAAN</th>
                <th style={{ padding: "14px 24px", textAlign: "right", color: "#475569", fontWeight: 700 }}>AKSI &amp; DOKUMEN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Loader2 size={28} color="#550000" className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontWeight: 600, fontSize: 13 }}>Memuat data santri...</p>
                  </td>
                </tr>
              ) : filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Users size={36} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontWeight: 700, color: "#475569", fontSize: 14, margin: 0 }}>Tidak ada data santri ditemukan</p>
                    <p style={{ fontSize: 12, margin: "4px 0 0" }}>Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredSantri.map((santri, index) => {
                  const statusConf = STATUS_CONFIG[santri.status_kesiswaan] || STATUS_CONFIG.aktif;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr
                      key={santri.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: santri.status_kesiswaan === "dikeluarkan" ? "#fff5f5" : "transparent"
                      }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td style={{ padding: "16px 18px", textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 14 }}>
                            {santri.nama_lengkap}
                          </span>
                          {santri.status_kesiswaan === "dikeluarkan" && (
                            <span style={{ padding: "2px 8px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 800 }}>
                              DO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>
                          NIS: {santri.nis || "-"} • JK: {santri.jenis_kelamin || "L"}
                        </div>
                        {santri.alasan_keluar && (
                          <div style={{ marginTop: 4, padding: "3px 8px", borderRadius: 6, background: "#fff1f2", border: "1px solid #ffe4e6", color: "#be123c", fontSize: 11, display: "inline-block" }}>
                            <b>Ket:</b> {santri.alasan_keluar}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155", fontWeight: 700, fontSize: 12 }}>
                          {santri.kelas?.nama || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        {santri.halaqoh_anggota && santri.halaqoh_anggota.length > 0 ? (
                          <div>
                            <span style={{ fontWeight: 700, color: "#334155", display: "block" }}>
                              {santri.halaqoh_anggota[0]?.kelompok?.nama_kelompok || "-"}
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Pengampu: {santri.halaqoh_anggota[0]?.kelompok?.pegawai?.nama_lengkap || "-"}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                            {santri.is_active ? "Belum dialokasikan" : "Nonaktif (Keluar)"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 700,
                            background: statusConf.bg,
                            color: statusConf.text,
                            border: `1px solid ${statusConf.border}`
                          }}
                        >
                          <StatusIcon size={14} />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          {/* Ubah Status Button */}
                          <button
                            type="button"
                            onClick={() => openStatusModal(santri)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 10,
                              background: "#550000",
                              color: "#ffffff",
                              border: "none",
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              boxShadow: "0 2px 8px rgba(85,0,0,0.25)",
                              transition: "all 0.15s"
                            }}
                          >
                            <ArrowRightLeft size={13} />
                            <span>Ubah Status</span>
                          </button>

                          {/* Print SK Button */}
                          {santri.status_kesiswaan !== "aktif" && (
                            <button
                              type="button"
                              onClick={() => openDocModal(santri)}
                              style={{
                                padding: "7px 12px",
                                borderRadius: 10,
                                background: "#f8fafc",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.15s"
                              }}
                              title="Cetak Surat Keputusan / Surat Keterangan"
                            >
                              <Printer size={13} color="#475569" />
                              <span>Cetak SK</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Modal: Ubah Status Kesiswaan ─────────────────────────────────────── */}
      {statusModalOpen && selectedSantriForStatus && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            overflowY: "auto"
          }}
          onClick={() => setStatusModalOpen(false)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
              background: "white",
              borderRadius: 24,
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              overflow: "hidden",
              border: "1px solid #f1f5f9",
              margin: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
                padding: "20px 24px",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 8, background: "rgba(255,255,255,0.15)", borderRadius: 12 }}>
                  <ArrowRightLeft size={20} color="#fef08a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Ubah Status Kesiswaan</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                    Santri: <b>{selectedSantriForStatus.nama_lengkap}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveStatus} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Pilih Status Baru
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { id: "aktif", label: "Aktif", desc: "Santri kembali aktif KBM" },
                    { id: "dikeluarkan", label: "Dikeluarkan (DO)", desc: "Pelanggaran berat / SK Mudir" },
                    { id: "mengundurkan_diri", label: "Mengundurkan Diri", desc: "Permintaan wali santri" },
                    { id: "mutasi", label: "Mutasi Keluar", desc: "Pindah ke sekolah lain" }
                  ].map((st) => (
                    <label
                      key={st.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: statusForm.status_kesiswaan === st.id ? "2px solid #550000" : "1.5px solid #e2e8f0",
                        background: statusForm.status_kesiswaan === st.id ? "#fff5f5" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: statusForm.status_kesiswaan === st.id ? "#550000" : "#1e293b" }}>
                          {st.label}
                        </span>
                        <input
                          type="radio"
                          name="status_kesiswaan"
                          value={st.id}
                          checked={statusForm.status_kesiswaan === st.id}
                          onChange={(e) => setStatusForm({ ...statusForm, status_kesiswaan: e.target.value as any })}
                          style={{ accentColor: "#550000" }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{st.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {statusForm.status_kesiswaan !== "aktif" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Tanggal Efektif Keluar
                    </label>
                    <input
                      type="date"
                      value={statusForm.tanggal_keluar}
                      onChange={(e) => setStatusForm({ ...statusForm, tanggal_keluar: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 13, outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Nomor Surat Keputusan (SK)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SK/DIR/ALIMAM/2026/088"
                      value={statusForm.no_sk_keluar}
                      onChange={(e) => setStatusForm({ ...statusForm, no_sk_keluar: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 13, outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Alasan / Keterangan Resmi
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Pelanggaran berat sesuai surat perjanjian tata tertib pesantren..."
                      value={statusForm.alasan_keluar}
                      onChange={(e) => setStatusForm({ ...statusForm, alasan_keluar: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, fontSize: 13, outline: "none" }}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: 12, background: "#f1f5f9", color: "#475569", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    background: "#550000",
                    color: "white",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: savingStatus ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(85,0,0,0.3)"
                  }}
                >
                  {savingStatus ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Modal: Cetak Dokumen SK (Print Preview) ─────────────────────────── */}
      {docModalOpen && selectedSantriForDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            overflowY: "auto"
          }}
          onClick={() => setDocModalOpen(false)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 680,
              background: "white",
              borderRadius: 24,
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              overflow: "hidden",
              border: "1px solid #f1f5f9",
              margin: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar Modal */}
            <div
              style={{
                background: "#0f172a",
                color: "white",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              className="no-print"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Printer size={16} color="#fbbf24" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Cetak Dokumen Resmi Pesantren</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 10,
                    background: "#550000",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Printer size={14} />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div style={{ padding: "36px 40px", background: "white", color: "#0f172a", fontSize: 13, lineHeight: 1.7 }} id="printable-area">
              {/* Kop Surat */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
                  PESANTREN AL-IMAM AL-ISLAMI
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>
                  Sistem Informasi &amp; Kepengasuhan Santri (SIKAP) • Akreditasi Pesantren
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                  Jl. Ciremai Raya No. 10, Garut - Jawa Barat | Web: pesantren-alimam.com
                </p>
              </div>

              {/* Judul Surat */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: "uppercase", textDecoration: "underline" }}>
                  {selectedSantriForDoc.status_kesiswaan === "dikeluarkan"
                    ? "SURAT KEPUTUSAN PEMBERHENTIAN SANTRI"
                    : "SURAT KETERANGAN MUTASI / PINDAH SEKOLAH"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                  Nomor: {selectedSantriForDoc.no_sk_keluar || "SK/DIR/ALIMAM/2026/088"}
                </p>
              </div>

              {/* Isi Surat */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0 }}>
                  Yang bertanda tangan di bawah ini, Pimpinan / Mudir Pesantren Al-Imam Al-Islami menerangkan bahwa:
                </p>

                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "140px 1fr", gap: "6px 12px", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>Nama Lengkap</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>: {selectedSantriForDoc.nama_lengkap}</span>

                  <span style={{ color: "#64748b" }}>Nomor Induk (NIS)</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>: {selectedSantriForDoc.nis || "-"}</span>

                  <span style={{ color: "#64748b" }}>Jenjang / Kelas</span>
                  <span style={{ color: "#0f172a" }}>: {selectedSantriForDoc.kelas?.nama || "I'dad Lughowy (IL)"}</span>

                  <span style={{ color: "#64748b" }}>Tanggal Efektif</span>
                  <span style={{ color: "#0f172a" }}>
                    :{" "}
                    {selectedSantriForDoc.tanggal_keluar
                      ? new Date(selectedSantriForDoc.tanggal_keluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                      : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>

                  <span style={{ color: "#64748b" }}>Alasan Keterangan</span>
                  <span style={{ fontWeight: 700, color: "#be123c" }}>
                    : {selectedSantriForDoc.alasan_keluar || "Pelanggaran berat sesuai surat perjanjian tata tertib pesantren."}
                  </span>
                </div>

                <p style={{ margin: 0 }}>
                  Terhitung sejak tanggal ditetapkannya surat keputusan ini, santri yang bersangkutan dinyatakan resmi{" "}
                  <b>{selectedSantriForDoc.status_kesiswaan === "dikeluarkan" ? "DIKELUARKAN" : "MUTASI KELUAR"}</b> dari
                  Pesantren Al-Imam Al-Islami dan tidak lagi memiliki hak serta kewajiban sebagai santri aktif.
                </p>

                <p style={{ margin: 0 }}>
                  Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Tanda Tangan */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
                <div style={{ textAlign: "center", width: 220 }}>
                  <p style={{ margin: 0, fontSize: 12 }}>
                    Garut, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    <br />
                    Mudir Pesantren Al-Imam,
                  </p>
                  <div style={{ height: 56 }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, textDecoration: "underline", fontSize: 13 }}>Ust. Wahab Rajasam, M.Pd.</p>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 11 }}>NIP. 198001012026011001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
