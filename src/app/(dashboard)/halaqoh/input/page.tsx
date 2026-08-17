"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookHeart, ArrowLeft, Search, ChevronDown, BookOpen, Users, Save,
  CheckCircle2, AlertCircle, RotateCcw, Award, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const OPSI_NILAI = [100, 98, 95, 90, 85, 80, 75, 70, 65, 60] as const;

function getPredikat(nilai: number) {
  if (nilai >= 98) return { label: "Sangat Baik", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
  if (nilai >= 90) return { label: "Baik",        bg: "#eff6ff", color: "#0284c7", border: "#bfdbfe" };
  if (nilai >= 85) return { label: "Cukup",       bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  if (nilai >= 75) return { label: "Kurang",      bg: "#fff7ed", color: "#ea580c", border: "#ffedd5" };
  return                  { label: "Sangat Kurang", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
}

const KEHADIRAN_OPT = [
  { label: "Hadir",  val: "hadir",  warna: "#059669", bg: "#ecfdf5" },
  { label: "Sakit",  val: "sakit",  warna: "#d97706", bg: "#fffbeb" },
  { label: "Izin",   val: "izin",   warna: "#0284c7", bg: "#eff6ff" },
  { label: "Alfa",   val: "alfa",   warna: "#dc2626", bg: "#fef2f2" },
];

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

const DRAFT_KEY_PREFIX = "siakad_halaqoh_draft_v2";

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
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 14px", borderRadius: 13, border: "1.5px solid #e2e8f0",
          background: "#fdf8f0", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1e293b",
        }}
      >
        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, color: "#550000" }}>{selected.nomor}. {selected.nama_latin}</span>
            <span style={{ fontSize: 15, color: "#64748b", fontFamily: "serif" }}>{selected.nama_arab}</span>
          </div>
        ) : (
          <span style={{ color: "#94a3b8" }}>Cari surah...</span>
        )}
        <ChevronDown size={16} color="#94a3b8" />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "white", borderRadius: 16, border: "1.5px solid #e2e8f0",
          boxShadow: "0 12px 36px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          <div style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor..."
                style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>
          <div className="custom-scrollbar" style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.map(s => (
              <div
                key={s.nomor}
                onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fdf8f0")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: "#fff5f5", color: "#550000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                    {s.nomor}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13 }}>{s.nama_latin}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.total_ayat} ayat</div>
                  </div>
                </div>
                <div style={{ fontSize: 16, color: "#475569", fontFamily: "serif" }}>{s.nama_arab}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INDIKATOR SELECTOR ──────────────────────────────────────────────────────
function NumericScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const predikat = getPredikat(value);
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "20px 22px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <span style={{ background: predikat.bg, color: predikat.color, border: `1px solid ${predikat.border}`, padding: "3px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {predikat.label} {value >= 85 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {OPSI_NILAI.map(num => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              style={{
                width: 42, height: 42, borderRadius: 12, border: isSelected ? "none" : "1.5px solid #e2e8f0",
                background: isSelected ? "#550000" : "#f8fafc", color: isSelected ? "white" : "#475569",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                boxShadow: isSelected ? "0 4px 12px rgba(85,0,0,0.3)" : "none",
                transition: "all 0.15s",
              }}
            >
              {num}
            </button>
          );
        })}
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

function TextScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const predikat = getPredikat(value);
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "20px 22px", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <span style={{ background: predikat.bg, color: predikat.color, border: `1px solid ${predikat.border}`, padding: "3px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {predikat.label} {value >= 85 ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {OPSI_SIKAP.map(item => {
          const isSelected = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              style={{
                padding: "8px 14px", borderRadius: 12, border: isSelected ? "none" : "1.5px solid #e2e8f0",
                background: isSelected ? "#550000" : "#f8fafc", color: isSelected ? "white" : "#475569",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: isSelected ? "0 4px 12px rgba(85,0,0,0.3)" : "none",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          );
        })}
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
        nis: a.santri.nis,
      }));
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
    fetch(`/api/quran/halaman?surah=${selectedSurah.nomor}&dari=${ayatDari}&ke=${ayatKe}`)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
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

  const selectedSantri = santriList.find(s => s.id === selectedSantriId);

  const filteredSantri = santriList.filter(s =>
    searchQuery === "" ||
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nis && s.nis.includes(searchQuery))
  );

  const finalNilai = Math.round((nilaiBacaan + nilaiKelancaran) / 2);

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
            surah_nomor: selectedSurah?.nomor,
            surah_nama: selectedSurah?.nama_latin,
            surah_nama_arab: selectedSurah?.nama_arab,
            ayat_dari: ayatDari,
            ayat_ke: ayatKe,
            jumlah_halaman: halamanAuto ?? 0,
            kehadiran,
            alasan: alasan || null,
            nilai_sikap: nilaiSikap,
            nilai_bacaan: nilaiBacaan,
            nilai_kelancaran: nilaiKelancaran,
            catatan: catatan || null,
          },
        ],
      };

      const res = await fetch("/api/halaqoh/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 800, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 13, border: "1.5px solid #e2e8f0",
    padding: "11px 14px", fontSize: 14, fontWeight: 600, outline: "none",
    background: "#fdf8f0", color: "#1e293b", transition: "border-color 0.2s",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400">
        <BookHeart size={24} className="mr-3 opacity-50" /> Memuat data halaqoh...
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── BACK BUTTON ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/halaqoh"
          style={{
            width: 40, height: 40, background: "white", border: "1.5px solid #e2e8f0",
            borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", textDecoration: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Kembali ke Dashboard Halaqoh</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="hero-banner">
        <div style={{ position: "absolute", top: 0, right: 0, width: 256, height: 256, background: "rgba(221, 193, 146, 0.15)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(30%, -50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: 192, height: 192, background: "rgba(221, 193, 146, 0.1)", borderRadius: "50%", filter: "blur(40px)", transform: "translate(-25%, 50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(221, 193, 146, 0.18)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(221, 193, 146, 0.4)", width: "fit-content", marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ddc192", boxShadow: "0 0 6px rgba(221, 193, 146, 0.9)" }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#fdf8f0", textTransform: "uppercase" }}>Pengisian Mutabaah Harian</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10, color: "white" }}>
            <BookHeart size={26} color="#ddc192" /> Input Catatan Halaqoh
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: 14, margin: "6px 0 0" }}>
            {SESI_LABEL[sesiParam] || sesiParam} · {formatTanggal(tanggal)} · Kelompok {kelompokInfo?.nama || "-"}
          </p>
        </div>
      </div>

      {/* ── MAIN FORM CARD ── */}
      <div style={{ background: "white", borderRadius: 24, padding: "28px 32px", border: "1.5px solid #ebdcc3", boxShadow: "0 4px 20px rgba(85,0,0,0.03)", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ fontSize: 18, fontWeight: 800, color: "#550000", display: "flex", alignItems: "center", gap: 10 }}>
          <BookHeart size={22} color="#550000" /> Form Catatan &amp; Mutabaah Halaqoh
        </div>

        {/* STEP 1: Pilih Jenis Setoran / Kegiatan */}
        <div>
          <label style={{ ...labelStyle, fontSize: 13, color: "#1e293b", marginBottom: 12 }}>
            <span style={{ background: "#550000", color: "white", width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginRight: 8 }}>1</span>
            PILIH JENIS KEGIATAN HALAQOH
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {(["tahsin", "ziyadah", "murojaah"] as const).map(j => {
              const isSelected = jenis === j;
              const meta: Record<string, { title: string; sub: string; icon: React.ReactNode }> = {
                tahsin:   { title: "Tahsin (Talaqqi Face-to-Face)", sub: "Penguatan Bacaan & Talaqqi", icon: <Award size={18} /> },
                ziyadah:  { title: "Setoran Ziyadah",             sub: "Setoran Hafalan Baru", icon: <BookOpen size={18} /> },
                murojaah: { title: "Setoran Murojaah",            sub: "Pengulangan Hafalan", icon: <RotateCcw size={18} /> },
              };
              const item = meta[j];
              return (
                <div
                  key={j}
                  onClick={() => setJenis(j)}
                  style={{
                    padding: "14px 18px", borderRadius: 16, cursor: "pointer",
                    border: isSelected ? "2px solid #550000" : "1.5px solid #e2e8f0",
                    background: isSelected ? "#fff5f5" : "#f8fafc",
                    boxShadow: isSelected ? "0 4px 12px rgba(85,0,0,0.12)" : "none",
                    transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? "#550000" : "white", display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "white" : "#550000", border: "1px solid #ebdcc3", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: isSelected ? "#550000" : "#334155" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Pilih Santri */}
        <div>
          <label style={{ ...labelStyle, fontSize: 13, color: "#1e293b", marginBottom: 12 }}>
            <span style={{ background: "#550000", color: "white", width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginRight: 8 }}>2</span>
            PILIH SANTRI
          </label>

          {selectedSantri ? (
            <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#550000", fontSize: 15 }}>{selectedSantri.nama_lengkap}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                  NIS: {selectedSantri.nis || "—"} · Kelompok: {kelompokInfo?.nama || "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSantriId("")}
                style={{ background: "white", border: "1.5px solid #fecaca", borderRadius: 10, padding: "8px 16px", color: "#dc2626", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
              >
                Ganti Santri
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama atau NIS santri..."
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div className="custom-scrollbar" style={{ maxHeight: 200, overflowY: "auto", border: "1.5px solid #e2e8f0", borderRadius: 16, background: "white" }}>
                {filteredSantri.map(s => {
                  const isDone = history.some(h => h.santri_id === s.id || h.santri?.nama_lengkap === s.nama_lengkap);
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSantriId(s.id)}
                      style={{
                        padding: "12px 18px", borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s",
                        background: isDone ? "#f0fdf4" : "white",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDone ? "#dcfce7" : "#fdf8f0")}
                      onMouseLeave={e => (e.currentTarget.style.background = isDone ? "#f0fdf4" : "white")}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: isDone ? "#166534" : "#1e293b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                          {s.nama_lengkap}
                          {isDone && (
                            <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 800, border: "1px solid #bbf7d0" }}>
                              ✓ Sudah Diisi
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: isDone ? "#15803d" : "#64748b" }}>NIS: {s.nis || "—"}</div>
                      </div>
                      <CheckCircle2 size={16} color={isDone ? "#166534" : "#550000"} />
                    </div>
                  );
                })}
                {filteredSantri.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Santri tidak ditemukan</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Detail Setoran & Nilai */}
        {selectedSantri && (
          <>
            {/* Tanggal & Kehadiran */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <label style={labelStyle}>{jenis === "tahsin" ? "TANGGAL HALAQOH" : "TANGGAL SETORAN"}</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
              </div>
              <div>
                <label style={labelStyle}>STATUS KEHADIRAN</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {KEHADIRAN_OPT.map(k => {
                    const isSel = kehadiran === k.val;
                    return (
                      <button
                        key={k.val}
                        type="button"
                        onClick={() => setKehadiran(k.val as any)}
                        style={{
                          padding: "10px 16px", borderRadius: 12, border: isSel ? `1.5px solid ${k.warna}` : "1.5px solid #e2e8f0",
                          background: isSel ? k.bg : "white", color: isSel ? k.warna : "#64748b",
                          fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.15s", flex: 1,
                        }}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Alasan jika tidak hadir */}
            {(kehadiran === "sakit" || kehadiran === "izin") && (
              <div>
                <label style={{ ...labelStyle, color: "#d97706" }}>Alasan {kehadiran === "sakit" ? "Sakit" : "Izin"} *</label>
                <input
                  type="text"
                  value={alasan}
                  onChange={e => setAlasan(e.target.value)}
                  placeholder={kehadiran === "sakit" ? "Sakit apa?" : "Izin untuk keperluan apa?"}
                  style={{ ...inputStyle, background: "#fffbeb", border: "1.5px solid #fde68a" }}
                />
              </div>
            )}

            {/* Form Hafalan / Tahsin (Hanya jika Hadir) */}
            {kehadiran === "hadir" && (
              <>
                {jenis === "tahsin" ? (
                  <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "14px 18px", color: "#b45309", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                    <Award size={18} color="#d97706" />
                    <span>Mode <strong>Tahsin (Talaqqi Face-to-Face)</strong>: Presensi &amp; Evaluasi Bacaan santri secara lisan.</span>
                  </div>
                ) : (
                  <>
                    {/* Surah & Halaman */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div>
                        <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="NAMA SURAH" />
                      </div>
                      <div>
                        <label style={labelStyle}>JUMLAH HALAMAN (STANDAR MADINAH)</label>
                        <div style={{ ...inputStyle, background: "#ecfdf5", border: "1.5px solid #a7f3d0", color: "#059669", fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {halamanAuto !== null ? `${halamanAuto.toFixed(1)} hal.` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Ayat Range */}
                    {selectedSurah && (
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18, border: "1.5px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {/* Dari Ayat */}
                        <div>
                          <label style={labelStyle}>Dari Ayat</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setAyatDari(prev => Math.max(1, (prev || 1) - 1))}
                              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >-</button>
                            <input
                              type="number"
                              min={1}
                              max={selectedSurah.total_ayat}
                              value={ayatDari === 0 ? "" : ayatDari}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === "") setAyatDari(0);
                                else {
                                  const n = parseInt(val);
                                  if (!isNaN(n)) setAyatDari(n);
                                }
                              }}
                              onBlur={() => {
                                if (!ayatDari || ayatDari < 1) setAyatDari(1);
                                else if (ayatDari > selectedSurah.total_ayat) setAyatDari(selectedSurah.total_ayat);
                              }}
                              style={{ ...inputStyle, background: "white", textAlign: "center", fontWeight: 800, fontSize: 15 }}
                              onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                            />
                            <button
                              type="button"
                              onClick={() => setAyatDari(prev => Math.min(selectedSurah.total_ayat, (prev || 0) + 1))}
                              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >+</button>
                          </div>
                        </div>

                        {/* Sampai Ayat */}
                        <div>
                          <label style={labelStyle}>Sampai Ayat (Maks: {selectedSurah.total_ayat})</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setAyatKe(prev => Math.max(ayatDari || 1, (prev || 1) - 1))}
                              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >-</button>
                            <input
                              type="number"
                              min={ayatDari || 1}
                              max={selectedSurah.total_ayat}
                              value={ayatKe === 0 ? "" : ayatKe}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === "") setAyatKe(0);
                                else {
                                  const n = parseInt(val);
                                  if (!isNaN(n)) setAyatKe(n);
                                }
                              }}
                              onBlur={() => {
                                if (!ayatKe || ayatKe < (ayatDari || 1)) setAyatKe(ayatDari || 1);
                                else if (ayatKe > selectedSurah.total_ayat) setAyatKe(selectedSurah.total_ayat);
                              }}
                              style={{ ...inputStyle, background: "white", textAlign: "center", fontWeight: 800, fontSize: 15 }}
                              onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                            />
                            <button
                              type="button"
                              onClick={() => setAyatKe(prev => Math.min(selectedSurah.total_ayat, (prev || 0) + 1))}
                              style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                            >+</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Score Selectors */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  <NumericScoreSelector label={jenis === "tahsin" ? "Nilai Tajwid" : "Nilai Bacaan"} value={nilaiBacaan} onChange={setNilaiBacaan} />
                  <NumericScoreSelector label={jenis === "tahsin" ? "Nilai Makhraj" : "Nilai Kelancaran"} value={nilaiKelancaran} onChange={setNilaiKelancaran} />
                  <TextScoreSelector label="Nilai Sikap" value={nilaiSikap} onChange={setNilaiSikap} />
                </div>

                {/* Calculation Summary Box */}
                <div style={{ background: "#fff5f5", borderRadius: 18, padding: "20px 24px", border: "1.5px solid #fecaca" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#550000", textTransform: "uppercase", letterSpacing: "0.04em" }}>KALKULASI NILAI AKHIR:</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: "#550000" }}>{finalNilai}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", background: "white", padding: "10px 14px", borderRadius: 10, border: "1px solid #ebdcc3", fontWeight: 600 }}>
                    {jenis === "tahsin" ? (
                      <>(Tajwid: <strong>{nilaiBacaan}</strong> + Makhraj: <strong>{nilaiKelancaran}</strong>) &divide; 2 = <strong style={{ color: "#550000" }}>{finalNilai}</strong></>
                    ) : (
                      <>(Bacaan: <strong>{nilaiBacaan}</strong> + Kelancaran: <strong>{nilaiKelancaran}</strong>) &divide; 2 = <strong style={{ color: "#550000" }}>{finalNilai}</strong></>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Catatan */}
            <div>
              <label style={labelStyle}>Catatan Halaqoh Santri (Opsional)</label>
              <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan evaluasi setoran santri ini..." style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "#550000")} onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 18px", borderRadius: 12, border: "1px solid #fecaca", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {saved && (
              <div style={{ background: "#ecfdf5", color: "#059669", padding: "12px 18px", borderRadius: 12, border: "1px solid #a7f3d0", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} /> Catatan halaqoh santri berhasil disimpan!
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedSantriId}
              style={{
                background: saving || !selectedSantriId ? "#cbd5e1" : "#550000",
                color: "white", padding: "14px 28px", borderRadius: 16,
                border: "none", fontWeight: 800, fontSize: 15, cursor: saving || !selectedSantriId ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: saving || !selectedSantriId ? "none" : "0 4px 14px rgba(85,0,0,0.3)",
                transition: "all 0.2s",
              }}
            >
              <Save size={18} /> {saving ? "Menyimpan Catatan..." : "Simpan Catatan Santri Ini"}
            </button>
          </>
        )}
      </div>

      {/* ── HISTORY TABLE ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1.5px solid #f1f5f9", fontWeight: 800, color: "#1e293b", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <BookHeart size={18} color="#550000" /> Riwayat Catatan Halaqoh ({SESI_LABEL[sesiParam] || sesiParam})
        </div>

        {history.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Belum ada catatan halaqoh untuk sesi ini</div>
        ) : (
          <div className="custom-scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Tanggal", "Santri", "Jenis", "Materi / Surah", "Ayat", "Halaman", "Nilai Akhir", "Kehadiran", "Catatan"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{formatTanggal(row.tanggal)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#1e293b", whiteSpace: "nowrap" }}>{row.santri?.nama_lengkap}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid #ebdcc3", background: row.jenis === "ziyadah" ? "#fff5f5" : "#fdf8f0", color: "#550000", textTransform: "capitalize" }}>
                        {row.jenis}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>
                      {row.surah_nama || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {row.ayat_dari && row.ayat_ke ? `Ayat ${row.ayat_dari}–${row.ayat_ke}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#059669", fontWeight: 700 }}>
                      {row.jumlah_halaman ? `${row.jumlah_halaman} hal.` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 900, color: "#550000", fontSize: 14 }}>
                      {row.nilai_akhir ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: row.kehadiran === "hadir" ? "#ecfdf5" : "#fffbeb", color: row.kehadiran === "hadir" ? "#059669" : "#d97706" }}>
                        {row.kehadiran}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                      {row.catatan || "—"}
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
