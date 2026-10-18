"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  Lock,
  MessageCircle,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";

/* ─────────────────────────── Konfigurasi ─────────────────────────── */

const SCHOOL_NAME = "Pesantren Islam Al-Imam";
const SEMESTER_LABEL = "Semester Ganjil 2026/2027";

// Satu sumber untuk kontak Finance (sebelumnya tertulis di tiga tempat berbeda)
const FINANCE_PHONE_DISPLAY = "085111403331";
const FINANCE_WA = "6285111403331";

// Data contoh hanya tampil saat pengembangan, atau bila NEXT_PUBLIC_WALI_DEMO=true.
// Di produksi, wali yang belum punya data ananda melihat tampilan kosong, bukan nama santri contoh.
const SHOW_DEMO =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_WALI_DEMO === "true";

/* ─────────────────────────── Tipe ─────────────────────────── */

interface WaliKelas {
  nama: string;
  nama_panggilan?: string;
  no_hp?: string;
}

interface Spp {
  status?: string;
  tunggakanCount?: number;
  isUnlockedManual?: boolean;
}

interface Anak {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jenjang: string;
  wali_kelas?: WaliKelas | null;
  foto_url?: string; // sengaja tidak dipakai: avatar memakai inisial
  lunas: boolean;
  spp?: Spp;
}

type SppState = "locked" | "verifying" | "paid" | "due";

const DEMO_ANAK: Anak[] = [
  {
    id: "demo-santri-1",
    nama: "Abdul Aziz Ali",
    nis: "202407001",
    kelas: "7 MTs",
    jenjang: "MTs",
    wali_kelas: {
      nama: "Ustadz Ahmad Fauzan, Lc.",
      nama_panggilan: "Fauzan",
      no_hp: "081234567890",
    },
    lunas: true,
  },
];

const FEATURES: { icon: LucideIcon; label: string; href: (id: string) => string; accent?: boolean }[] = [
  { icon: CalendarCheck, label: "Presensi & Absensi Harian", href: (id) => `/wali/akademik?santri_id=${id}` },
  { icon: BookOpen, label: "Nilai PTS Murni & Jurnal", href: (id) => `/wali/akademik?santri_id=${id}` },
  { icon: CreditCard, label: "Riwayat SPP 12 Bulan", href: (id) => `/wali/spp?santri_id=${id}` },
  { icon: Sparkles, label: "Halaqoh & Tahfidz Al-Qur'an", href: (id) => `/wali/tahfidz?santri_id=${id}`, accent: true },
];

/* ─────────────────────────── Helper ─────────────────────────── */

/** Ubah nomor HP lokal (08…, +62…, 8…) ke format wa.me (62…). */
function toWaNumber(raw?: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Urutan prioritas sama dengan sebelumnya: terkunci → diverifikasi → lunas → ada tagihan. */
function getSppState(anak: Anak): SppState {
  const verifying = anak.spp?.status === "menunggu_verifikasi";
  if (!anak.lunas && !verifying && !anak.spp?.isUnlockedManual) return "locked";
  if (verifying) return "verifying";
  if (anak.lunas) return "paid";
  return "due";
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/* ─────────────────────────── Komponen kecil ─────────────────────────── */

function SppBadge({ state, months }: { state: SppState; months: number }) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-tight";

  if (state === "locked") {
    return (
      <span className={`${base} border-rose-300 bg-rose-100 text-rose-800`}>
        <Lock size={12} className="shrink-0 text-rose-600" aria-hidden="true" />
        <span>Akses terkunci · Tagihan SPP ({months} bulan)</span>
      </span>
    );
  }
  if (state === "verifying") {
    return (
      <span className={`${base} border-amber-300 bg-amber-100 text-amber-900`}>
        <Clock
          size={12}
          className="shrink-0 text-amber-600 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span>SPP sedang diverifikasi</span>
      </span>
    );
  }
  if (state === "paid") {
    return (
      <span className={`${base} border-emerald-200 bg-emerald-100 text-emerald-800`}>
        <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />
        <span>SPP lunas</span>
      </span>
    );
  }
  return (
    <span className={`${base} border-rose-200 bg-rose-100 text-rose-800`}>
      <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
      <span>Tagihan SPP ({months} bulan)</span>
    </span>
  );
}

function LoadingCard() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-primary/10 sm:p-8"
    >
      <span className="sr-only">Memuat data ananda…</span>
      <div className="flex animate-pulse items-center gap-4 motion-reduce:animate-none sm:gap-5">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200 sm:h-20 sm:w-20" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-40 max-w-full rounded-full bg-slate-200" />
          <div className="h-5 w-3/4 rounded-full bg-slate-200" />
          <div className="h-3 w-1/2 rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="mt-6 h-12 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
    </div>
  );
}

