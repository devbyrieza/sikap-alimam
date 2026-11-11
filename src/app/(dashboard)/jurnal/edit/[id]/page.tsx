"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  BookOpen,
  ChevronLeft,
  Loader2,
  FileText,
  Clock,
  Save,
  Calendar,
  BookMarked,
  Check,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  formatTanggalLongID,
  getJakartaTodayISO,
  isValidISODate,
} from "@/lib/jurnalDateUtils";

type Kelas = { id: string; nama: string; jenjang: string | null };
type Asatidz = { id: string; nama_lengkap: string; jabatan: string | null };
type Mapel = { id: string; nama: string };
type AsatidzmMapel = { pegawai_id: string; mapel_id: string; kelas_id: string };
type MasterData = {
  kelas: Kelas[];
  asatidz: Asatidz[];
  mapel: Record<string, Mapel[]>;
  asatidzmMapel: AsatidzmMapel[];
};

type SesiWaktuRow = {
  id: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  durasi_menit: number;
};

const DEFAULT_WAKTU_MAP: Record<string, string> = {
  "1": "04.50-05.30",
  "2": "05.30-06.10",
  "3": "07.00-07.40",
  "4": "07.40-08.20",
  "5": "08.20-09.00",
  "6": "09.00-09.40",
  "7": "10.00-10.40",
  "8": "10.40-11.20",
  "9": "11.20-12.00",
};

