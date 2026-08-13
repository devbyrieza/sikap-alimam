"use client";

import React, { useState, useEffect } from "react";
import { 
  BookHeart, 
  Sun, 
  Moon, 
  Cloud, 
  CalendarDays, 
  Users, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  FileText,
  BookOpen,
  Search,
  ChevronRight,
  BarChart3,
  Filter
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
    sesi: string;
    surah: string;
    ayat_dari: number;
    ayat_ke: number;
    nilai_akhir: number;
  } | null;
  last_murojaah: {
    tanggal: string;
    sesi: string;
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

const SESI_INFO: Record<string, { label: string; waktu: string; icon: React.ReactNode; color: string; bg: string }> = {
  subuh: { label: "Halaqoh Subuh", waktu: "04.50 – 06.10", icon: <Sun size={20} />, color: "#d97706", bg: "#fffbeb" },
  maghrib: { label: "Ba'da Maghrib", waktu: "Ba'da Maghrib", icon: <Moon size={20} />, color: "#7c3aed", bg: "#f5f3ff" },
  dhuha: { label: "Halaqoh Dhuha", waktu: "07.00 – 08.20", icon: <Cloud size={20} />, color: "#0284c7", bg: "#eff6ff" },
};

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

  // Mutabaah Tab State
  const [santriList, setSantriList] = useState<SantriMutabaah[]>([]);
  const [loadingMutabaah, setLoadingMutabaah] = useState(false);
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");

  const [scopeFilter, setScopeFilter] = useState<"mine" | "all">("mine");
  const [pegawaiName, setPegawaiName] = useState<string>("");

  const getSesiAktifHariIni = (): string[] => {
    if (hariIni === "Ahad") return [];
    const sesi: string[] = [];
    if (hariIni !== "Selasa") sesi.push("subuh");
    sesi.push("maghrib");
    if (hariIni === "Rabu" || hariIni === "Sabtu") sesi.push("dhuha");
    return sesi;
  };

  const sesiAktif = getSesiAktifHariIni();
  const tanggalStr = today.toISOString().split("T")[0];

  useEffect(() => {
    if (tabParam === "mutabaah" && activeTab !== "mutabaah") {
      setActiveTab("mutabaah");
    } else if (tabParam !== "mutabaah" && activeTab !== "sesi") {
      setActiveTab("sesi");
    }
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
      const name = p?.nama_lengkap || u?.nama || "";
      setPegawaiName(name);

      const r = (u?.role || "").toLowerCase();
      // If admin/mudir/kabid/wali_kelas, default to "all", else default to "mine"
      if (r.includes("admin") || r.includes("mudir") || r.includes("kabid") || r.includes("wali")) {
        setScopeFilter("all");
      } else {
        setScopeFilter("mine");
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "mutabaah") {
      setLoadingMutabaah(true);
      fetch("/api/tahfidz/mutabaah")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSantriList(data);
        })
        .catch((err) => console.error("Gagal memuat mutabaah:", err))
        .finally(() => setLoadingMutabaah(false));
    }
  }, [activeTab]);

  const handleTabChange = (tab: "sesi" | "mutabaah") => {
    setActiveTab(tab);
    router.push(`/halaqoh?tab=${tab}`);
  };

  const formatTanggal = (d: Date) =>
    d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Pengampu Halaqoh: guru sekaligus pengampu (Iqbal, Agus, Imron, Wahyudi)
  // + pengabdian/musyrif pengampu (Ikhwan)
  const isPengampuHalaqoh = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("guru") || role.includes("musyrif") || role.includes("pengampu");
  };

  // Pimpinan: Admin Super, Mudir, dan Kabid Pengasuhan
  const isPimpinan = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("mudir") || role.includes("kabid_pengasuhan");
  };

  const getNilaiBadge = (nilai?: number | null) => {
    if (!nilai) return <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ada setoran</span>;
    if (nilai >= 90) return <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Sangat Baik</span>;
    if (nilai >= 80) return <span style={{ background: "#eff6ff", color: "#0284c7", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Baik</span>;
    if (nilai >= 70) return <span style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Cukup</span>;
    return <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{nilai} · Perlu Bimbingan</span>;
  };

  const isMySantri = (s: SantriMutabaah) => {
    if (!pegawaiName) return false;
    const musyrif = (s.kelompok_halaqoh?.musyrif || "").toLowerCase();
    const pName = pegawaiName.toLowerCase();
    const parts = pName.split(" ").filter(w => w.length > 2);
    return musyrif.includes(pName) || (parts.length > 0 && parts.some(part => musyrif.includes(part)));
  };

  const uniqueKelas = Array.from(new Set(santriList.map((s) => s.kelas).filter(Boolean)));
  const filteredSantri = santriList.filter((s) => {
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      (s.nis && s.nis.includes(search)) ||
      (s.kelompok_halaqoh?.musyrif && s.kelompok_halaqoh.musyrif.toLowerCase().includes(search.toLowerCase()));

    const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;
    const matchScope = scopeFilter === "all" || isMySantri(s);

    return matchSearch && matchKelas && matchScope;
  });


  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 24,
        padding: "26px 30px",
        marginBottom: 20,
        color: "white",
        boxShadow: "0 8px 32px rgba(85,0,0,0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10, backdropFilter: "blur(10px)" }}>
              <BookHeart size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Halaqoh & Mutabaah Tahfidz</h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8, marginTop: 2 }}>Pusat Operational & Rekapitulasi Tahfizh Al-Qur'an Pesantren Al-Imam</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, opacity: 0.85 }}>
            <CalendarDays size={14} />
            <span>{formatTanggal(today)}</span>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION SWITCHER ────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, background: "#f1f5f9", padding: 6, borderRadius: 16,
        marginBottom: 24, border: "1px solid #e2e8f0"
      }}>
        <button
          onClick={() => handleTabChange("sesi")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 18px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "sesi" ? "white" : "transparent",
            color: activeTab === "sesi" ? "#550000" : "#64748b",
            boxShadow: activeTab === "sesi" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
          }}
        >
          <Sun size={18} /> Sesi & Kelompok Pengampu
        </button>
        <button
          onClick={() => handleTabChange("mutabaah")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 18px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
            background: activeTab === "mutabaah" ? "white" : "transparent",
            color: activeTab === "mutabaah" ? "#550000" : "#64748b",
            boxShadow: activeTab === "mutabaah" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
          }}
        >
          <BookOpen size={18} /> Rekap Mutabaah & Laporan Santri
        </button>
      </div>

      {/* ─── TAB 1: SESI & KELOMPOK PENGAMPU ───────────────────────────────── */}
      {activeTab === "sesi" && (
        <>
          {/* Banner Informasi Dimulainya Mutabaah & Wajib Ujian Pekanan */}
          <div style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1.5px solid #93c5fd", borderRadius: 18, padding: "16px 20px",
            marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 14,
            color: "#1e3a8a", boxShadow: "0 2px 10px rgba(59,130,246,0.08)"
          }}>
            <div style={{ background: "#2563eb", color: "white", padding: 8, borderRadius: 12, flexShrink: 0, marginTop: 2 }}>
              <CalendarDays size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", marginBottom: 4 }}>
                📌 Pengumuman Resmi Pengisian Mutabaah Tahfidz
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#1e3a8a" }}>
                Pengisian <strong>Catatan Mutabaah Sesi Harian (Subuh, Magrib, Dhuha)</strong> secara efektif dimulai pada <strong>Senin Subuh, 17 Agustus 2026</strong>.
                <br />
                ⚡ <strong>Penting:</strong> Input <strong>Ujian Pekanan</strong> yang telah lewat dan Ujian Pekanan hari <strong>Sabtu, 15 Agustus 2026</strong> <u>TETAP WAJIB UNTUK DIISI</u> oleh seluruh Pengampu.
              </div>
            </div>
          </div>

          {hariIni === "Selasa" && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px",
              marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#92400e"
            }}>
              <AlertCircle size={18} />
              <div>
                <strong>Hari Selasa:</strong> Halaqoh Subuh digantikan dengan <strong>Kajian</strong>. Input catatan subuh tidak diperlukan.
              </div>
            </div>
          )}

          {hariIni === "Ahad" && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "14px 18px",
              marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#065f46"
            }}>
              <CheckCircle2 size={18} />
              <span>Hari Ahad — Tidak ada jadwal halaqoh. Selamat beristirahat!</span>
            </div>
          )}

          {hariIni !== "Ahad" && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color="#550000" /> Sesi Aktif Hari Ini
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {sesiAktif.map((sesi) => {
                  const info = SESI_INFO[sesi];
                  const kel = kelompokList.find((k) => k.sesi === sesi);
                  return (
                    <div
                      key={sesi}
                      style={{
                        background: "white", borderRadius: 20, padding: 22,
                        border: `1.5px solid ${kel ? "#cbd5e1" : "#e2e8f0"}`,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{ background: info.bg, color: info.color, padding: 10, borderRadius: 12 }}>
                          {info.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{info.label}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{info.waktu}</div>
                        </div>
                      </div>

                      {kel ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                            {kel.nama_kelompok}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                            {kel.anggota?.length || 0} Santri Anggota
                          </div>
                          <Link
                            href={`/halaqoh/input?kelompok=${kel.id}&sesi=${sesi}&tanggal=${tanggalStr}`}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
                              color: "white", padding: "10px 16px", borderRadius: 12,
                              fontWeight: 700, fontSize: 13, textDecoration: "none",
                              boxShadow: "0 4px 12px rgba(85,0,0,0.25)"
                            }}
                          >
                            Isi Catatan Sesi <ArrowRight size={14} />
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                            Belum ada kelompok halaqoh untuk sesi ini.
                          </div>
                          {isPengampuHalaqoh() && (
                            <Link
                              href="/halaqoh/kelompok"
                              style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "#f1f5f9", color: "#475569", padding: "9px 14px",
                                borderRadius: 10, fontWeight: 600, fontSize: 12, textDecoration: "none",
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              <Plus size={13} /> Atur Kelompok
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {isPengampuHalaqoh() && (
              <Link href="/halaqoh/kelompok" style={{
                display: "flex", alignItems: "center", gap: 12, background: "white",
                border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
                textDecoration: "none", color: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 8 }}>
                  <Users size={18} color="#550000" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Kelompok Saya</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Atur santri bimbingan</div>
                </div>
              </Link>
            )}
            <Link href="/halaqoh/ujian" style={{
              display: "flex", alignItems: "center", gap: 12, background: "white",
              border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
              textDecoration: "none", color: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 8 }}>
                <Award size={18} color="#047857" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Ujian Tahfidz</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Pekanan, Bulanan, & Itqon</div>
              </div>
            </Link>
            <Link href="/halaqoh/laporan" style={{
              display: "flex", alignItems: "center", gap: 12, background: "white",
              border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
              textDecoration: "none", color: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 8 }}>
                <FileText size={18} color="#7c3aed" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Cetak Laporan</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Rekap Pekanan & Rapor</div>
              </div>
            </Link>
            <Link href="/halaqoh/rekap" style={{
              display: "flex", alignItems: "center", gap: 12, background: "white",
              border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 20px",
              textDecoration: "none", color: "#1e293b", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 8 }}>
                <CalendarDays size={18} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Rekap Catatan</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Riwayat & statistik</div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ─── TAB 2: REKAP MUTABAAH & LAPORAN SANTRI ────────────────────────── */}
      {activeTab === "mutabaah" && (
        <div>
          {/* Filter & Search Bar */}
          <div style={{
            background: "white", borderRadius: 18, padding: "16px 20px",
            border: "1.5px solid #e2e8f0", marginBottom: 20, display: "flex",
            flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14
          }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: 12 }} />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, atau pengampu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px 10px 40px", borderRadius: 12,
                  border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isPimpinan() ? (
                /* Pimpinan: dropdown bebas pilih scope */
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as "mine" | "all")}
                  style={{
                    padding: "10px 14px", borderRadius: 12, border: "1.5px solid #0284c7",
                    fontSize: 13, fontWeight: 700, color: "#0369a1", background: "#f0f9ff"
                  }}
                >
                  <option value="all">🌐 Semua Kelompok ({santriList.length} Santri)</option>
                  <option value="mine">🟢 Kelompok Saya</option>
                </select>
              ) : (
                /* Pengampu: terkunci hanya tampil santri bimbingannya */
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f0fdf4", border: "1.5px solid #86efac",
                  borderRadius: 12, padding: "8px 14px"
                }}>
                  <span style={{ fontSize: 16 }}>🟢</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                    Kelompok Saya — {filteredSantri.length} Santri Bimbingan
                  </span>
                </div>
              )}

              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1",
                  fontSize: 13, fontWeight: 600, color: "#334155"
                }}
              >
                <option value="all">Semua Kelas</option>
                {uniqueKelas.map((k) => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>

              <Link
                href="/halaqoh/laporan"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#f1f5f9", color: "#334155", padding: "10px 16px",
                  borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: "none",
                  border: "1px solid #cbd5e1"
                }}
              >
                <FileText size={14} /> Cetak Rapor Tahfidz
              </Link>
            </div>
          </div>


          {/* Table Mutabaah */}
          {loadingMutabaah ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Memuat data mutabaah hafalan santri...
            </div>
          ) : (
            <div style={{
              background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0",
              overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13, minWidth: 1000 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>No</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Santri / NIS</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Kelas</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Kelompok & Pengampu</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Setoran Ziyadah Terakhir</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Setoran Murojaah Terakhir</th>
                      <th style={{ padding: "16px", whiteSpace: "nowrap" }}>Ujian Pekanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSantri.map((s, idx) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px", fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" }}>{idx + 1}</td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{s.nama_lengkap}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>NIS: {s.nis || "-"}</div>
                        </td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          <span style={{
                            background: "#f1f5f9", color: "#334155", padding: "3px 10px",
                            borderRadius: 8, fontSize: 12, fontWeight: 700
                          }}>
                            {s.kelas || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {s.kelompok_halaqoh ? (
                            <div>
                              <div style={{ fontWeight: 600, color: "#334155" }}>{s.kelompok_halaqoh.nama}</div>
                              <div style={{ fontSize: 11, color: "#059669" }}>Pengampu: {s.kelompok_halaqoh.musyrif}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Belum diplot</span>
                          )}

                        </td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {s.last_ziyadah ? (
                            <div>
                              <div style={{ fontWeight: 600, color: "#1e293b" }}>{s.last_ziyadah.surah} (Ayat {s.last_ziyadah.ayat_dari}-{s.last_ziyadah.ayat_ke})</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.last_ziyadah.tanggal}</div>
                            </div>
                          ) : (
                            getNilaiBadge(null)
                          )}
                        </td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {s.last_murojaah ? (
                            <div>
                              <div style={{ fontWeight: 600, color: "#1e293b" }}>{s.last_murojaah.surah} (Ayat {s.last_murojaah.ayat_dari}-{s.last_murojaah.ayat_ke})</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.last_murojaah.tanggal}</div>
                            </div>
                          ) : (
                            getNilaiBadge(null)
                          )}
                        </td>
                        <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                          {s.last_ujian ? (
                            <span style={{
                              background: s.last_ujian.is_lulus ? "#ecfdf5" : "#fef2f2",
                              color: s.last_ujian.is_lulus ? "#059669" : "#dc2626",
                              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700
                            }}>
                              Nilai: {s.last_ujian.nilai_akhir} ({s.last_ujian.is_lulus ? "Lulus" : "Mengulang"})
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Belum ujian</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSantri.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                          Tidak ada data santri ditemukan.
                        </td>
                      </tr>
                    )}
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
