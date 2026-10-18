"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookHeart,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Loader2,
  Lock,
  PhoneCall,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Trophy,
  User,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Swal from "sweetalert2";
import JurnalDetailModal from "@/components/JurnalDetailModal";
import RaporOfficialSheet from "@/components/RaporOfficialSheet";
import ModalKonfirmasiSPP from "@/components/ModalKonfirmasiSPP";
import { getOfficialNis } from "@/lib/officialSantri";
import { calculateHalaman } from "@/lib/quran-madinah";

/* ═══════════════════════════ Konfigurasi ═══════════════════════════ */

const TAHUN_AJARAN = "2026/2027";
const SEMESTER = "Ganjil";
const SCHOOL_LINE = "Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS";

// Kontak & rekening: satu sumber (sebelumnya tertulis berulang di banyak tempat)
const FINANCE_PHONE_DISPLAY = "085111403331";
const FINANCE_WA = "6285111403331";
const REKENING = {
  bank: "BSI",
  bankLengkap: "BSI • Bank Syariah Indonesia",
  nomor: "4222224441",
  atasNama: "PP Al Andalus Al Imam",
};

/* ═══════════════════════════ Tipe ═══════════════════════════ */

type TabId = "ringkasan" | "nilai" | "presensi" | "jurnal" | "tahfidz" | "spp";
type Kategori = "syariah" | "bahasa" | "umum";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "ringkasan", label: "1. Lembar Rapor Resmi", icon: FileText },
  { id: "nilai", label: "2. Nilai & Filter Mapel", icon: BookOpen },
  { id: "presensi", label: "3. Rekap Presensi Absen", icon: Calendar },
  { id: "jurnal", label: "4. Jurnal Mengajar Guru", icon: FileText },
  { id: "tahfidz", label: "5. Halaqoh & Tahfidz Al-Qur'an", icon: HeartHandshake },
  { id: "spp", label: "6. SPP & Wali Kelas", icon: CreditCard },
];

interface NilaiItem {
  mapel_id: string;
  mapel_nama: string;
  mapel_kategori?: string;
  ujian: number | null;
  kategori: Kategori;
  kkm: number;
  nilaiAkhir: string | null;
  nilaiAkhirNum: number | null;
  predikat: string;
}

/* ═══════════════════════════ Gaya bersama ═══════════════════════════ */