export default function EditJurnalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const router = useRouter();
  const today = useMemo(() => getJakartaTodayISO(), []);
  const editDraftKey = id ? `siakad_jurnal_edit_draft_${id}` : "";

  const [master, setMaster] = useState<MasterData | null>(null);
  const [sesiList, setSesiList] = useState<SesiWaktuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Form fields
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [namaMapelCustom, setNamaMapelCustom] = useState("");
  const [asatidId, setAsatidId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [jamKe, setJamKe] = useState<string[]>([]);
  const [jamKhususMulai, setJamKhususMulai] = useState("");
  const [jamKhususSelesai, setJamKhususSelesai] = useState("");
  const [materi, setMateri] = useState("");
  const [subMateri, setSubMateri] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  const hydratedRef = useRef(false);
  const skipNextAutosaveRef = useRef(true);

  const selectedKelasInfo = master?.kelas.find((k) => k.id === kelasId);
  const isSpecialClass =
    selectedKelasInfo?.nama.toLowerCase().includes("11 ma") ||
    selectedKelasInfo?.nama.toLowerCase().includes("12 ma");

  // Daftar sesi jam dinamis tersinkron dari /api/master/sesi
  const { jamOptions, waktuMap } = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_WAKTU_MAP };
    const existingNums = new Set(
      jamKe.filter((x) => /^\d+$/.test(x)).map((x) => Number(x)),
    );

    if (sesiList.length > 0) {
      const opts: string[] = [];
      for (const s of sesiList) {
        const key = String(s.jam_ke);
        map[key] = `${s.waktu_mulai.replace(":", ".")}-${s.waktu_selesai.replace(":", ".")}`;
        if (s.jam_ke >= 3 || existingNums.has(s.jam_ke)) {
          opts.push(key);
        }
      }
      for (const n of existingNums) {
        const key = String(n);
        if (!opts.includes(key)) opts.push(key);
      }
      opts.sort((a, b) => Number(a) - Number(b));
      opts.push("Khusus");
      return { jamOptions: opts, waktuMap: map };
    }

    const base = ["3", "4", "5", "6", "7", "8", "9"];
    for (const n of existingNums) {
      const key = String(n);
      if (!base.includes(key)) base.push(key);
    }
    base.sort((a, b) => Number(a) - Number(b));
    base.push("Khusus");
    return { jamOptions: base, waktuMap: map };
  }, [sesiList, jamKe]);

  // Muat master, sesi, profile, dan jurnal secara paralel setelah `id` siap
  useEffect(() => {
    if (!id) return;
    let active = true;
    hydratedRef.current = false;
    skipNextAutosaveRef.current = true;
    setLoading(true);

    Promise.all([
      fetch("/api/master", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/profile", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/master/sesi", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch(`/api/jurnal/${id}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([masterData, profileData, sesiData, jurnalRes]) => {
        if (!active) return;

        setMaster(masterData);
        if (Array.isArray(sesiData)) {
          setSesiList(sesiData);
        }

        const allKelas: Kelas[] = masterData?.kelas || [];
        const draftKey = `siakad_jurnal_edit_draft_${id}`;
        const rawDraft = localStorage.getItem(draftKey);
        let draftParsed: Record<string, unknown> | null = null;
        if (rawDraft) {
          try {
            draftParsed = JSON.parse(rawDraft);
          } catch {
            draftParsed = null;
          }
        }

        if (draftParsed && (draftParsed.materi || draftParsed.kegiatan || draftParsed.kelasId)) {
          const dk = String(draftParsed.kelasId || "");
          const matchedK = dk ? allKelas.find((k) => k.id === dk) : undefined;
          setJenjangFilter(
            String(draftParsed.jenjangFilter || matchedK?.jenjang || ""),
          );
          setKelasId(dk);
          setMapelId(String(draftParsed.mapelId || ""));
          setNamaMapelCustom(String(draftParsed.namaMapelCustom || ""));
          setAsatidId(String(draftParsed.asatidId || ""));
          if (isValidISODate(String(draftParsed.tanggal || ""))) {
            setTanggal(String(draftParsed.tanggal));
          }
          if (Array.isArray(draftParsed.jamKe)) {
            setJamKe(draftParsed.jamKe.map(String));
          } else if (typeof draftParsed.jamKe === "string") {
            setJamKe(draftParsed.jamKe.split(",").map((s) => s.trim()).filter(Boolean));
          }
          setJamKhususMulai(String(draftParsed.jamKhususMulai || ""));
          setJamKhususSelesai(String(draftParsed.jamKhususSelesai || ""));
          setMateri(String(draftParsed.materi || ""));
          setSubMateri(String(draftParsed.subMateri || ""));
          setLearningOutcome(String(draftParsed.learningOutcome || ""));
          setKegiatan(String(draftParsed.kegiatan || ""));
          setCatatan(String(draftParsed.catatan || ""));
          setLastSaved(draftParsed._savedAt ? String(draftParsed._savedAt) : null);
          setIsDraftRestored(true);
        } else if (jurnalRes?.data) {
          const j = jurnalRes.data;
          const matchedK = j.kelas_id
            ? allKelas.find((k) => k.id === j.kelas_id)
            : undefined;
          setJenjangFilter(matchedK?.jenjang || "");
          setKelasId(j.kelas_id || "");
          setMapelId(j.mapel_id || "");
          setAsatidId(j.pegawai_id || profileData?.pegawai?.id || "");
          setTanggal(
            j.tanggal ? String(j.tanggal).split("T")[0] : today,
          );
          if (j.jam_ke) {
            const parsed = String(j.jam_ke)
              .split(",")
              .map((x: string) => x.trim())
              .filter(Boolean);
            const finalJamKe: string[] = [];
            for (const val of parsed) {
              if (val.toLowerCase().startsWith("khusus")) {
                finalJamKe.push("Khusus");
                const match = val.match(/\((.*?)-(.*?)\)/);
                if (match) {
                  setJamKhususMulai(match[1].trim());
                  setJamKhususSelesai(match[2].trim());
                }
              } else {
                finalJamKe.push(val);
              }
            }
            setJamKe(finalJamKe);
          }
          setMateri(j.materi || "");
          setSubMateri(j.sub_materi || "");
          setLearningOutcome(j.learning_outcome || "");
          setKegiatan(j.kegiatan || "");
          setCatatan(j.catatan || "");
          setIsDraftRestored(false);
        }

        hydratedRef.current = true;
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data jurnal atau master. Coba refresh halaman.",
          confirmButtonColor: "#550000",
        });
      });

    return () => {
      active = false;
    };
  }, [id, today]);

  // Autosave ke localStorage khusus untuk jurnal ini SAAT user mengubah form
  useEffect(() => {
    if (!editDraftKey || loading || !hydratedRef.current) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    const savedAt = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const payload = {
      jenjangFilter,
      kelasId,
      mapelId,
      namaMapelCustom,
      asatidId,
      tanggal,
      jamKe,
      jamKhususMulai,
      jamKhususSelesai,
      materi,
      subMateri,
      learningOutcome,
      kegiatan,
      catatan,
      _savedAt: savedAt,
    };
    localStorage.setItem(editDraftKey, JSON.stringify(payload));
    setLastSaved(savedAt);
  }, [
    editDraftKey,
    loading,
    jenjangFilter,
    kelasId,
    mapelId,
    namaMapelCustom,
    asatidId,
    tanggal,
    jamKe,
    jamKhususMulai,
    jamKhususSelesai,
    materi,
    subMateri,
    learningOutcome,
    kegiatan,
    catatan,
  ]);

  const handleResetDraft = () => {
    Swal.fire({
      title: "Hapus Perubahan Draf Lokal?",
      text: "Draf lokal untuk edit jurnal ini akan dihapus dan data dimuat ulang dari server.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Muat Ulang Server",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        if (editDraftKey) localStorage.removeItem(editDraftKey);
        localStorage.removeItem("siakad_jurnal_draft");
        setLastSaved(null);
        setIsDraftRestored(false);
        window.location.reload();
      }
    });
  };

  const availableJenjangs = useMemo(() => {
    const defaultJenjangs = ["MTs", "IL", "MA"];
    if (!master?.kelas) return defaultJenjangs;
    const uniqueJenjangs = Array.from(
      new Set(master.kelas.map((k) => k.jenjang).filter(Boolean)),
    ) as string[];
    return uniqueJenjangs.length > 0 ? uniqueJenjangs : defaultJenjangs;
  }, [master]);

  const filteredKelasList = useMemo(() => {
    const list = master?.kelas || [];
    if (!jenjangFilter) return list;
    return list.filter((k) => k.jenjang === jenjangFilter);
  }, [jenjangFilter, master]);

  const mapelList = useMemo(() => {
    const list: Mapel[] =
      kelasId && master?.mapel?.[kelasId] ? [...master.mapel[kelasId]] : [];

    const selectedKelas = master?.kelas?.find((k) => k.id === kelasId);
    const selectedJenjang = selectedKelas?.jenjang;

    if (selectedJenjang && master?.kelas && master?.mapel) {
      const sameJenjangKelasIds = master.kelas
        .filter((k) => k.jenjang === selectedJenjang)
        .map((k) => k.id);

      const mapelNames = new Set(list.map((m) => m.nama.toLowerCase()));
      for (const kId of sameJenjangKelasIds) {
        for (const em of master.mapel[kId] || []) {
          if (!mapelNames.has(em.nama.toLowerCase())) {
            list.push(em);
            mapelNames.add(em.nama.toLowerCase());
          }
        }
      }
    }

    return list;
  }, [kelasId, master]);

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !kelasId ||
      (!mapelId && !namaMapelCustom) ||
      !asatidId ||
      !tanggal ||
      !materi ||
      !kegiatan
    ) {
      Swal.fire({
        icon: "warning",
        title: "Form Tidak Lengkap",
        text: "Mohon lengkapi semua field yang wajib diisi.",
        confirmButtonColor: "#550000",
      });
      return;
    }

    setSubmitting(true);
    try {
      const sortedJamKe =
        jamKe.length > 0
          ? [...jamKe]
              .sort((a, b) => {
                if (a === "Khusus") return 1;
                if (b === "Khusus") return -1;
                return Number.parseInt(a, 10) - Number.parseInt(b, 10);
              })
              .map((j) => {
                if (j === "Khusus" && jamKhususMulai && jamKhususSelesai) {
                  return `Khusus (${jamKhususMulai}-${jamKhususSelesai})`;
                }
                return j;
              })
              .join(", ")
          : null;

      const useCustomMapel = Boolean(isSpecialClass && mapelList.length === 0);
      const res = await fetch(`/api/jurnal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: asatidId,
          mapel_id: useCustomMapel ? undefined : mapelId,
          nama_mapel_custom: useCustomMapel ? namaMapelCustom : undefined,
          kelas_id: kelasId,
          tanggal,
          jam_ke: sortedJamKe,
          materi,
          sub_materi: subMateri || null,
          learning_outcome: learningOutcome || null,
          kegiatan,
          catatan: catatan || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan jurnal");
      }

      if (editDraftKey) localStorage.removeItem(editDraftKey);
      localStorage.removeItem("siakad_jurnal_draft");
      localStorage.removeItem("sikap_pending_jurnal_date");

      await Swal.fire({
        icon: "success",
        title: "Perubahan Tersimpan!",
        text: "Jurnal mengajar berhasil diperbarui.",
        confirmButtonColor: "#550000",
        timer: 1800,
        timerProgressBar: true,
      });

      router.push("/jurnal");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "#550000",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 md:p-6">
      {/* Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-[#550000] p-5 text-white shadow-xs md:p-6">
        <div className="flex items-center gap-3.5">
          <Link
            href="/jurnal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-white/10 text-white transition-colors duration-150 hover:bg-white/20"
            aria-label="Kembali ke daftar jurnal"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-[-0.02em] text-white md:text-2xl">
              <BookMarked size={22} className="text-[#ddc192]" /> Edit Jurnal Mengajar
            </h1>
            <p className="mt-0.5 text-xs text-white/85 md:text-sm">
              Perbarui catatan kegiatan belajar mengajar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white">
              <Save size={13} className="text-emerald-300" />
              <span className="tabular-nums">Draf: {lastSaved}</span>
            </div>
          )}
          {isDraftRestored && (
            <button
              type="button"
              onClick={handleResetDraft}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/20 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-[#fcfaf8]"
              title="Kembalikan ke data server"
            >
              <RotateCcw size={13} />
              <span>Reset Draf</span>
            </button>
          )}
        </div>
      </div>

      {isDraftRestored && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Draf Perubahan Lokal Dipulihkan
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Menampilkan ketikan terakhir yang belum sempat disimpan untuk jurnal ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDraft}
            className="cursor-pointer rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Muat Data Server
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-2.5 rounded-[12px] border border-[#e7e2da] bg-white text-sm text-[#44403c] shadow-xs">
          <Loader2 size={20} className="animate-spin text-[#550000]" />
          Memuat data jurnal dan master...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Card 1: Informasi Mengajar */}
          <div className="flex flex-col gap-5 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f0ece4] pb-3.5 text-base font-semibold text-[#1a1a1a]">
              <BookOpen size={18} className="text-[#550000]" />
              Informasi Mengajar
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Tanggal <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full max-w-[260px] rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
              {tanggal && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
                  <Calendar size={14} /> {formatTanggalLongID(tanggal)}
                </div>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                  Nama Guru <span className="text-rose-600">*</span>
                </label>
                <select
                  value={asatidId}
                  onChange={(e) => setAsatidId(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
                >
                  <option value="">-- Pilih Guru --</option>
                  {master?.asatidz.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-end justify-between gap-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#44403c]">
                      <Clock size={14} />
                      Jam ke- (KBM Kelas)
                    </label>
                    <p className="text-[11px] text-[#78716c]">
                      Tersinkron dengan Master Sesi Waktu Pesantren
                    </p>
                  </div>
                  {jamKe.length > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-700">
                      {jamKe.length} Sesi
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {jamOptions.map((j) => {
                    const isSelected = jamKe.includes(j);
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setJamKe(jamKe.filter((k) => k !== j));
                          } else {
                            setJamKe([...jamKe, j]);
                          }
                        }}
                        className={`relative flex min-w-[74px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-3 py-2 text-center transition-colors duration-150 ${
                          isSelected
                            ? "border-[#550000] bg-[#fdf5f5] text-[#550000]"
                            : "border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#faf6ee]"
                        }`}
                      >
                        {isSelected && j !== "Khusus" && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#550000] text-white">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                        {j === "Khusus" ? (
                          <>
                            <span className="flex items-center gap-1 text-xs font-bold">
                              {isSelected && <Check size={12} strokeWidth={3} />}
                              Khusus
                            </span>
                            <span className="text-[10px] text-[#78716c]">
                              Menyesuaikan
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-bold tabular-nums leading-tight">
                              Jam {j}
                            </span>
                            <span className="mt-0.5 text-[10px] font-medium tabular-nums text-[#78716c]">
                              {waktuMap[j] || "-"}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {jamKe.includes("Khusus") && (
                  <div className="mt-3 rounded-[10px] border border-dashed border-[#e7e2da] bg-[#fcfaf8] p-3">
                    <label className="mb-1.5 block text-xs font-semibold text-[#44403c]">
                      Tentukan Waktu Khusus <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="time"
                        value={jamKhususMulai}
                        onChange={(e) => setJamKhususMulai(e.target.value)}
                        required={jamKe.includes("Khusus")}
                        className="rounded-[8px] border border-[#e7e2da] bg-white px-3 py-1.5 text-sm text-[#1a1a1a]"
                      />
                      <span className="text-xs font-semibold text-[#78716c]">
                        s.d.
                      </span>
                      <input
                        type="time"
                        value={jamKhususSelesai}
                        onChange={(e) => setJamKhususSelesai(e.target.value)}
                        required={jamKe.includes("Khusus")}
                        className="rounded-[8px] border border-[#e7e2da] bg-white px-3 py-1.5 text-sm text-[#1a1a1a]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                  Jenjang <span className="text-rose-600">*</span>
                </label>
                <select
                  value={jenjangFilter}
                  onChange={(e) => {
                    setJenjangFilter(e.target.value);
                    setKelasId("");
                    setMapelId("");
                    setNamaMapelCustom("");
                  }}
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
                >
                  {availableJenjangs.length > 1 && (
                    <option value="">— Semua Jenjang —</option>
                  )}
                  {availableJenjangs.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                  Kelas <span className="text-rose-600">*</span>
                </label>
                <select
                  value={kelasId}
                  onChange={(e) => {
                    setKelasId(e.target.value);
                    setMapelId("");
                    setNamaMapelCustom("");
                  }}
                  required
                  disabled={jenjangFilter !== "" && filteredKelasList.length === 0}
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] disabled:bg-slate-100"
                >
                  <option value="">— Pilih Kelas —</option>
                  {filteredKelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                  Mata Pelajaran <span className="text-rose-600">*</span>
                </label>
                {isSpecialClass && mapelList.length === 0 ? (
                  <input
                    type="text"
                    placeholder="Ketik nama mata pelajaran..."
                    value={namaMapelCustom}
                    onChange={(e) => setNamaMapelCustom(e.target.value)}
                    required
                    className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
                  />
                ) : (
                  <select
                    value={mapelId}
                    onChange={(e) => setMapelId(e.target.value)}
                    required
                    disabled={!kelasId}
                    className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] disabled:bg-slate-100"
                  >
                    <option value="">
                      {kelasId
                        ? "— Pilih Mata Pelajaran —"
                        : "— Pilih kelas terlebih dahulu —"}
                    </option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Isi Jurnal */}
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f0ece4] pb-3.5 text-base font-semibold text-[#1a1a1a]">
              <FileText size={18} className="text-[#550000]" /> Isi Jurnal
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Topik Jurnal <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan topik jurnal hari ini..."
                value={materi}
                onChange={(e) => {
                  setMateri(e.target.value);
                  handleTextareaResize(e);
                }}
                required
                className="min-h-[80px] w-full resize-none rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Sub Topik Jurnal <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan sub topik yang spesifik..."
                value={subMateri}
                onChange={(e) => {
                  setSubMateri(e.target.value);
                  handleTextareaResize(e);
                }}
                required
                className="min-h-[60px] w-full resize-none rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Learning Objective (LO) / Tujuan Pembelajaran{" "}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan learning objective atau tujuan pembelajaran yang ingin dicapai..."
                value={learningOutcome}
                onChange={(e) => {
                  setLearningOutcome(e.target.value);
                  handleTextareaResize(e);
                }}
                required
                className="min-h-[80px] w-full resize-none rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Strategi Pembelajaran <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Deskripsikan strategi untuk mencapai target/tujuan pembelajaran..."
                value={kegiatan}
                onChange={(e) => {
                  setKegiatan(e.target.value);
                  handleTextareaResize(e);
                }}
                required
                className="min-h-[100px] w-full resize-none rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Catatan Lainnya (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Catatan tambahan, kendala, atau evaluasi..."
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  handleTextareaResize(e);
                }}
                className="min-h-[80px] w-full resize-none rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {lastSaved && (
              <span className="mr-auto flex items-center gap-1.5 text-xs font-medium text-[#78716c]">
                <Save size={14} /> Draf tersimpan pukul {lastSaved}
              </span>
            )}
            <Link
              href="/jurnal"
              className="rounded-[10px] border border-[#e7e2da] bg-white px-5 py-2.5 text-sm font-semibold text-[#44403c] hover:bg-[#f6f1e8]"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#550000] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#380000] active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
