"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Award,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  CalendarDays,
  Target,
  Star,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  FileSpreadsheet,
  Printer,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { getLaporanNilaiAccess, LaporanNilaiAccess } from "@/lib/permissions";

interface ExamDetail {
  count: number;
  last_id: string;
  last_tanggal: string;
  nilai_akhir: number;
  nilai_bacaan: number;
  nilai_kelancaran: number;
  nilai_sikap: number;
  is_lulus: boolean;
  surah_nama: string;
  penguji: string;
}

interface SantriMatrix {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  kelas: { id: string; nama: string; jenjang: string };
  kelompok: {
    id: string;
    nama: string;
    sesi: string;
    musyrif_id: string | null;
    musyrif_nama: string;
    musyrif_phone: string | null;
  } | null;
  ujian: {
    pekanan: ExamDetail | null;
    bulanan: ExamDetail | null;
    pra_target: ExamDetail | null;
    target: ExamDetail | null;
    itqon: ExamDetail | null;
  };
  is_pra_target_done: boolean;
  is_pekanan_done: boolean;
  is_bulanan_done: boolean;
  is_target_done: boolean;
  is_itqon_done: boolean;
  total_ujian_types_done: number;
  progress_pts_percent: number;
}

interface RekapMusyrif {
  musyrif_id: string;
  musyrif_nama: string;
  musyrif_phone: string | null;
  kelompok_nama: string;
  total_santri: number;
  pra_target_done: number;
  pekanan_done: number;
  bulanan_done: number;
  target_done: number;
  itqon_done: number;
  santri_belum_pra_target: { id: string; nama: string; nis: string | null }[];
  pra_target_persen: number;
  is_tuntas_pra_target: boolean;
}

