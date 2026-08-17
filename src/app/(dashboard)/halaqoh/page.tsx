"use client";

import React, { useState, useEffect } from "react";
import {
  BookHeart, Sun, Moon, Cloud, CalendarDays, Users,
  Plus, ArrowRight, Clock, CheckCircle2, AlertCircle,
  Award, FileText, BookOpen, Search, ChevronRight,
  Megaphone, AlertTriangle, UserCircle2, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const HARI_NAMA = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface KelompokHalaqoh {
  id: string;
  nama_kelompok: string;
  sesi: string;
  anggota: { id: string }[];
}

interface SantriMutabaah {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  kelas: string;
  kelompok_halaqoh: {
    id: string;
    nama: string;
    sesi: string;
    musyrif: string;
  } | null;
  last_ziyadah: {
    tanggal: string;
    surah: string;
    ayat_dari: number;
    ayat_ke: number;
    nilai_akhir: number;
  } | null;
  last_murojaah: {
    tanggal: string;
    surah: string;
    ayat_dari: number;
    ayat_ke: number;
    nilai_akhir: number;
  } | null;
  last_ujian: {
    tanggal: string;
    jenis: string;
    nilai_akhir: number;
    is_lulus: boolean;
  } | null;
}

const SESI_CONFIG: Record<string, { label: string; waktu: string; icon: React.ReactNode; bg: string; color: string; border: string }> = {
  subuh:   { label: "Halaqoh Subuh",   waktu: "04.50 – 06.10", icon: <Sun size={20} />,   bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  maghrib: { label: "Ba'da Maghrib",   waktu: "Ba'da Maghrib", icon: <Moon size={20} />,  bg: "#f5f3ff", color: "#7c3aed", border: "#ede9fe" },
  dhuha:   { label: "Halaqoh Dhuha",   waktu: "07.00 – 08.20", icon: <Cloud size={20} />, bg: "#eff6ff", color: "#0284c7", border: "#dbeafe" },
};

function NilaiBadge({ nilai }: { nilai?: number | null }) {
  if (!nilai) return <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>;
  const cfg = nilai >= 90
    ? { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", label: "Sangat Baik" }
    : nilai >= 80
    ? { bg: "#eff6ff", color: "#0284c7", border: "#bfdbfe", label: "Baik" }
    : nilai >= 70
    ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Cukup" }
    : { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Kurang" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {nilai} · {cfg.label}
    </span>
  );
}

export default function HalaqohDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") || "sesi";

  const [activeTab, setActiveTab] = useState<"sesi" | "mutabaah">(tabParam === "mutabaah" ? "mutabaah" : "sesi");
  const [today] = useState(() => new Date());
  const [hariIni] = useState(() => HARI_NAMA[new Date().getDay()]);
  const [kelompokList, setKelompokList] = useState<KelompokHalaqoh[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pegawaiName, setPegawaiName] = useState<string>("");
  const [pegawaiId, setPegawaiId] = useState<string>("");
  const [scopeFilter, setScopeFilter] = useState<"mine" | "all">("mine");

  // Mutabaah tab state
  const [santriList, setSantriList] = useState<SantriMutabaah[]>([]);
  const [loadingMutabaah, setLoadingMutabaah] = useState(false);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");

  const tanggalStr = today.toISOString().split("T")[0];

  const getSesiAktif = (): string[] => {
    if (hariIni === "Ahad") return [];
    const sesi: string[] = [];
    if (hariIni !== "Selasa") sesi.push("subuh");
    sesi.push("dhuha");
    sesi.push("maghrib");
    return sesi;
  };
  const sesiAktif = getSesiAktif();

  const formatTanggal = (d: Date) =>
    d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const tab = tabParam === "mutabaah" ? "mutabaah" : "sesi";
    if (activeTab !== tab) setActiveTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  useEffect(() => {
    Promise.all([
      fetch("/api/halaqoh/kelompok").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([kData, pData]) => {
      setKelompokList(Array.isArray(kData) ? kData : []);
      const u = pData?.user;
      const p = pData?.pegawai;
      setProfile(u);
      setPegawaiName(p?.nama_lengkap || u?.nama || "");
      setPegawaiId(p?.id || "");
      const r = (u?.role || "").toLowerCase();
      setScopeFilter(r.includes("admin") || r.includes("mudir") || r.includes("kabid") || r.includes("wali") ? "all" : "mine");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "mutabaah") {
      setLoadingMutabaah(true);
      fetch("/api/tahfidz/mutabaah")
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setSantriList(data); })
        .catch(err => console.error(err))
        .finally(() => setLoadingMutabaah(false));
    }
  }, [activeTab]);

  const handleTabChange = (tab: "sesi" | "mutabaah") => {
    setActiveTab(tab);
    router.push(`/halaqoh?tab=${tab}`);
  };

  const isPengampu = () => {
    const r = (profile?.role || "").toLowerCase();
    return r.includes("guru") || r.includes("musyrif") || r.includes("pengampu") || r.includes("admin") || r.includes("mudir") || r.includes("kabid");
  };

  const isPimpinan = () => {
    const r = (profile?.role || "").toLowerCase();
    return r.includes("admin") || r.includes("mudir") || r.includes("kabid");
  };

  const isMySantri = (s: SantriMutabaah) => {
    if (!pegawaiName) return false;
    const musyrif = (s.kelompok_halaqoh?.musyrif || "").toLowerCase();
    const pName = pegawaiName.toLowerCase();
    const parts = pName.split(" ").filter(w => w.length > 2);
    return musyrif.includes(pName) || (parts.length > 0 && parts.some(part => musyrif.includes(part)));
  };

  const uniqueKelas = Array.from(new Set(santriList.map(s => s.kelas).filter(Boolean)));
  const filteredSantri = santriList.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(q) ||
      (s.nis && s.nis.includes(search)) ||
      (s.kelompok_halaqoh?.musyrif && s.kelompok_halaqoh.musyrif.toLowerCase().includes(q));
    const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;
    const matchScope = scopeFilter === "all" || isMySantri(s);
    return matchSearch && matchKelas && matchScope;
  });

  // ─── CARD BUTTON STYLE ───
  const cardStyle: React.CSSProperties = {
    background: "white", borderRadius: 20,
    border: "1.5px solid #e8d5b7",
    boxShadow: "0 2px 12px rgba(85,0,0,0.05)",
    padding: "24px", display: "flex",
    flexDirection: "column", justifyContent: "space-between",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  return (
    <div className="page-container">

      {/* ── HERO BANNER ── */}
      <div className="hero-banner">
        <div style={{ position: "absolute", top: 0, right: 0, width: 256, height: 256, background: "rgba(221,193,146,0.15)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(30%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 192, height: 192, background: "rgba(221,193,146,0.1)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(-25%,50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(221,193,146,0.18)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(221,193,146,0.4)", width: "fit-content", marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ddc192", boxShadow: "0 0 6px rgba(221,193,146,0.9)" }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Pusat Operasional Halaqoh</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px,4vw,30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
            <BookHeart size={26} color="#ddc192" /> Halaqoh &amp; Mutabaah
          </h1>
          <p style={{ color: "rgba(253,248,240,0.85)", fontSize: 14, margin: "6px 0 0" }}>
            Rekapitulasi Capaian &amp; Harian Tahfizh Al-Qur&#39;an Pesantren Al-Imam
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(253,248,240,0.15)", padding: "10px 18px", borderRadius: 14, border: "1px solid rgba(221,193,146,0.35)", fontWeight: 700, color: "#fdf8f0", flexShrink: 0 }}>
          <CalendarDays size={16} color="#ddc192" />
          <span style={{ fontSize: 13 }}>{formatTanggal(today)}</span>
        </div>
      </div>

      {/* ── TAB SWITCHER ── */}
      <div style={{ background: "white", borderRadius: 18, padding: 6, border: "1.5px solid #e8d5b7", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", gap: 6 }}>
        {[
          { key: "sesi", icon: <Clock size={16} />, label: "Sesi & Kelompok Hari Ini" },
          { key: "mutabaah", icon: <BookOpen size={16} />, label: "Database Santri & Mutabaah" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key as "sesi" | "mutabaah")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "12px 16px", borderRadius: 13, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 800, transition: "all 0.2s",
              background: activeTab === t.key ? "#550000" : "transparent",
              color: activeTab === t.key ? "white" : "#64748b",
              boxShadow: activeTab === t.key ? "0 4px 12px rgba(85,0,0,0.25)" : "none",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — SESI & KELOMPOK HARI INI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "sesi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Hari Selasa info */}
          {hariIni === "Selasa" && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
                <strong>Hari Selasa:</strong> Halaqoh Subuh digantikan dengan <strong>Kajian</strong>. Input catatan subuh tidak diperlukan.
              </p>
            </div>
          )}

          {/* Hari Ahad info */}
          {hariIni === "Ahad" && (
            <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#065f46", margin: 0, fontWeight: 600 }}>Hari Ahad — Tidak ada jadwal halaqoh. Selamat beristirahat!</p>
            </div>
          )}

          {/* Sesi Cards */}
          {hariIni !== "Ahad" && (
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 16px" }}>
                <Clock size={18} color="#550000" /> Sesi Aktif Hari Ini
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: 8 }}>{hariIni}</span>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {sesiAktif.map(sesi => {
                  const cfg = SESI_CONFIG[sesi];
                  // Filter to ONLY show the logged-in user's own group for this session
                  const kel = kelompokList.find(k => k.sesi === sesi && (k as any).pegawai_id === pegawaiId);
                  return (
                    <div
                      key={sesi}
                      style={{ ...cardStyle, borderColor: cfg.border }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(85,0,0,0.12)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(85,0,0,0.05)"; }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                          <div style={{ width: 46, height: 46, background: cfg.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                            {cfg.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>{cfg.label}</div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{cfg.waktu}</div>
                          </div>
                        </div>
                        {kel ? (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 800, color: "#550000", fontSize: 14, marginBottom: 4 }}>{kel.nama_kelompok}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                              <Users size={14} /> {kel.anggota?.length || 0} Santri Anggota
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16, minHeight: 42 }}>
                            Belum ada kelompok halaqoh untuk sesi ini.
                          </div>
                        )}
                      </div>
                      {loading ? (
                        <div style={{ height: 44, borderRadius: 13, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
                      ) : kel ? (
                        <Link
                          href={`/halaqoh/input?kelompok=${kel.id}&sesi=${sesi}&tanggal=${tanggalStr}`}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#550000", color: "white", padding: "12px 20px", borderRadius: 13, fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 12px rgba(85,0,0,0.25)" }}
                        >
                          Isi Catatan Sesi <ArrowRight size={16} />
                        </Link>
                      ) : isPengampu() ? (
                        <Link
                          href="/halaqoh/kelompok"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#f8fafc", color: "#550000", border: "1.5px solid #e8d5b7", padding: "11px 20px", borderRadius: 13, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                        >
                          <Plus size={16} /> Atur Kelompok
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Access Links */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <ChevronRight size={18} color="#550000" /> Akses Cepat
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                ...(isPengampu() ? [{ href: "/halaqoh/kelompok", icon: <Users size={18} />, label: isPimpinan() ? "Semua Kelompok" : "Kelompok Saya", sub: isPimpinan() ? "Manajemen semua kelompok" : "Atur santri bimbingan", bg: "#fdf8f0", color: "#550000" }] : []),
                { href: "/halaqoh/ujian", icon: <Award size={18} />, label: "Ujian Tahfidz", sub: "Pekanan & Bulanan", bg: "#fffbeb", color: "#d97706" },
                { href: "/halaqoh/laporan", icon: <FileText size={18} />, label: "Cetak Rapor", sub: "Rapor Pekanan & Bulanan", bg: "#ecfdf5", color: "#059669" },
                { href: "/halaqoh/rekap", icon: <CalendarDays size={18} />, label: "Jurnal Harian", sub: "Tabel riwayat setoran", bg: "#eff6ff", color: "#0284c7" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "white", border: "1.5px solid #e8d5b7",
                    borderRadius: 16, padding: "16px 18px", textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "#550000"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(85,0,0,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "#e8d5b7"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div style={{ width: 44, height: 44, background: item.bg, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 14 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — DATABASE SANTRI & MUTABAAH
      ══════════════════════════════════════════════════════ */}
      {activeTab === "mutabaah" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {[
              { label: "Total Santri", value: santriList.length, icon: <Users size={20} />, bg: "#ecfdf5", color: "#059669", border: "#d1fae5" },
              { label: "Berhalaqoh", value: santriList.filter(s => s.kelompok_halaqoh).length, icon: <BookHeart size={20} />, bg: "#eff6ff", color: "#0284c7", border: "#dbeafe" },
              { label: "Setoran Murojaah", value: santriList.filter(s => s.last_murojaah).length, icon: <CalendarDays size={20} />, bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
              { label: "Lulus Ujian", value: santriList.filter(s => s.last_ujian?.is_lulus).length, icon: <TrendingUp size={20} />, bg: "#f5f3ff", color: "#7c3aed", border: "#ede9fe" },
            ].map(card => (
              <div key={card.label} style={{ background: "white", borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${card.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, background: card.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{loadingMutabaah ? "…" : card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div style={{ background: "white", borderRadius: 18, padding: "16px 20px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, atau pengampu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 13, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 500, outline: "none", background: "#f8fafc", color: "#1e293b" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              {isPimpinan() ? (
                <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value as "mine" | "all")}
                  style={{ padding: "10px 14px", borderRadius: 13, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700, color: "#550000", background: "#fff5f5", outline: "none", cursor: "pointer" }}>
                  <option value="all">Semua Kelompok ({santriList.length})</option>
                  <option value="mine">Kelompok Saya</option>
                </select>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 13, padding: "10px 14px" }}>
                  <UserCircle2 size={15} color="#059669" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>Kelompok Saya — {filteredSantri.length} Santri</span>
                </div>
              )}
              <select value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 13, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700, color: "#334155", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="all">Semua Kelas</option>
                {uniqueKelas.map(k => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
              <Link href="/halaqoh/laporan"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#550000", color: "white", textDecoration: "none", padding: "10px 16px", borderRadius: 13, fontSize: 13, fontWeight: 700, boxShadow: "0 4px 12px rgba(85,0,0,0.2)", whiteSpace: "nowrap" }}>
                <FileText size={15} color="#fcd34d" /> Cetak Rapor
              </Link>
            </div>
          </div>

          {/* Data Table */}
          {loadingMutabaah ? (
            <div style={{ padding: 64, textAlign: "center", background: "white", borderRadius: 18, border: "1.5px solid #e2e8f0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#550000", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
              <div style={{ fontWeight: 600, color: "#94a3b8" }}>Memuat data mutabaah...</div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={17} color="#550000" /> Database Santri &amp; Mutabaah
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: 9 }}>
                  {filteredSantri.length} dari {santriList.length} santri
                </span>
              </div>
              <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {["No", "Santri / NIS", "Kelas", "Kelompok & Pengampu", "Ziyadah Terakhir", "Murojaah Terakhir", "Ujian Pekanan", ""].map((h, i) => (
                        <th key={i} style={{ padding: "12px 16px", textAlign: (i === 0 || i === 2 || i === 6) ? "center" : i === 7 ? "right" : "left", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSantri.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 64, textAlign: "center" }}>
                          <Search size={32} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
                          <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Tidak ada data santri.</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>Coba ubah kata kunci atau filter kelas.</div>
                        </td>
                      </tr>
                    ) : filteredSantri.map((s, idx) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fdf8f0")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                      >
                        <td style={{ padding: "13px 16px", textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>{s.nama_lengkap}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>NIS: {s.nis || "—"}</div>
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "center" }}>
                          <span style={{ background: "#fdf8f0", color: "#550000", border: "1px solid #ebdcc3", padding: "4px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>
                            {s.kelas || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {s.kelompok_halaqoh ? (
                            <>
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12, marginBottom: 2 }}>{s.kelompok_halaqoh.nama}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>Pengampu: <strong style={{ color: "#334155" }}>{s.kelompok_halaqoh.musyrif}</strong></div>
                            </>
                          ) : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum diplot</span>}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {s.last_ziyadah ? (
                            <>
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12, marginBottom: 3 }}>
                                {s.last_ziyadah.surah} <span style={{ fontWeight: 400, color: "#64748b" }}>(Ayat {s.last_ziyadah.ayat_dari}–{s.last_ziyadah.ayat_ke})</span>
                              </div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 7px", borderRadius: 6 }}>{(s.last_ziyadah.tanggal || "").split("T")[0]}</span>
                                <NilaiBadge nilai={s.last_ziyadah.nilai_akhir} />
                              </div>
                            </>
                          ) : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ada setoran</span>}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {s.last_murojaah ? (
                            <>
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12, marginBottom: 3 }}>
                                {s.last_murojaah.surah} <span style={{ fontWeight: 400, color: "#64748b" }}>(Ayat {s.last_murojaah.ayat_dari}–{s.last_murojaah.ayat_ke})</span>
                              </div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 7px", borderRadius: 6 }}>{(s.last_murojaah.tanggal || "").split("T")[0]}</span>
                                <NilaiBadge nilai={s.last_murojaah.nilai_akhir} />
                              </div>
                            </>
                          ) : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ada setoran</span>}
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "center" }}>
                          {s.last_ujian ? (
                            <span style={{ padding: "4px 10px", borderRadius: 9, fontSize: 12, fontWeight: 700, ...(s.last_ujian.is_lulus ? { background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" } : { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }) }}>
                              {s.last_ujian.nilai_akhir} · {s.last_ujian.is_lulus ? "Lulus" : "Mengulang"}
                            </span>
                          ) : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum ujian</span>}
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "right" }}>
                          <Link
                            href={`/tahfidz/mutabaah/detail/${s.id}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", color: "#334155", textDecoration: "none", padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", whiteSpace: "nowrap", transition: "all 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#550000"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                          >
                            <FileText size={13} /> Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
