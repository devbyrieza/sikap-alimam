"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  BookMarked,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileSpreadsheet,
  Filter,
  Info,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Monitor,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import GuruJurnalDetailModal from "@/components/jurnal/GuruJurnalDetailModal";
import {
  formatTanggalLongID,
  getJakartaTodayISO,
  getPresetRange,
  getWeekParityOfDate,
  type PeriodPreset,
  type TipePekanFilter,
} from "@/lib/jurnalDateUtils";
import type {
  JurnalMonitoringReport,
  KepatuhanStatus,
  MissedSlotDetail,
  TeacherMonitoringItem,
} from "@/lib/jurnalMonitoring";
import type { LaporanNilaiAccess } from "@/lib/permissions";

interface JurnalMonitoringClientProps {
  initialReport: JurnalMonitoringReport;
  access: LaporanNilaiAccess;
}

const PRESET_OPTIONS: { id: PeriodPreset; label: string }[] = [
  { id: "pekan_ini", label: "Pekan Ini (Sen-Sab)" },
  { id: "pekan_lalu", label: "Pekan Lalu" },
  { id: "7_hari", label: "7 Hari Terakhir" },
  { id: "14_hari", label: "14 Hari Terakhir" },
  { id: "bulan_ini", label: "Bulan Ini" },
];

const STATUS_META: Record<
  KepatuhanStatus,
  { label: string; shortLabel: string; badgeClass: string; dotClass: string }
> = {
  belum_isi: {
    label: "Belum Mengisi",
    shortLabel: "Belum",
    badgeClass: "bg-rose-100 text-rose-700",
    dotClass: "bg-rose-600",
  },
  sebagian: {
    label: "Sebagian Terlewat",
    shortLabel: "Sebagian",
    badgeClass: "bg-amber-100 text-amber-800",
    dotClass: "bg-amber-500",
  },
  lengkap: {
    label: "Lengkap Mengisi",
    shortLabel: "Lengkap",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dotClass: "bg-emerald-600",
  },
  belum_jadwal: {
    label: "Menunggu Jadwal",
    shortLabel: "Menunggu",
    badgeClass: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
  },
};

