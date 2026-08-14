"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BookHeart, ArrowLeft, Search, CalendarDays, Award, CheckCircle2, AlertCircle, Save, Star, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

const JENIS_UJIAN_OPT = [
  { val: "ujian_pekanan", label: "Ujian Pekanan", target: "2 Halaman",             icon: <Clock size={16} />,       color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { val: "ujian_bulanan", label: "Ujian Bulanan", target: "10 Halaman",            icon: <CalendarDays size={16} />, color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe" },
  { val: "ujian_target",  label: "Ujian Target",  target: "Sesuai Target Kelas",   icon: <Award size={16} />,        color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  { val: "ujian_itqon",   label: "Ujian Itqon",   target: "per 5 Juz (Bonus +10)", icon: <Star size={16} />,         color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
];

const OPSI_NILAI = [100, 98, 95, 90, 85, 80, 75, 70, 65, 60] as const;

function getPredikat(nilai: number) {
  if (nilai >= 98) return { label: "Sangat Baik", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (nilai >= 90) return { label: "Baik", color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" };
  if (nilai === 85) return { label: "Cukup", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (nilai >= 75) return { label: "Kurang", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Sangat Kurang", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: predikat.bg, color: predikat.color, border: `1px solid ${predikat.border}` }}>
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {OPSI_NILAI.map(num => (
          <button
            key={num}
            onClick={() => onChange(num)}
            style={{
              padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1.5px solid ${value === num ? predikat.color : "#e2e8f0"}`,
              background: value === num ? predikat.bg : "white",
              color: value === num ? predikat.color : "#64748b",
              transition: "all 0.15s"
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</div>
        <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: predikat.bg, color: predikat.color, border: `1px solid ${predikat.border}` }}>
          {predikat.label} {value >= 85 ? "✅" : "⚠️"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {OPSI_SIKAP.map(opsi => (
          <button
            key={opsi.value}
            onClick={() => onChange(opsi.value)}
            style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1.5px solid ${value === opsi.value ? predikat.color : "#e2e8f0"}`,
              background: value === opsi.value ? predikat.bg : "white",
              color: value === opsi.value ? predikat.color : "#64748b",
              transition: "all 0.15s"
            }}
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
      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
        <li>Jalur internal MTs: <strong>10 Juz</strong> (+4 Juz dari Kls 9)</li>
        <li>Jalur eksternal IL: <strong>8 Juz</strong> (+4 Juz dari IL)</li>
      </ul>
    );
  } else if (kelas.includes("11 ma")) {
    targetNode = (
      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
        <li>Jalur internal MTs: <strong>13 Juz</strong> (+3 Juz dari Kls 10)</li>
        <li>Jalur eksternal IL: <strong>10 Juz</strong> (+2 Juz dari Kls 10)</li>
      </ul>
    );
  } else if (kelas.includes("12 ma")) {
    targetNode = (
      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
        <li>Jalur internal MTs: <strong>15 Juz</strong> (+2 Juz dari Kls 11)</li>
        <li>Jalur eksternal IL: <strong>12 Juz</strong> (+2 Juz dari Kls 11)</li>
      </ul>
    );
  } else {
    targetNode = <span>Belum ada standar target untuk kelas ini.</span>;
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
      border: "1.5px solid #c4b5fd", borderRadius: 14, padding: "16px 20px",
      marginTop: 14, color: "#4c1d95"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ background: "#6d28d9", color: "white", padding: 8, borderRadius: 10, flexShrink: 0 }}>
          <Award size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
            🎯 Target Hafalan Lulus Kelas {santri.kelas.nama}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
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

  // Form state
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [searchSantri, setSearchSantri] = useState("");
  const [jenisUjian, setJenisUjian] = useState("ujian_pekanan");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [juz, setJuz] = useState(1);
  const [surahNama, setSurahNama] = useState("");
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
      const [sRes, uRes] = await Promise.all([
        fetch("/api/halaqoh/master"),
        fetch("/api/halaqoh/ujian"),
      ]);
      const sData = await sRes.json();
      const uData = await uRes.json();
      setAllSantri(sData.santri || []);
      setHistory(Array.isArray(uData) ? uData : uData.ujian || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- AUTOSAVE DRAFT LOGIC ---
  const draftKey = "sikap_ujian_draft";

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.selectedSantriId) setSelectedSantriId(d.selectedSantriId);
        if (d.jenisUjian) setJenisUjian(d.jenisUjian);
        if (d.juz) setJuz(d.juz);
        if (d.surahNama) setSurahNama(d.surahNama);
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

  // Save draft
  useEffect(() => {
    const draft = {
      selectedSantriId, jenisUjian, juz, surahNama, ayatDari, ayatKe,
      jumlahHalaman, nilaiBacaan, nilaiKelancaran, nilaiSikap, isLulus, catatan
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [selectedSantriId, jenisUjian, juz, surahNama, ayatDari, ayatKe, jumlahHalaman, nilaiBacaan, nilaiKelancaran, nilaiSikap, isLulus, catatan]);
  // ----------------------------

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
        surah_nama: surahNama || undefined,
        ayat_dari: ayatDari,
        ayat_ke: ayatKe,
        jumlah_halaman: jumlahHalaman,
        nilai_bacaan: nilaiBacaan,
        nilai_kelancaran: nilaiKelancaran,
        nilai_sikap: nilaiSikap,
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
      localStorage.removeItem(draftKey); // Clear draft on success
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
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Back */}
      <Link href="/halaqoh" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
        <ArrowLeft size={14} /> Kembali ke Halaqoh
      </Link>

      {/* Header — warna palet khas Al-Imam */}
      <div style={{
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24, color: "white",
        boxShadow: "0 8px 32px rgba(85,0,0,0.35)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Award size={22} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Ujian Tahfidz & Itqon</h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
          Penilaian Ujian Pekanan, Bulanan, Target, & Ujian Itqon (Bonus +10)
        </p>
      </div>

      {/* Special Saturday Banner */}
      {isSaturday && (
        <div style={{
          background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "16px 20px",
          marginBottom: 24, display: "flex", alignItems: "center", gap: 14, color: "#92400e"
        }}>
          <Clock size={22} color="#d97706" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Hari Sabtu — Waktu Ujian Pekanan!</div>
            <div style={{ fontSize: 12, marginTop: 2, color: "#78350f" }}>
              Disarankan menginput nilai Ujian Pekanan setelah Halaqoh Dhuha (sebelum 12.00). Batas akhir penginputan: 15.15 WIB.
            </div>
          </div>
        </div>
      )}

      {/* Form Input Ujian */}
      <div style={{ background: "white", borderRadius: 18, padding: 24, marginBottom: 24, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={18} color="#7a0000" /> Form Penginputan Ujian
        </h2>

        {/* 1. Pilih Jenis Ujian */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Pilih Jenis Ujian
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {JENIS_UJIAN_OPT.map(j => (
              <div
                key={j.val}
                onClick={() => setJenisUjian(j.val)}
                style={{
                  padding: "14px 16px", borderRadius: 14, cursor: "pointer", border: "1.5px solid",
                  borderColor: jenisUjian === j.val ? j.color : "#e2e8f0",
                  background: jenisUjian === j.val ? j.bg : "white",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: j.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {j.icon} {j.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Cakupan: {j.target}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Pilih Santri */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2. Pilih Santri
          </label>
          {selectedSantri ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "12px 16px"
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#7a0000", fontSize: 14 }}>{selectedSantri.nama_lengkap}</div>
                <div style={{ fontSize: 11, color: "#991b1b" }}>{selectedSantri.nis || "NIS —"} · {selectedSantri.kelas?.nama}</div>
              </div>
              <button
                onClick={() => setSelectedSantriId("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#7a0000", fontWeight: 700, fontSize: 12 }}
              >
                Ganti Santri
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  value={searchSantri}
                  onChange={e => setSearchSantri(e.target.value)}
                  placeholder="Ketik nama atau NIS santri..."
                  style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                {filteredSantri.slice(0, 20).map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSantriId(s.id)}
                    style={{
                      padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc",
                      display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.nama_lengkap}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.nis} · {s.kelas?.nama}</div>
                    </div>
                    <CheckCircle2 size={16} color="#7a0000" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {jenisUjian === "ujian_target" && selectedSantri && renderTargetBanner(selectedSantri)}
        </div>

        {/* 3. Detail Ujian */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Tanggal Ujian</label>
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
          </div>

          {jenisUjian === "ujian_itqon" ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Tuntas Juz Ke-</label>
              <select value={juz} onChange={e => setJuz(Number(e.target.value))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", background: "white" }}>
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <option key={j} value={j * 5}>Per 5 Juz (Juz 1–{j * 5})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Nama Surah / Materi</label>
              <input type="text" value={surahNama} onChange={e => setSurahNama(e.target.value)} placeholder="Cth: Al-Baqarah"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Jumlah Halaman</label>
            <input type="number" min={0.5} step={0.5} value={jumlahHalaman} onChange={e => setJumlahHalaman(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        {/* 4. Penilaian */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          <NumericScoreSelector
            label="Nilai Bacaan"
            value={nilaiBacaan}
            onChange={setNilaiBacaan}
          />
          <NumericScoreSelector
            label="Nilai Kelancaran"
            value={nilaiKelancaran}
            onChange={setNilaiKelancaran}
          />
          <TextScoreSelector
            label="Nilai Sikap"
            value={nilaiSikap}
            onChange={setNilaiSikap}
          />
        </div>

        {/* Khusus Ujian Itqon: Checkbox Lulus + Bonus */}
        {jenisUjian === "ujian_itqon" && (
          <div style={{
            background: "#ecfeff", border: "1.5px solid #a5f3fc", borderRadius: 14, padding: "14px 18px",
            marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={20} color="#0e7490" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#164e63" }}>Status Kelulusan Ujian Itqon</div>
                <div style={{ fontSize: 11, color: "#0e7490" }}>Jika LULUS, santri secara otomatis memperoleh **Bonus +10 Poin** di Raport!</div>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#164e63" }}>
              <input type="checkbox" checked={isLulus} onChange={e => setIsLulus(e.target.checked)} style={{ width: 18, height: 18 }} />
              Dinyatakan Lulus
            </label>
          </div>
        )}

        {/* Total Skor Preview */}
        <div style={{
          background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 14, padding: "16px 20px",
          marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Kalkulasi Nilai Ujian:</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#550000" }}>{finalNilai}</span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "monospace", background: "#f1f5f9", padding: "8px 12px", borderRadius: 8 }}>
            (Bacaan: <strong>{nilaiBacaan}</strong> + Kelancaran: <strong>{nilaiKelancaran}</strong>) ÷ 2 
            {jenisUjian === "ujian_itqon" && isLulus && (
              <span style={{ color: "#059669" }}> + <strong>10</strong> (Bonus Itqon)</span>
            )}
            {" "} = <strong>{finalNilai}</strong>
          </div>
        </div>

        {/* Catatan */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Catatan Penguji (Opsional)</label>
          <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan evaluasi kelancaran hafalan..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
        </div>

        {/* Alerts & Save */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ecfdf5", color: "#059669", padding: "12px 16px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            <CheckCircle2 size={16} /> Data ujian berhasil disimpan!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !selectedSantriId}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: saving ? "#94a3b8" : "#550000", color: "white",
            fontWeight: 800, fontSize: 15, cursor: saving ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 4px 16px rgba(85,0,0,0.3)"
          }}
        >
          <Save size={18} /> {saving ? "Menyimpan..." : "Simpan Nilai Ujian"}
        </button>
      </div>

      {/* History Tabel Ujian */}
      <div style={{ background: "white", borderRadius: 18, padding: 24, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Riwayat Ujian Tahfidz</h2>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>Belum ada riwayat ujian</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Tanggal", "Santri", "Jenis Ujian", "Materi", "Nilai Akhir", "Penguji"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => {
                  const info = JENIS_UJIAN_OPT.find(j => j.val === row.jenis_ujian) || JENIS_UJIAN_OPT[0];
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{formatTanggal(row.tanggal)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>{row.santri.nama_lengkap}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}`, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {info.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>
                        {row.jenis_ujian === "ujian_itqon" ? `Juz 1–${row.juz || 5}` : row.surah_nama || "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#047857" }}>{row.nilai_akhir}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>{row.pegawai.nama_lengkap}</td>
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