function StateCard({
  icon: Icon,
  tone,
  title,
  children,
  action,
  role,
}: {
  icon: LucideIcon;
  tone: "rose" | "slate";
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  role?: "alert";
}) {
  const iconTone =
    tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500";
  return (
    <div
      role={role}
      className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-primary/10 sm:p-12"
    >
      <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconTone}`}>
        <Icon size={26} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-black text-slate-800">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─────────────────────────── Halaman ─────────────────────────── */

export default function WaliDashboard() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/wali/anak", { signal });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
        setAnakList(json.data);
      } else {
        setAnakList(SHOW_DEMO ? DEMO_ANAK : []);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Failed to load children:", err);
      if (SHOW_DEMO) setAnakList(DEMO_ANAK);
      else setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 pb-12 sm:pb-16">
      {/* ── Banner ── */}
      <header
        className="relative overflow-hidden rounded-b-[2rem] px-5 pb-24 pt-10 text-white shadow-2xl shadow-[#550000]/30 sm:rounded-b-[2.5rem] sm:pb-28 sm:pt-14"
        style={{ background: "linear-gradient(135deg, #550000 0%, #7a0000 50%, #450000 100%)" }}
      >
        <div className="pointer-events-none absolute right-0 top-0 p-6 opacity-10 sm:p-8" aria-hidden="true">
          <GraduationCap className="h-32 w-32 sm:h-44 sm:w-44 text-white" />
        </div>
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full border border-white/10 bg-white/5"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm sm:text-xs">
            <ShieldCheck size={14} className="shrink-0 text-emerald-300" aria-hidden="true" />
            <span className="truncate">Portal Resmi Wali Santri · {SEMESTER_LABEL}</span>
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            {SCHOOL_NAME}
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-normal leading-relaxed text-rose-100/90 sm:text-base">
            Akses terpadu perkembangan ananda: Lembar Rapor PTS Murni, Jurnal Harian Pengajar, Presensi
            Kehadiran, Mutabaah Tahfidz, dan Riwayat SPP.
          </p>
        </div>
      </header>

      {/* ── Konten ── */}
      <main className="relative z-10 mx-auto -mt-14 max-w-4xl space-y-5 px-4 sm:space-y-6 sm:px-6">
        {loading ? (
          <LoadingCard />
        ) : error ? (
          <StateCard
            role="alert"
            icon={AlertCircle}
            tone="rose"
            title="Data ananda belum bisa dimuat"
            action={
              <button
                type="button"
                onClick={() => load()}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#550000] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#550000]/25 transition-colors hover:bg-[#7a0000] active:scale-[0.98] ${focusRing}`}
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>Coba lagi</span>
              </button>
            }
          >
            Periksa koneksi internet Anda, lalu coba lagi.
          </StateCard>
        ) : anakList.length === 0 ? (
          <StateCard icon={Users} tone="slate" title="Belum ada ananda yang terhubung">
            Akun ini belum ditautkan ke data santri. Silakan hubungi wali kelas atau staf pesantren.
          </StateCard>
        ) : (
          anakList.map((anak) => {
            const nisResmi = (anak?.nama ? getOfficialNis(anak.nama) : null) || anak.nis;
            const waWali = toWaNumber(anak.wali_kelas?.no_hp);
            const state = getSppState(anak);
            const locked = state === "locked";
            const months = anak.spp?.tunggakanCount || 1;

            const raporLabel = locked
              ? "Akses Terkunci"
              : state === "verifying"
                ? "Buka Rapor (Verifikasi SPP)"
                : "Buka Rapor & Rekap";

            return (
              <article
                key={anak.id}
                className="overflow-hidden rounded-3xl border border-slate-100/90 bg-white shadow-xl shadow-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl motion-reduce:transition-none"
              >
                {/* Bagian atas */}
                <div className="flex flex-col gap-6 p-5 sm:p-8 md:flex-row md:items-start md:justify-between">
                  {/* Kiri: avatar + identitas */}
                  <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                    <div
                      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg shadow-[#550000]/20 ring-4 ring-rose-50 sm:h-20 sm:w-20 sm:text-3xl overflow-hidden"
                      style={{ background: anak.foto_url ? "transparent" : "linear-gradient(135deg, #550000 0%, #7a0000 100%)" }}
                      aria-hidden="true"
                    >
                      {anak.foto_url ? (
                        <img
                          src={anak.foto_url}
                          alt={anak.nama}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        (anak?.nama || "A").charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold uppercase leading-tight text-emerald-700">
                          Santri Aktif
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold leading-tight text-slate-600">
                          NIS: {nisResmi}
                        </span>
                        <SppBadge state={state} months={months} />
                      </div>

                      <h2 className="break-words text-xl font-black leading-snug text-slate-800 sm:text-2xl">
                        {anak.nama}
                      </h2>
                      <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                        Kelas <strong className="text-slate-800">{anak.kelas}</strong> · Jenjang {anak.jenjang}
                      </p>

                      {anak.wali_kelas?.nama && (
                        <div className="mt-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span className="font-medium text-slate-400">Wali Kelas:</span>
                          <strong className="text-slate-700">{anak.wali_kelas.nama}</strong>
                          {waWali && (
                            <a
                              href={`https://wa.me/${waWali}?text=${encodeURIComponent(
                                `Assalamu'alaikum Ustadz ${anak.wali_kelas.nama_panggilan || anak.wali_kelas.nama}, saya orang tua dari ${anak.nama} (${anak.kelas}).`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Chat WhatsApp wali kelas ${anak.wali_kelas.nama} (buka di tab baru)`}
                              className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 ${focusRing}`}
                            >
                              <MessageCircle size={13} aria-hidden="true" />
                              <span>Chat WA</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kanan: aksi */}
                  <div className="flex w-full shrink-0 flex-col gap-2.5 sm:flex-row md:w-auto md:flex-col lg:flex-row">
                    <a
                      href={`/wali/rapor?santri_id=${anak.id}`}
                      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all motion-safe:hover:scale-[1.02] active:scale-[0.98] ${focusRing} ${
                        locked
                          ? "bg-rose-600 shadow-rose-950/20 hover:bg-rose-700"
                          : "bg-[#550000] shadow-[#550000]/25 hover:bg-[#7a0000]"
                      }`}
                    >
                      {locked ? (
                        <Lock size={16} aria-hidden="true" />
                      ) : (
                        <FileText size={16} aria-hidden="true" />
                      )}
                      <span>{raporLabel}</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </a>

                    {!locked && (
                      <a
                        href={`/rapor/print/${anak.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 motion-safe:hover:scale-[1.02] ${focusRing}`}
                      >
                        <Printer size={15} aria-hidden="true" />
                        <span>Cetak PDF</span>
                        <span className="sr-only">(buka di tab baru)</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Pemberitahuan bila terkunci */}
                {locked && (
                  <div
                    role="note"
                    className="mx-5 mb-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/60 p-4 text-xs sm:mx-8 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-2.5 text-rose-900 sm:items-center">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 sm:mt-0" aria-hidden="true" />
                      <span className="leading-relaxed">
                        Akses laporan dinonaktifkan sementara karena ada tagihan SPP.{" "}
                        <strong>Sudah membayar tapi akun masih terkunci?</strong> Hubungi Finance di WhatsApp{" "}
                        <strong>{FINANCE_PHONE_DISPLAY}</strong> dengan bukti transfer.
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/${FINANCE_WA}?text=${encodeURIComponent(
                        `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam, saya wali dari ananda ${anak.nama} (NIS: ${nisResmi}, Kelas: ${anak.kelas}). Saya telah melakukan pembayaran SPP dan melampirkan bukti transfer terlampir. Mohon dibukakan akses portal SIKAP ananda. Jazaakumullah khayran.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm transition-all hover:bg-emerald-700 motion-safe:hover:scale-[1.02] sm:w-auto ${focusRing}`}
                    >
                      <MessageCircle size={14} aria-hidden="true" />
                      <span>WA Finance</span>
                      <span className="sr-only">(buka di tab baru)</span>
                    </a>
                  </div>
                )}

                {/* Ringkasan isi portal */}
                <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50/90 p-3.5 min-[420px]:grid-cols-2 sm:px-6 sm:py-3 lg:grid-cols-4">
                  {FEATURES.map(({ icon: Icon, label, href, accent }) => (
                    <a
                      key={label}
                      href={href(anak.id)}
                      className={`flex items-center gap-2 rounded-xl p-2 text-xs font-semibold transition-all hover:bg-white hover:shadow-sm ${
                        accent ? "text-emerald-700 hover:text-emerald-800" : "text-slate-700 hover:text-[#550000]"
                      }`}
                    >
                      <Icon
                        size={15}
                        className={`shrink-0 ${accent ? "text-emerald-600" : "text-[#550000]"}`}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              </article>
            );
          })
        )}

        {/* ── Informasi ── */}
        <section aria-label="Informasi portal" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-md backdrop-blur sm:p-6">
            <div className="shrink-0 rounded-2xl bg-rose-50 border border-rose-100 p-3 text-[#550000]">
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-bold text-slate-800">Mode Rapor PTS Murni Aktif</h3>
              <p className="text-xs leading-relaxed text-slate-500">
                Nilai yang ditampilkan pada lembar rapor resmi adalah Nilai Ujian PTS Murni Semester Ganjil
                sesuai kebijakan akademik kurikulum pesantren.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-md backdrop-blur sm:p-6">
            <div className="shrink-0 rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Phone size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-bold text-slate-800">Layanan Bantuan &amp; Kesantrian</h3>
              <p className="text-xs leading-relaxed text-slate-500">
                Apabila terdapat pertanyaan seputar perkembangan ananda, konsultasi tahfidz, atau administrasi
                SPP, Anda dapat langsung menghubungi wali kelas atau staf pesantren.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}