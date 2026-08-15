"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookHeart, ArrowLeft, Search, CalendarDays, Users, TrendingUp, Filter, Download, ChevronDown } from "lucide-react";
import Link from "next/link";

const SESI_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  subuh:   { label: "Subuh",   color: "#d97706", bg: "#fffbeb" },
  maghrib: { label: "Maghrib", color: "#7c3aed", bg: "#f5f3ff" },
  dhuha:   { label: "Dhuha",   color: "#0284c7", bg: "#eff6ff" },
};

const KEHADIRAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  hadir: { label: "Hadir", color: "#059669", bg: "#ecfdf5" },
  sakit: { label: "Sakit", color: "#d97706", bg: "#fffbeb" },
  izin:  { label: "Izin",  color: "#0284c7", bg: "#eff6ff" },
  alfa:  { label: "Alfa",  color: "#dc2626", bg: "#fef2f2" },
};

interface CatatanRow {
  id: string;
  tanggal: string;
  sesi: string;
  jenis: string;
  surah_nama: string;
  surah_nama_arab: string;
  ayat_dari: number;
  ayat_ke: number;
  jumlah_halaman: number;
  kehadiran: string;
  alasan?: string;
  nilai_sikap: string;
  nilai_kelancaran: number;
  nilai_bacaan: number;
  nilai_akhir: number;
  catatan?: string;
  santri: { nama_lengkap: string; nis?: string };
  pegawai: { nama_lengkap: string };
}

interface Kelompok {
  id: string;
  nama_kelompok: string;
  sesi: string;
}

