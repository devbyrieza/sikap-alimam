"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BookHeart, ArrowLeft, Search, CalendarDays, Award, CheckCircle2, AlertCircle, Save, Star, ShieldCheck, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";

const JENIS_UJIAN_OPT = [
  { val: "ujian_pekanan", label: "Ujian Pekanan", target: "2 Halaman",             icon: <Clock size={16} />,       color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", borderActive: "border-amber-500" },
  { val: "ujian_bulanan", label: "Ujian Bulanan", target: "10 Halaman",            icon: <CalendarDays size={16} />, color: "text-sky-700", bg: "bg-blue-50", border: "border-blue-200", borderActive: "border-sky-500" },
  { val: "ujian_target",  label: "Ujian Target",  target: "Sesuai Target Kelas",   icon: <Award size={16} />,        color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", borderActive: "border-violet-500" },
  { val: "ujian_itqon",   label: "Ujian Itqon",   target: "per 5 Juz (Bonus +10)", icon: <Star size={16} />,         color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", borderActive: "border-cyan-500" },
];

const OPSI_NILAI = [100, 98, 95, 90, 85, 80, 75, 70, 65, 60] as const;

function getPredikat(nilai: number) {
  if (nilai >= 98) return { label: "Sangat Baik", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", borderActive: "border-emerald-500" };
  if (nilai >= 90) return { label: "Baik", color: "text-sky-700", bg: "bg-blue-50", border: "border-blue-200", borderActive: "border-sky-500" };
  if (nilai === 85) return { label: "Cukup", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", borderActive: "border-green-500" };
  if (nilai >= 75) return { label: "Kurang", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", borderActive: "border-amber-500" };
  return { label: "Sangat Kurang", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", borderActive: "border-red-500" };
}

function NumericScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const predikat = getPredikat(value);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-[11px] font-semibold text-slate-500">{label}</div>
        <div className={`text-[10px] font-bold px-2 py-[3px] rounded-md border ${predikat.bg} ${predikat.color} ${predikat.border}`}>
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {OPSI_NILAI.map(num => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border-[1.5px] transition-all duration-150 ${
              value === num ? `${predikat.bg} ${predikat.color} ${predikat.borderActive}` : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

const OPSI_SIKAP = [
  { value: 100, label: "Sangat Baik" },
  { value: 90, label: "Baik" },
  { value: 80, label: "Cukup" },
  { value: 70, label: "Kurang" },
  { value: 60, label: "Sangat Kurang" },
];

function TextScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const predikat = getPredikat(value);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-[11px] font-semibold text-slate-500">{label}</div>
        <div className={`text-[10px] font-bold px-2 py-[3px] rounded-md border ${predikat.bg} ${predikat.color} ${predikat.border}`}>
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {OPSI_SIKAP.map(opsi => (
          <button
            key={opsi.value}
            onClick={() => onChange(opsi.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border-[1.5px] transition-all duration-150 ${
              value === opsi.value ? `${predikat.bg} ${predikat.color} ${predikat.borderActive}` : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opsi.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
  kelas?: { nama: string };
  pengampu_id?: string;
}

interface Surah {
  nomor: number;
  nama_latin: string;
  nama_arab: string;
  total_ayat: number;
}

function SurahPicker({
  surahList,
  selected,
  onSelect,
  label = "Pilih Surah",
}: {
  surahList: Surah[];
  selected: Surah | null;
  onSelect: (s: Surah) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = surahList.filter(s =>
    query === "" ||
    s.nama_latin.toLowerCase().includes(query.toLowerCase()) ||
    s.nama_arab.includes(query) ||
    String(s.nomor) === query
  ).slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</label>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] select-none hover:border-slate-300 transition-colors"
      >
        {selected ? (
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-800">
              {selected.nomor}. {selected.nama_latin}
            </span>
            <span className="text-[15px] text-slate-400 font-serif">{selected.nama_arab}</span>
          </div>
        ) : (
          <span className="text-slate-400">Cari surah...</span>
        )}
        <ChevronDown size={15} className="text-slate-400" />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor..."
                className="w-full py-2 pr-2.5 pl-8 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 transition-all"
              />
            </div>
          </div>
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
            {filtered.map(s => (
              <div
                key={s.nomor}
                onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                className="px-4 py-2.5 cursor-pointer border-b border-slate-50 flex items-center gap-3.5 transition-colors hover:bg-slate-50"
              >
                <div className="w-[30px] h-[30px] bg-slate-100 rounded-lg flex items-center justify-center text-[11px] font-bold text-red-900 shrink-0">
                  {s.nomor}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-slate-800">{s.nama_latin}</div>
                  <div className="text-[11px] text-slate-400">{s.total_ayat} ayat</div>
                </div>
                <div className="text-base text-slate-500 font-serif">{s.nama_arab}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-5 text-center text-slate-400 text-[13px]">
                Surah tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface UjianRecord {
  id: string;
  tanggal: string;
  jenis_ujian: string;
  juz?: number;
  surah_nama?: string;
  ayat_dari?: number;
  ayat_ke?: number;
  jumlah_halaman?: number;
  nilai_bacaan: number;
  nilai_sikap: number;
  nilai_akhir: number;
  is_lulus: boolean;
  catatan?: string;
  santri: { nama_lengkap: string; nis?: string };
  pegawai: { nama_lengkap: string };
}

function renderTargetBanner(santri: Santri) {
  if (!santri || !santri.kelas?.nama) return null;
  const kelas = santri.kelas.nama.toLowerCase();
  
  let targetNode = null;
  
  if (kelas.includes("7 mts")) {
    targetNode = <span><strong>1 Juz</strong> (Juz 30)</span>;
  } else if (kelas.includes("8 mts")) {
    targetNode = <span><strong>3 Juz</strong> (Juz 28, 29, 30)</span>;
  } else if (kelas.includes("9 mts")) {
    targetNode = <span><strong>6 Juz</strong> (Juz 25-30)</span>;
  } else if (kelas.includes("il") || kelas.includes("i'dad")) {
    targetNode = <span><strong>4 Juz</strong> (Juz 27-30)</span>;
  } else if (kelas.includes("10 ma")) {
    targetNode = (
      <ul className="mt-1 ml-4 list-disc p-0">
        <li>Jalur internal MTs: <strong>10 Juz</strong> (+4 Juz dari Kls 9)</li>
        <li>Jalur eksternal IL: <strong>8 Juz</strong> (+4 Juz dari IL)</li>
      </ul>
    );
  } else if (kelas.includes("11 ma")) {
    targetNode = (
      <ul className="mt-1 ml-4 list-disc p-0">
        <li>Jalur internal MTs: <strong>13 Juz</strong> (+3 Juz dari Kls 10)</li>
        <li>Jalur eksternal IL: <strong>10 Juz</strong> (+2 Juz dari Kls 10)</li>
      </ul>
    );
  } else if (kelas.includes("12 ma")) {
    targetNode = (
      <ul className="mt-1 ml-4 list-disc p-0">
        <li>Jalur internal MTs: <strong>15 Juz</strong> (+2 Juz dari Kls 11)</li>
        <li>Jalur eksternal IL: <strong>12 Juz</strong> (+2 Juz dari Kls 11)</li>
      </ul>
    );
  } else {
    targetNode = <span>Belum ada standar target untuk kelas ini.</span>;
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-violet-100 border-[1.5px] border-violet-200 rounded-2xl p-4 mt-3.5 text-violet-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-violet-700 text-white p-2 rounded-xl shrink-0">
          <Award size={20} />
        </div>
        <div>
          <div className="font-extrabold text-[13px] mb-1">
            🎯 Target Hafalan Lulus Kelas {santri.kelas.nama}
          </div>
          <div className="text-[13px] leading-relaxed">
            {targetNode}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UjianTahfidzPage() {
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [history, setHistory] = useState<UjianRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [searchSantri, setSearchSantri] = useState("");
  const [jenisUjian, setJenisUjian] = useState("ujian_pekanan");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [juz, setJuz] = useState(1);
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayatDari, setAyatDari] = useState(1);
  const [ayatKe, setAyatKe] = useState(10);
  const [jumlahHalaman, setJumlahHalaman] = useState(2);
  const [nilaiBacaan, setNilaiBacaan] = useState(90);
  const [nilaiKelancaran, setNilaiKelancaran] = useState(90);
  const [nilaiSikap, setNilaiSikap] = useState(90);
  const [isLulus, setIsLulus] = useState(true);
  const [catatan, setCatatan] = useState("");

  const isSaturday = new Date().getDay() === 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, uRes, qRes] = await Promise.all([
        fetch("/api/halaqoh/kelompok"),
        fetch("/api/halaqoh/ujian"),
        fetch("/api/quran/surah"),
      ]);
      const kData = await kRes.json();
      const uData = await uRes.json();
      const qData = await qRes.json();
      
      const uniqueSantri = new Map();
      if (Array.isArray(kData)) {
        kData.forEach((k: any) => {
          k.anggota?.forEach((a: any) => {
            if (a.santri) uniqueSantri.set(a.santri.id, { ...a.santri, pengampu_id: k.pegawai_id });
          });
        });
      }
      setAllSantri(Array.from(uniqueSantri.values()));
      setHistory(Array.isArray(uData) ? uData : uData.ujian || []);
      setSurahList(Array.isArray(qData) ? qData : qData.surah || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const draftKey = "sikap_ujian_draft";
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.selectedSantriId) setSelectedSantriId(d.selectedSantriId);
        if (d.jenisUjian) setJenisUjian(d.jenisUjian);
        if (d.juz) setJuz(d.juz);
        if (d.selectedSurah) setSelectedSurah(d.selectedSurah);
        if (d.ayatDari) setAyatDari(d.ayatDari);
        if (d.ayatKe) setAyatKe(d.ayatKe);
        if (d.jumlahHalaman) setJumlahHalaman(d.jumlahHalaman);
        if (typeof d.nilaiBacaan === "number") setNilaiBacaan(d.nilaiBacaan);
        if (typeof d.nilaiKelancaran === "number") setNilaiKelancaran(d.nilaiKelancaran);
        if (typeof d.nilaiSikap === "number") setNilaiSikap(d.nilaiSikap);
        if (typeof d.isLulus === "boolean") setIsLulus(d.isLulus);
        if (d.catatan) setCatatan(d.catatan);
      }
    } catch (e) {
      console.error("Gagal membaca draft", e);
    }
  }, []);

  useEffect(() => {
    const draft = {
      selectedSantriId, jenisUjian, juz, selectedSurah, ayatDari, ayatKe,
      jumlahHalaman, nilaiBacaan, nilaiKelancaran, nilaiSikap, isLulus, catatan
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [selectedSantriId, jenisUjian, juz, selectedSurah, ayatDari, ayatKe, jumlahHalaman, nilaiBacaan, nilaiKelancaran, nilaiSikap, isLulus, catatan]);

  useEffect(() => {
    if (!selectedSurah) return;
    const t = setTimeout(() => {
      fetch(`/api/quran/halaman?surah=${selectedSurah.nomor}&dari=${ayatDari}&sampai=${ayatKe}`)
        .then(r => r.json())
        .then(d => {
          if (d.halaman) setJumlahHalaman(d.halaman);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [selectedSurah, ayatDari, ayatKe]);

  const selectedSantri = allSantri.find(s => s.id === selectedSantriId);

  const filteredSantri = allSantri.filter(s =>
    searchSantri === "" ||
    s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()) ||
    (s.nis || "").toLowerCase().includes(searchSantri.toLowerCase())
  );

  const baseNilai = Math.round((nilaiBacaan + nilaiKelancaran) / 2);
  const finalNilai = (jenisUjian === "ujian_itqon" && isLulus) ? Math.min(100, baseNilai + 10) : baseNilai;

  const handleSave = async () => {
    if (!selectedSantriId) { setError("Pilih santri terlebih dahulu"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        santri_id: selectedSantriId,
        tanggal,
        jenis_ujian: jenisUjian,
        juz: jenisUjian === "ujian_itqon" ? juz : undefined,
        surah_nomor: selectedSurah?.nomor,
        surah_nama: selectedSurah?.nama_latin,
        ayat_dari: ayatDari,
        ayat_ke: ayatKe,
        jumlah_halaman: jumlahHalaman,
        nilai_bacaan: nilaiBacaan,
        nilai_kelancaran: nilaiKelancaran,
        nilai_sikap: nilaiSikap,
        nilai_akhir: finalNilai,
        is_lulus: isLulus,
        catatan: catatan || undefined,
      };

      const res = await fetch("/api/halaqoh/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan ujian");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      setSelectedSantriId("");
      setCatatan("");
      localStorage.removeItem(draftKey);
      await fetchData();
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const formatTanggal = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 font-sans">
      <Link href="/halaqoh" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 no-underline text-[13px] mb-4 font-medium transition-colors">
        <ArrowLeft size={14} /> Kembali ke Halaqoh
      </Link>

      <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-3xl p-6 mb-6 text-white shadow-[0_8px_32px_rgba(85,0,0,0.35)]">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Award size={22} className="text-red-200" />
          <h1 className="m-0 text-xl font-extrabold">Ujian Tahfidz & Itqon</h1>
        </div>
        <p className="m-0 text-[13px] text-red-100 opacity-90">
          Penilaian Ujian Pekanan, Bulanan, Target, & Ujian Itqon (Bonus +10)
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-6 mb-6 border-[1.5px] border-slate-200 shadow-xl">
        <h2 className="m-0 mb-5 text-base font-bold text-slate-800 flex items-center gap-2">
          <Award size={18} className="text-red-900" /> Form Penginputan Ujian
        </h2>

        <div className="mb-5">
          <label className="text-xs font-bold text-slate-600 block mb-2.5 uppercase tracking-wider">
            1. Pilih Jenis Ujian
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {JENIS_UJIAN_OPT.map(j => (
              <div
                key={j.val}
                onClick={() => setJenisUjian(j.val)}
                className={`px-4 py-3.5 rounded-2xl cursor-pointer border-[1.5px] transition-all duration-150 ${
                  jenisUjian === j.val ? `${j.borderActive} ${j.bg} shadow-sm` : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`flex items-center gap-2 font-bold text-[13px] mb-1 ${j.color}`}>
                  {j.icon} {j.label}
                </div>
                <div className="text-[11px] text-slate-500">Cakupan: {j.target}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
            2. Pilih Santri
          </label>
          {selectedSantri ? (
            <div className="flex items-center justify-between bg-red-50 border-[1.5px] border-red-200 rounded-2xl px-4 py-3 shadow-sm">
              <div>
                <div className="font-bold text-red-900 text-sm">{selectedSantri.nama_lengkap}</div>
                <div className="text-[11px] text-red-700">{selectedSantri.nis || "NIS —"} · {selectedSantri.kelas?.nama}</div>
              </div>
              <button
                onClick={() => setSelectedSantriId("")}
                className="bg-transparent border-none cursor-pointer text-red-900 font-bold text-xs hover:text-red-700 transition-colors"
              >
                Ganti Santri
              </button>
            </div>
          ) : (
            <div>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchSantri}
                  onChange={e => setSearchSantri(e.target.value)}
                  placeholder="Ketik nama atau NIS santri..."
                  className="w-full py-2.5 pr-3 pl-8 rounded-2xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
                />
              </div>
              <div className="max-h-[180px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-2xl">
                {filteredSantri.slice(0, 20).map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSantriId(s.id)}
                    className="px-3.5 py-2.5 cursor-pointer border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-[13px] text-slate-800">{s.nama_lengkap}</div>
                      <div className="text-[11px] text-slate-400">{s.nis} · {s.kelas?.nama}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-red-900" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {jenisUjian === "ujian_target" && selectedSantri && renderTargetBanner(selectedSantri)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tanggal Ujian</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={e => setTanggal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
            />
          </div>

          {jenisUjian === "ujian_itqon" ? (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tuntas Juz Ke-</label>
              <select 
                value={juz} 
                onChange={e => setJuz(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border bg-white focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <option key={j} value={j * 5}>Per 5 Juz (Juz 1–{j * 5})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="Nama Surah / Materi" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Jumlah Halaman</label>
                <input 
                  type="number" 
                  min={1} 
                  value={jumlahHalaman || ""} 
                  onChange={e => setJumlahHalaman(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {selectedSurah && jenisUjian !== "ujian_itqon" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Dari Ayat</label>
              <input
                type="number" min={1} max={selectedSurah.total_ayat}
                value={ayatDari || ""}
                onChange={e => {
                  const strVal = e.target.value;
                  if (strVal === "") setAyatDari(0);
                  else setAyatDari(parseInt(strVal));
                }}
                onBlur={() => {
                  let clamped = Math.max(1, Math.min(ayatDari || 1, selectedSurah.total_ayat));
                  setAyatDari(clamped);
                  if (ayatKe < clamped) setAyatKe(clamped);
                }}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sampai Ayat</label>
              <input
                type="number" min={ayatDari || 1} max={selectedSurah.total_ayat}
                value={ayatKe || ""}
                onChange={e => {
                  const strVal = e.target.value;
                  if (strVal === "") setAyatKe(0);
                  else setAyatKe(parseInt(strVal));
                }}
                onBlur={() => {
                  let clamped = Math.max(ayatDari || 1, Math.min(ayatKe || 1, selectedSurah.total_ayat));
                  setAyatKe(clamped);
                }}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <NumericScoreSelector label="Nilai Bacaan" value={nilaiBacaan} onChange={setNilaiBacaan} />
          <NumericScoreSelector label="Nilai Kelancaran" value={nilaiKelancaran} onChange={setNilaiKelancaran} />
          <TextScoreSelector label="Nilai Sikap" value={nilaiSikap} onChange={setNilaiSikap} />
        </div>

        {jenisUjian === "ujian_itqon" && (
          <div className="bg-cyan-50 border-[1.5px] border-cyan-200 rounded-2xl px-4 py-3.5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-cyan-700 shrink-0" />
              <div>
                <div className="font-extrabold text-[13px] text-cyan-900">Status Kelulusan Ujian Itqon</div>
                <div className="text-[11px] text-cyan-700">Jika LULUS, santri secara otomatis memperoleh **Bonus +10 Poin** di Raport!</div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[13px] text-cyan-900">
              <input 
                type="checkbox" 
                checked={isLulus} 
                onChange={e => setIsLulus(e.target.checked)} 
                className="w-[18px] h-[18px] text-cyan-700 rounded focus:ring-cyan-600" 
              />
              Dinyatakan Lulus
            </label>
          </div>
        )}

        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] text-slate-500 font-semibold">Kalkulasi Nilai Ujian:</span>
            <span className="text-2xl font-black text-red-900">{finalNilai}</span>
          </div>
          <div className="text-xs text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded-xl">
            (Bacaan: <strong>{nilaiBacaan}</strong> + Kelancaran: <strong>{nilaiKelancaran}</strong>) ÷ 2 
            {jenisUjian === "ujian_itqon" && isLulus && (
              <span className="text-emerald-600"> + <strong>10</strong> (Bonus Itqon)</span>
            )}
            {" "} = <strong>{finalNilai}</strong>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Catatan Penguji (Opsional)</label>
          <input 
            type="text" 
            value={catatan} 
            onChange={e => setCatatan(e.target.value)} 
            placeholder="Catatan evaluasi kelancaran hafalan..."
            className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[13px] box-border focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all" 
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-3.5 text-[13px] shadow-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl mb-3.5 text-[13px] shadow-sm">
            <CheckCircle2 size={16} /> Data ujian berhasil disimpan!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !selectedSantriId}
          className={`w-full p-3.5 rounded-2xl border-none text-white font-extrabold text-[15px] flex items-center justify-center gap-2.5 transition-all shadow-md ${
            saving ? "bg-slate-400 cursor-wait" : "bg-red-900 hover:bg-red-800 cursor-pointer shadow-red-900/30 hover:shadow-lg"
          }`}
        >
          <Save size={18} /> {saving ? "Menyimpan..." : "Simpan Nilai Ujian"}
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border-[1.5px] border-slate-200 shadow-xl">
        <h2 className="m-0 mb-4 text-[15px] font-bold text-slate-800">Riwayat Ujian Tahfidz</h2>
        {history.length === 0 ? (
          <div className="text-center p-8 text-slate-400 text-[13px]">Belum ada riwayat ujian</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  {["Tanggal", "Santri", "Jenis Ujian", "Materi", "Nilai Akhir", "Penguji"].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => {
                  const info = JENIS_UJIAN_OPT.find(j => j.val === row.jenis_ujian) || JENIS_UJIAN_OPT[0];
                  return (
                    <tr key={row.id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-50 transition-colors`}>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{formatTanggal(row.tanggal)}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">{row.santri.nama_lengkap}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold border ${info.bg} ${info.color} ${info.border}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 min-w-[150px]">
                        {row.jenis_ujian === "ujian_itqon" ? `Juz 1–${row.juz || 5}` : row.surah_nama || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-extrabold text-sm text-emerald-700">{row.nilai_akhir}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{row.pegawai.nama_lengkap}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
