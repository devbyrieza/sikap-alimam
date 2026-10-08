"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookHeart, ArrowLeft, Search, ChevronDown, BookOpen, Save,
  CheckCircle2, AlertCircle, RotateCcw, Award, Pencil } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const OPSI_NILAI = [100, 98, 95, 90, 85, 80, 75, 70, 65, 60] as const;
const NILAI_OPTIONS = OPSI_NILAI.map(n => ({ value: n as number, label: String(n) }));

const OPSI_SIKAP = [
  { value: 100, label: "Sangat Baik" },
  { value: 90, label: "Baik" },
  
  { value: 80, label: "Cukup" },
  { value: 70, label: "Kurang" },
  { value: 60, label: "Sangat Kurang" },
];

function getPredikat(nilai: number) {
  if (nilai >= 98) return { label: "Sangat Baik",   cls: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  if (nilai >= 90) return { label: "Baik",          cls: "bg-sky-50 text-sky-600 border-sky-200" };
  if (nilai >= 85) return { label: "Cukup",         cls: "bg-amber-50 text-amber-600 border-amber-200" };
  if (nilai >= 75) return { label: "Kurang",        cls: "bg-orange-50 text-orange-600 border-orange-100" };
  return                  { label: "Sangat Kurang", cls: "bg-red-50 text-red-600 border-red-200" };
}

const KEHADIRAN_OPT = [
  { label: "Hadir", val: "hadir", on: "border-emerald-600 bg-emerald-50 text-emerald-600" },
  { label: "Sakit", val: "sakit", on: "border-amber-600 bg-amber-50 text-amber-600" },
  { label: "Izin",  val: "izin",  on: "border-sky-600 bg-sky-50 text-sky-600" },
  { label: "Alfa",  val: "alfa",  on: "border-red-600 bg-red-50 text-red-600" },
];

const JENIS_META: Record<string, { title: string; sub: string; icon: React.ReactNode }> = {
  tahsin:   { title: "Tahsin",           sub: "Penguatan bacaan & talaqqi", icon: <Award size={18} /> },
  ziyadah:  { title: "Setoran ziyadah",  sub: "Setoran hafalan baru",       icon: <BookOpen size={18} /> },
  murojaah: { title: "Setoran murojaah", sub: "Pengulangan hafalan",        icon: <RotateCcw size={18} /> },
};

const SESI_LABEL: Record<string, string> = {
  subuh: "Halaqoh Subuh",
  maghrib: "Ba'da Maghrib",
  dhuha: "Halaqoh Dhuha" };

const formatTanggal = (s: string) => {
  if (!s) return "";
  const cleanDate = s.split("T")[0];
  const parts = cleanDate.split("-");
  if (parts.length < 3) return s;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

const labelClass = "mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-600";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-[#fdf8f0] px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary focus:bg-white";
const thClass = "px-4! py-3! whitespace-nowrap text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-600";
const tdClass = "px-4! py-3!";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
}

interface Surah {
  nomor: number;
  nama_latin: string;
  nama_arab: string;
  total_ayat: number;
  halaman_mulai: number;
}

interface CatatanRecord {
  id: string;
  santri_id?: string;
  tanggal: string;
  sesi: string;
  jenis: string;
  surah_nomor?: number;
  surah_selesai_nomor?: number;
  surah_selesai_nama?: string;
  surah_selesai_nama_arab?: string;
  surah_nama?: string;
  ayat_dari?: number;
  ayat_ke?: number;
  jumlah_halaman?: number;
  kehadiran: string;
  alasan?: string;
  nilai_bacaan: number;
  nilai_kelancaran: number;
  nilai_sikap: number;
  nilai_akhir: number;
  catatan?: string;
  santri: { nama_lengkap: string; nis?: string };
  pegawai?: { nama_lengkap: string };
}

// ─── KOMPONEN KECIL ─────────────────────────────────────────────────────────
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center text-[13px] font-extrabold uppercase tracking-wide text-slate-800">
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">{n}</span>
      {children}
    </span>
  );
}