export default function HalaqohRekapPage() {
  const [catatan, setCatatan] = useState<CatatanRow[]>([]);
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.substring(0, 8) + "01";
  const [filterDari, setFilterDari] = useState(firstOfMonth);
  const [filterSampai, setFilterSampai] = useState(today);
  const [filterKelompok, setFilterKelompok] = useState("");
  const [filterSesi, setFilterSesi] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const fetchCatatan = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDari) params.set("dari", filterDari);
      if (filterSampai) params.set("sampai", filterSampai);
      if (filterKelompok) params.set("kelompok_id", filterKelompok);
      if (filterSesi) params.set("sesi", filterSesi);
      const res = await fetch(`/api/halaqoh/catatan?${params.toString()}`);
      const data = await res.json();
      setCatatan(Array.isArray(data) ? data : data.catatan || []);
    } finally {
      setLoading(false);
    }
  }, [filterDari, filterSampai, filterKelompok, filterSesi]);

  useEffect(() => {
    fetch("/api/halaqoh/kelompok")
      .then(r => r.json())
      .then(data => setKelompokList(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => { fetchCatatan(); }, [fetchCatatan]);

  const filtered = catatan.filter(c =>
    filterSearch === "" ||
    c.santri.nama_lengkap.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.santri.nis || "").toLowerCase().includes(filterSearch.toLowerCase())
  );

  // Stats
  const totalHadir = filtered.filter(c => c.kehadiran === "hadir").length;
  const totalAlfa = filtered.filter(c => c.kehadiran === "alfa").length;
  const avgNilai = filtered.length > 0
    ? (filtered.reduce((a, c) => a + c.nilai_akhir, 0) / filtered.length).toFixed(1)
    : "-";
  const totalHalaman = filtered.reduce((a, c) => a + c.jumlah_halaman, 0).toFixed(1);

  const formatTanggal = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 font-sans">
      {/* Back */}
      <Link href="/halaqoh" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 font-medium transition-colors">
        <ArrowLeft size={14} /> Kembali ke Halaqoh
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#550000] to-[#7a0000] rounded-2xl md:rounded-3xl p-6 md:p-7 mb-6 text-white shadow-xl shadow-[#550000]/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={24} className="text-white/90" />
            <h1 className="m-0 text-xl md:text-2xl font-extrabold tracking-tight">Rekap Catatan Halaqoh</h1>
          </div>
          <p className="mt-2 text-sm text-white/80 font-medium">
            Riwayat & statistik setoran santri
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Catatan", value: filtered.length, color: "text-[#550000]", icon: <BookHeart size={20} /> },
          { label: "Hadir", value: totalHadir, color: "text-emerald-600", icon: <Users size={20} /> },
          { label: "Alfa", value: totalAlfa, color: "text-red-600", icon: <Users size={20} /> },
          { label: "Total Halaman", value: totalHalaman, color: "text-sky-600", icon: <CalendarDays size={20} /> },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white/90 backdrop-blur">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
                <div className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</div>
              </div>
              <div className={`${s.color} opacity-70`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur rounded-2xl md:rounded-3xl p-5 md:p-6 mb-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div className="w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Dari Tanggal</label>
            <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)}
              className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all bg-white" />
          </div>
          <div className="w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sampai Tanggal</label>
            <input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)}
              className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all bg-white" />
          </div>
          <div className="w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Kelompok</label>
            <select value={filterKelompok} onChange={e => setFilterKelompok(e.target.value)}
              className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white md:min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all">
              <option value="">Semua Kelompok</option>
              {kelompokList.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kelompok}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sesi</label>
            <select value={filterSesi} onChange={e => setFilterSesi(e.target.value)}
              className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all">
              <option value="">Semua Sesi</option>
              <option value="subuh">Subuh</option>
              <option value="maghrib">Maghrib</option>
              <option value="dhuha">Dhuha</option>
            </select>
          </div>
          <div className="w-full md:flex-1 md:min-w-[200px]">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Cari Santri</label>
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                placeholder="Nama atau NIS..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                {["Tanggal", "Santri", "Sesi", "Jenis", "Materi", "Hlm.", "Kehadiran", "Lancar", "Bacaan", "Sikap", "Akhir"].map((h, i) => (
                  <th key={i} className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400 font-medium">Memuat catatan...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-14 text-slate-400">
                    <BookHeart size={36} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    <span className="font-medium text-sm">Belum ada catatan halaqoh</span>
                  </td>
                </tr>
              ) : filtered.map((row, i) => {
                const sesi = SESI_BADGE[row.sesi] || SESI_BADGE.subuh;
                const had = KEHADIRAN_BADGE[row.kehadiran] || KEHADIRAN_BADGE.hadir;
                const isExcellent = row.nilai_akhir >= 85;
                const isGood = row.nilai_akhir >= 70 && row.nilai_akhir < 85;
                const isFair = row.nilai_akhir >= 55 && row.nilai_akhir < 70;
                const isPoor = row.nilai_akhir < 55;
                
                let nilaiStyle = isExcellent ? "text-emerald-600 bg-emerald-50" : isGood ? "text-sky-600 bg-sky-50" : isFair ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

                return (
                  <tr key={row.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-50 transition-colors`}>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">{formatTanggal(row.tanggal)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{row.santri.nama_lengkap}</div>
                      {row.santri.nis && <div className="text-xs text-slate-400">{row.santri.nis}</div>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: sesi.bg, color: sesi.color }}>
                        {sesi.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-bold capitalize ${row.jenis === "ziyadah" ? "text-emerald-600" : "text-violet-600"}`}>
                        {row.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{row.surah_nama}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Ayat {row.ayat_dari}–{row.ayat_ke}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-sky-600">{row.jumlah_halaman}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: had.bg, color: had.color }}>
                        {had.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-600 text-center">{row.nilai_kelancaran}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-600 text-center">{row.nilai_bacaan}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-600 text-center text-xs">{row.nilai_sikap}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className={`font-extrabold text-sm px-3 py-1 rounded-lg ${nilaiStyle}`}>
                        {row.nilai_akhir}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
            <span className="font-medium">Menampilkan {filtered.length} catatan</span>
            <span className="font-medium">Rata-rata nilai: <strong className="text-[#550000] font-bold text-sm ml-1">{avgNilai}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
