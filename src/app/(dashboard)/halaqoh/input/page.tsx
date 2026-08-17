"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { BookHeart, ArrowLeft, Search, ChevronDown, BookOpen, Users, Save, CheckCircle2, AlertCircle, RotateCcw, Award, AlertTriangle } from "lucide-react";
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

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 800, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 13, border: "1.5px solid #e2e8f0",
    padding: "11px 14px", fontSize: 14, fontWeight: 600, outline: "none",
    background: "#fdf8f0", color: "#1e293b", transition: "border-color 0.2s",
  };

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
            {SESI_LABEL[sesiParam] || sesiParam} · {formatTanggal(tanggalParam)} · Kelompok {kelompokInfo?.nama || "-"}
          </p>
        </div>
      </div>

      {/* ── MAIN FORM CARD (UNIFIED LIKE UJIAN TAHFIDZ) ── */}
      <div style={{ background: "white", borderRadius: 24, padding: "28px 32px", border: "1.5px solid #ebdcc3", boxShadow: "0 4px 20px rgba(85,0,0,0.03)", display: "flex", flexDirection: "column", gap: 28 }}>

        <div style={{ fontSize: 18, fontWeight: 800, color: "#550000", display: "flex", alignItems: "center", gap: 10 }}>
          <BookHeart size={22} color="#550000" /> Form Catatan &amp; Mutabaah Halaqoh
        </div>

        {/* STEP 1: Bacaan Sesi Ini */}
        <div>
          <label style={{ ...labelStyle, fontSize: 13, color: "#1e293b", marginBottom: 12 }}>
            <span style={{ background: "#550000", color: "white", width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginRight: 8 }}>1</span>
            MATERI BACAAN SESI INI
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Jenis Setoran */}
            <div>
              <label style={labelStyle}>Jenis Setoran</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["ziyadah", "murojaah"] as const).map(j => {
                  const isSelected = jenis === j;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setJenis(j)}
                      style={{
                        padding: "10px 20px", borderRadius: 13, border: isSelected ? "none" : "1.5px solid #e2e8f0",
                        background: isSelected ? "#550000" : "#f8fafc", color: isSelected ? "white" : "#475569",
                        fontSize: 14, fontWeight: 800, cursor: "pointer", textTransform: "capitalize",
                        display: "flex", alignItems: "center", gap: 8,
                        boxShadow: isSelected ? "0 4px 12px rgba(85,0,0,0.25)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {j === "ziyadah" ? <BookOpen size={16} /> : <RotateCcw size={16} />}
                      {j}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surah Picker */}
            <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="NAMA SURAH / MATERI" />

            {/* Ayat Range & Halaman */}
            {selectedSurah && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, alignItems: "flex-end" }}>
                <div>
                  <label style={labelStyle}>Dari Ayat</label>
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
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sampai Ayat</label>
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
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: "flex", gap: 4, alignItems: "center" }}>
                    Jumlah Halaman <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>(Madinah)</span>
                  </label>
                  <div style={{ ...inputStyle, background: "#ecfdf5", border: "1.5px solid #a7f3d0", color: "#059669", fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {halamanAuto !== null ? `${halamanAuto.toFixed(1)} hal.` : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Penilaian Santri */}
        {entries.length > 0 && (
          <div>
            <label style={{ ...labelStyle, fontSize: 13, color: "#1e293b", marginBottom: 16 }}>
              <span style={{ background: "#550000", color: "white", width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginRight: 8 }}>2</span>
              PENILAIAN &amp; PRESENSI SANTRI ({entries.length} SANTRI)
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {entries.map((entry, idx) => (
                <div
                  key={entry.santri_id}
                  style={{
                    border: "1.5px solid #e2e8f0", borderRadius: 18, overflow: "hidden", background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  {/* Header Bar */}
                  <div style={{ background: "#f8fafc", padding: "14px 20px", borderBottom: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 900, color: "#550000", fontSize: 15 }}>{entry.nama}</div>
                      {entry.nis && <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>NIS: {entry.nis}</div>}
                    </div>

                    {/* Kehadiran Buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {KEHADIRAN_OPT.map(k => {
                        const isSel = entry.kehadiran === k.val;
                        return (
                          <button
                            key={k.val}
                            type="button"
                            onClick={() => updateEntry(idx, "kehadiran", k.val)}
                            style={{
                              padding: "6px 14px", borderRadius: 10, border: isSel ? `1.5px solid ${k.warna}` : "1.5px solid #e2e8f0",
                              background: isSel ? k.bg : "white", color: isSel ? k.warna : "#64748b",
                              fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {k.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Alasan jika tidak hadir */}
                    {(entry.kehadiran === "sakit" || entry.kehadiran === "izin") && (
                      <div>
                        <label style={{ ...labelStyle, color: "#d97706" }}>Alasan {entry.kehadiran === "sakit" ? "Sakit" : "Izin"} *</label>
                        <input
                          type="text"
                          value={entry.alasan}
                          onChange={e => updateEntry(idx, "alasan", e.target.value)}
                          placeholder={entry.kehadiran === "sakit" ? "Sakit apa?" : "Izin untuk keperluan apa?"}
                          style={{ ...inputStyle, background: "#fffbeb", border: "1.5px solid #fde68a" }}
                        />
                      </div>
                    )}

                    {/* Score Selectors */}
                    {entry.kehadiran === "hadir" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                        <NumericScoreSelector label="Nilai Bacaan" value={entry.nilai_bacaan} onChange={v => updateEntry(idx, "nilai_bacaan", v)} />
                        <NumericScoreSelector label="Nilai Kelancaran" value={entry.nilai_kelancaran} onChange={v => updateEntry(idx, "nilai_kelancaran", v)} />
                        <TextScoreSelector label="Nilai Sikap" value={entry.nilai_sikap} onChange={v => updateEntry(idx, "nilai_sikap", v)} />
                      </div>
                    )}

                    {/* Kalkulasi Akhir Box */}
                    {entry.kehadiran === "hadir" && (() => {
                      const nBacaan = entry.nilai_bacaan;
                      const nKelancaran = entry.nilai_kelancaran;
                      const nAkhir = Math.round((nBacaan + nKelancaran) / 2);
                      return (
                        <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#550000", textTransform: "uppercase", letterSpacing: "0.04em" }}>KALKULASI AKHIR</div>
                            <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>
                              (Bacaan: {nBacaan} + Lancar: {nKelancaran}) &divide; 2
                            </div>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: "#550000", background: "white", padding: "4px 16px", borderRadius: 10, border: "1px solid #fecaca" }}>
                            {nAkhir}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Catatan Input */}
                    <div>
                      <label style={{ ...labelStyle, marginBottom: 4 }}>CATATAN HALAQOH SANTRI</label>
                      <input
                        type="text"
                        value={entry.catatan}
                        onChange={e => updateEntry(idx, "catatan", e.target.value)}
                        placeholder="Catatan opsional untuk santri ini..."
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages & Submit */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 14, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {saved && (
          <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", color: "#059669", padding: "12px 16px", borderRadius: 14, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} /> Catatan halaqoh berhasil disimpan!
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedSurah || entries.length === 0}
          style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            background: saving || !selectedSurah || entries.length === 0 ? "#cbd5e1" : "#550000",
            color: "white", fontSize: 15, fontWeight: 800,
            cursor: saving || !selectedSurah || entries.length === 0 ? "not-allowed" : "pointer",
            boxShadow: saving || !selectedSurah || entries.length === 0 ? "none" : "0 4px 14px rgba(85,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.15s",
          }}
        >
          <Save size={18} />
          {saving ? "Menyimpan Catatan..." : "Simpan Semua Catatan"}
        </button>
      </div>
    </div>
  );
}
