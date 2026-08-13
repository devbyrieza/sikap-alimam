"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { BookHeart, ArrowLeft, Search, ChevronDown, BookOpen, Users, Save, CheckCircle2, AlertCircle, RotateCcw, Award } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ─── NILAI INDIKATOR ────────────────────────────────────────────────────────
const NILAI_INDIKATOR = [
  { label: "Sangat Baik", nilai: 95, warna: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { label: "Baik",        nilai: 82, warna: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "Cukup",       nilai: 70, warna: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { label: "Kurang",      nilai: 55, warna: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { label: "Buruk",       nilai: 40, warna: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
] as const;

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
  nilai_sikap_label: string;
  nilai_bacaan_label: string;
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

function indikatorToNilai(label: string): number {
  return NILAI_INDIKATOR.find(i => i.label === label)?.nilai ?? 68;
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
      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>{label}</label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0",
          background: "white", cursor: "pointer", fontSize: 13, userSelect: "none"
        }}
      >
        {selected ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>
              {selected.nomor}. {selected.nama_latin}
            </span>
            <span style={{ fontSize: 15, color: "#94a3b8", fontFamily: "serif" }}>{selected.nama_arab}</span>
          </div>
        ) : (
          <span style={{ color: "#94a3b8" }}>Cari surah...</span>
        )}
        <ChevronDown size={15} color="#94a3b8" />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "white", borderRadius: 14, border: "1.5px solid #e2e8f0",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)", overflow: "hidden"
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor..."
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.map(s => (
              <div
                key={s.nomor}
                onClick={() => { onSelect(s); setOpen(false); setQuery(""); }}
                style={{
                  padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f8fafc",
                  display: "flex", alignItems: "center", gap: 14, transition: "background 0.1s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                <div style={{
                  width: 30, height: 30, background: "#f1f5f9", borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#550000", flexShrink: 0
                }}>
                  {s.nomor}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{s.nama_latin}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.total_ayat} ayat</div>
                </div>
                <div style={{ fontSize: 16, color: "#64748b", fontFamily: "serif" }}>{s.nama_arab}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
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
function IndikatorSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {NILAI_INDIKATOR.map(ind => (
          <button
            key={ind.label}
            onClick={() => onChange(ind.label)}
            style={{
              padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${value === ind.label ? ind.warna : "#e2e8f0"}`,
              background: value === ind.label ? ind.bg : "white",
              color: value === ind.label ? ind.warna : "#64748b",
              transition: "all 0.15s"
            }}
            title={`${ind.label} (${ind.nilai})`}
          >
            {ind.label}
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
        const ex = existingMap[a.santri.id];
        return {
          santri_id: a.santri.id,
          nama: a.santri.nama_lengkap,
          nis: a.santri.nis,
          kehadiran: ex?.kehadiran || "hadir",
          alasan: ex?.alasan || "",
          nilai_sikap_label: ex ? (
            NILAI_INDIKATOR.find(i => i.nilai === ex.nilai_sikap)?.label || "Baik"
          ) : "Baik",
          nilai_bacaan_label: ex ? (
            NILAI_INDIKATOR.find(i => i.nilai === ex.nilai_bacaan)?.label || "Baik"
          ) : "Baik",
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
          nilai_sikap: indikatorToNilai(e.nilai_sikap_label),
          nilai_bacaan: indikatorToNilai(e.nilai_bacaan_label),
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94a3b8" }}>
        <BookHeart size={24} style={{ marginRight: 12, opacity: 0.5 }} /> Memuat data halaqoh...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Back */}
      <Link href="/halaqoh" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
        <ArrowLeft size={14} /> Kembali ke Dashboard Halaqoh
      </Link>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 20, padding: "22px 28px", marginBottom: 24, color: "white",
        boxShadow: "0 8px 32px rgba(85,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <BookHeart size={20} />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Input Catatan Halaqoh</h1>
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {SESI_LABEL[sesiParam]} · {formatTanggal(tanggalParam)}
          {kelompokInfo && <span> · {kelompokInfo.nama_kelompok}</span>}
        </div>
      </div>

      {/* Bagian 1: Jenis + Surah */}
      <div style={{ background: "white", borderRadius: 18, padding: 24, marginBottom: 16, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ margin: "0 0 18px 0", fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} color="#550000" /> Bacaan Sesi Ini
        </h2>

        {/* Jenis Setoran */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Jenis Setoran</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["ziyadah", "murojaah"] as const).map(j => (
              <button
                key={j}
                onClick={() => setJenis(j)}
                style={{
                  padding: "10px 22px", borderRadius: 12, border: "1.5px solid",
                  borderColor: jenis === j ? "#550000" : "#e2e8f0",
                  background: jenis === j ? "#550000" : "white",
                  color: jenis === j ? "white" : "#64748b",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s"
                }}
              >
                {j === "ziyadah" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={14} /> Ziyadah
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <RotateCcw size={14} /> Murojaah
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Surah Picker */}
        <div style={{ marginBottom: 16 }}>
          <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="Surah" />
        </div>

        {/* Ayat Range */}
        {selectedSurah && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Dari Ayat</label>
              <input
                type="number" min={1} max={selectedSurah.total_ayat}
                value={ayatDari}
                onChange={e => {
                  const v = Math.max(1, Math.min(Number(e.target.value), ayatKe));
                  setAyatDari(v);
                }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 700, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Sampai Ayat</label>
              <input
                type="number" min={ayatDari} max={selectedSurah.total_ayat}
                value={ayatKe}
                onChange={e => {
                  const v = Math.min(selectedSurah.total_ayat, Math.max(Number(e.target.value), ayatDari));
                  setAyatKe(v);
                }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 700, boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Maks: {selectedSurah.total_ayat} ayat</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Jumlah Halaman
                <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6, fontWeight: 400 }}>(Mushaf Madinah, auto)</span>
              </label>
              <div style={{
                padding: "10px 14px", borderRadius: 10, background: "#f0fdf4",
                border: "1.5px solid #a7f3d0", fontWeight: 800, fontSize: 16, color: "#059669", textAlign: "center"
              }}>
                {halamanAuto !== null ? (
                  <>
                    {halamanAuto.toFixed(1)}
                    <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, color: "#6ee7b7" }}>hal.</span>
                  </>
                ) : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Tabel Santri */}
      {entries.length > 0 && (
        <div style={{ background: "white", borderRadius: 18, padding: 24, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={16} color="#550000" /> Penilaian Santri
            <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>({entries.length} santri)</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {entries.map((entry, idx) => (
              <div key={entry.santri_id} style={{
                border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden",
                boxShadow: entry.kehadiran !== "hadir" ? "inset 0 0 0 2px #fde68a" : "none"
              }}>
                {/* Santri Header */}
                <div style={{
                  background: "#f8fafc", padding: "12px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  borderBottom: "1px solid #f1f5f9"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{entry.nama}</div>
                    {entry.nis && <div style={{ fontSize: 11, color: "#94a3b8" }}>{entry.nis}</div>}
                  </div>
                  {/* Kehadiran */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {KEHADIRAN_OPT.map(k => (
                      <button
                        key={k.val}
                        onClick={() => updateEntry(idx, "kehadiran", k.val)}
                        style={{
                          padding: "5px 10px", borderRadius: 8, border: "1.5px solid",
                          borderColor: entry.kehadiran === k.val ? k.warna : "#e2e8f0",
                          background: entry.kehadiran === k.val ? k.bg : "white",
                          color: entry.kehadiran === k.val ? k.warna : "#64748b",
                          fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.15s"
                        }}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 16 }}>
                  {/* Alasan (jika tidak hadir) */}
                  {(entry.kehadiran === "sakit" || entry.kehadiran === "izin") && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#d97706", display: "block", marginBottom: 5 }}>
                        Alasan {entry.kehadiran === "sakit" ? "Sakit" : "Izin"} *
                      </label>
                      <input
                        type="text"
                        value={entry.alasan}
                        onChange={e => updateEntry(idx, "alasan", e.target.value)}
                        placeholder={entry.kehadiran === "sakit" ? "Sakit apa?" : "Izin untuk keperluan apa?"}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #fde68a", fontSize: 13, boxSizing: "border-box", background: "#fffbeb" }}
                      />
                    </div>
                  )}

                  {/* Nilai (hanya jika hadir) */}
                  {entry.kehadiran === "hadir" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                      <IndikatorSelector
                        label="Nilai Sikap"
                        value={entry.nilai_sikap_label}
                        onChange={v => updateEntry(idx, "nilai_sikap_label", v)}
                      />
                      <IndikatorSelector
                        label="Nilai Bacaan / Setoran"
                        value={entry.nilai_bacaan_label}
                        onChange={v => updateEntry(idx, "nilai_bacaan_label", v)}
                      />
                    </div>
                  )}

                  {/* Preview Nilai Akhir */}
                  {entry.kehadiran === "hadir" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Nilai Akhir:</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>(Rata-rata Sikap & Setoran)</span>
                      </div>
                      <span style={{
                        fontWeight: 800, fontSize: 15, color: "#550000",
                        background: "#fff1f2", padding: "3px 12px", borderRadius: 8
                      }}>
                        {Math.round((indikatorToNilai(entry.nilai_sikap_label) + indikatorToNilai(entry.nilai_bacaan_label)) / 2)}
                      </span>
                    </div>
                  )}

                  {/* Catatan */}
                  <div>
                    <input
                      type="text"
                      value={entry.catatan}
                      onChange={e => updateEntry(idx, "catatan", e.target.value)}
                      placeholder="Catatan opsional untuk santri ini..."
                      style={{ width: "100%", padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box", color: "#475569" }}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#059669", fontSize: 13 }}>
          <CheckCircle2 size={16} /> Catatan halaqoh berhasil disimpan!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !selectedSurah || entries.length === 0}
        style={{
          width: "100%", padding: "14px 24px", borderRadius: 14, border: "none",
          background: saving ? "#94a3b8" : "#550000", color: "white",
          fontWeight: 800, fontSize: 15, cursor: saving ? "wait" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 4px 16px rgba(85,0,0,0.25)", transition: "all 0.2s"
        }}
      >
        <Save size={18} />
        {saving ? "Menyimpan Catatan..." : "Simpan Semua Catatan"}
      </button>
    </div>
  );
}