export default function MonitoringUjianPage() {
  const [data, setData] = useState<{
    global_stats: any;
    santri: SantriMatrix[];
    rekap_musyrif: RekapMusyrif[];
    filters: {
      kelas: { id: string; nama: string; jenjang: string }[];
      musyrif: { id: string; nama: string; kelompok: string }[];
    };
  } | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<LaporanNilaiAccess | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matriks" | "musyrif">("matriks");

  // Filters
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterMusyrif, setFilterMusyrif] = useState("all");
  const [filterStatusPraTarget, setFilterStatusPraTarget] = useState<"all" | "done" | "pending">("all");

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(pData => {
        const access = getLaporanNilaiAccess(pData);
        setAccessInfo(access);
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!accessInfo?.canAccess) return;
    setLoading(true);
    try {
      const res = await fetch("/api/halaqoh/monitoring");
      const json = await res.json();
      if (!json.error) {
        setData(json);
      }
    } catch (err) {
      console.error("Gagal memuat monitoring ujian:", err);
    } finally {
      setLoading(false);
    }
  }, [accessInfo?.canAccess]);

  useEffect(() => {
    if (accessInfo?.canAccess) {
      fetchData();
    }
  }, [accessInfo?.canAccess, fetchData]);

  // Filtered Santri List
  const filteredSantri = useMemo(() => {
    if (!data?.santri) return [];
    return data.santri.filter(s => {
      const q = search.toLowerCase();
      const matchSearch =
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nis && s.nis.includes(search)) ||
        (s.kelompok?.musyrif_nama && s.kelompok.musyrif_nama.toLowerCase().includes(q));

      const matchKelas = filterKelas === "all" || s.kelas.id === filterKelas;
      const matchMusyrif = filterMusyrif === "all" || s.kelompok?.musyrif_id === filterMusyrif;

      let matchStatus = true;
      if (filterStatusPraTarget === "done") matchStatus = s.is_pra_target_done;
      if (filterStatusPraTarget === "pending") matchStatus = !s.is_pra_target_done;

      return matchSearch && matchKelas && matchMusyrif && matchStatus;
    });
  }, [data, search, filterKelas, filterMusyrif, filterStatusPraTarget]);

  // Send WhatsApp Reminder to Musyrif
  const handleSendReminderWA = (m: RekapMusyrif) => {
    if (!m.musyrif_phone) {
      alert(`Nomor WhatsApp untuk ${m.musyrif_nama} belum terdaftar di profil kepegawaian.`);
      return;
    }

    const uncompletedNames = m.santri_belum_pra_target.map((s, idx) => `${idx + 1}. ${s.nama}`).join("\n");
    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ust. ${m.musyrif_nama}.%0A%0A` +
      `Pemberitahuan dari *Divisi Kepengasuhan Pesantren Al-Imam Al-Islami*.%0A%0A` +
      `Mengingat tenggat pengisian nilai Rapor Bayangan PTS Semester Ganjil, terdapat santri bimbingan di *${m.kelompok_nama}* yang *belum memiliki Nilai Ujian Pra-Target*:%0A` +
      `${encodeURIComponent(uncompletedNames)}%0A%0A` +
      `Mohon agar dapat segera melaksanakan dan menginputkan nilai ujian pra-target melalui menu *Halaqoh → Ujian Tahfidz* di aplikasi SIKAP.%0A%0A` +
      `Jazakumullahu khairan atas dedikasi dan perhatian antum.`;

    const cleanPhone = m.musyrif_phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (authLoading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "#550000" }}>
          <Loader2 className="animate-spin" size={38} style={{ margin: "0 auto 12px auto" }} />
          <p style={{ fontWeight: 800, fontSize: "14px", color: "#550000" }}>Memverifikasi hak akses pantau ujian tahfidz...</p>
        </div>
      </div>
    );
  }

  if (!accessInfo?.canAccess) {
    return (
      <div className="page-container" style={{ maxWidth: 680, margin: "40px auto", padding: "0 20px" }}>
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "clamp(24px, 5vw, 40px)",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(85,0,0,0.06)",
          border: "1px solid #ebdcc3"
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "24px",
            background: "#fff1f2",
            color: "#be123c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            boxShadow: "0 4px 14px rgba(190, 18, 60, 0.15)"
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#550000", margin: "0 0 12px 0" }}>
            Akses Terbatas: Pantau Ujian Tahfidz
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "0 0 20px 0" }}>
            Mohon maaf, halaman <strong>Pantau Ujian &amp; Rekapitulasi Tahfidz</strong> hanya dapat diakses secara resmi oleh:
          </p>
          <div style={{
            background: "#fdf8f0",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid #ddc192",
            textAlign: "left",
            fontSize: "13px",
            color: "#451a03",
            marginBottom: "28px"
          }}>
            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Admin Super / Mudir / Pimpinan Pesantren</strong></li>
              <li><strong>Kepala Kurikulum:</strong> Ustadz Imron Abdillah, S.Pd.</li>
              <li><strong>Wali Kelas MTs:</strong> Ustadz Agus Cahyono (Kelas 7, 8, 9 MTs)</li>
              <li><strong>Wali Kelas IL:</strong> Ustadz Imron Abdillah, S.Pd. (Kelas I&apos;dad Lughowi)</li>
              <li><strong>Wali Kelas MA:</strong> Ustadz Muhammad Thoriq Ibn Ziyad, Lc., M.Ag. (Kelas 10, 11, 12 MA)</li>
            </ul>
          </div>
          <Link
            href="/halaqoh"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
              color: "white",
              padding: "12px 28px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "14px",
              textDecoration: "none",
              boxShadow: "0 6px 16px rgba(85,0,0,0.25)"
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Halaman Halaqoh
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── HERO BANNER ── */}
      <div
        className="hero-banner"
        style={{
          background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
          borderRadius: 24,
          padding: "26px 30px",
          color: "white",
          boxShadow: "0 12px 30px rgba(85,0,0,0.25)",
          position: "relative",
          overflow: "hidden",
          marginBottom: 24
        }}
      >
        <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, background: "rgba(255,255,255,0.06)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: 100, width: 140, height: 140, background: "rgba(255,255,255,0.04)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Link
                href="/halaqoh"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  textDecoration: "none"
                }}
              >
                <ArrowLeft size={16} />
              </Link>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 8 }}>
                Pusat Pengawasan Kepengasuhan & Tahfidz
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <Award size={28} /> Monitoring Kelengkapan Ujian Tahfidz
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.9, maxWidth: 650, lineHeight: 1.5 }}>
              Rekapitulasi progres input 5 kategori ujian (Pekanan, Bulanan, Pra-Target PTS, Target, dan Itqon). Pastikan seluruh santri telah terisi sebelum penerbitan rapor.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                backdropFilter: "blur(6px)"
              }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Muat Ulang
            </button>

            <Link
              href="/halaqoh/ujian"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#f59e0b",
                color: "#451a03",
                padding: "10px 18px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(245,158,11,0.35)"
              }}
            >
              <CheckCircle2 size={16} /> Input Nilai Ujian
            </Link>
          </div>
        </div>
      </div>

      {/* ── 5 STAT CARDS (GLOBAL PROGRESS) ── */}
      {data?.global_stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
          {/* 1. Ujian Pra-Target (Krusial PTS Rapor) */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
              borderRadius: 18,
              padding: "18px 20px",
              border: "2px solid #86efac",
              boxShadow: "0 4px 14px rgba(22,101,52,0.08)",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#166534", textTransform: "uppercase", letterSpacing: "0.06em", background: "#dcfce7", padding: "2px 8px", borderRadius: 6 }}>
                Prioritas Rapor PTS
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={18} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#14532d" }}>
              {data.global_stats.pra_target.count} <span style={{ fontSize: 14, color: "#4b5563", fontWeight: 700 }}>/ {data.global_stats.total_santri} Santri</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#d1fae5", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${data.global_stats.pra_target.percent}%`, height: "100%", background: "#16a34a", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>{data.global_stats.pra_target.percent}%</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#4b5563", fontWeight: 600 }}>Ujian Pra-Target (Setengah Target)</p>
          </div>

          {/* 2. Ujian Pekanan */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: "1.5px solid #fde68a", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#b45309", textTransform: "uppercase" }}>Ujian Pekanan</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#78350f" }}>
              {data.global_stats.pekanan.count} <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>/ {data.global_stats.total_santri}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#fef3c7", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${data.global_stats.pekanan.percent}%`, height: "100%", background: "#d97706", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#b45309" }}>{data.global_stats.pekanan.percent}%</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>Target per 2 Halaman</p>
          </div>

          {/* 3. Ujian Bulanan */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: "1.5px solid #bfdbfe", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase" }}>Ujian Bulanan</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a" }}>
              {data.global_stats.bulanan.count} <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>/ {data.global_stats.total_santri}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#dbeafe", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${data.global_stats.bulanan.percent}%`, height: "100%", background: "#2563eb", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>{data.global_stats.bulanan.percent}%</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>Target per 10 Halaman</p>
          </div>

          {/* 4. Ujian Target (Semesteran) */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: "1.5px solid #ddd6fe", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#6d28d9", textTransform: "uppercase" }}>Ujian Target</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#4c1d95" }}>
              {data.global_stats.target.count} <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>/ {data.global_stats.total_santri}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#ede9fe", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${data.global_stats.target.percent}%`, height: "100%", background: "#7c3aed", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#6d28d9" }}>{data.global_stats.target.percent}%</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>Full Target Kelas (Akhir Semester)</p>
          </div>

          {/* 5. Ujian Itqon */}
          <div style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: "1.5px solid #a5f3fc", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#0e7490", textTransform: "uppercase" }}>Ujian Itqon</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#cffafe", color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={18} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#164e63" }}>
              {data.global_stats.itqon.count} <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>/ {data.global_stats.total_santri}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#cffafe", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${data.global_stats.itqon.percent}%`, height: "100%", background: "#0891b2", borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#0e7490" }}>{data.global_stats.itqon.percent}%</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>Sertifikasi per 5 Juz (Bonus +10)</p>
          </div>
        </div>
      )}

      {/* ── TAB NAVIGATION ── */}
      <div style={{ background: "white", borderRadius: 18, padding: 6, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("matriks")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 13,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 800,
            background: activeTab === "matriks" ? "#550000" : "transparent",
            color: activeTab === "matriks" ? "white" : "#64748b",
            boxShadow: activeTab === "matriks" ? "0 4px 12px rgba(85,0,0,0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Target size={16} /> Matriks Checklist Santri ({filteredSantri.length})
        </button>

        <button
          onClick={() => setActiveTab("musyrif")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 13,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 800,
            background: activeTab === "musyrif" ? "#550000" : "transparent",
            color: activeTab === "musyrif" ? "white" : "#64748b",
            boxShadow: activeTab === "musyrif" ? "0 4px 12px rgba(85,0,0,0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Users size={16} /> Rekapitulasi per Musyrif ({data?.rekap_musyrif?.length || 0})
        </button>
      </div>

      {/* ── TAB 1: MATRIKS CHECKLIST SANTRI ── */}
      {activeTab === "matriks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filter Bar */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "18px 20px",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center"
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: 13 }} />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, atau musyrif..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontWeight: 600
                }}
              />
            </div>

            {/* Filter Kelas */}
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                background: "#f8fafc",
                color: "#1e293b",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Kelas</option>
              {data?.filters?.kelas?.map(k => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.jenjang})
                </option>
              ))}
            </select>

            {/* Filter Musyrif */}
            <select
              value={filterMusyrif}
              onChange={e => setFilterMusyrif(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                fontWeight: 600,
                outline: "none",
                background: "#f8fafc",
                color: "#1e293b",
                cursor: "pointer"
              }}
            >
              <option value="all">Semua Musyrif</option>
              {data?.filters?.musyrif?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nama} ({m.kelompok})
                </option>
              ))}
            </select>

            {/* Filter Status Pra-Target (PTS) */}
            <select
              value={filterStatusPraTarget}
              onChange={e => setFilterStatusPraTarget(e.target.value as any)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: filterStatusPraTarget === "pending" ? "1.5px solid #f87171" : "1.5px solid #e2e8f0",
                fontSize: 13,
                fontWeight: 700,
                outline: "none",
                background: filterStatusPraTarget === "pending" ? "#fef2f2" : "#f8fafc",
                color: filterStatusPraTarget === "pending" ? "#dc2626" : "#1e293b",
                cursor: "pointer"
              }}
            >
              <option value="all">Status Pra-Target: Semua</option>
              <option value="pending">🔴 Belum Ujian Pra-Target (Prioritas)</option>
              <option value="done">🟢 Sudah Ujian Pra-Target</option>
            </select>
          </div>

          {/* Table Container */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1e293b" }}>
                  Matriks Kelengkapan Nilai Ujian Santri
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Menampilkan {filteredSantri.length} santri aktif
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#64748b" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} /> Sudah Diuji
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} /> Belum Diuji
                </span>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-primary" />
                <p style={{ fontSize: 13, fontWeight: 700 }}>Memuat matriks ujian santri...</p>
              </div>
            ) : filteredSantri.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
                <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                <p style={{ fontSize: 14, fontWeight: 700 }}>Tidak ditemukan santri yang sesuai filter.</p>
              </div>
            ) : (
              <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 980 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", textAlign: "center", width: 44, color: "#475569", fontWeight: 800 }}>No</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontWeight: 800 }}>Santri</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Kelas</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontWeight: 800 }}>Musyrif / Kelompok</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Ujian Pekanan</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Ujian Bulanan</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", color: "#166534", fontWeight: 900, background: "#f0fdf4", borderLeft: "2px solid #86efac", borderRight: "2px solid #86efac" }}>
                        Pra-Target (PTS)
                      </th>
                      <th style={{ padding: "12px 12px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Ujian Target</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Ujian Itqon</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", color: "#475569", fontWeight: 800 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSantri.map((s, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: isEven ? "white" : "#fafafa",
                            transition: "background 0.15s"
                          }}
                        >
                          <td style={{ padding: "12px 14px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                            {idx + 1}
                          </td>

                          {/* Santri Name & NIS */}
                          <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13 }}>
                              {s.nama_lengkap}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              NIS: {s.nis || "-"}
                            </div>
                          </td>

                          {/* Kelas */}
                          <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 8, background: "#f1f5f9", color: "#334155", fontWeight: 700, fontSize: 11.5 }}>
                              {s.kelas.nama}
                            </span>
                          </td>

                          {/* Musyrif */}
                          <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 700, color: "#334155", fontSize: 12.5 }}>
                              {s.kelompok?.musyrif_nama || "-"}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {s.kelompok?.nama || "Tanpa Kelompok"}
                            </div>
                          </td>

                          {/* Ujian Pekanan */}
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {s.ujian.pekanan ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ padding: "3px 8px", borderRadius: 8, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontWeight: 900, fontSize: 11.5 }}>
                                  Nilai: {s.ujian.pekanan.nilai_akhir}
                                </span>
                                <span style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
                                  {s.ujian.pekanan.surah_nama}
                                </span>
                              </div>
                            ) : (
                              <span style={{ padding: "3px 8px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 700, fontSize: 10.5 }}>
                                Belum
                              </span>
                            )}
                          </td>

                          {/* Ujian Bulanan */}
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {s.ujian.bulanan ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ padding: "3px 8px", borderRadius: 8, background: "#eff6ff", color: "#0284c7", border: "1px solid #bfdbfe", fontWeight: 900, fontSize: 11.5 }}>
                                  Nilai: {s.ujian.bulanan.nilai_akhir}
                                </span>
                                <span style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
                                  {s.ujian.bulanan.surah_nama}
                                </span>
                              </div>
                            ) : (
                              <span style={{ padding: "3px 8px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 700, fontSize: 10.5 }}>
                                Belum
                              </span>
                            )}
                          </td>

                          {/* UJIAN PRA-TARGET (PTS) - KOLOM SOROTAN UTAMA */}
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap", background: s.is_pra_target_done ? "#f0fdf4" : "#fff1f2", borderLeft: "2px solid #86efac", borderRight: "2px solid #86efac" }}>
                            {s.ujian.pra_target ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ padding: "4px 10px", borderRadius: 8, background: "#16a34a", color: "white", fontWeight: 900, fontSize: 12, boxShadow: "0 2px 6px rgba(22,163,74,0.3)" }}>
                                  Nilai: {s.ujian.pra_target.nilai_akhir}
                                </span>
                                <span style={{ fontSize: 10, color: "#166534", fontWeight: 700, marginTop: 3 }}>
                                  {s.ujian.pra_target.surah_nama}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ padding: "4px 10px", borderRadius: 8, background: "#dc2626", color: "white", fontWeight: 800, fontSize: 11, boxShadow: "0 2px 6px rgba(220,38,38,0.25)" }}>
                                  BELUM DIUJI
                                </span>
                                <span style={{ fontSize: 9.5, color: "#b91c1c", fontWeight: 700, marginTop: 2 }}>
                                  Perlu Nilai Rapor
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Ujian Target */}
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {s.ujian.target ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ padding: "3px 8px", borderRadius: 8, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ede9fe", fontWeight: 900, fontSize: 11.5 }}>
                                  Nilai: {s.ujian.target.nilai_akhir}
                                </span>
                                <span style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
                                  {s.ujian.target.surah_nama}
                                </span>
                              </div>
                            ) : (
                              <span style={{ padding: "3px 8px", borderRadius: 8, background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: 10.5 }}>
                                Belum
                              </span>
                            )}
                          </td>

                          {/* Ujian Itqon */}
                          <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                            {s.ujian.itqon ? (
                              <span style={{ padding: "3px 8px", borderRadius: 8, background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", fontWeight: 900, fontSize: 11.5 }}>
                                Juz {s.ujian.itqon.surah_nama} ({s.ujian.itqon.nilai_akhir})
                              </span>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                            )}
                          </td>

                          {/* Aksi Cepat */}
                          <td style={{ padding: "10px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <Link
                                href={`/halaqoh/ujian?santri_id=${s.id}`}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 8,
                                  background: "#550000",
                                  color: "white",
                                  fontWeight: 800,
                                  fontSize: 11,
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}
                              >
                                Input Ujian
                              </Link>

                              <Link
                                href={`/rapor/print/${s.id}`}
                                target="_blank"
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: 8,
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  fontWeight: 700,
                                  fontSize: 11,
                                  textDecoration: "none"
                                }}
                                title="Lihat Cetak Rapor"
                              >
                                Rapor
                              </Link>
                            </div>
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
      )}

      {/* ── TAB 2: REKAPITULASI PER MUSYRIF ── */}
      {activeTab === "musyrif" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#f8fafc", borderRadius: 16, padding: "14px 20px", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
              Monitoring penginputan nilai per Pengampu Halaqoh. Klik tombol <strong>Ingatkan via WhatsApp</strong> untuk menghubungi musyrif yang belum menyelesaikan ujian santri.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {data?.rekap_musyrif?.map(m => {
              const isTuntas = m.is_tuntas_pra_target;
              return (
                <div
                  key={m.musyrif_id}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    border: isTuntas ? "1.5px solid #86efac" : "1.5px solid #fecaca",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 16
                  }}
                >
                  <div>
                    {/* Header Musyrif Card */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#1e293b" }}>
                          {m.musyrif_nama}
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                          {m.kelompok_nama}
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                          background: isTuntas ? "#dcfce7" : "#fee2e2",
                          color: isTuntas ? "#15803d" : "#b91c1c",
                          border: isTuntas ? "1px solid #86efac" : "1px solid #fca5a5"
                        }}
                      >
                        {isTuntas ? "100% Tuntas PTS" : `${m.pra_target_done} / ${m.total_santri} Tuntas`}
                      </span>
                    </div>

                    {/* Progress Bar Pra-Target */}
                    <div style={{ marginTop: 12, background: "#f8fafc", padding: "12px 14px", borderRadius: 14, border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, color: "#475569", marginBottom: 6 }}>
                        <span>Capaian Pra-Target (PTS):</span>
                        <span style={{ color: isTuntas ? "#15803d" : "#b91c1c" }}>{m.pra_target_persen}%</span>
                      </div>
                      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${m.pra_target_persen}%`,
                            height: "100%",
                            background: isTuntas ? "#16a34a" : "#ef4444",
                            borderRadius: 99
                          }}
                        />
                      </div>
                    </div>

                    {/* Breakdown 4 Ujian Lainnya */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12, textAlign: "center" }}>
                      <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Pekanan</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#1e293b" }}>{m.pekanan_done}</div>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Bulanan</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#1e293b" }}>{m.bulanan_done}</div>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Target</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#1e293b" }}>{m.target_done}</div>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Itqon</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#1e293b" }}>{m.itqon_done}</div>
                      </div>
                    </div>

                    {/* List Santri Belum Diuji */}
                    {!isTuntas && m.santri_belum_pra_target.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#b91c1c", marginBottom: 6 }}>
                          Santri Belum Ujian Pra-Target ({m.santri_belum_pra_target.length}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {m.santri_belum_pra_target.map(s => (
                            <span key={s.id} style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700 }}>
                              {s.nama}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Reminder Button */}
                  <div>
                    {!isTuntas ? (
                      <button
                        onClick={() => handleSendReminderWA(m)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "#059669",
                          color: "white",
                          border: "none",
                          fontWeight: 800,
                          fontSize: 12.5,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          boxShadow: "0 4px 10px rgba(5,150,105,0.25)"
                        }}
                      >
                        <MessageSquare size={15} /> Ingatkan via WhatsApp
                      </button>
                    ) : (
                      <div style={{ textAlign: "center", padding: "8px 0", color: "#15803d", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <CheckCircle2 size={16} /> Seluruh Santri Tuntas Dinilai
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
