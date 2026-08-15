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

const SESI_INFO: Record<string, { label: string; waktu: string; icon: React.ReactNode; color: string; bg: string; textClass: string; bgClass: string }> = {
  subuh: { label: "Halaqoh Subuh", waktu: "04.50 – 06.10", icon: <Sun size={20} />, color: "#d97706", bg: "#fffbeb", textClass: "text-amber-600", bgClass: "bg-amber-50" },
  maghrib: { label: "Ba'da Maghrib", waktu: "Ba'da Maghrib", icon: <Moon size={20} />, color: "#7c3aed", bg: "#f5f3ff", textClass: "text-violet-600", bgClass: "bg-violet-50" },
  dhuha: { label: "Halaqoh Dhuha", waktu: "07.00 – 08.20", icon: <Cloud size={20} />, color: "#0284c7", bg: "#eff6ff", textClass: "text-sky-600", bgClass: "bg-sky-50" },
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
    sesi.push("dhuha");
    sesi.push("maghrib");
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
  }, [tabParam, activeTab]);

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

  const isPengampuHalaqoh = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("guru") || role.includes("musyrif") || role.includes("pengampu");
  };

  const isPimpinan = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("mudir") || role.includes("kabid_pengasuhan");
  };

  const getNilaiBadge = (nilai?: number | null) => {
    if (!nilai) return <span className="text-[11px] font-medium text-slate-400">Belum ada setoran</span>;
    if (nilai >= 90) return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">{nilai} · Sangat Baik</span>;
    if (nilai >= 80) return <span className="bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">{nilai} · Baik</span>;
    if (nilai >= 70) return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">{nilai} · Cukup</span>;
    return <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-lg text-[11px] font-bold">{nilai} · Perlu Bimbingan</span>;
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#550000] via-[#751414] to-[#3a0000] rounded-3xl p-6 sm:p-8 text-white shadow-[0_12px_40px_rgba(85,0,0,0.35)] border border-red-500/20">
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-inner">
              <BookHeart className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-200 mb-2">
                <span>Pusat Operasional Halaqoh</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">Halaqoh & Mutabaah Tahfidz</h1>
              <p className="text-red-100 text-xs sm:text-sm font-medium mt-1 opacity-90">Rekapitulasi Capaian & Harian Tahfizh Al-Qur'an Pesantren Al-Imam</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 w-fit">
            <CalendarDays className="w-4 h-4 text-amber-300" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">{formatTanggal(today)}</span>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION SWITCHER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-100/80 p-2 rounded-2xl border border-slate-200/80 shadow-inner">
        <button
          onClick={() => handleTabChange("sesi")}
          className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === "sesi"
              ? "bg-[#550000] text-white shadow-md shadow-red-950/20 border border-red-900"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Sun className="w-4 h-4" /> Sesi & Kelompok Pengampu
        </button>
        <button
          onClick={() => handleTabChange("mutabaah")}
          className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-200 cursor-pointer ${
            activeTab === "mutabaah"
              ? "bg-[#550000] text-white shadow-md shadow-red-950/20 border border-red-900"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Database Santri & Rapor
        </button>
      </div>

      {/* ─── TAB 1: SESI & KELOMPOK PENGAMPU ───────────────────────────────── */}
      {activeTab === "sesi" && (
        <div className="space-y-6">
          {/* Banner Informasi Dimulainya Mutabaah & Wajib Ujian Pekanan */}
          <div className="flex items-start gap-4 bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900 mb-1.5">📌 Pengumuman Resmi Pengisian Mutabaah Tahfidz</h3>
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                Pengisian <strong className="font-bold">Catatan Mutabaah Sesi Harian (Subuh, Magrib, Dhuha)</strong> secara efektif dimulai pada <strong className="font-bold">Senin Subuh, 17 Agustus 2026</strong>.
                <br className="hidden sm:block" />
                <span className="mt-1 block sm:inline">
                  ⚡ <strong className="font-bold">Penting:</strong> Input <strong className="font-bold">Ujian Pekanan</strong> yang telah lewat dan Ujian Pekanan hari <strong className="font-bold">Sabtu, 15 Agustus 2026</strong> <u className="font-bold">TETAP WAJIB UNTUK DIISI</u> oleh seluruh Pengampu.
                </span>
              </p>
            </div>
          </div>

          {hariIni === "Selasa" && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong className="font-bold">Hari Selasa:</strong> Halaqoh Subuh digantikan dengan <strong className="font-bold">Kajian</strong>. Input catatan subuh tidak diperlukan.
              </p>
            </div>
          )}

          {hariIni === "Ahad" && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">Hari Ahad — Tidak ada jadwal halaqoh. Selamat beristirahat!</p>
            </div>
          )}

          {hariIni !== "Ahad" && (
            <div>
              <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-800 mb-5">
                <Clock className="w-5 h-5 text-indigo-600" /> Sesi Aktif Hari Ini
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sesiAktif.map((sesi) => {
                  const info = SESI_INFO[sesi];
                  const kel = kelompokList.find((k) => k.sesi === sesi);
                  return (
                    <div
                      key={sesi}
                      className={`bg-white rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
                        kel ? "border-2 border-indigo-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:border-indigo-300 hover:shadow-lg" : "border border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 mb-5">
                        <div className={`${info.bgClass} ${info.textClass} p-3 rounded-xl`}>
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{info.label}</h3>
                          <p className="text-xs sm:text-sm font-medium text-slate-500">{info.waktu}</p>
                        </div>
                      </div>

                      {kel ? (
                        <div>
                          <div className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">
                            {kel.nama_kelompok}
                          </div>
                          <div className="text-xs font-medium text-slate-500 mb-5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {kel.anggota?.length || 0} Santri Anggota
                          </div>
                          <Link
                            href={`/halaqoh/input?kelompok=${kel.id}&sesi=${sesi}&tanggal=${tanggalStr}`}
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-100"
                          >
                            Isi Catatan Sesi <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-slate-400 mb-4 h-[42px]">
                            Belum ada kelompok halaqoh untuk sesi ini.
                          </div>
                          {isPengampuHalaqoh() && (
                            <Link
                              href="/halaqoh/kelompok"
                              className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-sm transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Atur Kelompok
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8">
            {isPengampuHalaqoh() && (
              <Link href="/halaqoh/kelompok" className="group flex items-center gap-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
                <div className="bg-slate-50 group-hover:bg-indigo-50 p-2.5 rounded-xl transition-colors">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Kelompok Saya</div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-500">Atur santri bimbingan</div>
                </div>
              </Link>
            )}
            <Link href="/halaqoh/ujian" className="group flex items-center gap-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
              <div className="bg-slate-50 group-hover:bg-emerald-50 p-2.5 rounded-xl transition-colors">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Ujian Tahfidz</div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500">Pekanan & Bulanan</div>
              </div>
            </Link>
            <Link href="/halaqoh/laporan" className="group flex items-center gap-4 bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
              <div className="bg-slate-50 group-hover:bg-violet-50 p-2.5 rounded-xl transition-colors">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Cetak Rapor Santri</div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500">Rapor Pekanan & Bulanan</div>
              </div>
            </Link>
            <Link href="/halaqoh/rekap" className="group flex items-center gap-4 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
              <div className="bg-slate-50 group-hover:bg-sky-50 p-2.5 rounded-xl transition-colors">
                <CalendarDays className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Jurnal Harian</div>
                <div className="text-[11px] sm:text-xs font-medium text-slate-500">Tabel riwayat setoran</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DATABASE SANTRI & RAPOR ────────────────────────── */}
      {activeTab === "mutabaah" && (
        <div className="space-y-5">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, atau pengampu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-shadow"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isPimpinan() ? (
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as "mine" | "all")}
                  className="px-3.5 py-2.5 rounded-xl border-2 border-indigo-200 text-sm font-bold text-indigo-700 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="all">🌐 Semua Kelompok ({santriList.length} Santri)</option>
                  <option value="mine">🟢 Kelompok Saya</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-3.5 py-2">
                  <span className="text-sm">🟢</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 whitespace-nowrap">
                    Kelompok Saya — {filteredSantri.length} Santri
                  </span>
                </div>
              )}

              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {uniqueKelas.map((k) => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>

              <Link
                href="/halaqoh/laporan"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 transition-colors whitespace-nowrap"
              >
                <FileText className="w-4 h-4" /> Cetak Rapor
              </Link>
            </div>
          </div>

          {/* Table Mutabaah */}
          {loadingMutabaah ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Memuat data mutabaah hafalan...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="px-5 py-4 w-12 text-center">No</th>
                      <th className="px-5 py-4">Santri / NIS</th>
                      <th className="px-5 py-4 text-center">Kelas</th>
                      <th className="px-5 py-4">Kelompok & Pengampu</th>
                      <th className="px-5 py-4">Setoran Ziyadah</th>
                      <th className="px-5 py-4">Setoran Murojaah</th>
                      <th className="px-5 py-4 text-center">Ujian Pekanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSantri.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{s.nama_lengkap}</div>
                          <div className="text-[11px] font-medium text-slate-500 mt-0.5">NIS: {s.nis || "-"}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                            {s.kelas || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {s.kelompok_halaqoh ? (
                            <div>
                              <div className="font-bold text-slate-700 text-xs mb-0.5">{s.kelompok_halaqoh.nama}</div>
                              <div className="text-[11px] font-bold text-emerald-600">Pengampu: {s.kelompok_halaqoh.musyrif}</div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Belum diplot</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {s.last_ziyadah ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs mb-1">{s.last_ziyadah.surah} (Ayat {s.last_ziyadah.ayat_dari}-{s.last_ziyadah.ayat_ke})</div>
                              <div className="text-[11px] font-medium text-slate-500">{s.last_ziyadah.tanggal}</div>
                            </div>
                          ) : (
                            getNilaiBadge(null)
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {s.last_murojaah ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs mb-1">{s.last_murojaah.surah} (Ayat {s.last_murojaah.ayat_dari}-{s.last_murojaah.ayat_ke})</div>
                              <div className="text-[11px] font-medium text-slate-500">{s.last_murojaah.tanggal}</div>
                            </div>
                          ) : (
                            getNilaiBadge(null)
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {s.last_ujian ? (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              s.last_ujian.is_lulus ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              Nilai: {s.last_ujian.nilai_akhir} ({s.last_ujian.is_lulus ? "Lulus" : "Mengulang"})
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">Belum ujian</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSantri.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">Tidak ada data santri ditemukan.</span>
                          </div>
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
