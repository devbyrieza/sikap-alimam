"use client";

import React, { useState, useEffect, useCallback } from "react";
import ModuleTabs from "@/components/ModuleTabs";
import {
  ClipboardCheck,
  BarChart3,
  UserCheck,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  Filter,
  GraduationCap,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";

interface KelasItem {
  id: string;
  nama: string;
  jenjang: string;
}

interface SantriOption {
  id: string;
  nama_lengkap: string;
  nis: string | null;
  kelas?: { id: string; nama: string; jenjang: string };
}

interface PresensiRecord {
  id: string;
  tanggal: string;
  status: string;
  keterangan: string | null;
  kelasNama: string;
  waliKelas: string;
}

interface SantriDetail {
  id: string;
  nama_lengkap: string;
  nis: string | null;
  jenis_kelamin: string | null;
  foto_url: string | null;
  kelas: { id: string; nama: string; jenjang: string };
}

interface SummaryData {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
  persentaseHadir: number;
}

const BULAN_NAMA = [
  "Semua Bulan",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  hadir: { label: "Hadir", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", icon: CheckCircle2 },
  sakit: { label: "Sakit", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", icon: AlertCircle },
  izin: { label: "Izin", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Clock },
  alpha: { label: "Alpha", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", icon: XCircle },
};

export default function RiwayatPresensiSantriPage() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [selectedJenjang, setSelectedJenjang] = useState<string>("");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const now = new Date();
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(now.getFullYear());

  const [santriDetail, setSantriDetail] = useState<SantriDetail | null>(null);
  const [presensi, setPresensi] = useState<PresensiRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const [loadingMaster, setLoadingMaster] = useState<boolean>(true);
  const [loadingSantriList, setLoadingSantriList] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => { if(d.data?.role) setUserRole(d.data.role); }).catch(()=>{});
  }, []);

  // Fetch Master Kelas
  useEffect(() => {
    async function fetchKelas() {
      try {
        const res = await fetch("/api/master/kelas");
        if (res.ok) {
          const data = await res.json();
          setKelasList(data.kelas || []);
        }
      } catch (err) {
        console.error("Gagal load kelas", err);
      } finally {
        setLoadingMaster(false);
      }
    }
    fetchKelas();
  }, []);

  // Fetch Santri List for Dropdown
  const fetchSantriList = useCallback(async () => {
    setLoadingSantriList(true);
    try {
      let url = `/api/presensi/santri/riwayat?q=${encodeURIComponent(searchQuery)}`;
      if (selectedKelas) url += `&kelas_id=${selectedKelas}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSantriList(data.santriList || []);
      }
    } catch (err) {
      console.error("Gagal memuat list santri", err);
    } finally {
      setLoadingSantriList(false);
    }
  }, [selectedKelas, searchQuery]);

  useEffect(() => {
    fetchSantriList();
  }, [fetchSantriList]);

  // Fetch Riwayat for selected Santri
  const fetchRiwayat = useCallback(async () => {
    if (!selectedSantriId) {
      setSantriDetail(null);
      setPresensi([]);
      setSummary(null);
      return;
    }

    setLoadingData(true);
    try {
      let url = `/api/presensi/santri/riwayat?santri_id=${selectedSantriId}&tahun=${tahun}`;
      if (bulan > 0) {
        url += `&bulan=${bulan}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSantriDetail(data.santri);
        setPresensi(data.presensi || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Gagal memuat data riwayat santri", err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedSantriId, bulan, tahun]);

  useEffect(() => {
    fetchRiwayat();
  }, [fetchRiwayat]);

  const handleDelete = async (id: string, dateStr: string) => {
    const result = await Swal.fire({
      title: "Hapus Presensi?",
      text: `Yakin ingin menghapus presensi tanggal ${dateStr}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/presensi/santri/${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Terhapus!", "Data presensi berhasil dihapus.", "success");
          fetchRiwayat();
        } else {
          Swal.fire("Gagal", "Gagal menghapus data presensi.", "error");
        }
      } catch {
        Swal.fire("Error", "Terjadi kesalahan server.", "error");
      }
    }
  };

  const filteredKelas = selectedJenjang
    ? kelasList.filter((k) => k.jenjang === selectedJenjang)
    : kelasList;

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Individual Record</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <UserCheck size={26} color="#ddc192" /> Riwayat Presensi Santri
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Pantau riwayat absensi, izin, sakit, dan alpha per individu santri
          </p>
        </div>
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
          { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
          { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
        ]}
      />

      {/* ── Filter Card ── */}
      <div style={{ background: "white", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={18} color="#ddc192" />
          Pilih Santri &amp; Periode
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          {/* Jenjang */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Jenjang</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={selectedJenjang}
              onChange={(e) => {
                setSelectedJenjang(e.target.value);
                setSelectedKelas("");
                setSelectedSantriId("");
              }}
            >
              <option value="">— Semua Jenjang —</option>
              <option value="MTs">MTs</option>
              <option value="IL">IL</option>
              <option value="MA">MA</option>
            </select>
          </div>

          {/* Kelas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={selectedKelas}
              onChange={(e) => {
                setSelectedKelas(e.target.value);
                setSelectedSantriId("");
              }}
            >
              <option value="">— Semua Kelas —</option>
              {filteredKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Santri */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 1" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Nama Santri</label>
            {loadingSantriList ? (
              <div style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
                <Loader2 size={16} className="animate-spin text-amber-700" /> Memuat santri...
              </div>
            ) : (
              <select
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 700, color: "#1a1a1a" }}
                value={selectedSantriId}
                onChange={(e) => setSelectedSantriId(e.target.value)}
              >
                <option value="">— Pilih Santri —</option>
                {santriList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_lengkap} {s.nis ? `(NIS: ${s.nis})` : ""} {s.kelas ? `• ${s.kelas.nama}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bulan */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Bulan</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
            >
              {BULAN_NAMA.map((b, i) => (
                <option key={i} value={i}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tahun</label>
            <select
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", width: "100%", outline: "none", fontWeight: 600 }}
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {loadingData && (
        <div style={{ background: "white", borderRadius: "20px", padding: "48px 24px", border: "1px solid #ebdcc3", textAlign: "center", color: "#64748b" }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px", display: "block", color: "#550000" }} />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Memuat riwayat presensi santri...</p>
        </div>
      )}

      {!loadingData && !selectedSantriId && (
        <div style={{ background: "white", borderRadius: "20px", padding: "54px 24px", border: "1px dashed #ebdcc3", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fdf8f0", border: "1px solid #ebdcc3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={32} color="#550000" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#550000", margin: 0 }}>Pilih Santri Terlebih Dahulu</h3>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 460, margin: 0 }}>
            Gunakan filter kelas atau pilih langsung nama santri pada form di atas untuk menampilkan riwayat lengkap kehadiran.
          </p>
        </div>
      )}

      {!loadingData && selectedSantriId && santriDetail && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Santri Profile Header Card */}
          <div style={{ background: "white", borderRadius: "20px", padding: "22px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)", color: "#ddc192", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, border: "2px solid #ddc192" }}>
                {santriDetail.nama_lengkap.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
                  {santriDetail.nama_lengkap}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    NIS: <strong>{santriDetail.nis || "—"}</strong>
                  </span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 8, background: "#fdf8f0", border: "1px solid #ebdcc3", color: "#550000" }}>
                    Kelas {santriDetail.kelas.nama} {santriDetail.kelas.jenjang ? `(${santriDetail.kelas.jenjang})` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block" }}>Periode Tampilan</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#550000" }}>
                {BULAN_NAMA[bulan]} {tahun}
              </span>
            </div>
          </div>

          {/* Metric Summary Badges */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
              <div style={{ padding: "16px 18px", borderRadius: 16, background: "#fdf8f0", border: "1px solid #ebdcc3", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#550000", opacity: 0.8, marginBottom: 2 }}>Kehadiran</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#550000", lineHeight: 1.1 }}>{summary.persentaseHadir}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginTop: 4 }}>{summary.hadir} dari {summary.total} hari</div>
              </div>

              <div style={{ padding: "16px 18px", borderRadius: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", opacity: 0.8, marginBottom: 2 }}>Total Hadir</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#15803d", lineHeight: 1.1 }}>{summary.hadir}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#15803d", marginTop: 4 }}>Hari</div>
              </div>

              <div style={{ padding: "16px 18px", borderRadius: 16, background: "#fefce8", border: "1px solid #fef08a", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a16207", opacity: 0.8, marginBottom: 2 }}>Total Sakit</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#a16207", lineHeight: 1.1 }}>{summary.sakit}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a16207", marginTop: 4 }}>Hari</div>
              </div>

              <div style={{ padding: "16px 18px", borderRadius: 16, background: "#eff6ff", border: "1px solid #bfdbfe", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", opacity: 0.8, marginBottom: 2 }}>Total Izin</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8", lineHeight: 1.1 }}>{summary.izin}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8", marginTop: 4 }}>Hari</div>
              </div>

              <div style={{ padding: "16px 18px", borderRadius: 16, background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", opacity: 0.8, marginBottom: 2 }}>Total Alpha</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#b91c1c", lineHeight: 1.1 }}>{summary.alpha}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#b91c1c", marginTop: 4 }}>Hari</div>
              </div>
            </div>
          )}

          {/* Presensi Logs Table */}
          <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f5ede1", background: "#fdfcf9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000" }}>
                Catatan Log Presensi
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                Total {presensi.length} catatan
              </span>
            </div>

            {presensi.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                <Calendar size={36} style={{ opacity: 0.3, color: "#ddc192", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px 0", color: "#1a1a1a" }}>
                  Belum Ada Data Presensi
                </p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Tidak ada catatan kehadiran yang ditemukan untuk periode {BULAN_NAMA[bulan]} {tahun}.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ fontSize: 13, width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 60 }}>#</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 160 }}>Tanggal</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 140 }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Keterangan</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 140 }}>Kelas</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#550000", fontWeight: 800, width: 180 }}>Wali Kelas</th>
                      {userRole?.includes("ADMIN_SUPER") && (
                        <th style={{ padding: "12px 16px", textAlign: "center", color: "#550000", fontWeight: 800, width: 60 }}>Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {presensi.map((p, idx) => {
                      const st = STATUS_CONFIG[p.status.toLowerCase()] || {
                        label: p.status,
                        color: "#64748b",
                        bg: "#f8fafc",
                        border: "#e2e8f0",
                        icon: CheckCircle2,
                      };
                      const Icon = st.icon;
                      const dateObj = new Date(p.tanggal);
                      const formattedDate = dateObj.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });

                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: "1px solid #f5ede1",
                            background: idx % 2 === 0 ? "white" : "#fdfcf9",
                          }}
                        >
                          <td style={{ padding: "14px 16px", color: "#550000", fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a1a" }}>
                            {formattedDate}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 800,
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: st.bg,
                                color: st.color,
                                border: `1px solid ${st.border}`,
                              }}
                            >
                              <Icon size={14} />
                              {st.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", color: p.keterangan ? "#1a1a1a" : "#94a3b8", fontStyle: p.keterangan ? "normal" : "italic" }}>
                            {p.keterangan || "Tidak ada keterangan"}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 600, color: "#64748b" }}>
                            {p.kelasNama}
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 600, color: "#475569" }}>
                            {p.waliKelas}
                          </td>
                          {userRole?.includes("ADMIN_SUPER") && (
                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                              <button 
                                onClick={() => handleDelete(p.id, formattedDate)}
                                title="Hapus Data (Khusus Admin Super)"
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: "8px",
                                  width: "32px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fee2e2";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#fef2f2";
                                  e.currentTarget.style.transform = "none";
                                }}
                              >
                                <Trash2 size={16} />
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
        </div>
      )}
    </div>
  );
}