function formatPhoneWA(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

function buildMeetingWaSummary(report: JurnalMonitoringReport): string {
  const s = report.summary;
  const nonCompliant = report.teachers.filter(
    (t) =>
      t.status_kepatuhan === "belum_isi" || t.status_kepatuhan === "sebagian",
  );

  const lines: string[] = [
    "*REKAP KEPATUHAN PENGISIAN JURNAL GURU MAPEL*",
    "*Pesantren Al-Imam Al-Islami (SIKAP)*",
    `Periode: ${report.meta.period_label}`,
    ...(report.meta.jenjang_filter !== "ALL"
      ? [`Filter Jenjang: ${report.meta.jenjang_filter}`]
      : []),
    "",
    "*RINGKASAN EKSEKUTIF*",
    `- Total Guru Mapel Terdata: *${s.total_guru_mapel} guru*`,
    `- Sudah Mengisi: *${s.persen_mengisi}%* (${s.guru_mengisi} guru)`,
    `- Tidak Mengisi: *${s.persen_tidak_mengisi}%* (${s.guru_tidak_mengisi} guru)`,
    `- Status Kepatuhan: Lengkap ${s.guru_lengkap} | Sebagian ${s.guru_sebagian} | Belum Isi ${s.guru_belum_isi}${s.guru_belum_jadwal > 0 ? ` | Menunggu Jadwal ${s.guru_belum_jadwal}` : ""}`,
    ...(s.persen_sesi !== null
      ? [
          `- Kepatuhan Sesi KBM: *${s.persen_sesi}%* (${s.sesi_terisi_elapsed}/${s.total_sesi_jadwal_elapsed} sesi, ${s.sesi_terlewat} sesi belum diisi)`,
        ]
      : [`- Total Jurnal Masuk: *${s.total_jurnal} entri*`]),
    "",
  ];

  if (nonCompliant.length === 0) {
    lines.push(
      "[OK] Seluruh guru mapel terjadwal telah melengkapi pengisian jurnal mengajar pada periode ini.",
    );
  } else {
    lines.push(
      `*DAFTAR GURU BELUM / SEBAGIAN MENGISI JURNAL (${nonCompliant.length} GURU)*`,
    );
    nonCompliant.forEach((t, idx) => {
      const tag = t.status_kepatuhan === "belum_isi" ? "[BELUM]" : "[SEBAGIAN]";
      const kPct =
        t.persen_kepatuhan_jadwal !== null
          ? `${t.persen_kepatuhan_jadwal}% (${t.covered_sessions_elapsed}/${t.expected_sessions_elapsed} sesi)`
          : `${t.total_jurnal} jurnal`;
      lines.push(`${idx + 1}. ${tag} *${t.nama_lengkap}* - ${kPct}`);

      if (t.missed_blocks.length > 0) {
        t.missed_blocks.slice(0, 8).forEach((blk) => {
          const exc =
            blk.is_excused && blk.presensi_status
              ? ` [${blk.presensi_status.toUpperCase()}]`
              : "";
          lines.push(
            `   - ${blk.label_tanggal} | ${blk.mapel_nama} (${blk.kelas_nama}) | ${blk.jam_detail} (${blk.waktu_mulai}-${blk.waktu_selesai})${exc}`,
          );
        });
        if (t.missed_blocks.length > 8) {
          lines.push(
            `   - ... dan ${t.missed_blocks.length - 8} sesi terlewat lainnya`,
          );
        }
      } else if (t.assigned_mapels.length > 0) {
        const list = t.assigned_mapels
          .slice(0, 5)
          .map((m) => `${m.mapel_nama} (${m.kelas_nama})`)
          .join(", ");
        lines.push(`   - Mapel diampu: ${list}`);
      }
    });
  }

  lines.push(
    "",
    `Dicetak/Disalin dari SIKAP Al-Imam pada ${formatTanggalLongID(report.meta.today_iso)}.`,
  );
  return lines.join("\n");
}

function buildTeacherSingleWaText(
  teacher: TeacherMonitoringItem,
  periodLabel: string,
): string {
  const lines: string[] = [
    `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ust. ${teacher.nama_lengkap}.`,
    "",
    `Pengingat evaluasi pengisian jurnal mengajar SIKAP periode *${periodLabel}*:`,
  ];
  if (teacher.missed_blocks.length > 0) {
    lines.push(
      `Terdapat *${teacher.missed_blocks.length} sesi terjadwal* yang jurnalnya belum masuk:`,
    );
    teacher.missed_blocks.forEach((b, i) => {
      const exc =
        b.is_excused && b.presensi_status
          ? ` [${b.presensi_status.toUpperCase()}]`
          : "";
      lines.push(
        `${i + 1}. ${b.label_tanggal} | ${b.mapel_nama} (${b.kelas_nama}) | ${b.jam_detail} (${b.waktu_mulai}-${b.waktu_selesai})${exc}`,
      );
    });
  } else {
    const mapels = teacher.assigned_mapels
      .map((a) => `${a.mapel_nama} (${a.kelas_nama})`)
      .join(", ");
    lines.push(
      `Belum ada catatan jurnal masuk untuk mapel: ${mapels || "sesuai penugasan"}.`,
    );
  }
  lines.push(
    "",
    "Mohon segera dilengkapi di menu Jurnal Mengajar SIKAP. Jazakumullahu khairan.",
  );
  return lines.join("\n");
}

function detectInitialPreset(
  start: string,
  end: string,
  todayISO: string,
): PeriodPreset {
  const presets: PeriodPreset[] = [
    "pekan_ini",
    "pekan_lalu",
    "7_hari",
    "14_hari",
    "bulan_ini",
  ];
  for (const p of presets) {
    const r = getPresetRange(p, todayISO);
    if (r.startDate === start && r.endDate === end) return p;
  }
  return "kustom";
}

export default function JurnalMonitoringClient({
  initialReport,
  access,
}: JurnalMonitoringClientProps) {
  const [report, setReport] = useState<JurnalMonitoringReport>(initialReport);
  const [preset, setPreset] = useState<PeriodPreset>(() =>
    detectInitialPreset(
      initialReport.meta.start_date,
      initialReport.meta.end_date,
      initialReport.meta.today_iso,
    ),
  );
  const [startDate, setStartDate] = useState<string>(
    initialReport.meta.start_date,
  );
  const [endDate, setEndDate] = useState<string>(initialReport.meta.end_date);
  const [jenjangFilter, setJenjangFilter] = useState<string>(
    initialReport.meta.jenjang_filter || "ALL",
  );
  const [kelasFilter, setKelasFilter] = useState<string>(
    initialReport.meta.kelas_filter || "ALL",
  );
  const [tipePekan, setTipePekan] = useState<TipePekanFilter>(
    initialReport.meta.tipe_pekan || "otomatis",
  );
  const [includeUnassigned, setIncludeUnassigned] = useState<boolean>(
    initialReport.meta.include_unassigned,
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | KepatuhanStatus>(
    "ALL",
  );
  const [missedSubFilter, setMissedSubFilter] = useState<
    "ALL" | "unexcused" | "belum_isi_only"
  >("ALL");
  const [activeTab, setActiveTab] = useState<"missed" | "teachers" | "matrix">(
    () => (initialReport.missed_details.length > 0 ? "missed" : "teachers"),
  );
  const [sortKey, setSortKey] = useState<
    "prioritas" | "nama" | "kepatuhan" | "terlewat" | "jurnal"
  >("prioritas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );

  const fetchSeqRef = useRef(0);
  const hasMountedRef = useRef(false);

  const fetchReport = useCallback(
    async (params: {
      start: string;
      end: string;
      jenjang: string;
      kelas: string;
      pekan: TipePekanFilter;
      unassigned: boolean;
    }) => {
      const seq = ++fetchSeqRef.current;
      setLoading(true);
      setErrorMsg(null);
      try {
        const qs = new URLSearchParams({
          start_date: params.start,
          end_date: params.end,
          jenjang: params.jenjang,
          kelas_id: params.kelas,
          tipe_pekan: params.pekan,
          include_unassigned: params.unassigned ? "true" : "false",
        });
        const res = await fetch(`/api/jurnal/monitoring?${qs.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (seq !== fetchSeqRef.current) return;
        if (!res.ok || !json?.success || !json?.report) {
          throw new Error(json?.error || "Gagal memuat data monitoring jurnal");
        }
        setReport(json.report);
      } catch (err: unknown) {
        if (seq !== fetchSeqRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyinkronkan laporan.";
        setErrorMsg(msg);
      } finally {
        if (seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Sinkronisasi otomatis setiap filter server berubah setelah mount awal
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!startDate || !endDate) return;
    fetchReport({
      start: startDate,
      end: endDate,
      jenjang: jenjangFilter,
      kelas: kelasFilter,
      pekan: tipePekan,
      unassigned: includeUnassigned,
    });
  }, [
    startDate,
    endDate,
    jenjangFilter,
    kelasFilter,
    tipePekan,
    includeUnassigned,
    fetchReport,
  ]);

  const handlePresetClick = (p: PeriodPreset) => {
    const r = getPresetRange(p, report.meta.today_iso || getJakartaTodayISO());
    setPreset(p);
    setStartDate(r.startDate);
    setEndDate(r.endDate);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate && val > endDate) {
      setEndDate(val);
    }
    setPreset("kustom");
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (val && startDate && val < startDate) {
      setStartDate(val);
    }
    setPreset("kustom");
  };

  const handleJenjangChange = (val: string) => {
    setJenjangFilter(val);
    setKelasFilter("ALL");
  };

  const handleManualReset = () => {
    const todayISO = getJakartaTodayISO();
    const defRange = getPresetRange("pekan_ini", todayISO);
    const defaultJenjang =
      access.allowedJenjang === "ALL"
        ? "ALL"
        : access.allowedJenjang[0] || "ALL";
    setPreset("pekan_ini");
    setStartDate(defRange.startDate);
    setEndDate(defRange.endDate);
    setJenjangFilter(defaultJenjang);
    setKelasFilter("ALL");
    setTipePekan("otomatis");
    setIncludeUnassigned(false);
    setSearchQuery("");
    setStatusFilter("ALL");
    setMissedSubFilter("ALL");
  };

  // Kelas dropdown terfilter oleh Jenjang terpilih
  const kelasOptionsFiltered = useMemo(() => {
    if (jenjangFilter === "ALL") return report.filter_options.kelas;
    return report.filter_options.kelas.filter(
      (k) => k.jenjang === jenjangFilter,
    );
  }, [report.filter_options.kelas, jenjangFilter]);

  const selectedTeacher = useMemo(
    () =>
      selectedTeacherId
        ? report.teachers.find((t) => t.pegawai_id === selectedTeacherId) ||
          null
        : null,
    [report.teachers, selectedTeacherId],
  );

  // Set guru dengan status belum_isi untuk sub-filter Rincian Tidak Diisi
  const belumIsiTeacherIds = useMemo(
    () =>
      new Set(
        report.teachers
          .filter((t) => t.status_kepatuhan === "belum_isi")
          .map((t) => t.pegawai_id),
      ),
    [report.teachers],
  );

  // Filter & urutkan daftar guru
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = report.teachers.filter((t) => {
      if (statusFilter !== "ALL" && t.status_kepatuhan !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const inName = t.nama_lengkap.toLowerCase().includes(q);
      const inJabatan = (t.jabatan || "").toLowerCase().includes(q);
      const inMapel = t.assigned_mapels.some(
        (m) =>
          m.mapel_nama.toLowerCase().includes(q) ||
          m.kelas_nama.toLowerCase().includes(q) ||
          m.jenjang.toLowerCase().includes(q),
      );
      const inMissed = t.missed_blocks.some(
        (b) =>
          b.mapel_nama.toLowerCase().includes(q) ||
          b.kelas_nama.toLowerCase().includes(q) ||
          b.label_tanggal.toLowerCase().includes(q) ||
          b.jam_detail.toLowerCase().includes(q),
      );
      return inName || inJabatan || inMapel || inMissed;
    });

    const priorityRank: Record<KepatuhanStatus, number> = {
      belum_isi: 0,
      sebagian: 1,
      belum_jadwal: 2,
      lengkap: 3,
    };

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "prioritas") {
        cmp =
          priorityRank[a.status_kepatuhan] - priorityRank[b.status_kepatuhan];
        if (cmp === 0) {
          cmp = b.missed_sessions_elapsed - a.missed_sessions_elapsed;
        }
        if (cmp === 0) {
          cmp = a.nama_lengkap.localeCompare(b.nama_lengkap, "id");
        }
      } else if (sortKey === "nama") {
        cmp = a.nama_lengkap.localeCompare(b.nama_lengkap, "id");
      } else if (sortKey === "kepatuhan") {
        const pa = a.persen_kepatuhan_jadwal ?? (a.sudah_mengisi ? 100 : -1);
        const pb = b.persen_kepatuhan_jadwal ?? (b.sudah_mengisi ? 100 : -1);
        cmp = pa - pb;
      } else if (sortKey === "terlewat") {
        cmp = a.missed_sessions_elapsed - b.missed_sessions_elapsed;
      } else if (sortKey === "jurnal") {
        cmp = a.total_jurnal - b.total_jurnal;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [report.teachers, statusFilter, searchQuery, sortKey, sortDir]);

  // Filter rincian sesi tidak diisi (Guru Mapel + Mapel + Kelas + Jam ke- + Tanggal)
  const filteredMissed = useMemo<MissedSlotDetail[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return report.missed_details.filter((m) => {
      if (missedSubFilter === "unexcused" && m.is_excused) return false;
      if (
        missedSubFilter === "belum_isi_only" &&
        !belumIsiTeacherIds.has(m.pegawai_id)
      ) {
        return false;
      }
      if (
        statusFilter === "belum_isi" &&
        !belumIsiTeacherIds.has(m.pegawai_id)
      ) {
        return false;
      }
      if (statusFilter === "sebagian" && belumIsiTeacherIds.has(m.pegawai_id)) {
        return false;
      }
      if (!q) return true;
      return (
        m.guru_nama.toLowerCase().includes(q) ||
        m.mapel_nama.toLowerCase().includes(q) ||
        m.kelas_nama.toLowerCase().includes(q) ||
        m.jenjang.toLowerCase().includes(q) ||
        m.label_tanggal.toLowerCase().includes(q) ||
        m.tanggal.includes(q) ||
        m.jam_detail.toLowerCase().includes(q)
      );
    });
  }, [
    report.missed_details,
    missedSubFilter,
    statusFilter,
    belumIsiTeacherIds,
    searchQuery,
  ]);

  // Guru prioritas untuk panel rapat atas (belum_isi + sebagian)
  const priorityTeachers = useMemo(
    () =>
      report.teachers.filter(
        (t) =>
          t.status_kepatuhan === "belum_isi" ||
          t.status_kepatuhan === "sebagian",
      ),
    [report.teachers],
  );

  // Kalkulasi Donut SVG (% Mengisi vs % Tidak Mengisi)
  const { summary } = report;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const fillingStroke =
    summary.total_guru_mapel > 0
      ? (summary.persen_mengisi / 100) * circumference
      : 0;
  const notFillingStroke =
    summary.total_guru_mapel > 0 ? circumference - fillingStroke : 0;

  // Paritas pekan pada periode saat ini (untuk indikator header)
  const parityBadgeText = useMemo(() => {
    const startP = getWeekParityOfDate(report.meta.start_date);
    const endP = getWeekParityOfDate(report.meta.end_date);
    if (report.meta.tipe_pekan === "ganjil")
      return "Filter Paksa: Pekan Ganjil (1/3)";
    if (report.meta.tipe_pekan === "genap")
      return "Filter Paksa: Pekan Genap (2/4)";
    if (report.meta.tipe_pekan === "semua")
      return "Semua Pekan (Ganjil + Genap)";
    if (startP === endP) {
      return startP === "ganjil"
        ? "Pekan Ganjil (Pekan 1 / 3)"
        : "Pekan Genap (Pekan 2 / 4)";
    }
    return "Lintas Pekan Ganjil & Genap";
  }, [report.meta.start_date, report.meta.end_date, report.meta.tipe_pekan]);

  const toggleSort = (
    key: "prioritas" | "nama" | "kepatuhan" | "terlewat" | "jurnal",
  ) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "kepatuhan" || key === "nama" || key === "prioritas"
          ? "asc"
          : "desc",
      );
    }
  };

  const handleCopyMeetingWA = async () => {
    const txt = buildMeetingWaSummary(report);
    try {
      await navigator.clipboard.writeText(txt);
      Swal.fire({
        icon: "success",
        title: "Rekap Rapat Disalin",
        text: "Ringkasan persentase dan rincian guru, mapel, jam ke-, serta tanggal yang tidak diisi siap dikirim ke WhatsApp rapat.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyalin",
        text: "Browser tidak mengizinkan akses clipboard otomatis.",
        confirmButtonColor: "#550000",
      });
    }
  };

  const handleDirectWA = async (teacher: TeacherMonitoringItem) => {
    const msg = buildTeacherSingleWaText(teacher, report.meta.period_label);
    const phone = teacher.no_hp ? formatPhoneWA(teacher.no_hp) : "";
    if (!phone) {
      const res = await Swal.fire({
        icon: "info",
        title: "Nomor WA Belum Terdaftar",
        text: `No. HP ${teacher.nama_lengkap} belum diisi. Salin teks pengingat ke clipboard?`,
        showCancelButton: true,
        confirmButtonColor: "#550000",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Salin Teks",
        cancelButtonText: "Batal",
      });
      if (res.isConfirmed) {
        await navigator.clipboard.writeText(msg);
      }
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan Rapat
      const sheet1Rows = [
        ["LAPORAN KEPATUHAN PENGISIAN JURNAL MENGAJAR GURU MAPEL"],
        ["Pesantren Al-Imam Al-Islami (SIKAP)"],
        [],
        ["Periode Laporan", report.meta.period_label],
        ["Tanggal Mulai", report.meta.start_date],
        ["Tanggal Selesai", report.meta.end_date],
        ["Filter Jenjang", report.meta.jenjang_filter],
        ["Pola Pekan", parityBadgeText],
        ["Basis Evaluasi", report.summary.evaluation_basis.toUpperCase()],
        [
          "Hari KBM Berjalan",
          `${summary.school_days_elapsed} dari ${summary.school_days_total} hari`,
        ],
        [
          "Hari Libur Akademik",
          `${summary.holiday_days_count} hari (di luar Ahad)`,
        ],
        [],
        ["METRIK UTAMA RAPAT", "NILAI", "KETERANGAN"],
        [
          "Total Guru Mapel",
          summary.total_guru_mapel,
          "Guru mapel aktif sesuai cakupan",
        ],
        [
          "Guru Mengisi Jurnal",
          summary.guru_mengisi,
          `${summary.persen_mengisi}% dari total guru`,
        ],
        [
          "Guru Tidak Mengisi",
          summary.guru_tidak_mengisi,
          `${summary.persen_tidak_mengisi}% dari total guru`,
        ],
        [
          "Status Lengkap",
          summary.guru_lengkap,
          `${summary.persen_lengkap}% dari total guru`,
        ],
        [
          "Status Sebagian Terlewat",
          summary.guru_sebagian,
          `${summary.persen_sebagian}% dari total guru`,
        ],
        [
          "Status Belum Mengisi",
          summary.guru_belum_isi,
          "Memiliki jadwal berjalan tanpa jurnal",
        ],
        [
          "Status Menunggu Jadwal",
          summary.guru_belum_jadwal,
          "Jadwal berada pada hari mendatang",
        ],
        [
          "Total Jurnal Masuk",
          summary.total_jurnal,
          "Entri jurnal mengajar tersimpan",
        ],
        [
          "Kepatuhan Sesi KBM",
          summary.persen_sesi !== null ? `${summary.persen_sesi}%` : "-",
          `${summary.sesi_terisi_elapsed}/${summary.total_sesi_jadwal_elapsed} sesi (${summary.sesi_terlewat} sesi terlewat)`,
        ],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
      ws1["!cols"] = [{ wch: 30 }, { wch: 24 }, { wch: 48 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Rapat");

      // Sheet 2: Rekap Guru Mapel
      const sheet2Data = report.teachers.map((t, idx) => ({
        No: idx + 1,
        "Nama Guru Mapel": t.nama_lengkap,
        Jabatan: t.jabatan || "-",
        Status: STATUS_META[t.status_kepatuhan].label,
        Jenjang: t.jenjang_list.join(", ") || "-",
        "Mapel Diampu":
          t.assigned_mapels
            .map((m) => `${m.mapel_nama} (${m.kelas_nama})`)
            .join("; ") || "-",
        "Total Jurnal Masuk": t.total_jurnal,
        "Sesi Terjadwal Berjalan": t.expected_sessions_elapsed,
        "Sesi Terisi": t.covered_sessions_elapsed,
        "Sesi Tidak Diisi": t.missed_sessions_elapsed,
        "Kepatuhan (%)":
          t.persen_kepatuhan_jadwal !== null
            ? t.persen_kepatuhan_jadwal
            : t.sudah_mengisi
              ? 100
              : 0,
        "Terakhir Isi Jurnal": t.last_jurnal_tanggal || "Belum pernah",
        "Rincian Slot Tidak Diisi":
          t.missed_blocks
            .map(
              (b) =>
                `${b.label_tanggal} | ${b.mapel_nama} (${b.kelas_nama}) | ${b.jam_detail} (${b.waktu_mulai}-${b.waktu_selesai})`,
            )
            .join(" ;; ") || "-",
      }));
      const ws2 = XLSX.utils.json_to_sheet(
        sheet2Data.length > 0
          ? sheet2Data
          : [{ Keterangan: "Tidak ada data guru mapel" }],
      );
      ws2["!cols"] = [
        { wch: 5 },
        { wch: 28 },
        { wch: 24 },
        { wch: 18 },
        { wch: 12 },
        { wch: 36 },
        { wch: 16 },
        { wch: 20 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 18 },
        { wch: 60 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, "Rekap Guru Mapel");

      // Sheet 3: Rincian Tidak Mengisi (Tanggal, Mapel, Jam ke)
      const sheet3Data = report.missed_details.map((m, idx) => ({
        No: idx + 1,
        Tanggal: m.tanggal,
        Hari: m.hari,
        "Tanggal Lengkap": m.label_tanggal,
        "Guru Mapel": m.guru_nama,
        Jabatan: m.jabatan || "-",
        Kelas: m.kelas_nama,
        Jenjang: m.jenjang,
        "Mata Pelajaran": m.mapel_nama,
        "Jam ke-": m.jam_detail,
        "Rentang Waktu": `${m.waktu_mulai} - ${m.waktu_selesai} WIB`,
        "Jumlah JP": m.jam_list.length,
        "Status Presensi": m.is_excused
          ? `${(m.presensi_status || "").toUpperCase()} (Berhalangan)`
          : m.presensi_status
            ? m.presensi_status.toUpperCase()
            : "Tanpa Keterangan",
        "Keterangan Presensi": m.presensi_keterangan || "-",
      }));
      const ws3 = XLSX.utils.json_to_sheet(
        sheet3Data.length > 0
          ? sheet3Data
          : [
              {
                Keterangan:
                  "Tidak ada sesi jadwal yang terlewat pada periode ini",
              },
            ],
      );
      ws3["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 10 },
        { wch: 24 },
        { wch: 28 },
        { wch: 22 },
        { wch: 10 },
        { wch: 10 },
        { wch: 24 },
        { wch: 16 },
        { wch: 18 },
        { wch: 10 },
        { wch: 22 },
        { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, "Rincian Tidak Mengisi");

      // Sheet 4: Matriks Harian
      const matrixData = report.teachers.map((t, idx) => {
        const row: Record<string, string | number> = {
          No: idx + 1,
          "Guru Mapel": t.nama_lengkap,
          Status: STATUS_META[t.status_kepatuhan].label,
        };
        for (const d of t.days) {
          const colHeader = `${d.hari_singkat} ${d.label_tanggal}`;
          const codeMap: Record<typeof d.day_status, string> = {
            terisi: `Terisi (${d.jurnal_entries.length})`,
            parsial: `Sebagian (${d.jurnal_entries.length})`,
            bolong: `Kosong (${d.scheduled_blocks.length} jadwal)`,
            izin_sakit: `${(d.presensi_status || "Izin/Sakit").toUpperCase()}`,
            menunggu: "Menunggu",
            libur: d.libur_nama || "Libur",
            tanpa_jadwal: "-",
          };
          row[colHeader] = codeMap[d.day_status];
        }
        return row;
      });
      const ws4 = XLSX.utils.json_to_sheet(
        matrixData.length > 0
          ? matrixData
          : [{ Keterangan: "Tidak ada data matriks harian" }],
      );
      XLSX.utils.book_append_sheet(wb, ws4, "Matriks Harian");

      // Sheet 5: Daftar Jurnal Terisi
      const sheet5Data: Record<string, string | number>[] = [];
      report.teachers.forEach((t) => {
        t.jurnal_list.forEach((j) => {
          sheet5Data.push({
            Tanggal: j.tanggal,
            "Guru Mapel": t.nama_lengkap,
            Kelas: j.kelas_nama,
            Jenjang: j.jenjang,
            "Mata Pelajaran": j.mapel_nama,
            "Jam ke-": j.jam_ke,
            Materi: j.materi,
            "Capaian Pembelajaran": j.learning_outcome || "-",
            Kegiatan: j.kegiatan,
          });
        });
      });
      sheet5Data.sort((a, b) =>
        String(b.Tanggal).localeCompare(String(a.Tanggal)),
      );
      const ws5 = XLSX.utils.json_to_sheet(
        sheet5Data.length > 0
          ? sheet5Data
          : [{ Keterangan: "Belum ada jurnal terisi di periode ini" }],
      );
      ws5["!cols"] = [
        { wch: 12 },
        { wch: 28 },
        { wch: 10 },
        { wch: 10 },
        { wch: 24 },
        { wch: 14 },
        { wch: 36 },
        { wch: 30 },
        { wch: 36 },
      ];
      XLSX.utils.book_append_sheet(wb, ws5, "Daftar Jurnal Terisi");

      const fileName = `Monitoring_Jurnal_Guru_${report.meta.start_date}_sd_${report.meta.end_date}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error("Gagal export Excel monitoring jurnal:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Export Excel",
        text: "Terjadi kesalahan saat membuat file Excel.",
        confirmButtonColor: "#550000",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* ══════════════════ SCREEN DASHBOARD (NON-PRINT) ══════════════════ */}
      <div className="print:hidden mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6">
        {/* Top Executive Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-[#550000] p-5 text-white shadow-xs md:p-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ddc192]/40 bg-[#ddc192]/15 px-3 py-0.5 text-[11px] font-semibold text-[#fdf8f0]">
                <ClipboardList size={12} className="text-[#ddc192]" />
                Rapat Evaluasi Kurikulum · {access.userTitle}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/95">
                <Calendar size={11} className="text-[#ddc192]" />
                {parityBadgeText}
              </span>
              {access.allowedJenjang !== "ALL" && (
                <span className="inline-flex rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#fdf8f0]">
                  Cakupan: Jenjang {access.allowedJenjang.join(", ")}
                </span>
              )}
            </div>

            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">
              Pantau Kepatuhan Jurnal Guru Mapel
            </h1>
            <p className="mt-1 text-sm text-[#fdf8f0]/85">
              Periode aktif:{" "}
              <strong className="text-white">{report.meta.period_label}</strong>
              {" · "}
              <span className="tabular-nums">
                {summary.school_days_elapsed}/{summary.school_days_total} hari
                KBM berjalan
              </span>
              {summary.holiday_days_count > 0 && (
                <>
                  {" "}
                  · {summary.holiday_days_count} hari libur kalender akademik
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPresentationMode((v) => !v)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 py-2 text-xs font-semibold transition-colors duration-150 ${
                presentationMode
                  ? "border-[#ddc192] bg-[#ddc192] text-[#380000]"
                  : "border-white/25 bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Fokuskan tampilan untuk proyektor rapat kurikulum"
            >
              <Monitor size={14} />
              <span>
                {presentationMode ? "Keluar Mode Rapat" : "Mode Rapat"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyMeetingWA}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-emerald-400/40 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-emerald-800"
            >
              <MessageSquare size={14} />
              <span>Salin Rekap WA</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#ddc192]/50 bg-[#380000] px-3 py-2 text-xs font-semibold text-[#fdf8f0] transition-colors duration-150 hover:bg-[#2a0000] disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={14} className="text-[#ddc192]" />
              )}
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#ddc192] bg-white px-3 py-2 text-xs font-bold text-[#550000] transition-colors duration-150 hover:bg-[#fcfaf8]"
            >
              <Printer size={14} />
              <span>Cetak A4</span>
            </button>

            {!presentationMode && (
              <>
                <Link
                  href="/kurikulum/jadwal"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-white/20"
                >
                  <CalendarDays size={14} />
                  <span>Jadwal KBM</span>
                </Link>
                <Link
                  href="/jurnal"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-white/20"
                >
                  <BookMarked size={14} />
                  <span>Daftar Jurnal</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3.5 rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#f0ece4] pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#44403c]">
                <Filter size={13} className="text-[#550000]" />
                Rentang Cepat:
              </span>
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePresetClick(opt.id)}
                  className={`cursor-pointer rounded-[8px] border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                    preset === opt.id
                      ? "border-[#550000] bg-[#550000] text-white"
                      : "border-[#e7e2da] bg-[#fcfaf8] text-[#44403c] hover:bg-[#faf6ee]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {preset === "kustom" && (
                <span className="rounded-[8px] border border-[#ddc192] bg-[#fdf8f0] px-2.5 py-1 text-xs font-semibold text-[#550000]">
                  Rentang Kustom
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualReset}
                className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#44403c] hover:bg-[#f6f1e8]"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  fetchReport({
                    start: startDate,
                    end: endDate,
                    jenjang: jenjangFilter,
                    kelas: kelasFilter,
                    pekan: tipePekan,
                    unassigned: includeUnassigned,
                  })
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#550000] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#380000] disabled:opacity-60"
              >
                <RefreshCw
                  size={12}
                  className={loading ? "animate-spin" : ""}
                />
                <span>{loading ? "Menyinkronkan..." : "Segarkan"}</span>
              </button>
            </div>
          </div>

          {/* Detailed Controls */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label
                htmlFor="monitoring-start-date"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Dari Tanggal
              </label>
              <input
                id="monitoring-start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="monitoring-end-date"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Sampai Tanggal
              </label>
              <input
                id="monitoring-end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="monitoring-jenjang"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Jenjang
              </label>
              <select
                id="monitoring-jenjang"
                value={jenjangFilter}
                onChange={(e) => handleJenjangChange(e.target.value)}
                disabled={
                  access.allowedJenjang !== "ALL" &&
                  access.allowedJenjang.length <= 1
                }
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000] disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {access.allowedJenjang === "ALL" && (
                  <option value="ALL">Semua Jenjang</option>
                )}
                {(access.allowedJenjang === "ALL"
                  ? ["MTs", "IL", "MA"]
                  : access.allowedJenjang
                ).map((j) => (
                  <option key={j} value={j}>
                    {j === "MTs"
                      ? "MTs (Tsanawiyah)"
                      : j === "IL"
                        ? "IL (I'dad Lughowy)"
                        : "MA (Aliyah)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="monitoring-kelas"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Kelas
              </label>
              <select
                id="monitoring-kelas"
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000]"
              >
                <option value="ALL">Semua Kelas</option>
                {kelasOptionsFiltered.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="monitoring-pekan"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Pola Jadwal Pekan
              </label>
              <select
                id="monitoring-pekan"
                value={tipePekan}
                onChange={(e) =>
                  setTipePekan(e.target.value as TipePekanFilter)
                }
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000]"
              >
                <option value="otomatis">Otomatis (Sesuai Tanggal)</option>
                <option value="semua">Semua Pekan (Ganjil+Genap)</option>
                <option value="ganjil">Pekan Ganjil (1 / 3)</option>
                <option value="genap">Pekan Genap (2 / 4)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="monitoring-search"
                className="mb-1 block text-xs font-semibold text-[#44403c]"
              >
                Cari Guru / Mapel / Kelas / Tgl
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#78716c]"
                />
                <input
                  id="monitoring-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama, mapel, jam..."
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] py-2 pr-8 pl-8 text-xs text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-[#78716c] hover:text-[#1a1a1a]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {(summary.unassigned_guru_count > 0 || includeUnassigned) && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ece4] pt-2.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#44403c]">
                <input
                  type="checkbox"
                  checked={includeUnassigned}
                  onChange={(e) => setIncludeUnassigned(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e7e2da] accent-[#550000]"
                />
                <span>
                  Tampilkan akun guru/asatidz tanpa plot mapel &amp; jadwal (
                  {summary.unassigned_guru_count} pegawai)
                </span>
              </label>
              <span className="text-[11px] text-[#78716c]">
                Secara default hanya guru yang memiliki plot mapel / jadwal KBM
                yang dihitung dalam persentase kepatuhan.
              </span>
            </div>
          )}
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Executive Visual Analytics Grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: Donut Percentage & Key Headcounts */}
          <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs lg:col-span-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a]">
                  Persentase Pengisian Jurnal Guru Mapel
                </h2>
                <p className="text-xs text-[#44403c]">
                  Proporsi guru yang mengisi vs tidak mengisi pada periode ini
                </p>
              </div>
              {loading && (
                <Loader2 size={16} className="animate-spin text-[#550000]" />
              )}
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row">
              {/* SVG Donut Chart */}
              <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                <svg
                  viewBox="0 0 144 144"
                  className="h-full w-full -rotate-90"
                  role="img"
                  aria-label={`Persentase mengisi ${summary.persen_mengisi}% dan tidak mengisi ${summary.persen_tidak_mengisi}%`}
                >
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="#f0ece4"
                    strokeWidth="16"
                  />
                  {summary.total_guru_mapel > 0 && notFillingStroke > 0 && (
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="16"
                      strokeDasharray={`${notFillingStroke} ${circumference}`}
                      strokeDashoffset={-fillingStroke}
                    />
                  )}
                  {summary.total_guru_mapel > 0 && fillingStroke > 0 && (
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="16"
                      strokeDasharray={`${fillingStroke} ${circumference}`}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tabular-nums tracking-[-0.02em] text-[#1a1a1a]">
                    {summary.persen_mengisi}%
                  </span>
                  <span className="text-[11px] font-semibold text-[#44403c]">
                    Mengisi
                  </span>
                  <span className="text-[10px] tabular-nums text-[#78716c]">
                    {summary.guru_mengisi}/{summary.total_guru_mapel} guru
                  </span>
                </div>
              </div>

              {/* Dual Stat Comparison */}
              <div className="flex w-full flex-1 flex-col gap-2.5">
                <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <UserCheck size={14} className="text-emerald-700" />
                      Guru Mengisi
                    </span>
                    <span className="text-lg font-bold tabular-nums text-emerald-800">
                      {summary.persen_mengisi}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-emerald-800/85">
                    {summary.guru_mengisi} dari {summary.total_guru_mapel} guru
                    mapel
                  </div>
                </div>

                <div className="rounded-[10px] border border-rose-200 bg-rose-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                      <UserX size={14} className="text-rose-700" />
                      Guru Tidak Mengisi
                    </span>
                    <span className="text-lg font-bold tabular-nums text-rose-800">
                      {summary.persen_tidak_mengisi}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-rose-800/85">
                    {summary.guru_tidak_mengisi} dari {summary.total_guru_mapel}{" "}
                    guru mapel
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 3 mini metrics */}
            <div className="grid grid-cols-3 gap-2.5 border-t border-[#f0ece4] pt-3.5">
              <div className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-2.5">
                <div className="text-[11px] font-medium text-[#44403c]">
                  Total Jurnal
                </div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-[#550000]">
                  {summary.total_jurnal}
                </div>
                <div className="text-[10px] text-[#78716c]">
                  entri tersimpan
                </div>
              </div>

              <div className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-2.5">
                <div className="text-[11px] font-medium text-[#44403c]">
                  Sesi KBM Terisi
                </div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-[#1a1a1a]">
                  {summary.persen_sesi !== null
                    ? `${summary.persen_sesi}%`
                    : "-"}
                </div>
                <div className="text-[10px] tabular-nums text-[#78716c]">
                  {summary.sesi_terisi_elapsed}/
                  {summary.total_sesi_jadwal_elapsed} sesi
                </div>
              </div>

              <div className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-2.5">
                <div className="text-[11px] font-medium text-[#44403c]">
                  Sesi Terlewat
                </div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-rose-700">
                  {summary.sesi_terlewat}
                </div>
                <div className="text-[10px] text-[#78716c]">
                  slot belum diisi
                </div>
              </div>
            </div>
          </div>

          {/* Right: Compliance Breakdown, Daily Chart & Jenjang Strip */}
          <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs lg:col-span-7">
            {/* Status Breakdown Stacked Bar + Filter Chips */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[#1a1a1a]">
                  Sebaran Kepatuhan &amp; Tren Harian KBM
                </h2>
                <span className="text-xs font-medium text-[#78716c]">
                  Klik kartu status untuk menyaring daftar
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-[#f0ece4]">
                {summary.total_guru_mapel > 0 && (
                  <>
                    <div
                      style={{
                        width: `${(summary.guru_lengkap / summary.total_guru_mapel) * 100}%`,
                      }}
                      className="bg-emerald-600 transition-all duration-150"
                      title={`Lengkap Mengisi: ${summary.guru_lengkap} guru`}
                    />
                    <div
                      style={{
                        width: `${(summary.guru_sebagian / summary.total_guru_mapel) * 100}%`,
                      }}
                      className="bg-amber-500 transition-all duration-150"
                      title={`Sebagian Terlewat: ${summary.guru_sebagian} guru`}
                    />
                    <div
                      style={{
                        width: `${(summary.guru_belum_isi / summary.total_guru_mapel) * 100}%`,
                      }}
                      className="bg-rose-600 transition-all duration-150"
                      title={`Belum Mengisi: ${summary.guru_belum_isi} guru`}
                    />
                    <div
                      style={{
                        width: `${(summary.guru_belum_jadwal / summary.total_guru_mapel) * 100}%`,
                      }}
                      className="bg-slate-400 transition-all duration-150"
                      title={`Menunggu Jadwal: ${summary.guru_belum_jadwal} guru`}
                    />
                  </>
                )}
              </div>

              {/* Clickable Filter Pills */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors duration-150 ${
                    statusFilter === "ALL"
                      ? "border-[#550000] bg-[#fdf5f5]"
                      : "border-[#e7e2da] bg-[#fcfaf8] hover:border-[#b89758]"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-[#44403c]">
                    Semua Guru
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-[#1a1a1a]">
                    {summary.total_guru_mapel}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter((s) =>
                      s === "belum_isi" ? "ALL" : "belum_isi",
                    )
                  }
                  className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors duration-150 ${
                    statusFilter === "belum_isi"
                      ? "border-rose-500 bg-rose-50"
                      : "border-[#e7e2da] bg-[#fcfaf8] hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-600" />
                    Belum Isi
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-rose-800">
                    {summary.guru_belum_isi}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter((s) =>
                      s === "sebagian" ? "ALL" : "sebagian",
                    )
                  }
                  className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors duration-150 ${
                    statusFilter === "sebagian"
                      ? "border-amber-500 bg-amber-50"
                      : "border-[#e7e2da] bg-[#fcfaf8] hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Sebagian
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-amber-900">
                    {summary.guru_sebagian}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter((s) =>
                      s === "lengkap" ? "ALL" : "lengkap",
                    )
                  }
                  className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors duration-150 ${
                    statusFilter === "lengkap"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-[#e7e2da] bg-[#fcfaf8] hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Lengkap
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-emerald-800">
                    {summary.guru_lengkap}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter((s) =>
                      s === "belum_jadwal" ? "ALL" : "belum_jadwal",
                    )
                  }
                  className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors duration-150 ${
                    statusFilter === "belum_jadwal"
                      ? "border-slate-500 bg-slate-100"
                      : "border-[#e7e2da] bg-[#fcfaf8] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Menunggu
                  </div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-slate-700">
                    {summary.guru_belum_jadwal}
                  </div>
                </button>
              </div>
            </div>

            {/* Daily Compliance Bar Chart */}
            <div className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a1a1a]">
                  <BarChart3 size={14} className="text-[#550000]" />
                  Grafik Kepatuhan Pengisian per Hari
                </span>
                <span className="text-[11px] text-[#78716c]">
                  {report.daily_stats.length} hari dalam periode
                </span>
              </div>

              {report.daily_stats.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#78716c]">
                  Tidak ada rentang hari terpilih.
                </div>
              ) : (
                <div className="custom-scrollbar flex items-end gap-2 overflow-x-auto pb-1">
                  {report.daily_stats.map((d) => {
                    const barHeightPct = d.is_holiday
                      ? 12
                      : Math.max(8, Math.round(d.persen_kepatuhan_hari));
                    const barColor = d.is_holiday
                      ? "bg-slate-200"
                      : d.is_future
                        ? "bg-slate-300"
                        : d.persen_kepatuhan_hari >= 80
                          ? "bg-emerald-600"
                          : d.persen_kepatuhan_hari >= 40
                            ? "bg-amber-500"
                            : "bg-rose-600";
                    const tooltipText = d.is_holiday
                      ? `${d.hari}, ${d.label_tanggal}: ${d.libur_nama || "Libur"}`
                      : `${d.hari}, ${d.label_tanggal}: ${d.guru_mengisi_count}/${d.guru_seharusnya_count} guru (${d.persen_kepatuhan_hari}%), ${d.total_jurnal} jurnal.${d.guru_bolong_names.length > 0 ? ` Belum isi: ${d.guru_bolong_names.join(", ")}` : ""}`;

                    return (
                      <div
                        key={d.tanggal}
                        title={tooltipText}
                        className="flex min-w-[44px] flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-[10px] font-semibold tabular-nums text-[#44403c]">
                          {d.is_holiday
                            ? "Libur"
                            : d.is_future
                              ? "-"
                              : `${d.persen_kepatuhan_hari}%`}
                        </span>
                        <div className="flex h-20 w-full max-w-[34px] items-end rounded-[6px] bg-white p-0.5 ring-1 ring-[#e7e2da]">
                          <div
                            style={{ height: `${barHeightPct}%` }}
                            className={`w-full rounded-[4px] transition-all duration-150 ${barColor}`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-[#1a1a1a]">
                          {d.hari_singkat}
                        </span>
                        <span className="text-[9px] tabular-nums text-[#78716c]">
                          {d.label_tanggal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Jenjang Breakdown Strip */}
            {report.jenjang_stats.length > 0 && (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {report.jenjang_stats.map((js) => {
                  const isActiveJenjang = jenjangFilter === js.jenjang;
                  return (
                    <button
                      key={js.jenjang}
                      type="button"
                      onClick={() => {
                        if (access.allowedJenjang !== "ALL") return;
                        handleJenjangChange(
                          isActiveJenjang ? "ALL" : js.jenjang,
                        );
                      }}
                      className={`rounded-[10px] border p-3 text-left transition-colors duration-150 ${
                        access.allowedJenjang === "ALL" ? "cursor-pointer" : ""
                      } ${
                        isActiveJenjang
                          ? "border-[#550000] bg-[#fdf5f5]"
                          : "border-[#e7e2da] bg-[#fcfaf8] hover:border-[#b89758]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#550000]">
                          Jenjang {js.jenjang}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-[#1a1a1a]">
                          {js.persen_mengisi}% isi
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-rose-200">
                        <div
                          style={{ width: `${js.persen_mengisi}%` }}
                          className="bg-emerald-600"
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-[#44403c]">
                        <span>
                          {js.guru_mengisi}/{js.total_guru} guru
                        </span>
                        <span>{js.total_jurnal} jurnal</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Basis Evaluasi & Synchronization Transparency Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e7e2da] bg-[#faf6ee] px-4 py-3 text-xs text-[#44403c]">
          <div className="flex items-start gap-2.5">
            <Info size={15} className="mt-0.5 shrink-0 text-[#550000]" />
            <div>
              {summary.evaluation_basis === "jadwal" ? (
                <span>
                  <strong className="text-[#1a1a1a]">
                    Sinkronisasi Penuh Aktif:
                  </strong>{" "}
                  Seluruh guru mapel dievaluasi langsung terhadap jadwal KBM
                  resmi, kalender hari libur akademik, dan presensi asatidz
                  secara realtime.
                </span>
              ) : summary.evaluation_basis === "campuran" ? (
                <span>
                  <strong className="text-[#1a1a1a]">
                    Evaluasi Campuran (Jadwal + Penugasan Mapel):
                  </strong>{" "}
                  Guru yang sudah diplot di Jadwal Pelajaran dicek per sesi jam
                  &amp; tanggal; guru yang belum terplot di jadwal tetap
                  dipantau melalui daftar penugasan mapelnya.
                </span>
              ) : (
                <span>
                  <strong className="text-[#1a1a1a]">
                    Basis Penugasan Mapel:
                  </strong>{" "}
                  Belum ada jadwal KBM terisi untuk filter ini. Lengkapi plot
                  jadwal di menu{" "}
                  <Link
                    href="/kurikulum/jadwal"
                    className="font-semibold text-[#550000] underline"
                  >
                    Kelola Jadwal KBM
                  </Link>{" "}
                  agar pelacakan sesi jam ke- dapat berjalan lebih presisi.
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#78716c]">
            Total terdeteksi: {report.missed_details.length} sesi terlewat
          </span>
        </div>

        {/* Priority Attention Strip ("Perlu Perhatian Rapat") */}
        <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600" />
              <h2 className="text-base font-semibold text-[#1a1a1a]">
                Daftar Prioritas Rapat: Guru Belum / Sebagian Mengisi Jurnal (
                {priorityTeachers.length})
              </h2>
            </div>
            {report.missed_details.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("missed")}
                className="cursor-pointer text-xs font-semibold text-[#550000] underline"
              >
                Lihat seluruh {report.missed_details.length} rincian jadwal
                tidak diisi
              </button>
            )}
          </div>

          {priorityTeachers.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-[10px] border border-emerald-200 bg-emerald-50/70 px-4 py-3.5 text-sm text-emerald-900">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-700" />
              <span>
                Seluruh guru mapel yang jadwalnya sudah berjalan telah mengisi
                jurnal secara lengkap pada periode {report.meta.period_label}.
              </span>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {priorityTeachers.map((t) => {
                const st = STATUS_META[t.status_kepatuhan];
                return (
                  <div
                    key={t.pegawai_id}
                    className="flex flex-col justify-between gap-3 rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] p-3.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[#1a1a1a]">
                            {t.nama_lengkap}
                          </div>
                          <div className="truncate text-[11px] text-[#78716c]">
                            {t.jabatan || "Guru Mapel"}
                          </div>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                          />
                          {st.shortLabel}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs tabular-nums">
                        <span className="font-bold text-[#550000]">
                          {t.persen_kepatuhan_jadwal !== null
                            ? `${t.persen_kepatuhan_jadwal}% patuh`
                            : "0 jurnal"}
                        </span>
                        <span className="text-[#78716c]">·</span>
                        <span className="text-[#44403c]">
                          {t.has_schedule
                            ? `${t.missed_sessions_elapsed} sesi tidak diisi`
                            : `${t.assigned_mapels.length} mapel diampu`}
                        </span>
                      </div>

                      {/* Exact Missed Details inline (Tanggal · Mapel · Kelas · Jam ke-) */}
                      {t.missed_blocks.length > 0 ? (
                        <div className="mt-2.5 space-y-1.5">
                          {t.missed_blocks.slice(0, 3).map((b) => (
                            <div
                              key={b.block_id}
                              className="flex items-center justify-between gap-2 rounded-[8px] border border-[#f0ece4] bg-white px-2.5 py-1.5 text-[11px]"
                            >
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-[#1a1a1a]">
                                  {b.mapel_nama}{" "}
                                  <span className="font-bold text-[#550000]">
                                    ({b.kelas_nama})
                                  </span>
                                </div>
                                <div className="truncate tabular-nums text-[#44403c]">
                                  {b.hari_singkat},{" "}
                                  {
                                    formatTanggalLongID(b.tanggal).split(
                                      ", ",
                                    )[1]
                                  }{" "}
                                  · <strong>{b.jam_detail}</strong> (
                                  {b.waktu_mulai}–{b.waktu_selesai})
                                </div>
                              </div>
                              {b.is_excused && (
                                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                                  {b.presensi_status}
                                </span>
                              )}
                            </div>
                          ))}
                          {t.missed_blocks.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherId(t.pegawai_id)}
                              className="cursor-pointer text-[11px] font-semibold text-[#550000] hover:underline"
                            >
                              + {t.missed_blocks.length - 3} sesi terlewat
                              lainnya
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {t.assigned_mapels.slice(0, 3).map((am) => (
                            <span
                              key={`${am.jenjang}-${am.kelas_nama}-${am.standard_mapel}`}
                              className="rounded border border-[#e7e2da] bg-white px-2 py-0.5 text-[11px] text-[#44403c]"
                            >
                              {am.kelas_nama} · {am.mapel_nama}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#f0ece4] pt-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherId(t.pegawai_id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
                      >
                        <Eye size={12} /> Detail Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectWA(t)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        <MessageSquare size={12} /> Ingatkan WA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Tabs Container */}
        <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white shadow-xs">
          {/* Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e2da] bg-[#faf6ee] px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("missed")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                  activeTab === "missed"
                    ? "bg-[#550000] text-white"
                    : "border border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
                }`}
              >
                <Clock size={14} />
                <span>Rincian Tidak Diisi ({filteredMissed.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("teachers")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                  activeTab === "teachers"
                    ? "bg-[#550000] text-white"
                    : "border border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
                }`}
              >
                <Users size={14} />
                <span>Rekapitulasi per Guru ({filteredTeachers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                  activeTab === "matrix"
                    ? "bg-[#550000] text-white"
                    : "border border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
                }`}
              >
                <LayoutGrid size={14} />
                <span>Matriks Harian ({report.days_calendar.length} Hari)</span>
              </button>
            </div>

            {activeTab === "missed" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL" as const, label: "Semua Sesi Terlewat" },
                  {
                    id: "unexcused" as const,
                    label: "Tanpa Keterangan / Hadir",
                  },
                  {
                    id: "belum_isi_only" as const,
                    label: "Belum Isi Sama Sekali",
                  },
                ].map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => setMissedSubFilter(sf.id)}
                    className={`cursor-pointer rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
                      missedSubFilter === sf.id
                        ? "border-[#550000] bg-[#fdf5f5] text-[#550000]"
                        : "border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "teachers" && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-medium text-[#44403c]">Urutkan:</span>
                {(
                  [
                    { key: "prioritas", label: "Prioritas" },
                    { key: "kepatuhan", label: "% Patuh" },
                    { key: "terlewat", label: "Terlewat" },
                    { key: "jurnal", label: "Jurnal" },
                    { key: "nama", label: "Nama" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSort(item.key)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold ${
                      sortKey === item.key
                        ? "border-[#550000] bg-[#fdf5f5] text-[#550000]"
                        : "border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {sortKey === item.key && <ArrowUpDown size={11} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: RINCIAN JADWAL TIDAK DIISI */}
          {activeTab === "missed" && (
            <div>
              {filteredMissed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                  <div className="text-base font-semibold text-[#1a1a1a]">
                    {report.missed_details.length === 0
                      ? "Tidak ada jadwal mengajar yang terlewat pada periode ini"
                      : "Tidak ada rincian terlewat yang cocok dengan filter aktif"}
                  </div>
                  <p className="max-w-lg text-xs text-[#44403c]">
                    {summary.guru_belum_isi > 0 && !summary.has_any_schedule
                      ? "Terdapat guru tanpa plot jadwal KBM terstruktur; periksa tab Rekapitulasi per Guru untuk melihat daftar mapel yang diampu."
                      : "Semua sesi terjadwal yang sudah berjalan telah terisi jurnal atau dikecualikan."}
                  </p>
                </div>
              ) : (
                <div className="custom-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e7e2da] bg-[#fcfaf8] text-[#1a1a1a]">
                        <th className="px-3.5 py-2.5 font-semibold">No</th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Hari &amp; Tanggal
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Guru Mapel
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Kelas &amp; Jenjang
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Mata Pelajaran
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Jam ke- &amp; Waktu
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Presensi
                        </th>
                        <th className="px-3.5 py-2.5 text-right font-semibold">
                          Tindakan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMissed.map((m, idx) => {
                        const teacherObj = report.teachers.find(
                          (t) => t.pegawai_id === m.pegawai_id,
                        );
                        const fillHref = `/jurnal/tambah?pegawai_id=${encodeURIComponent(
                          m.pegawai_id,
                        )}&kelas_id=${encodeURIComponent(
                          m.kelas_id,
                        )}&kelas_nama=${encodeURIComponent(
                          m.kelas_nama,
                        )}&mapel_id=${encodeURIComponent(
                          m.mapel_id,
                        )}&mapel_nama=${encodeURIComponent(
                          m.mapel_nama,
                        )}&tanggal=${encodeURIComponent(
                          m.tanggal,
                        )}&jam_ke=${encodeURIComponent(m.jam_list.join(","))}`;

                        return (
                          <tr
                            key={m.block_id}
                            className="border-b border-[#f0ece4] transition-colors duration-150 hover:bg-[#faf6ee]"
                          >
                            <td className="px-3.5 py-2.5 tabular-nums text-[#78716c]">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <div className="font-semibold text-[#1a1a1a]">
                                {m.label_tanggal}
                              </div>
                              <div className="text-[11px] tabular-nums text-[#78716c]">
                                {m.tanggal}
                                {m.tipe_pekan !== "semua" &&
                                  ` · Pekan ${m.tipe_pekan}`}
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTeacherId(m.pegawai_id)
                                }
                                className="cursor-pointer text-left font-semibold text-[#550000] hover:underline"
                              >
                                {m.guru_nama}
                              </button>
                              <div className="text-[11px] text-[#78716c]">
                                {m.jabatan || "Guru Mapel"}
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span className="mr-1 rounded-[8px] bg-[#550000] px-2 py-0.5 text-[11px] font-semibold text-white">
                                {m.kelas_nama}
                              </span>
                              <span className="rounded-[8px] border border-[#e7e2da] bg-[#fcfaf8] px-1.5 py-0.5 text-[11px] font-medium text-[#44403c]">
                                {m.jenjang}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 font-semibold text-[#1a1a1a]">
                              {m.mapel_nama}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums">
                              <div className="font-bold text-[#550000]">
                                {m.jam_detail}{" "}
                                <span className="font-normal text-[#78716c]">
                                  ({m.jam_list.length} JP)
                                </span>
                              </div>
                              <div className="text-[11px] text-[#44403c]">
                                {m.waktu_mulai}–{m.waktu_selesai} WIB
                              </div>
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {m.is_excused ? (
                                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
                                  {m.presensi_status}
                                </span>
                              ) : m.presensi_status === "hadir" ||
                                m.presensi_status === "telat" ? (
                                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                                  Hadir (Belum Isi)
                                </span>
                              ) : m.presensi_status === "alpha" ? (
                                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                                  Alpha
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                  Belum Absen / Kosong
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={fillHref}
                                  className="inline-flex items-center gap-1 rounded-[8px] bg-[#550000] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#380000]"
                                >
                                  <BookMarked size={11} /> Isi Jurnal
                                </Link>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTeacherId(m.pegawai_id)
                                  }
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
                                >
                                  Detail
                                </button>
                                {teacherObj && (
                                  <button
                                    type="button"
                                    onClick={() => handleDirectWA(teacherObj)}
                                    title="Kirim pengingat WhatsApp"
                                    className="inline-flex cursor-pointer items-center rounded-[8px] border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <MessageSquare size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REKAPITULASI PER GURU */}
          {activeTab === "teachers" && (
            <div>
              {filteredTeachers.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-[#44403c]">
                  Tidak ada data guru mapel yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div className="custom-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e7e2da] bg-[#fcfaf8] text-[#1a1a1a]">
                        <th className="px-3.5 py-2.5 font-semibold">
                          Guru Mapel
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">Status</th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Kepatuhan Jadwal
                        </th>
                        <th className="px-3.5 py-2.5 text-right font-semibold">
                          Jurnal
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Rincian Slot Tidak Diisi (Tgl · Mapel · Jam)
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Terakhir Isi
                        </th>
                        <th className="px-3.5 py-2.5 text-right font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeachers.map((t) => {
                        const st = STATUS_META[t.status_kepatuhan];
                        const pct =
                          t.persen_kepatuhan_jadwal !== null
                            ? t.persen_kepatuhan_jadwal
                            : t.sudah_mengisi
                              ? 100
                              : 0;

                        return (
                          <tr
                            key={t.pegawai_id}
                            className="border-b border-[#f0ece4] transition-colors duration-150 hover:bg-[#faf6ee]"
                          >
                            <td className="px-3.5 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTeacherId(t.pegawai_id)
                                }
                                className="cursor-pointer text-left font-semibold text-[#1a1a1a] hover:text-[#550000] hover:underline"
                              >
                                {t.nama_lengkap}
                              </button>
                              <div className="text-[11px] text-[#78716c]">
                                {t.jabatan || "Guru Mapel"}
                                {t.jenjang_list.length > 0 &&
                                  ` · ${t.jenjang_list.join("/")}`}
                              </div>
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.badgeClass}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                                />
                                {st.label}
                              </span>
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 overflow-hidden rounded-full bg-[#f0ece4]">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`h-full ${
                                      pct >= 80
                                        ? "bg-emerald-600"
                                        : pct > 0
                                          ? "bg-amber-500"
                                          : "bg-rose-600"
                                    }`}
                                  />
                                </div>
                                <span className="font-bold tabular-nums text-[#1a1a1a]">
                                  {t.persen_kepatuhan_jadwal !== null
                                    ? `${t.persen_kepatuhan_jadwal}%`
                                    : t.sudah_mengisi
                                      ? "100%"
                                      : "0%"}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[11px] tabular-nums text-[#78716c]">
                                {t.has_schedule
                                  ? `${t.covered_sessions_elapsed}/${t.expected_sessions_elapsed} sesi KBM`
                                  : `${t.covered_mapels_count}/${t.assigned_mapels_count} mapel`}
                              </div>
                            </td>

                            <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-[#550000]">
                              {t.total_jurnal}
                            </td>

                            <td className="max-w-[340px] px-3.5 py-2.5">
                              {t.missed_blocks.length > 0 ? (
                                <div className="space-y-1 text-[11px]">
                                  {t.missed_blocks.slice(0, 2).map((b) => (
                                    <div
                                      key={b.block_id}
                                      className="rounded border border-[#f0ece4] bg-[#fcfaf8] px-2 py-1 text-[#1a1a1a]"
                                    >
                                      <span className="font-semibold text-[#550000]">
                                        {b.hari_singkat},{" "}
                                        {
                                          formatTanggalLongID(b.tanggal).split(
                                            ", ",
                                          )[1]
                                        }
                                      </span>{" "}
                                      · {b.mapel_nama} ({b.kelas_nama}) ·{" "}
                                      <strong className="tabular-nums">
                                        {b.jam_label}
                                      </strong>
                                    </div>
                                  ))}
                                  {t.missed_blocks.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedTeacherId(t.pegawai_id)
                                      }
                                      className="cursor-pointer font-semibold text-[#550000] hover:underline"
                                    >
                                      Lihat +{t.missed_blocks.length - 2} sesi
                                      lainnya
                                    </button>
                                  )}
                                </div>
                              ) : t.status_kepatuhan === "belum_isi" ? (
                                <span className="text-[11px] text-rose-700">
                                  Belum mengisi untuk:{" "}
                                  {t.assigned_mapels
                                    .slice(0, 3)
                                    .map(
                                      (m) =>
                                        `${m.mapel_nama} (${m.kelas_nama})`,
                                    )
                                    .join(", ") || "mapel diampu"}
                                </span>
                              ) : t.status_kepatuhan === "belum_jadwal" ? (
                                <span className="text-[11px] text-slate-600">
                                  Jadwal minggu/hari mendatang
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-emerald-700">
                                  Terisi lengkap
                                </span>
                              )}
                            </td>

                            <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-[#44403c]">
                              {t.last_jurnal_tanggal ? (
                                <>
                                  <div className="font-medium tabular-nums text-[#1a1a1a]">
                                    {t.last_jurnal_tanggal}
                                  </div>
                                  <div className="text-[11px] text-[#78716c]">
                                    {t.last_jurnal_hari_lalu === 0
                                      ? "Hari ini"
                                      : `${t.last_jurnal_hari_lalu} hari lalu`}
                                  </div>
                                </>
                              ) : (
                                <span className="text-rose-600">
                                  Belum pernah
                                </span>
                              )}
                            </td>

                            <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTeacherId(t.pegawai_id)
                                  }
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
                                >
                                  <Eye size={11} /> Detail
                                </button>
                                {(t.status_kepatuhan === "belum_isi" ||
                                  t.status_kepatuhan === "sebagian") && (
                                  <button
                                    type="button"
                                    onClick={() => handleDirectWA(t)}
                                    title="Kirim pengingat WhatsApp"
                                    className="inline-flex cursor-pointer items-center rounded-[8px] bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                                  >
                                    <MessageSquare size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MATRIKS HARIAN */}
          {activeTab === "matrix" && (
            <div>
              {filteredTeachers.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-[#44403c]">
                  Tidak ada data guru mapel untuk ditampilkan pada matriks.
                </div>
              ) : (
                <>
                  {report.days_calendar.length > 31 && (
                    <div className="border-b border-[#f0ece4] bg-[#fcfaf8] px-4 py-2 text-xs text-[#44403c]">
                      Menampilkan 31 hari pertama dari{" "}
                      {report.days_calendar.length} hari rentang. Gunakan Export
                      Excel untuk melihat matriks penuh seluruh hari.
                    </div>
                  )}
                  <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[780px] border-collapse text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-[#e7e2da] bg-[#fcfaf8] text-[#1a1a1a]">
                          <th className="sticky left-0 z-20 border-r border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2.5 font-semibold">
                            Guru Mapel
                          </th>
                          {report.days_calendar.slice(0, 31).map((cal) => (
                            <th
                              key={cal.tanggal}
                              className={`min-w-[82px] px-2 py-2.5 text-center font-semibold ${
                                cal.is_holiday
                                  ? "bg-slate-100 text-slate-500"
                                  : ""
                              }`}
                            >
                              <div>{cal.hari_singkat}</div>
                              <div className="text-[10px] font-normal tabular-nums text-[#78716c]">
                                {cal.label_tanggal}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((t) => (
                          <tr
                            key={t.pegawai_id}
                            className="border-b border-[#f0ece4] hover:bg-[#faf6ee]"
                          >
                            <td className="sticky left-0 z-10 border-r border-[#e7e2da] bg-white px-3.5 py-2.5 font-semibold text-[#1a1a1a]">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTeacherId(t.pegawai_id)
                                }
                                className="cursor-pointer text-left hover:text-[#550000] hover:underline"
                              >
                                {t.nama_lengkap}
                              </button>
                            </td>
                            {t.days.slice(0, 31).map((d) => {
                              const cellMap: Record<
                                typeof d.day_status,
                                { label: string; cls: string }
                              > = {
                                terisi: {
                                  label:
                                    d.scheduled_blocks.length > 0
                                      ? `${d.scheduled_blocks.filter((b) => b.is_covered).length}/${d.scheduled_blocks.length}`
                                      : `${d.jurnal_entries.length} entri`,
                                  cls: "bg-emerald-100 text-emerald-800",
                                },
                                parsial: {
                                  label: `${d.scheduled_blocks.filter((b) => b.is_covered).length}/${d.scheduled_blocks.length}`,
                                  cls: "bg-amber-100 text-amber-800",
                                },
                                bolong: {
                                  label: `0/${d.scheduled_blocks.length}`,
                                  cls: "bg-rose-100 text-rose-800 font-bold",
                                },
                                izin_sakit: {
                                  label: (
                                    d.presensi_status || "Izin"
                                  ).toUpperCase(),
                                  cls: "bg-amber-50 text-amber-700",
                                },
                                menunggu: {
                                  label: "Jadwal",
                                  cls: "bg-slate-100 text-slate-500",
                                },
                                libur: {
                                  label: "Libur",
                                  cls: "bg-slate-100 text-slate-400",
                                },
                                tanpa_jadwal: {
                                  label: "-",
                                  cls: "text-[#78716c]",
                                },
                              };
                              const c = cellMap[d.day_status];
                              return (
                                <td
                                  key={d.tanggal}
                                  className="px-1.5 py-2 text-center whitespace-nowrap"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedTeacherId(t.pegawai_id)
                                    }
                                    className={`inline-block cursor-pointer rounded-[6px] px-2 py-0.5 text-[11px] tabular-nums font-medium ${c.cls}`}
                                    title={`${t.nama_lengkap} · ${d.hari}, ${d.label_tanggal}`}
                                  >
                                    {c.label}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════ PRINTABLE A4 REPORT (NO <header>/<footer> TAGS!) ══════════════════ */}
      <div className="hidden print:block p-4 text-black">
        {/* Kop Surat */}
        <div className="mb-4 border-b-2 border-black pb-3 text-center">
          <div className="text-base font-bold uppercase tracking-wide">
            PESANTREN AL-IMAM AL-ISLAMI
          </div>
          <div className="text-sm font-bold uppercase">
            LAPORAN MONITORING KEPATUHAN PENGISIAN JURNAL MENGAJAR
          </div>
          <div className="mt-1 text-xs">
            Periode: {report.meta.period_label} · Pola Pekan: {parityBadgeText}
            {report.meta.jenjang_filter !== "ALL"
              ? ` · Jenjang: ${report.meta.jenjang_filter}`
              : ""}
          </div>
        </div>

        {/* Ringkasan Eksekutif */}
        <table className="rapor-table mb-4 w-full text-xs">
          <thead>
            <tr>
              <th className="p-1.5 text-left">Total Guru Mapel</th>
              <th className="p-1.5 text-left">Mengisi Jurnal</th>
              <th className="p-1.5 text-left">Tidak Mengisi</th>
              <th className="p-1.5 text-left">Lengkap / Sebagian</th>
              <th className="p-1.5 text-left">Kepatuhan Sesi KBM</th>
              <th className="p-1.5 text-left">Total Jurnal Masuk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1.5 font-bold">
                {summary.total_guru_mapel} guru
              </td>
              <td className="p-1.5 font-bold">
                {summary.persen_mengisi}% ({summary.guru_mengisi} guru)
              </td>
              <td className="p-1.5 font-bold">
                {summary.persen_tidak_mengisi}% ({summary.guru_tidak_mengisi}{" "}
                guru)
              </td>
              <td className="p-1.5">
                {summary.guru_lengkap} Lengkap / {summary.guru_sebagian}{" "}
                Sebagian
              </td>
              <td className="p-1.5">
                {summary.persen_sesi !== null
                  ? `${summary.persen_sesi}% (${summary.sesi_terisi_elapsed}/${summary.total_sesi_jadwal_elapsed} sesi)`
                  : "-"}
              </td>
              <td className="p-1.5 font-bold">{summary.total_jurnal} entri</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel 1: Rekapitulasi per Guru */}
        <div className="mb-1 text-xs font-bold uppercase">
          1. Rekapitulasi Kepatuhan Guru Mapel ({report.teachers.length} Guru)
        </div>
        <table className="rapor-table mb-5 w-full text-[11px]">
          <thead>
            <tr>
              <th className="w-8 p-1 text-center">No</th>
              <th className="p-1 text-left">Nama Guru Mapel</th>
              <th className="w-24 p-1 text-left">Status</th>
              <th className="w-20 p-1 text-center">Jurnal</th>
              <th className="w-24 p-1 text-center">Sesi Terisi</th>
              <th className="w-20 p-1 text-center">Kepatuhan</th>
              <th className="p-1 text-left">Mapel Diampu</th>
            </tr>
          </thead>
          <tbody>
            {report.teachers.map((t, i) => (
              <tr key={t.pegawai_id}>
                <td className="p-1 text-center">{i + 1}</td>
                <td className="p-1 font-semibold">{t.nama_lengkap}</td>
                <td className="p-1">{STATUS_META[t.status_kepatuhan].label}</td>
                <td className="p-1 text-center">{t.total_jurnal}</td>
                <td className="p-1 text-center">
                  {t.has_schedule
                    ? `${t.covered_sessions_elapsed}/${t.expected_sessions_elapsed}`
                    : `${t.covered_mapels_count}/${t.assigned_mapels_count}`}
                </td>
                <td className="p-1 text-center font-bold">
                  {t.persen_kepatuhan_jadwal !== null
                    ? `${t.persen_kepatuhan_jadwal}%`
                    : t.sudah_mengisi
                      ? "100%"
                      : "0%"}
                </td>
                <td className="p-1">
                  {t.assigned_mapels
                    .map((m) => `${m.mapel_nama} (${m.kelas_nama})`)
                    .join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabel 2: Rincian Jadwal Mengajar Tidak Diisi Jurnal */}
        <div className="mb-1 text-xs font-bold uppercase">
          2. Rincian Jadwal Mengajar Belum Diisi Jurnal (
          {report.missed_details.length} Sesi)
        </div>
        <table className="rapor-table mb-6 w-full text-[11px]">
          <thead>
            <tr>
              <th className="w-8 p-1 text-center">No</th>
              <th className="w-32 p-1 text-left">Hari &amp; Tanggal</th>
              <th className="p-1 text-left">Guru Mapel</th>
              <th className="w-20 p-1 text-center">Kelas</th>
              <th className="p-1 text-left">Mata Pelajaran</th>
              <th className="w-32 p-1 text-left">Jam ke- &amp; Waktu</th>
              <th className="w-28 p-1 text-left">Presensi</th>
            </tr>
          </thead>
          <tbody>
            {report.missed_details.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-2 text-center">
                  Tidak ada sesi mengajar terjadwal yang terlewat pada periode
                  ini.
                </td>
              </tr>
            ) : (
              report.missed_details.map((m, idx) => (
                <tr key={m.block_id}>
                  <td className="p-1 text-center">{idx + 1}</td>
                  <td className="p-1">{m.label_tanggal}</td>
                  <td className="p-1 font-semibold">{m.guru_nama}</td>
                  <td className="p-1 text-center">{m.kelas_nama}</td>
                  <td className="p-1">{m.mapel_nama}</td>
                  <td className="p-1">
                    {m.jam_detail} ({m.waktu_mulai}-{m.waktu_selesai})
                  </td>
                  <td className="p-1">
                    {m.is_excused && m.presensi_status
                      ? m.presensi_status.toUpperCase()
                      : m.presensi_status || "Tanpa Keterangan"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Tanda Tangan */}
        <div className="mt-6 flex justify-between px-6 text-xs">
          <div className="text-center">
            <div>Mengetahui,</div>
            <div className="font-bold">Mudir Pesantren Al-Imam Al-Islami</div>
            <div className="mt-14 font-bold underline">
              ( ........................................ )
            </div>
          </div>
          <div className="text-center">
            <div>{formatTanggalLongID(report.meta.today_iso)}</div>
            <div className="font-bold">Kepala Kurikulum</div>
            <div className="mt-14 font-bold underline">
              ( ........................................ )
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal per Guru */}
      <GuruJurnalDetailModal
        teacher={selectedTeacher}
        periodLabel={report.meta.period_label}
        onClose={() => setSelectedTeacherId(null)}
      />
    </>
  );
}
