"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookHeart,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import Swal from "sweetalert2";
import { getOfficialNis } from "@/lib/officialSantri";
import { calculateHalaman } from "@/lib/quran-madinah";

const TAHUN_AJARAN = "2026/2027";
const SCHOOL_LINE = "Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const btnBase = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`;
const btnPrimary = `${btnBase} bg-[#550000] text-white shadow-sm hover:bg-[#7a0000] active:scale-[0.98]`;
const surface = "rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow";

function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

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

  let rawHal = u.jumlah_halaman !== null && u.jumlah_halaman !== undefined ? Number(u.jumlah_halaman) : null;
  let halValue = rawHal;

  if (isYusuf && (isAnomalousRange || (ayatDari === 1 && ayatKe === 52) || (rawHal !== null && rawHal < 2))) {
    halValue = 6.6;
  } else if ((!halValue || halValue < 0.5) && ayatDari && ayatKe) {
    const sNomor = Number(u.surah_nomor) || (isYusuf ? 12 : 0);
    if (sNomor > 0) {
      halValue = calculateHalaman(sNomor, ayatDari, ayatKe);
    }
  }

  const halText = halValue ? `${halValue} Halaman` : null;

  return { surahNama, ayatText, halText };
}

/* ═══════════════════════════ Komponen Profil Banner ═══════════════════════════ */
function ProfileBanner({
  santri,
  nis,
  anakList,
  currentSantriId,
  onSelectSantri,
  onFotoUpdated,
}: {
  santri: any;
  nis: string;
  anakList: any[];
  currentSantriId: string;
  onSelectSantri: (id: string) => void;
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
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-slate-900/10 sm:p-8"
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
        {/* Kotak Avatar / Foto Ananda */}
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
            <span className="rounded-full bg-emerald-500/90 text-white px-2.5 py-0.5 text-xs font-bold shadow-sm">
              Halaqoh &amp; Tahfidz Al-Qur&apos;an
            </span>
          </div>

          <h1 className="break-words text-2xl font-extrabold leading-tight text-white sm:text-3xl">{santri.nama}</h1>
          <p className="mt-1 text-xs font-medium text-rose-100/90 sm:text-sm">
            {SCHOOL_LINE} • Tahun Ajaran {santri?.tahun_ajaran || TAHUN_AJARAN}
          </p>

          {/* Selector jika wali memiliki lebih dari 1 ananda */}
          {anakList.length > 1 && (
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

/* ═══════════════════════════ HALAMAN UTAMA TAHFIDZ ═══════════════════════════ */
export default function WaliTahfidzPage() {
  const searchParams = useSearchParams();
  const santriIdParam = searchParams.get("santri_id") || "";

  const [activeTab, setActiveTab] = useState<"ujian" | "setoran" | "presensi">("ujian");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [anakList, setAnakList] = useState<any[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>(santriIdParam);

  useEffect(() => {
    if (santriIdParam) {
      setSelectedSantriId(santriIdParam);
      if (typeof window !== "undefined") {
        localStorage.setItem("sikap_selected_santri_id", santriIdParam);
      }
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sikap_selected_santri_id");
      if (saved) setSelectedSantriId(saved);
    }
  }, [santriIdParam]);

  useEffect(() => {
    fetch("/api/wali/anak")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAnakList(res.data);
          if (!selectedSantriId) {
            const firstId = res.data[0].id;
            setSelectedSantriId(firstId);
            if (typeof window !== "undefined") {
              localStorage.setItem("sikap_selected_santri_id", firstId);
            }
          }
        }
      })
      .catch((err) => console.error("Error fetching anak list:", err));
  }, []);

  useEffect(() => {
    if (!selectedSantriId) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);

    fetch(`/api/rapor?santri_id=${encodeURIComponent(selectedSantriId)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (res?.error) setLoadError(true);
        else setData(res);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedSantriId]);

  const handleSelectSantri = (id: string) => {
    setSelectedSantriId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("sikap_selected_santri_id", id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className={`p-10 text-center ${surface}`}>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-b-2 border-[#550000] animate-spin" />
          <h3 className="text-lg font-bold text-slate-800">Memuat Data Tahfidz Al-Qur&apos;an</h3>
          <p className="mt-1 text-xs text-slate-500">Mengambil riwayat setoran ziyadah, murojaah, dan hasil ujian...</p>
        </div>
      </div>
    );
  }

  if (loadError || !data?.santri) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className={`p-10 text-center max-w-md ${surface}`}>
          <AlertCircle size={48} className="mx-auto mb-3 text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800">Data Tahfidz Belum Tersedia</h3>
          <p className="mb-5 mt-1 text-sm text-slate-500">Silakan kembali ke beranda atau coba muat ulang.</p>
          <div className="flex justify-center gap-3">
            <Link href="/wali" className={btnPrimary}>Kembali ke Beranda</Link>
            <button type="button" onClick={() => setSelectedSantriId((id) => id)} className={btnBase + " bg-slate-100 text-slate-700"}>
              <RefreshCw size={15} /> Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { santri } = data;
  const ujianList: any[] = data?.ujian_tahfidz || [];
  const setoranList: any[] = data?.tahfidz || [];
  const presensiHalaqoh: any[] = data?.absen_halaqoh?.detail || [];
  const nis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri.nis;

  // Statistik ringkasan
  const totalLulus = ujianList.filter((u) => u.is_lulus).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Top Bar Navigasi */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 flex items-center justify-between">
        <Link
          href="/wali"
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-white hover:text-[#550000]"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          href={`/wali/rapor?santri_id=${selectedSantriId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-[#550000] shadow-sm transition-all hover:bg-[#550000] hover:text-white"
        >
          <FileText size={14} />
          <span>Buka Lembar Rapor &rarr;</span>
        </Link>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-4 sm:space-y-8 sm:px-6">
        {/* Banner Profil */}
        <ProfileBanner
          santri={santri}
          nis={nis}
          anakList={anakList}
          currentSantriId={selectedSantriId}
          onSelectSantri={handleSelectSantri}
          onFotoUpdated={(newUrl) => {
            setData((prev: any) => (prev ? { ...prev, santri: { ...prev.santri, foto_url: newUrl } } : prev));
          }}
        />

        {/* Navigasi 4 Portal Utama Wali */}
        <div className="sticky top-14 z-20 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-md backdrop-blur sm:top-16">
          <div
            className="flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto custom-scrollbar w-full py-0.5 px-0.5 overscroll-x-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <Link
              href={`/wali/rapor?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <FileText size={16} className="text-slate-400" />
              <span>1. Lembar Rapor Resmi</span>
            </Link>

            <Link
              href={`/wali/akademik?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <BookOpen size={16} className="text-slate-400" />
              <span>2. Nilai &amp; Akademik</span>
            </Link>

            <Link
              href={`/wali/tahfidz?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-[#550000] text-white shadow-sm transition-all"
            >
              <HeartHandshake size={16} className="text-rose-200" />
              <span>3. Halaqoh &amp; Tahfidz</span>
            </Link>

            <Link
              href={`/wali/spp?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <CreditCard size={16} className="text-slate-400" />
              <span>4. SPP &amp; Wali Kelas</span>
            </Link>
          </div>
        </div>

        {/* 3 Kartu Ringkasan Tahfidz */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Ujian Tahfidz</span>
              <Trophy size={20} className="text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-blue-950">{ujianList.length}</p>
            <p className="mt-1 text-xs text-blue-700 font-semibold">{totalLulus} dinyatakan Lulus</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Setoran Rutin</span>
              <BookOpen size={20} className="text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-950">{setoranList.length}</p>
            <p className="mt-1 text-xs text-emerald-700 font-semibold">Ziyadah &amp; Muroja&apos;ah</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Kehadiran Halaqoh</span>
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-950">{data?.absen_halaqoh?.total || 0} Kali</p>
            <p className="mt-1 text-xs text-amber-700 font-semibold">Sesi Shubuh &amp; Maghrib</p>
          </div>
        </div>

        {/* Tab Navigasi Sub-Tahfidz */}
        <div className="sticky top-14 z-20 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-md backdrop-blur sm:top-16">
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar w-full py-0.5 px-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("ujian")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "ujian"
                  ? "bg-[#550000] text-white shadow-sm"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Trophy size={16} />
              <span>1. Hasil Ujian Tahfidz &amp; Pra-Target</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("setoran")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "setoran"
                  ? "bg-[#550000] text-white shadow-sm"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen size={16} />
              <span>2. Setoran Halaqoh Harian</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presensi")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "presensi"
                  ? "bg-[#550000] text-white shadow-sm"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar size={16} />
              <span>3. Kehadiran Halaqoh</span>
            </button>
          </div>
        </div>

        {/* ── SUB TAB 1: HASIL UJIAN TAHFIDZ ── */}
        {activeTab === "ujian" && (
          <div className="space-y-4">
            {ujianList.length === 0 ? (
              <div className={`p-12 text-center text-slate-400 ${surface}`}>
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-slate-700">Belum ada riwayat ujian tahfidz</p>
                <p className="mt-1 text-xs text-slate-400">Hasil ujian pra-target dan target ananda akan ditampilkan di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ujianList.map((u) => {
                  const { surahNama, ayatText, halText } = normalizeUjianTahfidz(u);
                  return (
                    <article
                      key={u.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-800">
                            {u.jenis_ujian ? String(u.jenis_ujian).replace(/_/g, " ") : "UJIAN PRA TARGET"}
                          </span>
                          <span
                            className={`rounded-xl border px-3 py-1 text-sm font-black shadow-sm ${
                              u.is_lulus ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {u.is_lulus ? "LULUS" : "MENGULANG"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base sm:text-lg font-black text-slate-800">
                          {u.juz ? `Juz ${u.juz}` : surahNama} {ayatText && <span className="text-slate-600 font-bold">({ayatText})</span>}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Tanggal: <strong>{formatTanggal(u.tanggal)}</strong></span>
                          {halText && (
                            <>
                              <span>•</span>
                              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800">
                                Jumlah: {halText}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Kelancaran</p>
                          <p className="text-sm font-black text-slate-800">{u.nilai_kelancaran || "-"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Fashohah</p>
                          <p className="text-sm font-black text-slate-800">{u.nilai_bacaan || "-"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Nilai Akhir</p>
                          <p className="text-sm font-black text-[#550000]">{u.nilai_akhir || "-"}</p>
                        </div>
                      </div>

                      {u.catatan && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-2.5 text-xs italic text-amber-800">
                          &quot;{u.catatan}&quot;
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUB TAB 2: SETORAN HALAQOH HARIAN ── */}
        {activeTab === "setoran" && (
          <div className="space-y-4">
            {setoranList.length === 0 ? (
              <div className={`p-12 text-center text-slate-400 ${surface}`}>
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-slate-700">Belum ada riwayat setoran harian</p>
                <p className="mt-1 text-xs text-slate-400">Catatan ziyadah dan murojaah ba&apos;da Shubuh/Maghrib akan tampil di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {setoranList.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="min-w-0">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                        {t.jenis || "Setoran"}
                      </span>
                      <h4 className="mt-1.5 text-sm font-bold text-slate-800">
                        {t.surat} {t.ayat ? `(Ayat ${t.ayat})` : ""}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500">{formatTanggal(t.tanggal)}</p>
                    </div>
                    <span className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                      {t.keterangan || "Lancar"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUB TAB 3: KEHADIRAN HALAQOH ── */}
        {activeTab === "presensi" && (
          <div className={`p-6 ${surface}`}>
            <h3 className="text-base font-bold text-slate-800 mb-2">Presensi Halaqoh Qur&apos;an Santri</h3>
            <p className="text-xs text-slate-500 mb-5">Kehadiran santri pada sesi halaqoh Shubuh dan Maghrib bersama musyrif halaqoh.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <span className="text-[11px] font-bold uppercase text-emerald-800">Hadir</span>
                <p className="mt-1 text-2xl font-black text-emerald-900">{data?.absen_halaqoh?.hadir || data?.absen_halaqoh?.total || 0}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <span className="text-[11px] font-bold uppercase text-blue-800">Sakit</span>
                <p className="mt-1 text-2xl font-black text-blue-900">{data?.absen_halaqoh?.sakit || 0}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <span className="text-[11px] font-bold uppercase text-amber-800">Izin</span>
                <p className="mt-1 text-2xl font-black text-amber-900">{data?.absen_halaqoh?.izin || 0}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <span className="text-[11px] font-bold uppercase text-rose-800">Alpa</span>
                <p className="mt-1 text-2xl font-black text-rose-900">{data?.absen_halaqoh?.alpha || 0}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Catatan Pengasuhan Halaqoh:</p>
              <p className="mt-1 leading-relaxed">
                Santri wajib mengikuti kegiatan halaqoh Qur&apos;an secara disiplin setiap hari ba&apos;da shalat Shubuh dan ba&apos;da shalat Maghrib di masjid jami&apos; pesantren bersama musyrif halaqoh masing-masing.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
