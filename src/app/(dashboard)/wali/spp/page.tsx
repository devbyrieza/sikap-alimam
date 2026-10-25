"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import ModalKonfirmasiSPP from "@/components/ModalKonfirmasiSPP";
import { getOfficialNis } from "@/lib/officialSantri";

const TAHUN_AJARAN = "2026/2027";
const SCHOOL_LINE = "Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS";
const FINANCE_PHONE_DISPLAY = "085111403331";
const FINANCE_WA = "6285111403331";
const REKENING = {
  bank: "BSI",
  bankLengkap: "BSI • Bank Syariah Indonesia",
  nomor: "4222224441",
  atasNama: "PP Al Andalus Al Imam",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const btnBase = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`;
const btnPrimary = `${btnBase} bg-[#550000] text-white shadow-sm hover:bg-[#7a0000] active:scale-[0.98]`;
const surface = "rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow";

function toWaNumber(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function formatRupiah(num: number | null | undefined): string {
  if (num === null || num === undefined) return "Rp 0";
  return `Rp ${Number(num).toLocaleString("id-ID")}`;
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
              SPP &amp; Wali Kelas
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

/* ═══════════════════════════ HALAMAN UTAMA SPP & WALI KELAS ═══════════════════════════ */
export default function WaliSppPage() {
  const searchParams = useSearchParams();
  const santriIdParam = searchParams.get("santri_id") || "";

  const [data, setData] = useState<any>(null);
  const [sppHistory, setSppHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anakList, setAnakList] = useState<any[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>(santriIdParam);
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const loadData = () => {
    if (!selectedSantriId) return;
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      fetch(`/api/rapor?santri_id=${encodeURIComponent(selectedSantriId)}`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`/api/wali/spp-history?santri_id=${encodeURIComponent(selectedSantriId)}`, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([raporRes, sppRes]) => {
        setData(raporRes);
        setSppHistory(sppRes);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Error loading SPP page data:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  };

  useEffect(() => {
    const abort = loadData();
    return () => abort?.();
  }, [selectedSantriId]);

  const handleSelectSantri = (id: string) => {
    setSelectedSantriId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("sikap_selected_santri_id", id);
    }
  };

  const copyRekening = () => {
    navigator.clipboard.writeText(REKENING.nomor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#f8fafc] flex items-center justify-center p-6">
        <div className={`p-10 text-center ${surface}`}>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-b-2 border-[#550000] animate-spin" />
          <h3 className="text-lg font-bold text-slate-800">Memuat Informasi SPP &amp; Wali Kelas</h3>
          <p className="mt-1 text-xs text-slate-500">Mengambil status pembayaran dan kontak wali kelas...</p>
        </div>
      </div>
    );
  }

  const santri = data?.santri || sppHistory?.santri || { id: selectedSantriId, nama: "Santri", kelas: "-" };
  const wali = sppHistory?.wali_kelas;
  const summary = sppHistory?.spp_summary || {};
  const history: any[] = sppHistory?.spp_history || [];
  const nis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri.nis;
  const waWali = toWaNumber(wali?.no_hp);

  return (
    <div className="min-h-dvh bg-[#f8fafc] pb-20">
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
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <HeartHandshake size={16} className="text-slate-400" />
              <span>3. Halaqoh &amp; Tahfidz</span>
            </Link>

            <Link
              href={`/wali/spp?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-[#550000] text-white shadow-sm transition-all"
            >
              <CreditCard size={16} className="text-rose-200" />
              <span>4. SPP &amp; Keuangan</span>
            </Link>
          </div>
        </div>

        {/* ── KARTU LAYANAN KEUANGAN / FINANCE PESANTREN ── */}
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
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 text-white shadow-lg backdrop-blur sm:h-20 sm:w-20"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" }}
                aria-hidden="true"
              >
                <Building2 size={36} />
              </div>
              <div className="min-w-0">
                <div
                  className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffe4e6" }}
                >
                  <CreditCard size={13} aria-hidden="true" />
                  <span>Bagian Keuangan &amp; Administrasi SPP</span>
                </div>
                <h3 className="break-words text-xl font-black leading-tight sm:text-2xl" style={{ color: "#ffffff" }}>
                  Finance Pesantren Al-Imam
                </h3>
                <p className="mt-1 text-xs sm:text-sm font-medium" style={{ color: "rgba(255, 228, 230, 0.9)" }}>
                  Layanan Konfirmasi Pembayaran &amp; Informasi SPP Santri &bull; WhatsApp: {FINANCE_PHONE_DISPLAY}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${FINANCE_WA}?text=${encodeURIComponent(
                  `Assalamu'alaikum Warahmatullahi Wabarakatuh Bagian Keuangan Pesantren Al-Imam, saya orang tua dari ${santri.nama} (Kelas ${santri.kelas}). Mohon izin konfirmasi dan berkonsultasi mengenai administrasi SPP ananda.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-600 motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`}
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
              >
                <PhoneCall size={18} />
                <span>Hubungi Finance via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── STATUS & REKENING PEMBAYARAN SPP ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom 1 & 2: Ringkasan Status SPP */}
          <div className={`p-6 lg:col-span-2 space-y-5 ${surface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Status Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">Tahun Ajaran {TAHUN_AJARAN} • Pembayaran per bulan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsKonfirmasiOpen(true)}
                className={btnPrimary}
              >
                <CreditCard size={16} />
                <span>Konfirmasi Pembayaran SPP</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">Status Bulan Ini</span>
                <p className="mt-1.5 text-base font-extrabold text-slate-800">
                  {summary.statusBulanIni === "lunas" || summary.status_bulan_ini === "lunas" || ((summary.totalTunggakanBulan ?? summary.total_belum_lunas ?? 0) === 0 && history.some(h => h.is_bulan_ini && h.status === "lunas")) ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Lunas
                    </span>
                  ) : summary.statusBulanIni === "menunggu_verifikasi" ? (
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <Clock size={16} /> Diverifikasi
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1.5">
                      <XCircle size={16} /> Belum Lunas
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Tunggakan</span>
                <p className="mt-1.5 text-2xl font-black text-slate-900">
                  {summary.totalTunggakanBulan ?? summary.total_belum_lunas ?? 0} <span className="text-xs font-semibold text-slate-500">Bulan</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">Nominal Tagihan</span>
                <p className="mt-1.5 text-xl font-black text-[#550000]">
                  {formatRupiah(summary.totalTunggakanNominal ?? summary.total_nominal_tunggakan ?? 0)}
                </p>
              </div>
            </div>

            {/* Riwayat Bulan-bulan */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Rincian Pembayaran SPP (12 Bulan)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 text-xs transition-all ${
                      h.status === "lunas"
                        ? "border-emerald-200 bg-emerald-50/60"
                        : h.status === "menunggu_verifikasi"
                        ? "border-amber-300 bg-amber-50/60"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="font-bold text-slate-800">{h.bulanNama || h.label || `Bulan ${h.bulan}`}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatRupiah(h.nominal)}</p>
                    <div className="mt-2">
                      {h.status === "lunas" ? (
                        <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          LUNAS
                        </span>
                      ) : h.status === "menunggu_verifikasi" ? (
                        <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                          VERIFIKASI
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                          TAGIHAN
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom 3: Informasi Rekening Resmi */}
          <div className={`p-6 space-y-5 ${surface}`}>
            <div>
              <div className="flex items-center gap-2.5 text-[#550000] mb-1">
                <Building2 size={20} />
                <h3 className="text-base font-black">Rekening Resmi Pesantren</h3>
              </div>
              <p className="text-xs text-slate-500">Salurkan pembayaran SPP ananda hanya ke rekening resmi berikut:</p>
            </div>

            <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/50 p-4">
              <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">{REKENING.bankLengkap}</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-slate-900 tracking-wider">{REKENING.nomor}</span>
                <button
                  type="button"
                  onClick={copyRekening}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">a.n. <strong>{REKENING.atasNama}</strong></p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs space-y-2 text-slate-600">
              <p className="font-bold text-slate-800">Layanan Keuangan Pesantren:</p>
              <p>Jika ada pertanyaan atau kendala seputar pembayaran SPP, hubungi WhatsApp Keuangan:</p>
              <a
                href={`https://wa.me/${FINANCE_WA}?text=${encodeURIComponent(
                  `Assalamu'alaikum Bagian Keuangan Al-Imam, saya wali dari ${santri.nama} (${santri.kelas}). Ingin konfirmasi mengenai pembayaran SPP.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#550000] font-bold hover:underline"
              >
                <MessageCircle size={14} />
                <span>{FINANCE_PHONE_DISPLAY} (Chat WhatsApp)</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Konfirmasi SPP */}
      <ModalKonfirmasiSPP
        isOpen={isKonfirmasiOpen}
        onClose={() => setIsKonfirmasiOpen(false)}
        santriId={santri.id}
        santriNama={santri.nama}
        santriNis={nis}
        santriKelas={santri.kelas}
        sppHistoryList={history}
        totalNominalTunggakan={summary?.totalTunggakanNominal}
        onSuccess={() => {
          setIsKonfirmasiOpen(false);
          loadData();
          Swal.fire({
            icon: "success",
            title: "Konfirmasi Terkirim!",
            text: "Bukti pembayaran Anda berhasil dikirim ke bagian Keuangan untuk diverifikasi.",
          });
        }}
      />
    </div>
  );
}
