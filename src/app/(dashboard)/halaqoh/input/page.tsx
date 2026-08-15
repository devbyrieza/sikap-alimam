"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { BookHeart, ArrowLeft, Search, ChevronDown, BookOpen, Users, Save, CheckCircle2, AlertCircle, RotateCcw, Award } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const OPSI_NILAI = [100, 98, 95, 90, 85, 80, 75, 70, 65, 60] as const;

function getPredikat(nilai: number) {
  if (nilai >= 98) return { label: "Sangat Baik", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (nilai >= 90) return { label: "Baik", color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" };
  if (nilai === 85) return { label: "Cukup", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (nilai >= 75) return { label: "Kurang", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Sangat Kurang", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

const KEHADIRAN_OPT = [
  { label: "Hadir",  val: "hadir",  warna: "#059669", bg: "#ecfdf5" },
  { label: "Sakit",  val: "sakit",  warna: "#d97706", bg: "#fffbeb" },
  { label: "Izin",   val: "izin",   warna: "#0284c7", bg: "#eff6ff" },
  { label: "Alfa",   val: "alfa",   warna: "#dc2626", bg: "#fef2f2" },
];

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Surah {
  nomor: number;
  nama_latin: string;
  nama_arab: string;
  total_ayat: number;
  halaman_mulai: number;
}

interface SantriEntry {
  santri_id: string;
  nama: string;
  nis?: string;
  kehadiran: "hadir" | "sakit" | "izin" | "alfa";
  alasan: string;
  nilai_sikap: number;
  nilai_bacaan: number;
  nilai_kelancaran: number;
  // Per-santri override untuk surat (jika berbeda dari default kelompok)
  override_surah?: boolean;
  override_surah_nomor?: number;
  override_surah_nama?: string;
  override_surah_nama_arab?: string;
  override_ayat_dari?: number;
  override_ayat_ke?: number;
  override_halaman?: number;
  catatan: string;
}

const DRAFT_KEY_PREFIX = "siakad_halaqoh_draft";

function getDraftKey(userId: string, kelompokId: string, sesi: string, tanggal: string) {
  return `${DRAFT_KEY_PREFIX}_${userId}_${kelompokId}_${sesi}_${tanggal}`;
}



// ─── SURAH SEARCH COMPONENT ─────────────────────────────────────────────────
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
        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white cursor-pointer text-sm select-none"
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
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[200] bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor..."
                className="w-full py-2 pr-2.5 pl-8 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-900/20"
              />
            </div>
          </div>
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar overscroll-contain">
            {filtered.map(s => (
              <div
                key={s.nomor}
                onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                className="px-4 py-2.5 cursor-pointer border-b border-slate-50 flex items-center gap-3.5 transition-colors hover:bg-slate-50"
              >
                <div className="w-[30px] h-[30px] bg-slate-100 rounded-lg flex items-center justify-center text-[11px] font-bold text-red-950 shrink-0">
                  {s.nomor}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-800">{s.nama_latin}</div>
                  <div className="text-xs text-slate-400">{s.total_ayat} ayat</div>
                </div>
                <div className="text-base text-slate-500 font-serif">{s.nama_arab}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-5 text-center text-slate-400 text-sm">
                Surah tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INDIKATOR SELECTOR ──────────────────────────────────────────────────────
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
        <div 
          className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
          style={{ background: predikat.bg, color: predikat.color, borderColor: predikat.border }}
        >
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {OPSI_NILAI.map(num => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className="px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border-[1.5px] transition-all duration-150 min-h-[32px] min-w-[36px]"
            style={{
              borderColor: value === num ? predikat.color : "#e2e8f0",
              background: value === num ? predikat.bg : "white",
              color: value === num ? predikat.color : "#64748b"
            }}
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
        <div 
          className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
          style={{ background: predikat.bg, color: predikat.color, borderColor: predikat.border }}
        >
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {OPSI_SIKAP.map(opsi => (
          <button
            key={opsi.value}
            onClick={() => onChange(opsi.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border-[1.5px] transition-all duration-150 min-h-[32px]"
            style={{
              borderColor: value === opsi.value ? predikat.color : "#e2e8f0",
              background: value === opsi.value ? predikat.bg : "white",
              color: value === opsi.value ? predikat.color : "#64748b"
            }}
          >
            {opsi.label}
          </button>
        ))}
      </div>
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
  const [userId, setUserId] = useState<string>("");
  const [pegawaiId, setPegawaiId] = useState<string>("");

  // Form state
  const [jenis, setJenis] = useState<"ziyadah" | "murojaah">("ziyadah");
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayatDari, setAyatDari] = useState(1);
  const [ayatKe, setAyatKe] = useState(1);
  const [halamanAuto, setHalamanAuto] = useState<number | null>(null);

  const [entries, setEntries] = useState<SantriEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft key
  const draftKey = userId ? getDraftKey(userId, kelompokId, sesiParam, tanggalParam) : null;

  // Fetch surah list
  useEffect(() => {
    fetch("/api/quran/surah").then(r => r.json()).then(data => {
      setSurahList(Array.isArray(data) ? data : data.surah || []);
    });
  }, []);

  // Fetch profile & kelompok
  useEffect(() => {
    if (!kelompokId) { setLoading(false); return; }
    Promise.all([
      fetch("/api/profile").then(r => r.json()),
      fetch(`/api/halaqoh/kelompok?id=${kelompokId}`).then(r => r.json()),
      fetch(`/api/halaqoh/catatan?kelompok_id=${kelompokId}&tanggal=${tanggalParam}&sesi=${sesiParam}`).then(r => r.json()),
    ]).then(([profileData, kData, cData]) => {
      const uid = profileData?.user?.id || "";
      const pid = profileData?.pegawai?.id || "";
      setUserId(uid);
      setPegawaiId(pid);

      const kelompok = Array.isArray(kData) ? kData[0] : kData?.kelompok?.[0];
      setKelompokInfo(kelompok);

      // Build entries from anggota
      const anggotaList = kelompok?.anggota || [];
      const existingMap: Record<string, any> = {};
      (Array.isArray(cData) ? cData : cData?.catatan || []).forEach((c: any) => {
        existingMap[c.santri_id] = c;
      });

      const initialEntries: SantriEntry[] = anggotaList.map((a: any) => {
        const s = a.santri;
        const ex = existingMap[s.id] as any;
        return {
          santri_id: s.id,
          nama: s.nama_lengkap,
          nis: s.nis,
          kehadiran: ex?.kehadiran || "hadir",
          alasan: ex?.alasan || "",
          nilai_sikap: ex?.nilai_sikap ?? 90,
          nilai_bacaan: ex?.nilai_bacaan ?? 90,
          nilai_kelancaran: ex?.nilai_kelancaran ?? 90,
          catatan: ex?.catatan || "",
        };
      });

      // If existing catatan, pre-fill surah
      const firstEntry = Object.values(existingMap)[0] as any;
      if (firstEntry) {
        const s = surahList.find(s => s.nomor === firstEntry.surah_nomor);
        if (s) setSelectedSurah(s);
        setAyatDari(firstEntry.ayat_dari);
        setAyatKe(firstEntry.ayat_ke);
        setHalamanAuto(firstEntry.jumlah_halaman);
        setJenis(firstEntry.jenis);
      }

      setEntries(initialEntries);
    }).finally(() => setLoading(false));
  }, [kelompokId, tanggalParam, sesiParam, surahList.length]);

  // Restore draft from localStorage
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.jenis) setJenis(draft.jenis);
        if (draft.selectedSurah) setSelectedSurah(draft.selectedSurah);
        if (draft.ayatDari) setAyatDari(draft.ayatDari);
        if (draft.ayatKe) setAyatKe(draft.ayatKe);
        if (draft.entries) setEntries(draft.entries);
      }
    } catch { /* ignore */ }
  }, [draftKey]);

  // Auto-save draft
  useEffect(() => {
    if (!draftKey || entries.length === 0) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ jenis, selectedSurah, ayatDari, ayatKe, entries }));
    } catch { /* ignore */ }
  }, [draftKey, jenis, selectedSurah, ayatDari, ayatKe, entries]);

  // Auto-calculate halaman when surah/ayat changes
  useEffect(() => {
    if (!selectedSurah) { setHalamanAuto(null); return; }
    fetch(`/api/quran/halaman?surah=${selectedSurah.nomor}&dari=${ayatDari}&ke=${ayatKe}`)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
        // Fallback: proportional calculation
        const ratio = (ayatKe - ayatDari + 1) / selectedSurah.total_ayat;
        setHalamanAuto(parseFloat((ratio * 0.5).toFixed(1)));
      });
  }, [selectedSurah, ayatDari, ayatKe]);

  // Sync ayatKe max when surah changes
  useEffect(() => {
    if (!selectedSurah) return;
    setAyatDari(1);
    setAyatKe(Math.min(selectedSurah.total_ayat, 10));
  }, [selectedSurah?.nomor]);

  const updateEntry = (idx: number, field: keyof SantriEntry, value: any) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedSurah) { setError("Pilih surah terlebih dahulu"); return; }
    if (!kelompokId || !pegawaiId) { setError("Data kelompok tidak ditemukan"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        kelompok_id: kelompokId,
        pegawai_id: pegawaiId,
        tanggal: tanggalParam,
        sesi: sesiParam,
        jenis,
        surah_nomor: selectedSurah.nomor,
        surah_nama: selectedSurah.nama_latin,
        surah_nama_arab: selectedSurah.nama_arab,
        ayat_dari: ayatDari,
        ayat_ke: ayatKe,
        jumlah_halaman: halamanAuto ?? 0,
        entries: entries.map(e => ({
          santri_id: e.santri_id,
          kehadiran: e.kehadiran,
          alasan: e.alasan || null,
          nilai_sikap: e.nilai_sikap,
          nilai_bacaan: e.nilai_bacaan,
          nilai_kelancaran: e.nilai_kelancaran,
          catatan: e.catatan || null,
        })),
      };
      const res = await fetch("/api/halaqoh/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }
      // Clear draft on success
      if (draftKey) localStorage.removeItem(draftKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const SESI_LABEL: Record<string, string> = {
    subuh: "Halaqoh Subuh",
    maghrib: "Ba'da Maghrib",
    dhuha: "Halaqoh Dhuha",
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400">
        <BookHeart size={24} className="mr-3 opacity-50" /> Memuat data halaqoh...
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans">
      {/* Back */}
      <Link href="/halaqoh" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors">
        <ArrowLeft size={16} /> Kembali ke Dashboard Halaqoh
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#550000] via-[#751414] to-[#3a0000] rounded-3xl p-6 sm:p-8 text-white shadow-[0_12px_40px_rgba(85,0,0,0.35)] border border-red-500/20">
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-inner">
            <BookHeart className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-200 mb-2">
              <span>Pengisian Mutabaah Harian</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">Input Catatan Halaqoh</h1>
            <p className="text-red-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
              {SESI_LABEL[sesiParam]} &middot; {formatTanggal(tanggalParam)}
              {kelompokInfo && <span> &middot; {kelompokInfo.nama_kelompok}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 1: Jenis + Surah */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_10px_35px_rgba(85,0,0,0.06)] space-y-6">
        <h2 className="m-0 text-lg font-black text-slate-800 flex items-center gap-2.5">
          <BookOpen size={20} className="text-[#751414]" /> Bacaan Sesi Ini
        </h2>

        {/* Jenis Setoran */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-600 block mb-2">Jenis Setoran</label>
          <div className="flex flex-wrap gap-2.5">
            {(["ziyadah", "murojaah"] as const).map(j => (
              <button
                key={j}
                onClick={() => setJenis(j)}
                className={`px-5 py-2.5 rounded-xl border-[1.5px] font-bold text-sm cursor-pointer capitalize transition-all duration-200 min-h-[44px] flex items-center gap-1.5 ${
                  jenis === j 
                    ? "border-red-950 bg-red-950 text-white shadow-md" 
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {j === "ziyadah" ? <BookOpen size={16} /> : <RotateCcw size={16} />}
                {j}
              </button>
            ))}
          </div>
        </div>

        {/* Surah Picker */}
        <div className="mb-4">
          <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="Surah" />
        </div>

        {/* Ayat Range */}
        {selectedSurah && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Dari Ayat</label>
              <input
                type="number" min={1} max={selectedSurah.total_ayat}
                value={ayatDari || ""}
                onChange={e => {
                  const val = e.target.value;
                  setAyatDari(val === "" ? 0 : Number(val));
                }}
                onBlur={() => {
                  let v = Math.max(1, Math.min(ayatDari, ayatKe));
                  if (!ayatDari) v = 1;
                  setAyatDari(v);
                }}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-sm font-bold min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-950/20 focus:border-red-950/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sampai Ayat</label>
              <input
                type="number" min={ayatDari || 1} max={selectedSurah.total_ayat}
                value={ayatKe || ""}
                onChange={e => {
                  const val = e.target.value;
                  setAyatKe(val === "" ? 0 : Number(val));
                }}
                onBlur={() => {
                  let v = Math.min(selectedSurah.total_ayat, Math.max(ayatKe, ayatDari || 1));
                  if (!ayatKe) v = ayatDari || 1;
                  setAyatKe(v);
                }}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-sm font-bold min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-950/20 focus:border-red-950/50"
              />
              <div className="text-[11px] text-slate-400 mt-1">Maks: {selectedSurah.total_ayat} ayat</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-600 flex items-baseline gap-1 mb-1.5">
                Jumlah Halaman
                <span className="text-[10px] text-slate-400 font-normal">(Mushaf Madinah)</span>
              </label>
              <div className="px-3 py-2.5 rounded-xl bg-green-50 border-[1.5px] border-green-200 font-extrabold text-base text-green-700 text-center min-h-[44px] flex items-center justify-center">
                {halamanAuto !== null ? (
                  <>
                    {halamanAuto.toFixed(1)}
                    <span className="text-[11px] font-medium ml-1 text-green-500">hal.</span>
                  </>
                ) : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Tabel Santri */}
      {entries.length > 0 && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl p-5 md:p-7 border-[1.5px] border-slate-200 shadow-sm mb-5">
          <h2 className="m-0 mb-5 text-base font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-red-950" /> Penilaian Santri
            <span className="text-xs font-normal text-slate-400 ml-1">({entries.length} santri)</span>
          </h2>

          <div className="flex flex-col gap-4">
            {entries.map((entry, idx) => (
              <div key={entry.santri_id} 
                className={`border-[1.5px] rounded-2xl overflow-hidden transition-all ${
                  entry.kehadiran !== "hadir" ? "border-amber-200 shadow-[inset_0_0_0_1px_#fde68a]" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Santri Header */}
                <div className="bg-slate-50/80 p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{entry.nama}</div>
                    {entry.nis && <div className="text-[11px] text-slate-500">{entry.nis}</div>}
                  </div>
                  {/* Kehadiran */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {KEHADIRAN_OPT.map(k => (
                      <button
                        key={k.val}
                        onClick={() => updateEntry(idx, "kehadiran", k.val)}
                        className="px-2.5 py-1.5 rounded-lg border-[1.5px] font-bold text-xs cursor-pointer transition-all duration-150 min-h-[36px] min-w-[56px]"
                        style={{
                          borderColor: entry.kehadiran === k.val ? k.warna : "#e2e8f0",
                          background: entry.kehadiran === k.val ? k.bg : "white",
                          color: entry.kehadiran === k.val ? k.warna : "#64748b"
                        }}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Alasan (jika tidak hadir) */}
                  {(entry.kehadiran === "sakit" || entry.kehadiran === "izin") && (
                    <div className="mb-4">
                      <label className="text-[11px] font-semibold text-amber-600 block mb-1.5">
                        Alasan {entry.kehadiran === "sakit" ? "Sakit" : "Izin"} *
                      </label>
                      <input
                        type="text"
                        value={entry.alasan}
                        onChange={e => updateEntry(idx, "alasan", e.target.value)}
                        placeholder={entry.kehadiran === "sakit" ? "Sakit apa?" : "Izin untuk keperluan apa?"}
                        className="w-full px-3 py-2 rounded-xl border-[1.5px] border-amber-200 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 min-h-[44px]"
                      />
                    </div>
                  )}

                  {/* Nilai (hanya jika hadir) */}
                  {entry.kehadiran === "hadir" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <NumericScoreSelector
                        label="Nilai Bacaan"
                        value={entry.nilai_bacaan}
                        onChange={v => updateEntry(idx, "nilai_bacaan", v)}
                      />
                      <NumericScoreSelector
                        label="Nilai Kelancaran"
                        value={entry.nilai_kelancaran}
                        onChange={v => updateEntry(idx, "nilai_kelancaran", v)}
                      />
                      <TextScoreSelector
                        label="Nilai Sikap"
                        value={entry.nilai_sikap}
                        onChange={v => updateEntry(idx, "nilai_sikap", v)}
                      />
                    </div>
                  )}

                  {/* Preview Nilai Akhir */}
                  {entry.kehadiran === "hadir" && (() => {
                    const nBacaan = entry.nilai_bacaan;
                    const nKelancaran = entry.nilai_kelancaran;
                    const nAkhir = Math.round((nBacaan + nKelancaran) / 2);
                    return (
                      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-dashed border-slate-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-500 font-semibold">Kalkulasi Nilai Akhir:</span>
                          <span className="font-extrabold text-base text-red-950">{nAkhir}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-mono bg-slate-100/80 p-2 rounded-lg break-all md:break-normal">
                          (Bacaan: <strong>{nBacaan}</strong> + Kelancaran: <strong>{nKelancaran}</strong>) &divide; 2 = <strong>{nAkhir}</strong>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Catatan */}
                  <div>
                    <input
                      type="text"
                      value={entry.catatan}
                      onChange={e => updateEntry(idx, "catatan", e.target.value)}
                      placeholder="Catatan opsional untuk santri ini..."
                      className="w-full px-3 py-2 rounded-xl border-[1.5px] border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-950/20 focus:border-red-950/50 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error & Save */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-700 text-sm font-medium">
          <CheckCircle2 size={18} className="shrink-0" /> Catatan halaqoh berhasil disimpan!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !selectedSurah || entries.length === 0}
        className={`w-full py-3.5 px-6 rounded-2xl border-none font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 min-h-[52px] ${
          saving || !selectedSurah || entries.length === 0
            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none" 
            : "bg-red-950 hover:bg-red-900 text-white shadow-red-950/25 hover:shadow-red-900/40 hover:-translate-y-0.5 cursor-pointer"
        }`}
      >
        <Save size={20} />
        {saving ? "Menyimpan Catatan..." : "Simpan Semua Catatan"}
      </button>
    </div>
  );
}
