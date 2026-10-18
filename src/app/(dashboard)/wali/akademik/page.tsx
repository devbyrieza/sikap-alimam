"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
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
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import JurnalDetailModal from "@/components/JurnalDetailModal";
import { getOfficialNis } from "@/lib/officialSantri";

/* ═══════════════════════════ Konfigurasi ═══════════════════════════ */
const TAHUN_AJARAN = "2026/2027";
const SCHOOL_LINE = "Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS";

type TabAkademik = "nilai" | "presensi" | "jurnal";
type Kategori = "syariah" | "bahasa" | "umum";

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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const btnBase = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing}`;
const btnPrimary = `${btnBase} bg-[#550000] text-white shadow-lg shadow-[#550000]/25 hover:bg-[#7a0000] active:scale-[0.98]`;
const surface = "rounded-3xl border border-slate-100 bg-white/90 shadow-xl shadow-primary/10 backdrop-blur";

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
      const diff = order[a.kategori] - order[b.kategori];
      return diff !== 0 ? diff : a.mapel_nama.localeCompare(b.mapel_nama, "id");
    });
}

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
      className="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl shadow-[#550000]/30 sm:p-8"
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
              Akademik &amp; Mapel
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

/* ═══════════════════════════ Filter Card ═══════════════════════════ */
function FilterCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-4 sm:p-5 ${surface}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-50 p-3 text-[#550000] shadow-sm">
            <Icon size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 sm:text-base">{title}</h3>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════ HALAMAN UTAMA AKADEMIK ═══════════════════════════ */
export default function WaliAkademikPage() {
  const searchParams = useSearchParams();
  const santriIdParam = searchParams.get("santri_id") || "";

  const [activeTab, setActiveTab] = useState<TabAkademik>("nilai");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [anakList, setAnakList] = useState<any[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>(santriIdParam);

  // Filter
  const [filterMapelNilai, setFilterMapelNilai] = useState("");
  const [filterStatusPresensi, setFilterStatusPresensi] = useState("");
  const [filterMapelPresensi, setFilterMapelPresensi] = useState("");
  const [filterMapelJurnal, setFilterMapelJurnal] = useState("");
  const [filterKeywordJurnal, setFilterKeywordJurnal] = useState("");

  // Modal Jurnal
  const [jurnalDetail, setJurnalDetail] = useState<any | null>(null);

  // Inisialisasi santri ID dari parameter atau localStorage
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

  // Muat daftar anak
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

  // Muat data rapor & akademik santri
  useEffect(() => {
    if (!selectedSantriId) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);

    fetch(`/api/rapor?santri_id=${encodeURIComponent(selectedSantriId)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((res) => {
        if (res?.error) {
          setLoadError(true);
        } else {
          setData(res);
        }
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

  /* ── Turunan Data ── */
  const akademikGrouped = useMemo(() => groupAkademik(data?.detail?.akademik ?? []), [data]);

  const mapelListNames = useMemo<string[]>(() => {
    const names = new Set<string>();
    (data?.detail?.mapelList ?? []).forEach((m: any) => m?.nama && names.add(m.nama));
    return Array.from(names);
  }, [data]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex items-center justify-center p-6">
        <div className={`p-10 text-center ${surface}`}>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-b-2 border-[#550000] animate-spin" />
          <h3 className="text-lg font-bold text-slate-800">Memuat Data Akademik Santri</h3>
          <p className="mt-1 text-xs text-slate-500">Mengambil rincian nilai, absensi, dan jurnal guru...</p>
        </div>
      </div>
    );
  }

  if (loadError || !data?.santri) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex items-center justify-center p-6">
        <div className={`p-10 text-center max-w-md ${surface}`}>
          <AlertCircle size={48} className="mx-auto mb-3 text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800">Data Akademik Belum Tersedia</h3>
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
  const ringkasan = data.ringkasan ?? {};
  const nis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri.nis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-100 pb-20">
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
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar w-full py-0.5 px-0.5">
            <Link
              href={`/wali/rapor?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <FileText size={16} className="text-slate-400" />
              <span>1. Lembar Rapor Resmi</span>
            </Link>

            <Link
              href={`/wali/akademik?santri_id=${selectedSantriId}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-[#550000] text-white shadow-md shadow-[#550000]/30 transition-all"
            >
              <BookOpen size={16} className="text-rose-200" />
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
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <CreditCard size={16} className="text-slate-400" />
              <span>4. SPP &amp; Wali Kelas</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigasi Sub-Akademik */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-1.5 shadow-sm">
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar w-full py-0.5 px-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("nilai")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "nilai"
                  ? "bg-[#550000] text-white shadow-md shadow-[#550000]/30"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen size={16} />
              <span>1. Nilai &amp; Filter Mapel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presensi")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "presensi"
                  ? "bg-[#550000] text-white shadow-md shadow-[#550000]/30"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar size={16} />
              <span>2. Rekap Presensi Absen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jurnal")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold min-h-[44px] transition-all ${
                activeTab === "jurnal"
                  ? "bg-[#550000] text-white shadow-md shadow-[#550000]/30"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileText size={16} />
              <span>3. Jurnal Mengajar Guru</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: NILAI & FILTER MAPEL ── */}
        {activeTab === "nilai" && (
          <div className="space-y-6">
            <FilterCard
              icon={Filter}
              title="Filter Mata Pelajaran"
              desc="Pilih mata pelajaran tertentu untuk melihat rincian capaian pembelajaran ananda"
            >
              <div className="w-full sm:w-72">
                <select
                  id="filter-mapel-nilai"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#550000] focus:ring-1 focus:ring-[#550000]"
                  value={filterMapelNilai}
                  onChange={(e) => setFilterMapelNilai(e.target.value)}
                >
                  <option value="">— Tampilkan Semua Mata Pelajaran —</option>
                  {mapelOptionsNilai.map((nama) => (
                    <option key={nama} value={nama}>{nama}</option>
                  ))}
                </select>
              </div>
            </FilterCard>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {filteredAkademik.length === 0 ? (
                <div className={`col-span-full p-12 text-center text-slate-400 ${surface}`}>
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-slate-700">Belum ada nilai untuk mata pelajaran ini</p>
                  <p className="mt-1 text-xs text-slate-400">Silakan pilih mata pelajaran lain pada dropdown di atas.</p>
                </div>
              ) : (
                filteredAkademik.map((item) => {
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
                            <CheckCircle2 size={13} /> {n === item.kkm ? "Pas KKM" : "Di Atas KKM"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <XCircle size={13} /> Di Bawah KKM
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: REKAP PRESENSI ABSEN ── */}
        {activeTab === "presensi" && (
          <div className="space-y-6">
            {/* Kartu Ringkasan Absensi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                <span className="text-xs font-bold uppercase text-emerald-800">Hadir</span>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-900">{ringkasan.hadir ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-center">
                <span className="text-xs font-bold uppercase text-blue-800">Sakit</span>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-blue-900">{ringkasan.sakit ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-center">
                <span className="text-xs font-bold uppercase text-amber-800">Izin</span>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-amber-900">{ringkasan.izin ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-center">
                <span className="text-xs font-bold uppercase text-rose-800">Alpa</span>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-rose-900">{ringkasan.alpha ?? 0}</p>
              </div>
            </div>

            {/* Filter Presensi */}
            <FilterCard
              icon={Filter}
              title="Filter Catatan Presensi"
              desc="Saring kehadiran berdasarkan mata pelajaran atau status kehadiran santri"
            >
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  value={filterMapelPresensi}
                  onChange={(e) => setFilterMapelPresensi(e.target.value)}
                >
                  <option value="">— Semua Mapel —</option>
                  {mapelListNames.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  value={filterStatusPresensi}
                  onChange={(e) => setFilterStatusPresensi(e.target.value)}
                >
                  <option value="">— Semua Status —</option>
                  <option value="tidak_hadir">Hanya Yang Tidak Hadir</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="alpha">Alpa</option>
                  <option value="hadir">Hadir</option>
                </select>
              </div>
            </FilterCard>

            {/* Tabel Riwayat Presensi */}
            <div className={`overflow-hidden ${surface}`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Mata Pelajaran</th>
                      <th className="px-4 py-3">Pertemuan</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPresensi.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Tidak ada catatan presensi yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPresensi.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{formatTanggal(p.tanggal)}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{p.mapel_nama || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">Ke-{p.pertemuan || 1}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                p.status === "hadir"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.status === "sakit"
                                  ? "bg-blue-100 text-blue-800"
                                  : p.status === "izin"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 italic">{p.catatan || p.keterangan || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: JURNAL MENGAJAR GURU ── */}
        {activeTab === "jurnal" && (
          <div className="space-y-6">
            <FilterCard
              icon={Filter}
              title="Cari Jurnal Guru"
              desc="Temukan rangkuman materi dan kegiatan belajar santri di kelas"
            >
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  value={filterMapelJurnal}
                  onChange={(e) => setFilterMapelJurnal(e.target.value)}
                >
                  <option value="">— Semua Mapel —</option>
                  {mapelListNames.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari materi..."
                    className="w-full sm:w-48 rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                    value={filterKeywordJurnal}
                    onChange={(e) => setFilterKeywordJurnal(e.target.value)}
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>
            </FilterCard>

            <div className="space-y-3">
              {filteredJurnal.length === 0 ? (
                <div className={`p-12 text-center text-slate-400 ${surface}`}>
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-slate-700">Belum ada jurnal mengajar guru</p>
                  <p className="mt-1 text-xs text-slate-400">Jurnal harian guru akan muncul di sini setelah diinput oleh asatidz pengampu.</p>
                </div>
              ) : (
                filteredJurnal.map((j) => (
                  <article
                    key={j.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="rounded-full bg-rose-100 text-[#550000] px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                          {j.mapel}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatTanggal(j.tanggal)} • Pertemuan ke-{j.pertemuan || 1}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 break-words">{j.materi}</h4>
                      {j.kegiatan && (
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">{j.kegiatan}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setJurnalDetail(j)}
                      className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 hover:text-[#550000]"
                    >
                      <Eye size={14} />
                      <span>Lihat Rincian</span>
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Detail Jurnal */}
      <JurnalDetailModal data={jurnalDetail} onClose={() => setJurnalDetail(null)} />
    </div>
  );
}