function SurahPicker({
  surahList,
  selected,
  onSelect,
  label = "Pilih Surah" }: {
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

  const filtered = surahList.filter(s => {
    if (query === "") return true;
    const qRaw = query.toLowerCase().trim();
    const qNorm = qRaw.replace(/[-'\s`’]+/g, "");

    const latinRaw = s.nama_latin.toLowerCase();
    const latinNorm = latinRaw.replace(/[-'\s`’]+/g, "");

    return (
      latinRaw.includes(qRaw) ||
      latinNorm.includes(qNorm) ||
      s.nama_arab.includes(qRaw) ||
      String(s.nomor) === qRaw
    );
  }).slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <label className={labelClass}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-[#fdf8f0] px-3.5 py-3 text-left text-sm font-semibold text-slate-800"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="font-extrabold text-primary">{selected.nomor}. {selected.nama_latin}</span>
            <span className="font-serif text-[15px] text-slate-500">{selected.nama_arab}</span>
          </span>
        ) : (
          <span className="text-slate-400">Cari surah...</span>
        )}
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/10">
          <div className="border-b border-slate-100 p-2.5">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor"
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="custom-scrollbar max-h-60 overflow-y-auto">
            {filtered.map(s => (
              <button
                type="button"
                key={s.nomor}
                onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                className="flex w-full items-center justify-between border-b border-slate-50 bg-white px-4 py-2.5 text-left hover:bg-[#fdf8f0]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff5f5] text-xs font-extrabold text-primary">
                    {s.nomor}
                  </span>
                  <span>
                    <span className="block text-[13px] font-extrabold text-slate-800">{s.nama_latin}</span>
                    <span className="block text-[11px] text-slate-400">{s.total_ayat} ayat</span>
                  </span>
                </span>
                <span className="font-serif text-base text-slate-600">{s.nama_arab}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreSelector({ label, value, onChange, options, pill }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  pill?: boolean;
}) {
  const predikat = getPredikat(value);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{label}</div>
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${predikat.cls}`}>
          {predikat.label} {value >= 85 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-xl border transition-colors ${
                pill ? "px-3.5 py-2 text-[13px] font-bold" : "h-[42px] w-[42px] text-sm font-extrabold"
              } ${
                sel
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AyatStepper({ label, value, setValue, max }: {
  label: string;
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  max: number;
}) {
  const stepBtn =
    "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-black text-primary hover:bg-slate-50";
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="Kurangi ayat" onClick={() => setValue(prev => Math.max(1, (prev || 1) - 1))} className={stepBtn}>-</button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value === 0 ? "" : value}
          onChange={e => {
            const val = e.target.value;
            if (val === "") setValue(0);
            else {
              const n = parseInt(val);
              if (!isNaN(n)) setValue(Math.min(max, n));
            }
          }}
          onBlur={() => {
            if (!value || value < 1) setValue(1);
          }}
          className={`${inputClass} min-w-[70px] flex-1 text-center text-base font-extrabold`}
        />
        <button type="button" aria-label="Tambah ayat" onClick={() => setValue(prev => Math.min(max, (prev || 1) + 1))} className={stepBtn}>+</button>
      </div>
      <span className="mt-1 block text-[11px] text-slate-500">Maks: {max} ayat</span>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function HalaqohInputPage() {
  const searchParams = useSearchParams();
  const kelompokId = searchParams.get("kelompok") || "";
  const sesiParam = searchParams.get("sesi") || "subuh";
  const tanggalParam = searchParams.get("tanggal") || new Date().toISOString().split("T")[0];

  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [kelompokInfo, setKelompokInfo] = useState<any>(null);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [history, setHistory] = useState<CatatanRecord[]>([]);

  const [userId, setUserId] = useState<string>("");
  const [pegawaiId, setPegawaiId] = useState<string>("");

  // Form State (Per-Santri)
  const [selectedSantriId, setSelectedSantriId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [jenis, setJenis] = useState<"tahsin" | "ziyadah" | "murojaah">("tahsin");
  const [tanggal, setTanggal] = useState(tanggalParam);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedSurahAkhir, setSelectedSurahAkhir] = useState<Surah | null>(null);
  const [ayatDari, setAyatDari] = useState(1);
  const [ayatKe, setAyatKe] = useState(10);
  const [halamanAuto, setHalamanAuto] = useState<number | null>(null);

  const [kehadiran, setKehadiran] = useState<"hadir" | "sakit" | "izin" | "alfa">("hadir");
  const [alasan, setAlasan] = useState("");
  const [nilaiBacaan, setNilaiBacaan] = useState(90);
  const [nilaiKelancaran, setNilaiKelancaran] = useState(90);
  const [nilaiSikap, setNilaiSikap] = useState(90);
  const [catatan, setCatatan] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch surah list
  useEffect(() => {
    fetch("/api/quran/surah")
      .then(r => r.json())
      .then(data => {
        setSurahList(Array.isArray(data) ? data : data.surah || []);
      });
  }, []);

  const fetchData = useCallback(async () => {
    if (!kelompokId) { setLoading(false); return; }
    try {
      const [profileRes, kelompokRes, catatanRes] = await Promise.all([
        fetch("/api/profile").then(r => r.json()),
        fetch(`/api/halaqoh/kelompok?id=${kelompokId}`).then(r => r.json()),
        fetch(`/api/halaqoh/catatan?kelompok_id=${kelompokId}&tanggal=${tanggal}&sesi=${sesiParam}`).then(r => r.json()),
      ]);

      setUserId(profileRes?.user?.id || "");
      setPegawaiId(profileRes?.pegawai?.id || "");

      const kelompok = Array.isArray(kelompokRes) ? kelompokRes[0] : kelompokRes?.kelompok?.[0];
      setKelompokInfo(kelompok);

      const sList = (kelompok?.anggota || []).map((a: any) => ({
        id: a.santri.id,
        nama_lengkap: a.santri.nama_lengkap,
        nis: a.santri.nis }));
      setSantriList(sList);

      const catList = Array.isArray(catatanRes) ? catatanRes : catatanRes?.catatan || [];
      setHistory(catList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [kelompokId, tanggal, sesiParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-calculate halaman when surah/ayat changes
  useEffect(() => {
    if (!selectedSurah) { setHalamanAuto(null); return; }
    let url = `/api/quran/halaman?surah=${selectedSurah.nomor}&dari=${ayatDari}&ke=${ayatKe}`;
    if (selectedSurahAkhir) {
      url += `&surah_selesai=${selectedSurahAkhir.nomor}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
        const ratio = (ayatKe - ayatDari + 1) / selectedSurah.total_ayat;
        setHalamanAuto(parseFloat((ratio * 0.5).toFixed(1)));
      });
  }, [selectedSurah, selectedSurahAkhir, ayatDari, ayatKe]);

  // Sync ayatKe max when surah changes
  useEffect(() => {
    if (!selectedSurah) return;
    setAyatDari(1);
    setAyatKe(Math.min(selectedSurah.total_ayat, 10));
  }, [selectedSurah?.nomor]);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");

  const selectedSantri = santriList.find(s => s.id === selectedSantriId);

  const completedCount = santriList.filter(s =>
    history.some(h => h.santri_id === s.id || h.santri?.nama_lengkap === s.nama_lengkap)
  ).length;

  const filteredSantri = santriList.filter(s => {
    const isDone = history.some(h => h.santri_id === s.id || h.santri?.nama_lengkap === s.nama_lengkap);
    const matchSearch =
      searchQuery === "" ||
      s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.includes(searchQuery));
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "done" && isDone) ||
      (statusFilter === "pending" && !isDone);
    return matchSearch && matchStatus;
  });

  const finalNilai = Math.round((nilaiBacaan + nilaiKelancaran) / 2);
  const allDone = completedCount === santriList.length && santriList.length > 0;

  const handleSave = async () => {
    if (!selectedSantriId) { setError("Pilih santri terlebih dahulu"); return; }
    if (jenis !== "tahsin" && !selectedSurah && kehadiran === "hadir") { setError("Pilih surah terlebih dahulu"); return; }
    if (!kelompokId || !pegawaiId) { setError("Data kelompok / pengampu tidak ditemukan"); return; }

    setSaving(true);
    setError(null);
    try {
      const body = {
        kelompok_id: kelompokId,
        pegawai_id: pegawaiId,
        tanggal,
        sesi: sesiParam,
        entries: [
          {
            santri_id: selectedSantriId,
            jenis,
            surah_nomor: selectedSurah?.nomor ?? 0,
            surah_nama: selectedSurah?.nama_latin ?? (jenis === "tahsin" ? "Tahsin" : "—"),
            surah_nama_arab: selectedSurah?.nama_arab ?? null,
            ayat_dari: ayatDari ?? 0,
            ayat_ke: ayatKe ?? 0,
            jumlah_halaman: halamanAuto ?? 0,
            kehadiran,
            alasan: alasan || null,
            nilai_sikap: nilaiSikap,
            nilai_bacaan: nilaiBacaan,
            nilai_kelancaran: nilaiKelancaran,
            catatan: catatan || null },
        ] };

      const res = await fetch("/api/halaqoh/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body) });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan catatan");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      setSelectedSantriId("");
      setCatatan("");
      setAlasan("");
      await fetchData();
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleEditRow = (row: CatatanRecord) => {
    const sId = row.santri_id || santriList.find(s => s.nama_lengkap === row.santri?.nama_lengkap)?.id;
    if (sId) setSelectedSantriId(sId);
    if (row.jenis) setJenis(row.jenis as any);
    if (row.kehadiran) setKehadiran(row.kehadiran as any);
    if (row.alasan) setAlasan(row.alasan || "");
    if (row.nilai_bacaan) setNilaiBacaan(row.nilai_bacaan);
    if (row.nilai_kelancaran) setNilaiKelancaran(row.nilai_kelancaran);
    if (row.nilai_sikap) setNilaiSikap(row.nilai_sikap);
    if (row.catatan) setCatatan(row.catatan || "");

    if (row.surah_nomor) {
      const sFound = surahList.find(s => s.nomor === row.surah_nomor);
      if (sFound) setSelectedSurah(sFound);
    }
    if (row.ayat_dari) setAyatDari(row.ayat_dari);
    if (row.ayat_ke) setAyatKe(row.ayat_ke);

    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  if (!kelompokId) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center px-6 text-slate-500">
        <AlertCircle size={48} className="mb-4 text-red-300" />
        <h2 className="mb-2 text-xl font-bold text-slate-700">Pilih kelompok terlebih dahulu</h2>
        <p className="mb-6 max-w-md text-center text-sm">
          Anda harus memilih kelompok dan sesi halaqoh dari Dashboard Halaqoh sebelum dapat mengisi catatan.
        </p>
        <Link
          href="/halaqoh"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-light"
        >
          <ArrowLeft size={16} /> Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center text-slate-400">
        <BookHeart size={24} className="mr-3 opacity-50" /> Memuat data halaqoh...
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Kembali */}
      <div className="flex items-center gap-3">
        <Link
          href="/halaqoh"
          aria-label="Kembali ke dashboard halaqoh"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-[13px] font-bold text-slate-500">Kembali ke dashboard halaqoh</span>
      </div>

      {/* Hero */}
      <div className="hero-banner">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-[30%] rounded-full bg-[#ddc192]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/2 rounded-full bg-[#ddc192]/10 blur-3xl" />

        <div className="relative z-10 min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#ddc192]/40 bg-[#ddc192]/20 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#fdf8f0]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#ddc192] shadow-[0_0_6px_rgba(221,193,146,0.9)]" />
            Pengisian mutabaah harian
          </div>
          <h1 className="flex items-center gap-2.5 text-[clamp(20px,4vw,30px)] font-extrabold text-white">
            <BookHeart size={26} color="#ddc192" /> Input catatan halaqoh
          </h1>
          <p className="mt-1.5 text-sm text-[#fdf8f0]/90">
            {SESI_LABEL[sesiParam] || sesiParam} · {formatTanggal(tanggal)} · Kelompok {kelompokInfo?.nama || "-"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-6 rounded-3xl border border-[#ebdcc3] bg-white p-5 shadow-sm shadow-primary/5 sm:p-8">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-lg font-extrabold text-primary">
            <BookHeart size={22} /> Form catatan &amp; mutabaah halaqoh
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
            <label className="mb-0 text-xs font-extrabold text-slate-600">TANGGAL SESI:</label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="cursor-pointer border-0 bg-transparent text-sm font-extrabold text-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Langkah 1: jenis kegiatan */}
        <div>
          <div className="mb-3"><StepTitle n={1}>Pilih jenis kegiatan halaqoh</StepTitle></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["tahsin", "ziyadah", "murojaah"] as const).map(j => {
              const isSelected = jenis === j;
              const item = JENIS_META[j];
              return (
                <button
                  type="button"
                  key={j}
                  onClick={() => setJenis(j)}
                  className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                    isSelected
                      ? "border-2 border-primary bg-[#fff5f5] shadow-md shadow-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30"
                  }`}
                >
                  <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#ebdcc3] ${
                    isSelected ? "bg-primary text-white" : "bg-white text-primary"
                  }`}>
                    {item.icon}
                  </span>
                  <span>
                    <span className={`block text-[13px] font-extrabold ${isSelected ? "text-primary" : "text-slate-700"}`}>{item.title}</span>
                    <span className="block text-[11px] font-semibold text-slate-500">{item.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Langkah 2: pilih santri */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <StepTitle n={2}>Pilih santri</StepTitle>
            <div className={`rounded-xl border px-3.5 py-1.5 text-xs font-extrabold ${
              allDone ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-red-200 bg-[#fff5f5] text-primary"
            }`}>
              Progress: <strong>{completedCount}</strong> / {santriList.length} santri {allDone ? "✓ Selesai!" : ""}
            </div>
          </div>

          {selectedSantri ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-[#fff5f5] px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-black text-primary">{selectedSantri.nama_lengkap}</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-500">
                  NIS: {selectedSantri.nis || "—"} · Kelompok: {kelompokInfo?.nama || "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSantriId("")}
                className="shrink-0 rounded-[10px] border border-red-200 bg-white px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50"
              >
                Ganti santri
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <div className="text-xs font-bold text-slate-600">Filter status pengisian:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "pending", "done"] as const).map(f => {
                    const counts = {
                      all: santriList.length,
                      pending: santriList.length - completedCount,
                      done: completedCount };
                    const labels = {
                      all: `Semua (${counts.all})`,
                      pending: `Belum diisi (${counts.pending})`,
                      done: `Sudah diisi (${counts.done})` };
                    const isSel = statusFilter === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStatusFilter(f)}
                        className={`rounded-[10px] border px-3 py-1 text-[11px] font-extrabold transition-colors ${
                          isSel ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-500 hover:border-primary/40"
                        }`}
                      >
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative mb-2">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama atau NIS santri"
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="custom-scrollbar max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {filteredSantri.map(s => {
                  const record = history.find(h => h.santri_id === s.id || h.santri?.nama_lengkap === s.nama_lengkap);
                  const isDone = !!record;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedSantriId(s.id)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                        isDone ? "bg-green-50 hover:bg-green-100" : "bg-white hover:bg-[#fdf8f0]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`flex flex-wrap items-center gap-2 text-[13px] font-extrabold ${isDone ? "text-green-800" : "text-slate-800"}`}>
                          {s.nama_lengkap}
                          {isDone ? (
                            <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">
                              ✓ Sudah diisi {record?.nilai_akhir ? `(Nilai: ${record.nilai_akhir})` : ""}
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              Belum diisi
                            </span>
                          )}
                        </span>
                        <span className={`block text-[11px] ${isDone ? "text-green-700" : "text-slate-500"}`}>NIS: {s.nis || "—"}</span>
                      </span>
                      <CheckCircle2 size={16} className={isDone ? "text-green-800" : "text-slate-300"} />
                    </button>
                  );
                })}
                {filteredSantri.length === 0 && (
                  <div className="p-5 text-center text-[13px] text-slate-400">
                    {statusFilter === "pending" ? "Semua santri sudah selesai dinilai!" : "Santri tidak ditemukan"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Langkah 3: detail setoran & nilai */}
        {selectedSantri && (
          <>
            <div>
              <label className={labelClass}>Status kehadiran</label>
              <div className="flex flex-wrap gap-1.5">
                {KEHADIRAN_OPT.map(k => {
                  const isSel = kehadiran === k.val;
                  return (
                    <button
                      key={k.val}
                      type="button"
                      onClick={() => setKehadiran(k.val as any)}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-extrabold transition-colors ${
                        isSel ? k.on : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(kehadiran === "sakit" || kehadiran === "izin") && (
              <div>
                <label className={`${labelClass} text-amber-600`}>Alasan {kehadiran === "sakit" ? "sakit" : "izin"} *</label>
                <input
                  type="text"
                  value={alasan}
                  onChange={e => setAlasan(e.target.value)}
                  placeholder={kehadiran === "sakit" ? "Sakit apa?" : "Izin untuk keperluan apa?"}
                  className={`${inputClass} border-amber-200 bg-amber-50`}
                />
              </div>
            )}

            {kehadiran === "hadir" && (
              <>
                {jenis === "tahsin" && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[13px] font-bold text-amber-700">
                    <Award size={18} className="shrink-0 text-amber-600" />
                    <span>Mode <strong>Tahsin</strong>: presensi &amp; evaluasi bacaan santri secara lisan.</span>
                  </div>
                )}

                {/* Surah & ayat */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <SurahPicker
                      surahList={surahList}
                      selected={selectedSurah}
                      onSelect={(s) => { setSelectedSurah(s); setSelectedSurahAkhir(s); }}
                      label={jenis === "tahsin" ? "DARI SURAH (OPSIONAL)" : "DARI SURAH"}
                    />
                    {selectedSurah && (
                      <AyatStepper label="DARI AYAT" value={ayatDari} setValue={setAyatDari} max={selectedSurah.total_ayat || 300} />
                    )}
                  </div>

                  <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <SurahPicker
                      surahList={surahList}
                      selected={selectedSurahAkhir}
                      onSelect={setSelectedSurahAkhir}
                      label={jenis === "tahsin" ? "SAMPAI SURAH (OPSIONAL)" : "SAMPAI SURAH"}
                    />
                    {selectedSurahAkhir && selectedSurah && (
                      <AyatStepper label="SAMPAI AYAT" value={ayatKe} setValue={setAyatKe} max={selectedSurahAkhir.total_ayat || 300} />
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Jumlah halaman (Madinah)</label>
                  <div className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 font-extrabold text-emerald-600">
                    {halamanAuto !== null ? halamanAuto.toFixed(1) + " hal." : "-"}
                  </div>
                </div>

                {/* Nilai */}
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                  <ScoreSelector
                    label={jenis === "tahsin" ? "Nilai tajwid" : "Nilai bacaan"}
                    value={nilaiBacaan} onChange={setNilaiBacaan} options={NILAI_OPTIONS}
                  />
                  <ScoreSelector
                    label={jenis === "tahsin" ? "Nilai makhraj" : "Nilai kelancaran"}
                    value={nilaiKelancaran} onChange={setNilaiKelancaran} options={NILAI_OPTIONS}
                  />
                  <ScoreSelector label="Nilai sikap" value={nilaiSikap} onChange={setNilaiSikap} options={OPSI_SIKAP} pill />
                </div>

                {/* Kalkulasi */}
                <div className="rounded-2xl border border-red-200 bg-[#fff5f5] px-6 py-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] font-extrabold uppercase tracking-wide text-primary">Kalkulasi nilai akhir:</span>
                    <span className="text-[32px] font-black text-primary">{finalNilai}</span>
                  </div>
                  <div className="rounded-[10px] border border-[#ebdcc3] bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-600">
                    {jenis === "tahsin" ? (
                      <>(Tajwid: <strong>{nilaiBacaan}</strong> + Makhraj: <strong>{nilaiKelancaran}</strong>) &divide; 2 = <strong className="text-primary">{finalNilai}</strong></>
                    ) : (
                      <>(Bacaan: <strong>{nilaiBacaan}</strong> + Kelancaran: <strong>{nilaiKelancaran}</strong>) &divide; 2 = <strong className="text-primary">{finalNilai}</strong></>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Catatan halaqoh santri (opsional)</label>
              <input
                type="text"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan evaluasi setoran santri ini"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-600">
                <CheckCircle2 size={16} /> Catatan halaqoh santri berhasil disimpan!
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedSantriId}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-primary/30 hover:bg-primary-light disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Save size={18} /> {saving ? "Menyimpan catatan..." : "Simpan catatan santri ini"}
            </button>
          </>
        )}
      </div>

      {/* Riwayat */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 text-[15px] font-extrabold text-slate-800">
          <BookHeart size={18} className="text-primary" /> Riwayat catatan halaqoh ({SESI_LABEL[sesiParam] || sesiParam})
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-slate-400">Belum ada catatan halaqoh untuk sesi ini</div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[850px] text-[13px]">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  {["Tanggal", "Santri", "Jenis", "Materi / Surah", "Ayat", "Halaman", "Nilai akhir", "Kehadiran", "Catatan", "Aksi"].map(h => (
                    <th key={h} className={thClass}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(row => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className={`${tdClass} whitespace-nowrap font-semibold text-slate-500`}>{formatTanggal(row.tanggal)}</td>
                    <td className={`${tdClass} whitespace-nowrap font-extrabold text-slate-800`}>{row.santri?.nama_lengkap}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className={`rounded-lg border border-[#ebdcc3] px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        row.jenis === "tahsin" ? "bg-amber-50 text-amber-600" : row.jenis === "ziyadah" ? "bg-[#fff5f5] text-primary" : "bg-[#fdf8f0] text-primary"
                      }`}>
                        {row.jenis}
                      </span>
                    </td>
                    <td className={`${tdClass} font-bold text-slate-600`}>{row.surah_nama || "—"}</td>
                    <td className={`${tdClass} text-slate-500`}>
                      {row.ayat_dari && row.ayat_ke ? `Ayat ${row.ayat_dari}–${row.ayat_ke}` : "—"}
                    </td>
                    <td className={`${tdClass} font-bold text-emerald-600`}>
                      {row.jumlah_halaman ? `${row.jumlah_halaman} hal.` : "—"}
                    </td>
                    <td className={`${tdClass} text-sm font-black text-primary`}>{row.nilai_akhir ?? "—"}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        row.kehadiran === "hadir" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {row.kehadiran}
                      </span>
                    </td>
                    <td className={`${tdClass} text-xs text-slate-500`}>{row.catatan || "—"}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <button
                        type="button"
                        onClick={() => handleEditRow(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-[#fff5f5] px-3 py-1 text-[11px] font-extrabold text-primary hover:bg-red-50"
                      >
                        <Pencil size={12} /> Edit nilai
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}