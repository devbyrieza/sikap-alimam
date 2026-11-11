"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  formatTanggalLongID,
  getJakartaTodayISO,
  isValidISODate,
} from "@/lib/jurnalDateUtils";
import { getStandardMapelName } from "@/lib/mapel";

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

function cleanMapelLabel(raw: string): string {
  const noPrefix = (raw || "").replace(/^\[.*?\]\s*/, "").trim();
  if (noPrefix === "Tahsin/Tahfidz Al-Quran") return "Tahsin Al-Qur'an";
  return noPrefix;
}

function TambahJurnalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useMemo(() => getJakartaTodayISO(), []);

  // Parameter prefill dari /guru/jadwal atau /jurnal/monitoring
  const urlPegawaiId = searchParams.get("pegawai_id") || "";
  const urlKelasId = searchParams.get("kelas_id") || "";
  const urlKelasNama = searchParams.get("kelas_nama") || "";
  const urlMapelId = searchParams.get("mapel_id") || "";
  const urlMapelNama = searchParams.get("mapel_nama") || "";
  const urlTanggal = searchParams.get("tanggal") || "";
  const urlJamKe = searchParams.get("jam_ke") || "";
  const hasUrlPrefill = Boolean(
    urlPegawaiId || urlKelasId || urlMapelId || urlMapelNama || urlTanggal || urlJamKe,
  );

  const [master, setMaster] = useState<MasterData | null>(null);
  const [sesiList, setSesiList] = useState<SesiWaktuRow[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    role?: string;
    nama?: string;
  } | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);

  // Form fields
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
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
  const [namaMapelCustom, setNamaMapelCustom] = useState("");

  // Track apakah initial hydration sudah selesai sebelum menjalankan auto-reset filter
  const hydratedRef = useRef(false);

  const selectedKelasInfo = master?.kelas.find((k) => k.id === kelasId);
  const isSpecialClass =
    selectedKelasInfo?.nama.toLowerCase().includes("11 ma") ||
    selectedKelasInfo?.nama.toLowerCase().includes("12 ma");

  // Force asatidz to Thoriq Ziyad for special MA class jika belum dipilih lewat URL prefill
  useEffect(() => {
    if (isSpecialClass && master && !urlPegawaiId) {
      const thoriq = master.asatidz.find((a) =>
        a.nama_lengkap.toLowerCase().includes("thoriq"),
      );
      if (thoriq && asatidId !== thoriq.id) {
        setAsatidId(thoriq.id);
      }
    }
  }, [isSpecialClass, master, asatidId, urlPegawaiId]);

  const getDraftKey = () => {
    const uid = currentUser?.id || asatidId;
    return uid ? `siakad_jurnal_draft_${uid}` : "siakad_jurnal_draft";
  };

  // Daftar sesi jam dinamis tersinkron dari /api/master/sesi
  const { jamOptions, waktuMap } = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_WAKTU_MAP };
    const prefilledNumeric = new Set(
      jamKe.filter((x) => /^\d+$/.test(x)).map((x) => Number(x)),
    );

    if (sesiList.length > 0) {
      const opts: string[] = [];
      for (const s of sesiList) {
        const key = String(s.jam_ke);
        map[key] = `${s.waktu_mulai.replace(":", ".")}-${s.waktu_selesai.replace(":", ".")}`;
        if (s.jam_ke >= 3 || prefilledNumeric.has(s.jam_ke)) {
          opts.push(key);
        }
      }
      for (const n of prefilledNumeric) {
        const key = String(n);
        if (!opts.includes(key)) opts.push(key);
      }
      opts.sort((a, b) => Number(a) - Number(b));
      opts.push("Khusus");
      return { jamOptions: opts, waktuMap: map };
    }

    const base = ["3", "4", "5", "6", "7", "8", "9"];
    for (const n of prefilledNumeric) {
      const key = String(n);
      if (!base.includes(key)) base.push(key);
    }
    base.sort((a, b) => Number(a) - Number(b));
    base.push("Khusus");
    return { jamOptions: base, waktuMap: map };
  }, [sesiList, jamKe]);

  const handleResetDraft = () => {
    Swal.fire({
      title: "Kosongkan Formulir?",
      text: "Semua tulisan draf yang tersimpan otomatis di perangkat ini akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Bersihkan",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(getDraftKey());
        localStorage.removeItem("siakad_jurnal_draft");
        setJenjangFilter("");
        setKelasId("");
        setMapelId("");
        setNamaMapelCustom("");
        setJamKe([]);
        setJamKhususMulai("");
        setJamKhususSelesai("");
        setMateri("");
        setSubMateri("");
        setLearningOutcome("");
        setKegiatan("");
        setCatatan("");
        setLastSaved(null);
        setIsDraftRestored(false);
        Swal.fire({
          icon: "success",
          title: "Draf Dibersihkan",
          text: "Formulir telah dikosongkan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Autosave draft ke localStorage setelah data master & prefill selesai dihidrasi
  useEffect(() => {
    if (loadingMaster || !hydratedRef.current) return;
    const uid = currentUser?.id || asatidId;
    if (!uid) return;

    if (
      kelasId ||
      mapelId ||
      namaMapelCustom ||
      materi ||
      subMateri ||
      learningOutcome ||
      kegiatan ||
      catatan
    ) {
      const savedAt = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const payload = {
        uid,
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
      localStorage.setItem(`siakad_jurnal_draft_${uid}`, JSON.stringify(payload));
      setLastSaved(savedAt);
    }
  }, [
    loadingMaster,
    currentUser,
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

  // Load master, sesi, & profile; lalu terapkan URL prefill ATAU pulihkan draft user
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/master", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/profile", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/master/sesi", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([masterData, profileData, sesiData]) => {
        if (!active) return;

        setMaster(masterData);
        if (Array.isArray(sesiData)) {
          setSesiList(sesiData);
        }

        const loggedInUser = profileData?.user || null;
        const pegawaiObj = profileData?.pegawai || null;
        setCurrentUser(loggedInUser);

        const teacherId = pegawaiObj?.id || "";
        const uid = loggedInUser?.id || teacherId;

        const allKelas: Kelas[] = masterData?.kelas || [];
        const resolveKelasByIdOrName = (kid: string, knama: string) => {
          if (kid) {
            const direct = allKelas.find((k) => k.id === kid);
            if (direct) return direct;
          }
          if (knama) {
            const cleanTarget = knama
              .replace(/\s*(MTs|MA)$/i, "")
              .trim()
              .toLowerCase();
            return allKelas.find(
              (k) =>
                k.nama.trim().toLowerCase() === knama.trim().toLowerCase() ||
                k.nama
                  .replace(/\s*(MTs|MA)$/i, "")
                  .trim()
                  .toLowerCase() === cleanTarget,
            );
          }
          return undefined;
        };

        const resolveMapelForKelas = (
          kObj: Kelas | undefined,
          mid: string,
          mnama: string,
        ): string => {
          if (!kObj) return mid || "";
          const mapelDict: Record<string, Mapel[]> = masterData?.mapel || {};
          const candidates: Mapel[] = [...(mapelDict[kObj.id] || [])];
          if (kObj.jenjang) {
            for (const otherK of allKelas) {
              if (otherK.jenjang === kObj.jenjang && mapelDict[otherK.id]) {
                candidates.push(...mapelDict[otherK.id]);
              }
            }
          }
          if (mid && candidates.some((m) => m.id === mid)) {
            return mid;
          }
          if (mnama) {
            const cleanTarget = cleanMapelLabel(mnama).toLowerCase();
            const stdTarget = getStandardMapelName(
              cleanTarget,
              kObj.jenjang === "MA",
            ).toLowerCase();
            const matched = candidates.find((m) => {
              const cm = cleanMapelLabel(m.nama).toLowerCase();
              const sm = getStandardMapelName(
                cm,
                kObj.jenjang === "MA",
              ).toLowerCase();
              return cm === cleanTarget || sm === stdTarget;
            });
            if (matched) return matched.id;
          }
          return "";
        };

        if (hasUrlPrefill) {
          // Prioritaskan parameter slot terlewat / jadwal mengajar
          const chosenAsatidz = urlPegawaiId || teacherId;
          if (chosenAsatidz) setAsatidId(chosenAsatidz);

          if (isValidISODate(urlTanggal)) {
            setTanggal(urlTanggal);
          }

          if (urlJamKe) {
            const tokens = urlJamKe
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const parsedTokens: string[] = [];
            for (const tok of tokens) {
              if (tok.toLowerCase().startsWith("khusus")) {
                parsedTokens.push("Khusus");
                const match = tok.match(/\((.*?)-(.*?)\)/);
                if (match) {
                  setJamKhususMulai(match[1].trim());
                  setJamKhususSelesai(match[2].trim());
                }
              } else {
                parsedTokens.push(tok);
              }
            }
            if (parsedTokens.length > 0) setJamKe(parsedTokens);
          }

          const targetKelas = resolveKelasByIdOrName(urlKelasId, urlKelasNama);
          if (targetKelas) {
            if (targetKelas.jenjang) setJenjangFilter(targetKelas.jenjang);
            setKelasId(targetKelas.id);
            const isTargetSpecial =
              targetKelas.nama.toLowerCase().includes("11 ma") ||
              targetKelas.nama.toLowerCase().includes("12 ma");
            if (isTargetSpecial) {
              if (urlMapelNama) setNamaMapelCustom(cleanMapelLabel(urlMapelNama));
            } else {
              const resolvedMapelId = resolveMapelForKelas(
                targetKelas,
                urlMapelId,
                urlMapelNama,
              );
              if (resolvedMapelId) setMapelId(resolvedMapelId);
            }
          }

          const infoParts = [
            isValidISODate(urlTanggal) ? formatTanggalLongID(urlTanggal) : null,
            urlMapelNama ? cleanMapelLabel(urlMapelNama) : null,
            urlJamKe ? `Jam ke-${urlJamKe}` : null,
          ].filter(Boolean);
          if (infoParts.length > 0) {
            setPrefillBanner(infoParts.join(" · "));
          }
        } else {
          // Mode normal: set default guru login + pulihkan draft user-specific
          if (teacherId) {
            setAsatidId(teacherId);
          }
          const draftKey = uid ? `siakad_jurnal_draft_${uid}` : null;
          const userDraft = draftKey ? localStorage.getItem(draftKey) : null;
          if (userDraft) {
            try {
              const p = JSON.parse(userDraft);
              const hasContent =
                p.materi || p.learningOutcome || p.kegiatan || p.catatan;
              const matchedKelas = p.kelasId
                ? allKelas.find((k) => k.id === p.kelasId)
                : undefined;
              const inferredJenjang =
                p.jenjangFilter || matchedKelas?.jenjang || "";
              if (inferredJenjang) setJenjangFilter(inferredJenjang);
              if (matchedKelas) {
                setKelasId(matchedKelas.id);
              } else if (p.kelasId) {
                setKelasId(p.kelasId);
              }
              if (p.mapelId) setMapelId(p.mapelId);
              if (p.namaMapelCustom) setNamaMapelCustom(p.namaMapelCustom);
              if (p.tanggal && isValidISODate(p.tanggal) && p.tanggal === today) {
                setTanggal(p.tanggal);
              }
              if (p.jamKe) {
                if (Array.isArray(p.jamKe)) setJamKe(p.jamKe);
                else if (typeof p.jamKe === "string") {
                  setJamKe(p.jamKe.split(",").map((s: string) => s.trim()));
                }
              }
              if (p.jamKhususMulai) setJamKhususMulai(p.jamKhususMulai);
              if (p.jamKhususSelesai) setJamKhususSelesai(p.jamKhususSelesai);
              if (p.materi) setMateri(p.materi);
              if (p.subMateri) setSubMateri(p.subMateri);
              if (p.learningOutcome) setLearningOutcome(p.learningOutcome);
              if (p.kegiatan) setKegiatan(p.kegiatan);
              if (p.catatan) setCatatan(p.catatan);
              setLastSaved(p._savedAt || null);
              if (hasContent) setIsDraftRestored(true);
            } catch {
              // Abaikan draft korup
            }
          } else {
            localStorage.removeItem("siakad_jurnal_draft");
            setIsDraftRestored(false);
          }
        }

        hydratedRef.current = true;
        setLoadingMaster(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadingMaster(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data master. Coba refresh halaman.",
          confirmButtonColor: "#550000",
        });
      });

    return () => {
      active = false;
    };
  }, [
    hasUrlPrefill,
    today,
    urlJamKe,
    urlKelasId,
    urlKelasNama,
    urlMapelId,
    urlMapelNama,
    urlPegawaiId,
    urlTanggal,
  ]);

  const availableJenjangs = useMemo(() => {
    const defaultJenjangs = ["MTs", "IL", "MA"];
    if (!master?.kelas) return defaultJenjangs;
    const uniqueJenjangs = Array.from(
      new Set(master.kelas.map((k) => k.jenjang).filter(Boolean)),
    ) as string[];
    return uniqueJenjangs.length > 0 ? uniqueJenjangs : defaultJenjangs;
  }, [master]);

  useEffect(() => {
    if (loadingMaster) return;
    if (availableJenjangs.length === 1 && !jenjangFilter) {
      setJenjangFilter(availableJenjangs[0]);
    }
  }, [loadingMaster, availableJenjangs, jenjangFilter]);

  const filteredKelasList = useMemo(() => {
    if (!jenjangFilter) return [];
    return (master?.kelas || []).filter((k) => k.jenjang === jenjangFilter);
  }, [jenjangFilter, master]);

  useEffect(() => {
    if (loadingMaster || !hydratedRef.current) return;
    if (filteredKelasList.length === 1 && !kelasId) {
      setKelasId(filteredKelasList[0].id);
    } else if (kelasId) {
      const exists = filteredKelasList.some((k) => k.id === kelasId);
      if (!exists && jenjangFilter) {
        setKelasId("");
      }
    }
  }, [loadingMaster, filteredKelasList, kelasId, jenjangFilter]);

  const mapelList = useMemo(() => {
    let list: Mapel[] =
      kelasId && master?.mapel?.[kelasId] ? [...master.mapel[kelasId]] : [];

    const selectedKelas = master?.kelas?.find((k) => k.id === kelasId);
    const selectedJenjang = selectedKelas?.jenjang;

    if (selectedJenjang && master?.kelas && master?.mapel) {
      const sameJenjangKelasIds = master.kelas
        .filter((k) => k.jenjang === selectedJenjang)
        .map((k) => k.id);

      const extraMapels: Mapel[] = [];
      for (const kId of sameJenjangKelasIds) {
        if (master.mapel[kId]) {
          extraMapels.push(...master.mapel[kId]);
        }
      }

      const mapelNames = new Set(list.map((m) => m.nama.toLowerCase()));
      for (const em of extraMapels) {
        if (!mapelNames.has(em.nama.toLowerCase())) {
          list.push(em);
          mapelNames.add(em.nama.toLowerCase());
        }
      }
    }

    const finalUnique: Mapel[] = [];
    const seenNames = new Set<string>();
    for (const m of list) {
      const nameKey = m.nama.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        finalUnique.push(m);
      }
    }

    return finalUnique;
  }, [kelasId, master]);

  useEffect(() => {
    if (loadingMaster || !hydratedRef.current) return;
    if (mapelList.length === 1 && !mapelId) {
      setMapelId(mapelList[0].id);
    } else if (mapelId && kelasId && !mapelList.some((m) => m.id === mapelId)) {
      setMapelId("");
    }
  }, [loadingMaster, mapelList, mapelId, kelasId]);

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

      const res = await fetch("/api/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: asatidId,
          mapel_id: isSpecialClass ? undefined : mapelId,
          nama_mapel_custom: isSpecialClass ? namaMapelCustom : undefined,
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

      localStorage.removeItem(getDraftKey());
      localStorage.removeItem("siakad_jurnal_draft");
      localStorage.removeItem("sikap_pending_jurnal_date");

      await Swal.fire({
        icon: "success",
        title: "Jurnal Tersimpan!",
        text: "Jurnal mengajar berhasil ditambahkan dan langsung tersinkron ke laporan.",
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
              <BookMarked size={22} className="text-[#ddc192]" /> Tambah Jurnal Mengajar
            </h1>
            <p className="mt-0.5 text-xs text-white/85 md:text-sm">
              Catat kegiatan belajar mengajar sesuai jadwal KBM harian
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
          {(kelasId || materi || learningOutcome || kegiatan || catatan) && (
            <button
              type="button"
              onClick={handleResetDraft}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-white/20 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-[#fcfaf8]"
              title="Kosongkan form dan hapus draf"
            >
              <RotateCcw size={13} />
              <span>Reset Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Prefill dari Jadwal / Monitoring */}
      {prefillBanner && (
        <div className="flex items-start gap-3 rounded-[12px] border border-[#e7e2da] bg-[#faf6ee] p-4 text-xs text-[#1a1a1a]">
          <Info size={16} className="mt-0.5 shrink-0 text-[#550000]" />
          <div>
            <div className="font-semibold text-[#550000]">
              Formulir Diisi Otomatis dari Jadwal Mengajar
            </div>
            <div className="mt-0.5 text-[#44403c]">{prefillBanner}</div>
          </div>
        </div>
      )}

      {/* Banner Draf Dipulihkan */}
      {isDraftRestored && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Draf Belum Tersimpan Dipulihkan
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Formulir otomatis memuat ketikan terakhir dari perangkat Anda agar tidak hilang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDraft}
            className="cursor-pointer rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Hapus Draf
          </button>
        </div>
      )}

      {loadingMaster ? (
        <div className="flex min-h-[200px] items-center justify-center gap-2.5 rounded-[12px] border border-[#e7e2da] bg-white text-sm text-[#44403c] shadow-xs">
          <Loader2 size={20} className="animate-spin text-[#550000]" />
          Memuat data master dan jam pelajaran...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Card 1: Informasi Mengajar */}
          <div className="flex flex-col gap-5 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f0ece4] pb-3.5 text-base font-semibold text-[#1a1a1a]">
              <BookOpen size={18} className="text-[#550000]" />
              Informasi Mengajar
            </div>

            {/* Tanggal + nama hari */}
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
              {/* Nama Guru */}
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

              {/* Jam ke- */}
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

              {/* Jenjang */}
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
                    <option value="">— Pilih Jenjang —</option>
                  )}
                  {availableJenjangs.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelas */}
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
                  disabled={!jenjangFilter || filteredKelasList.length === 0}
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] disabled:bg-slate-100"
                >
                  <option value="">
                    {jenjangFilter
                      ? "— Pilih Kelas —"
                      : "— Pilih Jenjang Terlebih Dahulu —"}
                  </option>
                  {filteredKelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama || (k.jenjang ? `Kelas ${k.jenjang}` : "Tanpa Nama")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                  Mata Pelajaran <span className="text-rose-600">*</span>
                </label>
                {isSpecialClass ? (
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
                        : "— Pilih Kelas Terlebih Dahulu —"}
                    </option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                )}

                {kelasId && !isSpecialClass && mapelList.length === 0 && (
                  <p className="mt-1.5 text-xs font-medium text-amber-700">
                    Belum ada mapel untuk kelas ini
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Isi Jurnal / Validasi */}
          {!kelasId ||
          (!mapelId && !namaMapelCustom) ||
          jamKe.length === 0 ||
          !asatidId ||
          !tanggal ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertCircle size={22} />
              </div>
              <div className="text-sm font-bold text-amber-900">
                Informasi Mengajar Belum Lengkap
              </div>
              <div className="mx-auto mt-2 flex max-w-lg items-start justify-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  {!kelasId
                    ? "Silakan pilih Jenjang dan Kelas terlebih dahulu."
                    : !mapelId && !namaMapelCustom
                      ? "Silakan pilih atau isi Mata Pelajaran terlebih dahulu."
                      : "Silakan pilih Jam ke- KBM terlebih dahulu."}{" "}
                  Isian materi dan langkah pembelajaran akan terbuka setelah informasi di atas lengkap.
                </span>
              </div>
            </div>
          ) : (
            <>
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
                      Simpan Jurnal
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default function TambahJurnalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[260px] max-w-4xl items-center justify-center gap-2.5 p-6 text-sm text-[#44403c]">
          <Loader2 size={20} className="animate-spin text-[#550000]" />
          Memuat formulir jurnal mengajar...
        </div>
      }
    >
      <TambahJurnalInner />
    </Suspense>
  );
}