const NO_PRINT = "no-print print:hidden";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const btnBase = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`;
const btnPrimary = `${btnBase} bg-[#550000] text-white shadow-sm hover:bg-[#7a0000] active:scale-[0.98]`;

const surface = "rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow";

type Tone = "emerald" | "amber" | "blue" | "rose";
const TONE: Record<Tone, { card: string; label: string; icon: string; value: string; caption: string }> = {
  emerald: {
    card: "border-emerald-200/80 bg-emerald-50/80",
    label: "text-emerald-800",
    icon: "text-emerald-600",
    value: "text-emerald-900",
    caption: "text-emerald-700",
  },
  amber: {
    card: "border-amber-200/80 bg-amber-50/80",
    label: "text-amber-800",
    icon: "text-amber-600",
    value: "text-amber-900",
    caption: "text-amber-700",
  },
  blue: {
    card: "border-blue-200/80 bg-blue-50/80",
    label: "text-blue-800",
    icon: "text-blue-600",
    value: "text-blue-900",
    caption: "text-blue-700",
  },
  rose: {
    card: "border-rose-200/80 bg-rose-50/80",
    label: "text-rose-800",
    icon: "text-rose-600",
    value: "text-rose-900",
    caption: "text-rose-700",
  },
};

const PRESENSI_CARDS: { key: string; label: string; caption: string; icon: LucideIcon; tone: Tone }[] = [
  { key: "totalHadir", label: "Hadir", caption: "Hari Mengikuti KBM", icon: CheckCircle2, tone: "emerald" },
  { key: "totalSakit", label: "Sakit", caption: "Beristirahat / Dalam Perawatan", icon: AlertCircle, tone: "amber" },
  { key: "totalIzin", label: "Izin", caption: "Izin Resmi Pesantren", icon: HelpCircle, tone: "blue" },
  { key: "totalAlpha", label: "Alpha", caption: "Tanpa Keterangan", icon: XCircle, tone: "rose" },
];

const PRESENSI_STATUS: Record<string, { text: string; cls: string }> = {
  hadir: { text: "Hadir", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  sakit: { text: "Sakit", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  izin: { text: "Izin", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  alpha: { text: "Alpha", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

/* ═══════════════════════════ Helper ═══════════════════════════ */

function formatTanggal(iso: unknown): string {
  if (!iso) return "-";
  let d: Date;
  if (iso instanceof Date) {
    d = iso;
  } else if (typeof iso === "string") {
    const clean = iso.includes("T") ? iso.split("T")[0] : iso;
    d = new Date(`${clean}T00:00:00`);
    if (isNaN(d.getTime())) d = new Date(iso);
  } else {
    d = new Date(iso as number);
  }
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRupiah(n: unknown): string {
  return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
}

/** Ubah nomor HP lokal (08…, +62…, 8…) ke format wa.me (62…). */
function toWaNumber(raw?: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function isSyariahOrBahasa(name: string): boolean {
  const low = name.toLowerCase();
  const umum = [
    "matematika", "mtk", "ipa", "ips", "indonesia", "inggris", "pjok", "penjas",
    "seni", "pkn", "informatika", "prakarya", "kewirausahaan", "entrepreneurship",
  ];
  return !umum.some((u) => low.includes(u));
}

function getKategoriMapel(nama: string): Kategori {
  const low = nama.toLowerCase();
  const syariah = ["akidah", "hadis", "fikih", "ushul fikih", "sirah", "tahsin", "tahfidz", "adab", "akhlak", "tauhid", "tafsir", "tajwid", "mahfudzot"];
  const bahasa = ["bahasa arab", "nahwu", "shorof", "kitabah", "muthola", "imla", "khot", "insya", "muhadatsah"];
  if (syariah.some((k) => low.includes(k))) return "syariah";
  if (bahasa.some((k) => low.includes(k))) return "bahasa";
  return "umum";
}

const getKkm = (nama: string): number => (isSyariahOrBahasa(nama) ? 85 : 80);

/** Urutan pengecekan dipertahankan: "ujian_harian" tetap dianggap harian, bukan ujian. */
function classifyJenis(jenis: string): "harian" | "kompetensi" | "sikap" | "ujian" | null {
  if (jenis.includes("harian") || jenis === "tugas" || jenis === "uh") return "harian";
  if (jenis.includes("kompetensi") || jenis === "komp") return "kompetensi";
  if (jenis.includes("sikap") || jenis === "adab") return "sikap";
  if (jenis === "pas" || jenis === "pts" || jenis.includes("ujian") || jenis.includes("sas") || jenis.includes("sat")) {
    return "ujian";
  }
  return null;
}

function getPredikat(n: number | null): string {
  if (n === null) return "-";
  if (n >= 90) return "A (Istimewa)";
  if (n >= 80) return "B (Sangat Baik)";
  if (n >= 70) return "C (Cukup)";
  return "D (Perlu Bimbingan)";
}

function predikatColor(n: number | null): string {
  if (n === null) return "text-slate-400";
  if (n >= 90) return "text-emerald-700";
  if (n >= 80) return "text-blue-700";
  if (n >= 70) return "text-amber-700";
  return "text-red-600";
}

/** Mode "PTS Murni": nilai akhir = nilai ujian. Satu baris per mata pelajaran. */
function groupAkademik(rows: any[]): NilaiItem[] {
  const map = new Map<string, { base: any; ujian: number | null }>();

  rows.forEach((n) => {
    if (!map.has(n.mapel_id)) map.set(n.mapel_id, { base: n, ujian: null });
    const entry = map.get(n.mapel_id)!;
    if (classifyJenis(String(n.jenis ?? "")) === "ujian") {
      entry.ujian = Number(n.nilai) || 0;
    }
  });

  const order: Record<Kategori, number> = { syariah: 1, bahasa: 2, umum: 3 };

  return Array.from(map.values())
    .map(({ base, ujian }): NilaiItem => ({
      mapel_id: base.mapel_id,
      mapel_nama: base.mapel_nama,
      mapel_kategori: base.mapel_kategori,
      ujian,
      kategori: getKategoriMapel(base.mapel_nama),
      kkm: getKkm(base.mapel_nama),
      nilaiAkhir: ujian !== null ? ujian.toFixed(1) : null,
      nilaiAkhirNum: ujian,
      predikat: getPredikat(ujian),
    }))
    .sort((a, b) => {
      if (order[a.kategori] !== order[b.kategori]) return order[a.kategori] - order[b.kategori];
      return a.mapel_nama.localeCompare(b.mapel_nama, "id");
    });
}

/**
 * LEGACY — dibawa apa adanya dari kode sebelumnya.
 * Untuk Surah Yusuf, bila rentang ayat kosong atau tertukar (11–13), ditampilkan "Ayat 1 - 52",
 * dan "5 Halaman" bila jumlah halaman kosong. Ini menambal data, bukan data aslinya.
 * Sebaiknya diperbaiki di database, lalu blok ini dihapus.
 */
function normalizeUjianTahfidz(u: any) {
  const rawDari = u.ayat_dari !== null && u.ayat_dari !== undefined ? Number(u.ayat_dari) : null;
  const rawKe = u.ayat_ke !== null && u.ayat_ke !== undefined ? Number(u.ayat_ke) : null;

  let ayatDari = rawDari;
  let ayatKe = rawKe;
  if (ayatDari !== null && ayatKe !== null && ayatDari > ayatKe) {
    [ayatDari, ayatKe] = [ayatKe, ayatDari];
  }

  const isYusuf = Boolean(u.surah_nama?.toLowerCase().includes("yusuf"));
  const isAnomalousRange = !ayatDari || !ayatKe || (ayatDari === 11 && ayatKe === 13) || (rawDari === 13 && rawKe === 11);
  if (isYusuf && isAnomalousRange) {
    ayatDari = 1;
    ayatKe = 52;
  }

  const surahBase: string = u.surah_nama || "Yusuf";
  const surahNama = surahBase.toLowerCase().startsWith("surah") ? surahBase : `Surah ${surahBase}`;
  const ayatText = ayatDari && ayatKe ? `Ayat ${ayatDari} - ${ayatKe}` : isYusuf ? "Ayat 1 - 52" : "";

  // Halaman: jika Yusuf ayat 1-52 (atau jika data lama di DB tercatat 0.1 halaman sisa uji coba 2-3 ayat)
  let rawHal = u.jumlah_halaman !== null && u.jumlah_halaman !== undefined ? Number(u.jumlah_halaman) : null;
  let halValue = rawHal;

  if (isYusuf && (isAnomalousRange || (ayatDari === 1 && ayatKe === 52) || (rawHal !== null && rawHal < 2))) {
    halValue = 6.6; // Surah Yusuf ayat 1 - 52 (Juz 12) = 6.6 halaman standar mushaf Madinah
  } else if ((!halValue || halValue < 0.5) && ayatDari && ayatKe) {
    const sNomor = Number(u.surah_nomor) || (isYusuf ? 12 : 0);
    if (sNomor > 0) {
      halValue = calculateHalaman(sNomor, ayatDari, ayatKe);
    }
  }

  const halText = halValue ? `${halValue} Halaman` : null;

  return { surahNama, ayatText, halText };
}

/* ═══════════════════════════ Komponen kecil ═══════════════════════════ */

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
        {children}
      </div>
    </div>
  );
}

function IconBadge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <div className={`shrink-0 rounded-xl p-2.5 ${tone}`}>{children}</div>;
}

function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-slate-400">
      <Icon size={36} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

function Panel({ id, tabbed, children }: { id: TabId; tabbed: boolean; children: React.ReactNode }) {
  return (
    <section
      id={`panel-${id}`}
      role={tabbed ? "tabpanel" : undefined}
      aria-labelledby={tabbed ? `tab-${id}` : undefined}
      className="space-y-6"
    >
      {children}
    </section>
  );
}

function FilterCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur`}>
      <div className="flex min-w-0 items-center gap-3">
        <IconBadge tone="bg-rose-50 text-rose-800 border border-rose-100">
          <Icon size={18} aria-hidden="true" />
        </IconBadge>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════ Bagian halaman ═══════════════════════════ */

function TopBar({ santriId, locked, onKirimWA }: { santriId: string; locked: boolean; onKirimWA: () => void }) {
  return (
    <div className={`sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur ${NO_PRINT}`}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <a
          href="/wali"
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200/70 hover:text-[#550000] sm:text-sm ${focusRing}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="sm:hidden">Kembali</span>
          <span className="hidden sm:inline">Kembali ke Pilihan Anak</span>
        </a>

        {!locked && (
          <div className="flex items-center gap-2">
            <a
              href={`/rapor/print/${santriId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:inline-flex ${focusRing}`}
            >
              <Printer size={14} aria-hidden="true" />
              <span>Cetak PDF</span>
              <span className="sr-only">(buka di tab baru)</span>
            </a>
            <button
              type="button"
              onClick={onKirimWA}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#550000] px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#7a0000] active:scale-[0.98] ${focusRing}`}
            >
              <Send size={14} aria-hidden="true" />
              <span>Kirim ke WA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BannerSppPill({ spp, locked }: { spp: any; locked: boolean }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black leading-tight shadow-sm";
  const months = spp?.tunggakanCount || 1;

  if (locked) {
    return (
      <span className={`${base} border border-rose-300 bg-rose-600 text-white`}>
        <Lock size={12} className="shrink-0" aria-hidden="true" />
        <span>Akses Terkunci: Tagihan SPP {months} Bulan</span>
      </span>
    );
  }
  if (spp?.status === "menunggu_verifikasi") {
    return (
      <span className={`${base} border border-amber-300 bg-amber-500 text-white`}>
        <Clock size={12} className="shrink-0 motion-safe:animate-pulse" aria-hidden="true" />
        <span>SPP Menunggu Verifikasi</span>
      </span>
    );
  }
  if (spp?.lunas) {
    return (
      <span className={`${base} border border-emerald-300 bg-emerald-600 text-white`}>
        <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />
        <span>SPP {spp.namaBulan || "Bulan Ini"} Lunas</span>
      </span>
    );
  }
  return (
    <span className={`${base} border border-rose-300 bg-rose-500 text-white`}>
      <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
      <span>Tagihan SPP: {months} Bulan</span>
    </span>
  );
}

function ProfileBanner({
  santri,
  nis,
  spp,
  locked,
  anakList = [],
  currentSantriId = "",
  onSelectSantri,
  onFotoUpdated,
}: {
  santri: any;
  nis: string;
  spp: any;
  locked: boolean;
  anakList?: any[];
  currentSantriId?: string;
  onSelectSantri?: (id: string) => void;
  onFotoUpdated?: (newUrl: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentFoto, setCurrentFoto] = useState<string | null>(santri?.foto_url || null);

  useEffect(() => {
    setCurrentFoto(santri?.foto_url || null);
  }, [santri?.foto_url]);

  const handleAvatarClick = () => {
    if (uploading) return;
    if (currentFoto) {
      Swal.fire({
        title: "Foto Profil Ananda",
        text: `Kelola foto profil untuk ${santri?.nama || "santri"}:`,
        imageUrl: currentFoto,
        imageAlt: santri?.nama,
        imageHeight: 180,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "📷 Ganti Foto Baru",
        denyButtonText: "🗑️ Hapus Foto",
        cancelButtonText: "Tutup",
        confirmButtonColor: "#550000",
        denyButtonColor: "#be123c",
      }).then((result) => {
        if (result.isConfirmed) {
          fileInputRef.current?.click();
        } else if (result.isDenied) {
          handleDeleteFoto();
        }
      });
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDeleteFoto = async () => {
    if (!santri?.id) return;
    try {
      setUploading(true);
      const res = await fetch(`/api/wali/foto-santri?santri_id=${encodeURIComponent(santri.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setCurrentFoto(null);
        onFotoUpdated?.(null);
        Swal.fire({
          icon: "success",
          title: "Foto Dihapus",
          text: "Foto profil santri berhasil dihapus.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Gagal", json.error || "Gagal menghapus foto", "error");
      }
    } catch (err) {
      console.error("Error delete foto:", err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menghapus foto", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !santri?.id) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Format Salah", "Pilih file gambar dengan format JPG, PNG, atau WEBP.", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("File Terlalu Besar", "Ukuran foto maksimal adalah 5 MB.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("santri_id", santri.id);
    formData.append("foto", file);

    setUploading(true);
    try {
      const res = await fetch("/api/wali/foto-santri", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.foto_url) {
        setCurrentFoto(json.foto_url);
        onFotoUpdated?.(json.foto_url);
        Swal.fire({
          icon: "success",
          title: "Alhamdulillah!",
          text: `Foto ananda ${santri.nama} berhasil diunggah.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Gagal Mengunggah", json.error || "Gagal memperbarui foto", "error");
      }
    } catch (err) {
      console.error("Error upload foto:", err);
      Swal.fire("Gagal", "Terjadi kendala jaringan saat mengunggah foto", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <header
      className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-slate-900/10 sm:p-8 ${NO_PRINT}`}
      style={{ background: "linear-gradient(135deg, #550000 0%, #7a0000 50%, #3a0000 100%)" }}
    >
      <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-10 sm:p-8" aria-hidden="true">
        <GraduationCap className="h-32 w-32 sm:h-44 sm:w-44 text-white" />
      </div>
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full border border-white/10 bg-white/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        {/* Kotak Avatar / Foto Ananda (Bisa diklik untuk Upload) */}
        <div className="relative group shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploading}
            title={currentFoto ? "Klik untuk ganti atau kelola foto ananda" : "Klik untuk upload foto ananda"}
            className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-white/40 overflow-hidden shadow-2xl ring-4 ring-white/20 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            style={{ background: currentFoto ? "transparent" : "rgba(255, 255, 255, 0.18)" }}
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <Loader2 size={24} className="animate-spin text-white" />
                <span className="text-[10px] font-bold text-white tracking-wider">Upload...</span>
              </div>
            ) : currentFoto ? (
              <>
                <img
                  src={currentFoto}
                  alt={santri?.nama || "Foto Santri"}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera size={18} />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5">Ubah</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-black text-white drop-shadow">
                  {(santri?.nama || "S").charAt(0).toUpperCase()}
                </span>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera size={20} />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5">Upload</span>
                </div>
              </>
            )}
          </button>

          {/* Badge Icon Kamera di Sudut */}
          {!uploading && (
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Upload Foto Ananda"
              className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg ring-2 ring-white/80 transition-transform duration-200 hover:scale-110 active:scale-90 hover:bg-emerald-500 hover:text-white"
            >
              <Camera size={14} className="sm:size-4" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold leading-tight tracking-wide text-white border border-white/30">
              Kelas {santri.kelas}
            </span>
            <span className="font-mono text-xs text-white font-bold bg-black/25 px-2.5 py-0.5 rounded-full border border-white/20">
              NIS: {nis}
            </span>
            <BannerSppPill spp={spp} locked={locked} />
          </div>
          <h1 className="break-words text-2xl font-extrabold leading-tight text-white sm:text-3xl">{santri.nama}</h1>
          <p className="mt-1 text-xs font-medium text-rose-100/90 sm:text-sm">
            {SCHOOL_LINE} • Tahun Ajaran {santri?.tahun_ajaran || TAHUN_AJARAN}
          </p>

          {/* Selector jika wali memiliki lebih dari 1 ananda */}
          {anakList.length > 1 && onSelectSantri && (
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 border-t border-white/15">
              <span className="text-[11px] font-bold text-rose-200">Pilih Ananda:</span>
              {anakList.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectSantri(a.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    a.id === currentSantriId
                      ? "bg-white text-[#550000] shadow-md scale-105"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {a.nama} ({a.kelas})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function VerifyingBanner({ onUploadLagi, onLihatSpp }: { onUploadLagi: () => void; onLihatSpp: () => void }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-start justify-between gap-4 rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 p-5 text-xs shadow-lg shadow-amber-950/5 sm:flex-row sm:items-center ${NO_PRINT}`}
    >
      <div className="flex items-start gap-3.5 sm:items-center">
        <div className="shrink-0 rounded-2xl bg-amber-500 p-3 text-white shadow-md shadow-amber-950/20">
          <Clock size={22} className="motion-safe:animate-pulse" aria-hidden="true" />
        </div>
        <div>
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
              Sedang Diverifikasi
            </span>
            <span className="text-sm font-extrabold text-amber-950 sm:text-base">
              Konfirmasi Pembayaran Sedang Diproses Keuangan
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">
            Alhamdulillah, bukti pembayaran SPP ananda telah diterima dan sedang dalam antrean verifikasi Admin
            Keuangan. Seluruh akses lembar rapor dan mutabaah ananda tetap dibuka secara penuh.
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onUploadLagi}
          className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-amber-700 sm:flex-initial ${focusRing}`}
        >
          <CreditCard size={14} aria-hidden="true" />
          <span>Upload Bukti Tambahan</span>
        </button>
        <button
          type="button"
          onClick={onLihatSpp}
          className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-900 shadow-sm transition-colors hover:bg-slate-50 sm:flex-initial ${focusRing}`}
        >
          <span>Lihat Tab SPP &rarr;</span>
        </button>
      </div>
    </div>
  );
}

function GraceBanner({ namaBulan }: { namaBulan: string }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-4 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-xs shadow-md backdrop-blur ${NO_PRINT}`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-xl bg-amber-500 p-2 text-white">
          <Clock size={16} aria-hidden="true" />
        </div>
        <div>
          <h4 className="font-bold text-amber-950">Masa Pembayaran SPP Bulan {namaBulan}</h4>
          <p className="mt-0.5 text-amber-800/90">
            Batas akhir pembayaran SPP adalah tanggal <strong>10 {namaBulan}</strong>. Seluruh akses laporan santri
            tetap terbuka selama periode ini.
          </p>
        </div>
      </div>
      <span className="hidden shrink-0 rounded-lg bg-amber-200/70 px-3 py-1 font-bold text-amber-900 sm:block">
        Masa Tenggang
      </span>
    </div>
  );
}

function LockedBackBar({ onBack }: { onBack: () => void }) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center ${NO_PRINT}`}
    >
      <div className="flex items-center gap-2.5 text-xs font-bold text-rose-900">
        <Lock size={16} className="shrink-0 text-rose-600" aria-hidden="true" />
        <span>Halaman ini hanya menampilkan rincian tagihan SPP. Lembar Rapor dan Mutabaah tetap terkunci.</span>
      </div>
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 ${focusRing}`}
      >
        <ArrowLeft size={13} aria-hidden="true" />
        <span>Kembali ke Halaman Kunci</span>
      </button>
    </div>
  );
}

function TabNav({ santriId }: { santriId: string }) {
  return (
    <div
      className={`sticky top-14 z-20 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-md backdrop-blur sm:top-16 ${NO_PRINT}`}
    >
      <div
        role="tablist"
        aria-label="Menu portal ananda"
        className="flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto custom-scrollbar w-full py-0.5 px-0.5 overscroll-x-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <Link
          href={`/wali/rapor?santri_id=${santriId}`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-[#550000] text-white shadow-sm transition-all"
        >
          <FileText size={16} className="text-rose-200" />
          <span>1. Lembar Rapor Resmi</span>
        </Link>

        <Link
          href={`/wali/akademik?santri_id=${santriId}`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
        >
          <BookOpen size={16} className="text-slate-400" />
          <span>2. Nilai &amp; Akademik</span>
        </Link>

        <Link
          href={`/wali/tahfidz?santri_id=${santriId}`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
        >
          <HeartHandshake size={16} className="text-slate-400" />
          <span>3. Halaqoh &amp; Tahfidz</span>
        </Link>

        <Link
          href={`/wali/spp?santri_id=${santriId}`}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
        >
          <CreditCard size={16} className="text-slate-400" />
          <span>4. SPP &amp; Keuangan</span>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Tampilan terkunci ═══════════════════════════ */

function LockedPanel({
  santri,
  nis,
  spp,
  onOpenSpp,
  onKonfirmasi,
}: {
  santri: any;
  nis: string;
  spp: any;
  onOpenSpp: () => void;
  onKonfirmasi: () => void;
}) {
  const months = spp?.tunggakanCount || 1;
  const nominal = Number(spp?.totalTunggakanNominal) || 0;
  const bulanList: string[] = Array.isArray(spp?.tunggakanBulan) ? spp.tunggakanBulan : [];

  const salinRekening = async () => {
    const info = `${REKENING.bank} ${REKENING.nomor} a.n. ${REKENING.atasNama}`;
    try {
      await navigator.clipboard.writeText(REKENING.nomor);
      Swal.fire({
        icon: "success",
        title: "Nomor Rekening Disalin!",
        text: info,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({ icon: "info", title: "Salin nomor secara manual", text: info });
    }
  };

  const waText =
    `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam, saya wali dari ananda:\n` +
    `• Nama: ${santri.nama}\n• NIS: ${nis}\n• Kelas: ${santri.kelas}\n\n` +
    `Saya telah mentransfer pembayaran SPP${nominal ? ` sebesar ${formatRupiah(nominal)}` : ""} dan melampirkan bukti transfer terlampir. ` +
    `Mohon bantuannya untuk membukakan akses portal SIKAP ananda. Jazaakumullah khayran.`;

  return (
    <div className={`space-y-6 ${NO_PRINT}`}>
      <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg shadow-slate-900/5 sm:p-12">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-rose-50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-80 w-80 rounded-full bg-amber-50/60 blur-3xl" aria-hidden="true" />

        <div className="relative mb-6 inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-white shadow-md">
            <Lock size={44} className="stroke-[2.2]" aria-hidden="true" />
          </div>
          <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-2 text-amber-950 shadow-md motion-safe:animate-bounce">
            <AlertTriangle size={16} aria-hidden="true" />
          </div>
        </div>

        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-rose-200 bg-rose-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-rose-800 shadow-sm">
          <span>Akses Portal Santri Dinonaktifkan Sementara</span>
        </div>

        <h2 className="mx-auto max-w-2xl text-2xl font-black leading-tight tracking-tight text-slate-800 sm:text-3xl">
          Kewajiban Administrasi SPP Ananda Belum Diselesaikan
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
          Afwan Bapak/Ibu Wali Santri dari ananda <strong className="text-slate-900">{santri.nama}</strong> ({santri.kelas}),
          seluruh akses laporan hasil belajar (Lembar Rapor PTS Murni, Nilai Akademik, Rekap Presensi, Jurnal Pengajar,
          dan Mutabaah Tahfidz Al-Qur&apos;an) saat ini dinonaktifkan sementara hingga kewajiban administrasi SPP
          diselesaikan.
        </p>

        {/* Rincian tagihan */}
        <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-slate-50 to-rose-50/40 p-5 text-center shadow-inner sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Bulan Menunggak</span>
            <span className="mt-1 block text-xl font-black text-rose-600">{months} Bulan</span>
            <span className="text-[10px] text-slate-400">TA {TAHUN_AJARAN}</span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:col-span-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Tagihan SPP</span>
            <span className="mt-1 block text-xl font-black text-slate-800">
              {nominal ? formatRupiah(nominal) : "Lihat rincian SPP"}
            </span>
            <span className="block text-[10px] font-semibold text-rose-600">
              {bulanList.length > 0 ? `(${bulanList.join(", ")})` : "SPP Belum Lunas"}
            </span>
          </div>
        </div>

        {/* Rekening */}
        <div className="relative mx-auto mt-6 max-w-xl overflow-hidden rounded-2xl bg-slate-900 p-5 text-left text-white shadow-xl sm:p-6">
          <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-10" aria-hidden="true">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                Rekening Resmi Pembayaran SPP
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/80">
                {REKENING.bankLengkap}
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-2xl font-black tracking-wider text-white sm:text-3xl">{REKENING.nomor}</div>
                <div className="mt-1 text-xs text-slate-300">
                  Atas Nama: <strong className="text-white">{REKENING.atasNama}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={salinRekening}
                className={`min-h-[44px] rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-white/30 ${focusRing}`}
              >
                Salin Nomor Rekening
              </button>
            </div>
          </div>
        </div>

        {/* Hubungi Finance */}
        <div className="mx-auto mt-8 max-w-xl rounded-3xl border-2 border-emerald-400/90 bg-gradient-to-r from-emerald-50 via-teal-50/80 to-emerald-50 p-5 text-left shadow-lg shadow-emerald-950/5 sm:p-7">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0 rounded-2xl bg-emerald-600 p-3.5 text-white shadow-md">
              <PhoneCall size={28} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-200 px-3 py-0.5 text-[11px] font-black text-emerald-950">
                <span>Sudah Membayar Tapi Akun Masih Terkunci?</span>
              </div>
              <h3 className="text-base font-black leading-snug text-emerald-950 sm:text-lg">
                Hubungi Finance ({FINANCE_PHONE_DISPLAY}) dengan Bukti Transfer
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
                Jika Bapak/Ibu Wali Santri <strong>sudah melakukan transfer/pelunasan SPP</strong> namun akun masih
                terkunci, silakan langsung mengirimkan foto/bukti transfer ke nomor WhatsApp{" "}
                <strong>Finance ({FINANCE_PHONE_DISPLAY})</strong> agar Tim Keuangan dapat segera memverifikasi dan
                membukakan akses portal SIKAP ananda.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-stretch gap-3 border-t border-emerald-200/80 pt-4 sm:flex-row sm:items-center">
            <a
              href={`https://wa.me/${FINANCE_WA}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-700 motion-safe:hover:scale-[1.02] active:scale-[0.98] sm:text-sm ${focusRing}`}
            >
              <Send size={16} aria-hidden="true" />
              <span>Kirim Bukti ke WA Finance</span>
              <span className="sr-only">(buka di tab baru)</span>
            </a>
            <button
              type="button"
              onClick={onKonfirmasi}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-xs font-bold text-emerald-900 shadow-sm transition-colors hover:bg-slate-50 sm:text-sm ${focusRing}`}
            >
              <CreditCard size={16} aria-hidden="true" />
              <span>Upload Bukti di Web</span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center border-t border-slate-200/80 pt-6">
          <button
            type="button"
            onClick={onOpenSpp}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-200 hover:text-primary ${focusRing}`}
          >
            <CreditCard size={15} aria-hidden="true" />
            <span>Lihat Rincian Riwayat SPP Santri (12 Bulan) &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Isi tab ═══════════════════════════ */

function TabRapor({ printId, cetakData, cetakError }: { printId: string; cetakData: any; cetakError: boolean }) {
  const printHref = `/rapor/print/${printId}`;
  const [mobileFit, setMobileFit] = useState(true);
  const fitContainerRef = useRef<HTMLDivElement>(null);
  const fitContentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number>(0.4);
  const [rawHeight, setRawHeight] = useState<number>(2300);

  useEffect(() => {
    if (!mobileFit) return;

    const updateScaleAndHeight = () => {
      if (fitContainerRef.current) {
        const containerWidth = fitContainerRef.current.clientWidth;
        if (containerWidth > 0) {
          // Standard A4 width: 794px (~210mm pada 96 DPI)
          // Berikan padding aman 12px (6px kiri, 6px kanan) agar seluruh border, bayangan, dan teks Arab tidak pernah terpotong
          const targetWidth = 794;
          const availableWidth = Math.max(260, containerWidth - 12);
          const computedScale = Math.min(1, availableWidth / targetWidth);
          setFitScale(computedScale);
        }
      }
      if (fitContentRef.current) {
        const h = fitContentRef.current.scrollHeight || fitContentRef.current.offsetHeight;
        if (h > 0) {
          setRawHeight(h);
        }
      }
    };

    updateScaleAndHeight();
    const t1 = setTimeout(updateScaleAndHeight, 100);
    const t2 = setTimeout(updateScaleAndHeight, 400);

    let roContainer: ResizeObserver | null = null;
    let roContent: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      if (fitContainerRef.current) {
        roContainer = new ResizeObserver(() => updateScaleAndHeight());
        roContainer.observe(fitContainerRef.current);
      }
      if (fitContentRef.current) {
        roContent = new ResizeObserver(() => updateScaleAndHeight());
        roContent.observe(fitContentRef.current);
      }
    }

    window.addEventListener("resize", updateScaleAndHeight);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      roContainer?.disconnect();
      roContent?.disconnect();
      window.removeEventListener("resize", updateScaleAndHeight);
    };
  }, [mobileFit, cetakData]);

  // Kalkulasi kompensasi margin untuk centering presisi
  const marginX = Math.max(0, (794 - 794 * fitScale) / 2);
  const marginB = fitScale < 1 && rawHeight > 0 ? Math.max(0, rawHeight - rawHeight * fitScale - 16) : 0;

  const handleZoom = (delta: number) => {
    setFitScale((prev) => Math.min(1.2, Math.max(0.25, Number((prev + delta).toFixed(2)))));
  };

  const resetZoom = () => {
    if (fitContainerRef.current) {
      const containerWidth = fitContainerRef.current.clientWidth;
      const targetWidth = 794;
      const availableWidth = Math.max(260, containerWidth - 12);
      setFitScale(Math.min(1, availableWidth / targetWidth));
    }
  };

  return (
    <>
      <div className={`flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6 ${NO_PRINT}`}>
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #550000 0%, #881337 100%)" }}
          >
            <FileText size={22} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 sm:text-lg">Rapor Hasil Belajar Santri (Kasyfud Darajat)</h2>
            <p className="mt-0.5 text-xs text-slate-500">Penilaian Tengah Semester (PTS) • T.A. {TAHUN_AJARAN}</p>
          </div>
        </div>
        <a href={printHref} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
          <Printer size={16} aria-hidden="true" />
          <span>Cetak / Unduh PDF Resmi</span>
          <span className="sr-only">(buka di tab baru)</span>
        </a>
      </div>

      {cetakData ? (
        <>
          {/* Kontrol responsif mobile: Pas Layar vs Ukuran Asli */}
          <div className={`flex flex-col gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-3.5 text-xs font-medium text-amber-950 shadow-sm md:hidden ${NO_PRINT}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                <span>Mode Tampilan Mobile:</span>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-amber-300/80 bg-white/90 p-1">
                <button
                  type="button"
                  onClick={() => setMobileFit(true)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    mobileFit
                      ? "bg-[#550000] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  📱 Pas Layar HP
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFit(false)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    !mobileFit
                      ? "bg-[#550000] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🔍 Geser Ukuran Asli
                </button>
              </div>
            </div>

            {mobileFit ? (
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-white/80 rounded-xl px-3 py-1.5 border border-amber-200/60">
                <span>Skala Tampilan: <strong className="text-[#550000]">{Math.round(fitScale * 100)}%</strong> (Otomatis Pas Layar)</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleZoom(-0.05)}
                    className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm"
                    title="Perkecil"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                    title="Kembalikan ke Pas Layar"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(0.05)}
                    className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm"
                    title="Perbesar"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-amber-800">
                Geser ke kanan / kiri pada lembar rapor untuk membaca rincian tulisan dalam ukuran 100%.
              </p>
            )}
          </div>

          {/* Wadah sheet A4: jika mobileFit aktif, diskalakan proporsional pas di mobile screen */}
          {mobileFit ? (
            <div
              ref={fitContainerRef}
              className="w-full -mx-1 sm:mx-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100/70 py-3 px-1 shadow-inner"
            >
              <div className="flex justify-center w-full overflow-hidden">
                <div
                  ref={fitContentRef}
                  style={{
                    width: "794px",
                    transform: `scale(${fitScale})`,
                    transformOrigin: "top center",
                    flexShrink: 0,
                    marginLeft: `-${marginX}px`,
                    marginRight: `-${marginX}px`,
                    marginBottom: `-${marginB}px`,
                  }}
                >
                  <RaporOfficialSheet data={cetakData} showPrintToolbar={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar overflow-x-auto pb-4 print:block print:overflow-visible print:p-0">
              <div className="mx-auto w-max">
                <RaporOfficialSheet data={cetakData} showPrintToolbar={false} />
              </div>
            </div>
          )}
        </>
      ) : cetakError ? (
        <div role="alert" className={`rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm ${NO_PRINT}`}>
          <AlertCircle size={32} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700">Dokumen rapor belum dapat dimuat</p>
          <p className="mt-1 text-xs text-slate-500">Silakan gunakan tombol Cetak / Unduh PDF Resmi di atas atau muat ulang halaman.</p>
        </div>
      ) : (
        <div role="status" className={`rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm ${NO_PRINT}`}>
          <Loader2 className="mx-auto mb-3 text-[#550000] motion-safe:animate-spin" size={32} aria-hidden="true" />
          <p className="text-sm font-bold text-slate-600">Memuat Dokumen Resmi Rapor (A4)...</p>
        </div>
      )}

      <div className={`flex justify-center pb-6 pt-2 ${NO_PRINT}`}>
        <a href={printHref} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} px-8 py-3.5 shadow-xl`}>
          <Printer size={18} aria-hidden="true" />
          <span>Cetak / Unduh PDF Resmi</span>
          <span className="sr-only">(buka di tab baru)</span>
        </a>
      </div>
    </>
  );
}

function TabNilai({
  items,
  options,
  filter,
  onFilter,
}: {
  items: NilaiItem[];
  options: string[];
  filter: string;
  onFilter: (v: string) => void;
}) {
  return (
    <>
      <FilterCard
        icon={Filter}
        title="Filter Mata Pelajaran"
        desc="Pilih mata pelajaran tertentu (misal: Fiqh, Nahwu, Matematika) untuk melihat rincian nilai ananda"
      >
        <div className="w-full sm:w-72">
          <label htmlFor="filter-mapel-nilai" className="sr-only">Filter mata pelajaran</label>
          <select
            id="filter-mapel-nilai"
            className="form-control"
            style={{ fontWeight: 600 }}
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
          >
            <option value="">— Tampilkan Semua Mata Pelajaran —</option>
            {options.map((nama) => (
              <option key={nama} value={nama}>{nama}</option>
            ))}
          </select>
        </div>
      </FilterCard>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {items.length === 0 ? (
          <div className={`col-span-full p-12 text-center text-slate-400 ${surface}`}>
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" aria-hidden="true" />
            <p className="font-bold text-slate-700">Belum ada nilai untuk mata pelajaran ini</p>
            <p className="mt-1 text-xs text-slate-400">Silakan pilih mata pelajaran lain pada dropdown di atas.</p>
          </div>
        ) : (
          items.map((item) => {
            const n = item.nilaiAkhirNum;
            const kat = (item.mapel_kategori || "").toLowerCase();
            const badgeCls = kat.includes("syariah") || kat.includes("diniyah")
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : kat.includes("bahasa") || kat.includes("arab")
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-purple-50 text-purple-800 border-purple-200";

            return (
              <article
                key={item.mapel_id}
                className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${badgeCls}`}>
                      {item.mapel_kategori || "Pelajaran Pokok"}
                    </span>
                    <h3 className="mt-1.5 break-words text-lg font-bold text-slate-800">{item.mapel_nama}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Nilai Akhir</span>
                    <p className="mt-0.5 text-2xl font-black leading-none text-slate-900">{item.nilaiAkhir || "-"}</p>
                    <span className={`text-[11px] font-bold ${predikatColor(n)}`}>{item.predikat}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-2.5 text-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">Nilai PTS Murni</span>
                  <span className="mt-0.5 block text-xl font-black text-[#550000]">{item.ujian ?? "-"}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>Target KKM: <b>{item.kkm}.0</b></span>
                  {n === null ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-400">— Belum Ada Nilai</span>
                  ) : n >= item.kkm ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 size={13} aria-hidden="true" /> {n === item.kkm ? "Pas KKM" : "Di Atas KKM"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                      <XCircle size={13} aria-hidden="true" /> Di Bawah KKM
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}

function TabPresensi({
  ringkasan,
  rows,
  totalRows,
  mapelList,
  filterMapel,
  onFilterMapel,
  filterStatus,
  onFilterStatus,
}: {
  ringkasan: any;
  rows: any[];
  totalRows: number;
  mapelList: string[];
  filterMapel: string;
  onFilterMapel: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
}) {
  const tidakHadir = (ringkasan.totalSakit || 0) + (ringkasan.totalIzin || 0) + (ringkasan.totalAlpha || 0);
  const chip = (active: boolean, activeCls: string) =>
    `min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${focusRing} ${
      active ? activeCls : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {PRESENSI_CARDS.map(({ key, label, caption, icon: Icon, tone }) => {
          const t = TONE[tone];
          return (
            <div key={key} className={`rounded-2xl border p-4 shadow-md sm:p-5 ${t.card}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${t.label}`}>{label}</span>
                <Icon size={18} className={t.icon} aria-hidden="true" />
              </div>
              <p className={`mt-2 text-3xl font-extrabold ${t.value}`}>{ringkasan[key] || 0}</p>
              <span className={`text-[11px] font-medium ${t.caption}`}>{caption}</span>
            </div>
          );
        })}
      </div>

      <div className={`overflow-hidden ${surface}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Riwayat Detail Presensi Harian</h3>
            <p className="mt-0.5 text-xs text-slate-500">Catatan seluruh tanggal kehadiran dan ketidakhadiran ananda di kelas</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label htmlFor="filter-mapel-presensi" className="sr-only">Filter mata pelajaran</label>
            <select
              id="filter-mapel-presensi"
              className="form-control max-w-full py-1.5 text-xs sm:max-w-[200px]"
              value={filterMapel}
              onChange={(e) => onFilterMapel(e.target.value)}
            >
              <option value="">Semua Mata Pelajaran</option>
              {mapelList.map((nama) => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={filterStatus === ""}
              onClick={() => onFilterStatus("")}
              className={chip(filterStatus === "", "bg-[#550000] text-white shadow-sm")}
            >
              Semua Status ({totalRows})
            </button>
            <button
              type="button"
              aria-pressed={filterStatus === "tidak_hadir"}
              onClick={() => onFilterStatus("tidak_hadir")}
              className={chip(filterStatus === "tidak_hadir", "bg-amber-600 text-white shadow-md shadow-amber-600/30")}
            >
              Ketidakhadiran ({tidakHadir})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-left">
            <caption className="sr-only">Riwayat presensi harian ananda</caption>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th scope="col" className="w-12 px-4 py-3.5 text-center">No</th>
                <th scope="col" className="px-4 py-3.5">Tanggal & Waktu</th>
                <th scope="col" className="px-4 py-3.5">Mata Pelajaran</th>
                <th scope="col" className="px-4 py-3.5 text-center">Status Kehadiran</th>
                <th scope="col" className="px-4 py-3.5">Keterangan / Alasan</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    Tidak ada catatan presensi pada filter ini.
                  </td>
                </tr>
              ) : (
                rows.map((p, idx) => {
                  const st = PRESENSI_STATUS[p.status] ?? PRESENSI_STATUS.hadir;
                  return (
                    <tr key={p.id || idx} className="border-b border-slate-50 text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-center font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="block font-bold text-slate-800">{formatTanggal(p.tanggal)}</span>
                        {p.jam_ke && <span className="mt-0.5 text-[10px] text-slate-500">Jam ke-{p.jam_ke}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-700">{p.mapel_nama || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.keterangan || <span className="italic text-slate-300">Tidak ada catatan</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabJurnal({
  rows,
  kelas,
  mapelList,
  filterMapel,
  onFilterMapel,
  keyword,
  onKeyword,
  onDetail,
}: {
  rows: any[];
  kelas: string;
  mapelList: string[];
  filterMapel: string;
  onFilterMapel: (v: string) => void;
  keyword: string;
  onKeyword: (v: string) => void;
  onDetail: (row: any) => void;
}) {
  return (
    <>
      <FilterCard
        icon={FileText}
        title="Jurnal Mengajar Para Guru"
        desc={`Transparansi KBM harian di kelas ${kelas} (Materi, Tujuan Pembelajaran & Aktivitas)`}
      >
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <label htmlFor="filter-mapel-jurnal" className="sr-only">Filter mata pelajaran</label>
          <select
            id="filter-mapel-jurnal"
            className="form-control text-sm"
            value={filterMapel}
            onChange={(e) => onFilterMapel(e.target.value)}
          >
            <option value="">Semua Mata Pelajaran</option>
            {mapelList.map((nama) => (
              <option key={nama} value={nama}>{nama}</option>
            ))}
          </select>
          <label htmlFor="cari-jurnal" className="sr-only">Cari topik materi</label>
          <input
            id="cari-jurnal"
            type="search"
            placeholder="Cari topik materi..."
            className="form-control text-sm"
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
          />
        </div>
      </FilterCard>

      <p className="flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[12px] font-medium text-amber-900 shadow-sm sm:hidden">
        <ArrowRight className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        Geser tabel ke kanan untuk melihat rincian guru, jam pelajaran, dan tombol detail.
      </p>

      <div className={`overflow-hidden ${surface}`}>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <caption className="sr-only">Jurnal mengajar guru di kelas ananda</caption>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th scope="col" className="sticky left-0 z-10 min-w-[120px] bg-slate-50 px-4 py-3.5">Tanggal</th>
                <th scope="col" className="px-4 py-3.5">Guru Pengampu</th>
                <th scope="col" className="px-4 py-3.5">Mata Pelajaran</th>
                <th scope="col" className="px-4 py-3.5 text-center">Jam Ke</th>
                <th scope="col" className="min-w-[200px] px-4 py-3.5">Materi Pembelajaran</th>
                <th scope="col" className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    Belum ada jurnal mengajar yang tersimpan di kelas ananda.
                  </td>
                </tr>
              ) : (
                rows.map((j) => (
                  <tr key={j.id} className="group border-b border-slate-50 text-sm transition-colors hover:bg-slate-50/60">
                    <td className="sticky left-0 z-[5] bg-white px-4 py-3.5 font-bold text-[#550000] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50">
                      {formatTanggal(j.tanggal)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{j.asatidz}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{j.mapel}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">{j.jam_ke}</span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 text-xs text-slate-700" title={j.materi}>
                      {j.materi}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onDetail(j)}
                        className={`inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-200 ${focusRing}`}
                      >
                        <Eye size={13} className="text-[#550000]" aria-hidden="true" />
                        <span>Lihat Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabTahfidz({ ujian, setoran }: { ujian: any[]; setoran: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Ujian tahfidz */}
      <div className={`space-y-4 p-5 sm:p-6 ${surface}`}>
        <div className="mb-2 flex items-center gap-3">
          <IconBadge tone="bg-blue-50 text-blue-700">
            <Trophy size={20} aria-hidden="true" />
          </IconBadge>
          <div>
            <h3 className="text-base font-bold text-slate-800">Hasil Ujian Tahfidz Al-Qur&apos;an</h3>
            <p className="text-xs text-slate-500">Evaluasi Pra-Target, Target, dan Itqon Santri</p>
          </div>
        </div>

        {ujian.length === 0 ? (
          <EmptyState icon={BookOpen}>Belum ada riwayat ujian tahfidz pada periode ini.</EmptyState>
        ) : (
          <div className="space-y-3">
            {ujian.map((u) => {
              const { surahNama, ayatText, halText } = normalizeUjianTahfidz(u);
              return (
                <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-800">
                        {u.jenis_ujian ? String(u.jenis_ujian).replace(/_/g, " ") : "UJIAN PRA TARGET"}
                      </span>
                      <h4 className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800 sm:text-base">
                        <span>{u.juz ? `Juz ${u.juz}` : surahNama}</span>
                        {ayatText && (
                          <span className="rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-950">
                            ({ayatText})
                          </span>
                        )}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatTanggal(u.tanggal)}</span>
                        {halText && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="rounded-md border border-emerald-200/50 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                              {halText}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-black shadow-sm ${u.is_lulus ? "text-emerald-600" : "text-rose-600"}`}>
                        {u.nilai_akhir}
                      </span>
                      <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{u.is_lulus ? "LULUS" : "MENGULANG"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3">
                    {[
                      ["Kelancaran", u.nilai_kelancaran],
                      ["Fashohah", u.nilai_bacaan],
                      ["Adab", u.nilai_sikap],
                    ].map(([label, val]) => (
                      <div key={label as string} className="rounded-lg border border-slate-100 bg-white p-1.5 text-center shadow-sm">
                        <p className="text-[9px] font-bold uppercase text-slate-500">{label}</p>
                        <p className="text-xs font-bold text-slate-700">{(val as string | number) || "-"}</p>
                      </div>
                    ))}
                  </div>

                  {u.catatan && (
                    <div className="mt-1 rounded-lg border border-amber-100/50 bg-amber-50/50 p-2">
                      <p className="text-[10px] italic text-amber-700">&quot;{u.catatan}&quot;</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Setoran harian */}
      <div className={`space-y-4 p-5 sm:p-6 ${surface}`}>
        <div className="mb-2 flex items-center gap-3">
          <IconBadge tone="bg-emerald-50 text-emerald-700">
            <BookOpen size={20} aria-hidden="true" />
          </IconBadge>
          <div>
            <h3 className="text-base font-bold text-slate-800">Capaian Setoran Halaqoh Harian</h3>
            <p className="text-xs text-slate-500">Ziyadah (hafalan baru) &amp; Murojaah ba&apos;da Subuh &amp; Maghrib</p>
          </div>
        </div>

        {setoran.length === 0 ? (
          <EmptyState icon={BookOpen}>Belum ada riwayat setoran tahfidz tercatat.</EmptyState>
        ) : (
          <div className="space-y-3">
            {setoran.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                <div className="min-w-0">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">{t.jenis}</span>
                  <h4 className="mt-1 text-sm font-bold text-slate-800">{t.surat} {t.ayat ? `(Ayat ${t.ayat})` : ""}</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">{formatTanggal(t.tanggal)}</p>
                </div>
                <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                  {t.keterangan || "Lancar"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function sppItemClass(item: any): string {
  if (item.is_bulan_ini) return "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-md";
  if (item.status === "menunggu_verifikasi") return "bg-amber-50/50 border-amber-300 hover:bg-amber-100/50 shadow-sm";
  if (item.status === "lunas") return "bg-slate-50/70 border-slate-200/80 hover:bg-white";
  if (item.status === "belum_lunas") return "bg-rose-50/40 border-rose-200 hover:bg-rose-50/70";
  return "bg-slate-50/30 border-slate-100 opacity-75";
}

function SppItemBadge({ status }: { status: string }) {
  const base = "inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold";
  if (status === "lunas") {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-800`}>
        <CheckCircle2 size={13} aria-hidden="true" /> <span>Lunas</span>
      </span>
    );
  }
  if (status === "menunggu_verifikasi") {
    return (
      <span className={`${base} border border-amber-300 bg-amber-100 text-amber-900`}>
        <Clock size={13} className="text-amber-600 motion-safe:animate-pulse" aria-hidden="true" /> <span>Sedang Diverifikasi</span>
      </span>
    );
  }
  if (status === "belum_lunas") {
    return (
      <span className={`${base} bg-rose-100 text-rose-800`}>
        <XCircle size={13} aria-hidden="true" /> <span>Belum Lunas</span>
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 font-semibold text-slate-600`}>
      <Clock size={13} aria-hidden="true" /> <span>Mendatang</span>
    </span>
  );
}

function TabSpp({
  loading,
  sppHistory,
  santri,
  onKonfirmasi,
}: {
  loading: boolean;
  sppHistory: any;
  santri: any;
  onKonfirmasi: () => void;
}) {
  if (loading) {
    return (
      <div role="status" className={`p-12 text-center ${surface}`}>
        <Loader2 className="mx-auto mb-3 h-10 w-10 text-primary motion-safe:animate-spin" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Memuat informasi SPP dan Wali Kelas...</p>
      </div>
    );
  }

  const wali = sppHistory?.wali_kelas;
  const summary = sppHistory?.spp_summary;
  const history: any[] = sppHistory?.spp_history || [];
  const namaAnak = santri?.nama || sppHistory?.santri?.nama;
  const kelas = santri?.kelas || sppHistory?.santri?.kelas;
  const waWali = toWaNumber(wali?.no_hp);

  return (
    <>
      {/* Wali kelas */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #550000 0%, #7a0000 50%, #3a0000 100%)",
          backgroundColor: "#550000",
          color: "#ffffff",
        }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 text-2xl font-black text-white shadow-lg backdrop-blur sm:h-20 sm:w-20"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" }}
              aria-hidden="true"
            >
              {wali?.nama ? wali.nama.slice(0, 2).toUpperCase() : <User size={32} />}
            </div>
            <div className="min-w-0">
              <div
                className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffe4e6" }}
              >
                <ShieldCheck size={13} aria-hidden="true" />
                <span>Wali Kelas Ananda</span>
              </div>
              <h3 className="break-words text-lg font-black leading-tight sm:text-xl" style={{ color: "#ffffff" }}>
                {wali?.nama || "Ustadz Pembina Kelas"}
              </h3>
              <p className="mt-1 text-xs sm:text-sm font-medium" style={{ color: "rgba(255, 228, 230, 0.9)" }}>
                Kelas {kelas || "-"} &bull; {santri?.jenjang || sppHistory?.santri?.jenjang || "Pesantren Al-Imam"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {waWali ? (
              <a
                href={`https://wa.me/${waWali}?text=${encodeURIComponent(
                  `Assalamu'alaikum Warahmatullahi Wabarakatuh Ustadz ${wali.nama_panggilan || wali.nama}, saya orang tua dari ${namaAnak} (Kelas ${kelas}). Mohon izin bersilaturahmi dan berkonsultasi mengenai perkembangan ananda.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-600 motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`}
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
              >
                <PhoneCall size={18} aria-hidden="true" />
                <span>Hubungi via WhatsApp</span>
                <span className="sr-only">(buka di tab baru)</span>
              </a>
            ) : (
              <div
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-medium"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.85)" }}
              >
                <AlertCircle size={15} aria-hidden="true" />
                <span>Nomor kontak dapat dikoordinasikan via Kesantrian</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan SPP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Bulan Terbayar</span>
            <div className="rounded-xl bg-emerald-500 p-2 text-white"><CheckCircle2 size={16} aria-hidden="true" /></div>
          </div>
          <p className="text-3xl font-black text-emerald-900">
            {summary?.total_lunas || 0}
            <span className="ml-1.5 text-base font-semibold text-emerald-600">Bulan</span>
          </p>
          <p className="mt-1 text-[11px] text-emerald-600">Status kewajiban lunas</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-rose-700">Tunggakan / Belum Lunas</span>
            <div className="rounded-xl bg-rose-500 p-2 text-white"><AlertTriangle size={16} aria-hidden="true" /></div>
          </div>
          <p className="text-3xl font-black text-rose-900">
            {summary?.total_belum_lunas || 0}
            <span className="ml-1.5 text-base font-semibold text-rose-600">Bulan</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-rose-600">
            {summary?.total_nominal_tunggakan
              ? `Total ${formatRupiah(summary.total_nominal_tunggakan)}`
              : "Perlu penyelesaian administrasi"}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Total Terbayar (12 Bulan)</span>
            <div className="rounded-xl bg-blue-500 p-2 text-white"><CreditCard size={16} aria-hidden="true" /></div>
          </div>
          <p className="text-2xl font-black text-blue-900">{formatRupiah(summary?.total_nominal_lunas)}</p>
          <p className="mt-1 text-[11px] text-blue-600">Akumulasi riwayat tercatat</p>
        </div>
      </div>

      {/* Riwayat */}
      <div className={`space-y-5 p-5 sm:p-7 ${surface}`}>
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <IconBadge tone="bg-blue-50 text-blue-800 border border-blue-100">
              <Calendar size={20} aria-hidden="true" />
            </IconBadge>
            <div>
              <h3 className="text-base font-bold text-slate-800 sm:text-lg">Riwayat SPP 12 Bulan Terakhir</h3>
              <p className="text-xs text-slate-500">Transparansi pencatatan SPP bulanan santri di Safina Keuangan</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onKonfirmasi}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#550000] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#7a0000] motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`}
            >
              <CreditCard size={14} aria-hidden="true" />
              <span>Konfirmasi Pembayaran (WA/Upload)</span>
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Tahun Ajaran {TAHUN_AJARAN}
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <EmptyState icon={CreditCard}>Belum ada riwayat SPP yang dapat ditampilkan.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item, idx) => (
              <div key={idx} className={`rounded-2xl border p-4 transition-all ${sppItemClass(item)}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-800">{item.label}</h4>
                      {item.is_bulan_ini && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          Bulan Ini
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">{formatRupiah(item.nominal)}</p>
                  </div>
                  <SppItemBadge status={item.status} />
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-500">
                  <span>Tanggal Bayar:</span>
                  <span className="font-medium text-slate-700">
                    {item.tanggal_bayar
                      ? formatTanggal(item.tanggal_bayar)
                      : item.status === "mendatang"
                        ? "Belum Jatuh Tempo"
                        : item.status === "menunggu_verifikasi"
                          ? "Menunggu Admin"
                          : "-"}
                  </span>
                </div>
                {item.metode_bayar && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Metode:</span>
                    <span className="font-semibold capitalize text-slate-600">{item.metode_bayar}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
          <div className="text-xs leading-relaxed text-amber-900">
            <p className="font-bold">Informasi Pembayaran &amp; Rekonsiliasi SPP</p>
            <p className="mt-0.5 text-amber-800">
              Pembayaran SPP dilakukan melalui rekening resmi Pesantren Al-Imam Al-Islami. Jika telah melakukan transfer
              namun status belum terbarui, silakan klik tombol <strong>Konfirmasi Pembayaran (WA/Upload)</strong> di atas
              atau hubungi Admin Keuangan via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════ Halaman ═══════════════════════════ */

export default function RaporWaliPage() {
  const searchParams = useSearchParams();
  const santriId = searchParams.get("santri_id") || "";

  const [data, setData] = useState<any>(null);
  const [cetakData, setCetakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cetakError, setCetakError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [activeTab, setActiveTab] = useState<TabId>("ringkasan");

  const [filterMapelNilai, setFilterMapelNilai] = useState("");
  const [filterStatusPresensi, setFilterStatusPresensi] = useState("");
  const [filterMapelPresensi, setFilterMapelPresensi] = useState("");
  const [filterMapelJurnal, setFilterMapelJurnal] = useState("");
  const [filterKeywordJurnal, setFilterKeywordJurnal] = useState("");

  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);

  const [sppHistory, setSppHistory] = useState<any>(null);
  const [loadingSpp, setLoadingSpp] = useState(false);
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(false);
  const [anakList, setAnakList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/wali/anak")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setAnakList(res.data);
        }
      })
      .catch((err) => console.error("Error loading anak list:", err));
  }, []);

  useEffect(() => {
    if (santriId && typeof window !== "undefined") {
      localStorage.setItem("sikap_selected_santri_id", santriId);
    }
  }, [santriId]);

  /* ── Data rapor + dokumen cetak (rapor tetap tampil walau dokumen cetak gagal) ── */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setLoadError(false);
    setCetakError(false);
    setData(null);
    setCetakData(null);
    setSppHistory(null);

    const raporQuery = santriId ? `?${new URLSearchParams({ santri_id: santriId })}` : "";
    const cetakQuery = new URLSearchParams({
      ...(santriId ? { santri_id: santriId } : {}),
      semester: SEMESTER,
      tahun_ajaran: TAHUN_AJARAN,
    });
    const getJson = (url: string) => fetch(url, { signal }).then((res) => res.json());

    Promise.allSettled([getJson(`/api/rapor${raporQuery}`), getJson(`/api/rapor/cetak?${cetakQuery}`)]).then(
      ([rapor, cetak]) => {
        if (signal.aborted) return;
        if (rapor.status === "fulfilled") setData(rapor.value);
        else {
          console.error("Error loading rapor data:", rapor.reason);
          setLoadError(true);
        }
        if (cetak.status === "fulfilled") setCetakData(cetak.value);
        else {
          console.error("Error loading cetak data:", cetak.reason);
          setCetakError(true);
        }
        setLoading(false);
      },
    );

    return () => controller.abort();
  }, [santriId, reloadKey]);

  const targetSantriId = santriId || data?.santri?.id || "";
  const isAccessLocked =
    data?.spp?.lunas === false && data?.spp?.status !== "menunggu_verifikasi" && !data?.spp?.isUnlockedManual;

  /* ── Riwayat SPP: dimuat lebih awal agar modal konfirmasi selalu siap ── */
  useEffect(() => {
    if (!targetSantriId) return;
    const controller = new AbortController();
    setLoadingSpp(true);
    fetch(`/api/wali/spp-history?santri_id=${encodeURIComponent(targetSantriId)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setSppHistory(d))
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Error loading SPP history:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSpp(false);
      });
    return () => controller.abort();
  }, [targetSantriId]);

  /* ── Tab aktif selalu terlihat di baris tab yang bisa digeser ── */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(`tab-${activeTab}`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
  }, [activeTab]);

  const refreshSppData = () => {
    if (!targetSantriId) return;
    const id = encodeURIComponent(targetSantriId);
    setLoadingSpp(true);
    Promise.all([
      fetch(`/api/wali/spp-history?santri_id=${id}`).then((r) => r.json()),
      fetch(`/api/rapor?santri_id=${id}`).then((r) => r.json()),
    ])
      .then(([sppRes, raporRes]) => {
        setSppHistory(sppRes);
        setData(raporRes);
      })
      .catch((err) => console.error("Error refreshing SPP data:", err))
      .finally(() => setLoadingSpp(false));
  };

  // TODO: ini masih SIMULASI. Belum ada pesan yang benar-benar dikirim; notifikasi "terkirim" hanya tampilan.
  // Ganti isi setTimeout dengan pemanggilan endpoint pengiriman WhatsApp yang sebenarnya.
  const handleKirimWA = () => {
    if (!data?.santri) return;
    Swal.fire({
      title: "Kirim Ringkasan ke WhatsApp?",
      text: `Sistem akan merangkum progres ananda ${data.santri.nama} dan mengirimkannya ke WhatsApp wali santri.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Kirim Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#9b1b22",
    }).then((result) => {
      if (!result.isConfirmed) return;
      Swal.fire({
        title: "Mengirim Notifikasi...",
        text: "Menghubungkan ke gateway WhatsApp Pesantren Al-Imam",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      setTimeout(() => {
        Swal.fire(
          "Laporan Terkirim!",
          "Ringkasan capaian santri telah berhasil diteruskan ke nomor WhatsApp Anda.",
          "success",
        );
      }, 1200);
    });
  };

  /* ── Turunan data ── */
  const akademikGrouped = useMemo(() => groupAkademik(data?.detail?.akademik ?? []), [data]);

  const mapelListNames = useMemo<string[]>(() => {
    const names = new Set<string>();
    (data?.detail?.mapelList ?? []).forEach((m: any) => m?.nama && names.add(m.nama));
    return Array.from(names);
  }, [data]);

  // Dropdown nilai: gabungan daftar mapel dan mapel yang punya nilai, tanpa duplikat
  const mapelOptionsNilai = useMemo<string[]>(() => {
    const names = new Set<string>(mapelListNames);
    akademikGrouped.forEach((a) => a.mapel_nama && names.add(a.mapel_nama));
    return Array.from(names);
  }, [mapelListNames, akademikGrouped]);

  const filteredAkademik = useMemo(() => {
    if (!filterMapelNilai) return akademikGrouped;
    const f = filterMapelNilai.toLowerCase();
    return akademikGrouped.filter((a) => a.mapel_id === filterMapelNilai || a.mapel_nama.toLowerCase() === f);
  }, [akademikGrouped, filterMapelNilai]);

  const filteredPresensi = useMemo(() => {
    let result: any[] = data?.detail?.presensi ?? [];
    if (filterStatusPresensi === "tidak_hadir") result = result.filter((p) => p.status !== "hadir");
    else if (filterStatusPresensi) result = result.filter((p) => p.status === filterStatusPresensi);
    if (filterMapelPresensi) result = result.filter((p) => p.mapel_nama === filterMapelPresensi);
    return result;
  }, [data, filterStatusPresensi, filterMapelPresensi]);

  const filteredJurnal = useMemo(() => {
    let result: any[] = data?.detail?.jurnal ?? [];
    if (filterMapelJurnal) result = result.filter((j) => j.mapel === filterMapelJurnal);
    if (filterKeywordJurnal) {
      const k = filterKeywordJurnal.toLowerCase();
      result = result.filter(
        (j) => j.materi?.toLowerCase().includes(k) || j.kegiatan?.toLowerCase().includes(k) || j.catatan?.toLowerCase().includes(k),
      );
    }
    return result;
  }, [data, filterMapelJurnal, filterKeywordJurnal]);

  /* ── Keadaan halaman ── */
  if (loading) {
    return (
      <CenterCard>
        <div role="status">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-b-2 border-[#550000] motion-safe:animate-spin" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-800">Memuat Rapor &amp; Rekap Santri</h3>
          <p className="mt-1 text-xs text-slate-500">Mengambil data nilai, presensi, dan jurnal guru...</p>
        </div>
      </CenterCard>
    );
  }

  if (loadError) {
    return (
      <CenterCard>
        <div role="alert">
          <AlertCircle size={48} className="mx-auto mb-3 text-rose-500" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-800">Data belum bisa dimuat</h3>
          <p className="mb-5 mt-1 text-sm text-slate-500">Periksa koneksi internet Anda, lalu coba lagi.</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={btnPrimary}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Coba lagi</span>
          </button>
        </div>
      </CenterCard>
    );
  }

  if (!data?.santri) {
    return (
      <CenterCard>
        <AlertCircle size={48} className="mx-auto mb-3 text-amber-500" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-800">Data Santri Tidak Ditemukan</h3>
        <p className="mb-5 mt-1 text-sm text-slate-500">Silakan kembali ke halaman utama wali santri.</p>
        <a href="/wali" className={btnPrimary}>Kembali ke Portal</a>
      </CenterCard>
    );
  }

  const { santri } = data;
  const ringkasan = data.ringkasan ?? {};
  const detail = data.detail ?? {};
  const nis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri.nis;

  const showLockedPanel = isAccessLocked && activeTab !== "spp";
  const showTabs = !isAccessLocked;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 print:m-0 print:min-h-0 print:bg-white print:p-0">
      <TopBar santriId={santri.id} locked={isAccessLocked} onKirimWA={handleKirimWA} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:space-y-8 sm:px-6 sm:pt-8 print:m-0 print:max-w-none print:space-y-0 print:p-0">
        <ProfileBanner
          santri={santri}
          nis={nis}
          spp={data?.spp}
          locked={isAccessLocked}
          anakList={anakList}
          currentSantriId={targetSantriId}
          onSelectSantri={(id) => {
            if (typeof window !== "undefined") {
              localStorage.setItem("sikap_selected_santri_id", id);
              window.location.href = `/wali/rapor?santri_id=${id}`;
            }
          }}
          onFotoUpdated={(newUrl) => {
            setData((prev: any) => (prev ? { ...prev, santri: { ...prev.santri, foto_url: newUrl } } : prev));
          }}
        />

        {data?.spp?.status === "menunggu_verifikasi" && (
          <VerifyingBanner onUploadLagi={() => setIsKonfirmasiOpen(true)} onLihatSpp={() => setActiveTab("spp")} />
        )}

        {showLockedPanel ? (
          <LockedPanel
            santri={santri}
            nis={nis}
            spp={data?.spp}
            onOpenSpp={() => setActiveTab("spp")}
            onKonfirmasi={() => setIsKonfirmasiOpen(true)}
          />
        ) : (
          <>
            {data?.spp?.isGracePeriod && data?.spp?.lunas && <GraceBanner namaBulan={data.spp.namaBulan} />}
            {isAccessLocked && activeTab === "spp" && <LockedBackBar onBack={() => setActiveTab("ringkasan")} />}
            {showTabs && <TabNav santriId={targetSantriId} />}
          </>
        )}

        {!isAccessLocked && activeTab === "ringkasan" && (
          <Panel id="ringkasan" tabbed={showTabs}>
            <TabRapor printId={santri?.id || cetakData?.santri?.id} cetakData={cetakData} cetakError={cetakError} />
          </Panel>
        )}

        {!isAccessLocked && activeTab === "nilai" && (
          <Panel id="nilai" tabbed={showTabs}>
            <TabNilai
              items={filteredAkademik}
              options={mapelOptionsNilai}
              filter={filterMapelNilai}
              onFilter={setFilterMapelNilai}
            />
          </Panel>
        )}

        {!isAccessLocked && activeTab === "presensi" && (
          <Panel id="presensi" tabbed={showTabs}>
            <TabPresensi
              ringkasan={ringkasan}
              rows={filteredPresensi}
              totalRows={detail.presensi?.length || 0}
              mapelList={mapelListNames}
              filterMapel={filterMapelPresensi}
              onFilterMapel={setFilterMapelPresensi}
              filterStatus={filterStatusPresensi}
              onFilterStatus={setFilterStatusPresensi}
            />
          </Panel>
        )}

        {!isAccessLocked && activeTab === "jurnal" && (
          <Panel id="jurnal" tabbed={showTabs}>
            <TabJurnal
              rows={filteredJurnal}
              kelas={santri.kelas}
              mapelList={mapelListNames}
              filterMapel={filterMapelJurnal}
              onFilterMapel={setFilterMapelJurnal}
              keyword={filterKeywordJurnal}
              onKeyword={setFilterKeywordJurnal}
              onDetail={(j) => setSelectedJurnal({ ...j, kelas: j.kelas || santri.kelas, kelas_jenjang: santri.jenjang })}
            />
          </Panel>
        )}

        {!isAccessLocked && activeTab === "tahfidz" && (
          <Panel id="tahfidz" tabbed={showTabs}>
            <TabTahfidz ujian={detail.ujianTahfidz ?? []} setoran={detail.tahfidz ?? []} />
          </Panel>
        )}

        {activeTab === "spp" && (
          <Panel id="spp" tabbed={showTabs}>
            <TabSpp
              loading={loadingSpp}
              sppHistory={sppHistory}
              santri={santri}
              onKonfirmasi={() => setIsKonfirmasiOpen(true)}
            />
          </Panel>
        )}
      </main>

      <ModalKonfirmasiSPP
        isOpen={isKonfirmasiOpen}
        onClose={() => setIsKonfirmasiOpen(false)}
        santriId={targetSantriId}
        santriNama={santri?.nama || ""}
        santriNis={nis || ""}
        santriKelas={santri?.kelas || ""}
        sppHistoryList={sppHistory?.spp_history || []}
        onSuccess={refreshSppData}
      />

      <JurnalDetailModal data={selectedJurnal} onClose={() => setSelectedJurnal(null)} />
    </div>
  );
}