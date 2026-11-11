import {
  addDaysISO,
  DAY_NAMES_ID,
  DAY_SHORT_ID,
  diffDaysISO,
  enumerateDatesISO,
  formatISODateUTC,
  formatPeriodLabelID,
  formatTanggalLongID,
  formatTanggalShortID,
  getDayIndexUTC,
  getJakartaTodayISO,
  getPresetRange,
  getWeekParityOfDate,
  isValidISODate,
  type PeriodPreset,
  parseISODateUTC,
  type TipePekanFilter,
} from "@/lib/jurnalDateUtils";
import { getJenjangFromKelas, type JenjangType, sortKelas } from "@/lib/kelas";
import { getStandardMapelName } from "@/lib/mapel";
import { prisma } from "@/lib/prisma";
import { syncScheduleFromPDF } from "@/lib/syncScheduleFromPDF";

export {
  addDaysISO,
  DAY_NAMES_ID,
  DAY_SHORT_ID,
  diffDaysISO,
  enumerateDatesISO,
  formatISODateUTC,
  formatPeriodLabelID,
  formatTanggalLongID,
  formatTanggalShortID,
  getDayIndexUTC,
  getJakartaTodayISO,
  getPresetRange,
  getWeekParityOfDate,
  isValidISODate,
  parseISODateUTC,
  type PeriodPreset,
  type TipePekanFilter,
};

export type KepatuhanStatus =
  | "lengkap"
  | "sebagian"
  | "belum_isi"
  | "belum_jadwal";

export interface AssignedMapelInfo {
  kelas_id?: string;
  kelas_nama: string;
  jenjang: JenjangType;
  mapel_nama: string;
  standard_mapel: string;
  source: "jadwal" | "asatidz_mapel" | "profil";
}

export interface JurnalEntrySummary {
  id: string;
  tanggal: string;
  kelas_id: string;
  kelas_nama: string;
  jenjang: JenjangType;
  mapel_id: string;
  mapel_nama: string;
  jam_ke: string;
  materi: string;
  learning_outcome: string;
  kegiatan: string;
  catatan: string;
}

export interface ScheduledBlockSummary {
  block_id: string;
  hari: string;
  hari_singkat: string;
  tanggal: string;
  label_tanggal: string;
  kelas_id: string;
  kelas_nama: string;
  jenjang: JenjangType;
  mapel_id: string;
  mapel_nama: string;
  jam_list: number[];
  jam_label: string;
  jam_detail: string;
  waktu_mulai: string;
  waktu_selesai: string;
  tipe_pekan: string;
  is_future: boolean;
  is_holiday: boolean;
  is_covered: boolean;
  covered_by_jurnal_ids: string[];
  presensi_status: string | null;
  presensi_keterangan: string | null;
  is_excused: boolean;
}

export interface MissedSlotDetail {
  block_id: string;
  pegawai_id: string;
  guru_nama: string;
  jabatan: string | null;
  no_hp: string | null;
  tanggal: string;
  hari: string;
  hari_singkat: string;
  label_tanggal: string;
  kelas_id: string;
  kelas_nama: string;
  jenjang: JenjangType;
  mapel_id: string;
  mapel_nama: string;
  jam_list: number[];
  jam_label: string;
  jam_detail: string;
  waktu_mulai: string;
  waktu_selesai: string;
  tipe_pekan: string;
  presensi_status: string | null;
  presensi_keterangan: string | null;
  is_excused: boolean;
}

export interface TeacherDayRecord {
  tanggal: string;
  hari: string;
  hari_singkat: string;
  label_tanggal: string;
  is_sunday: boolean;
  is_holiday: boolean;
  libur_nama: string | null;
  is_future: boolean;
  week_parity: "ganjil" | "genap";
  presensi_status: string | null; // hadir | telat | sakit | izin | alpha | null
  presensi_keterangan: string | null;
  scheduled_blocks: ScheduledBlockSummary[];
  jurnal_entries: JurnalEntrySummary[];
  day_status:
    | "terisi"
    | "parsial"
    | "bolong"
    | "izin_sakit"
    | "menunggu"
    | "libur"
    | "tanpa_jadwal";
}

export interface TeacherMonitoringItem {
  pegawai_id: string;
  nama_lengkap: string;
  jabatan: string | null;
  kategori_pegawai: string;
  user_role: string | null;
  no_hp: string | null;
  foto_url: string | null;
  mata_pelajaran_raw: string | null;
  has_mapel_assignment: boolean;
  has_schedule: boolean;
  jenjang_list: JenjangType[];
  kelas_list: string[];
  assigned_mapels: AssignedMapelInfo[];
  covered_mapels_count: number;
  assigned_mapels_count: number;

  // Core counts in range
  total_jurnal: number;
  sudah_mengisi: boolean;
  expected_sessions_total: number;
  expected_sessions_elapsed: number;
  covered_sessions: number;
  covered_sessions_elapsed: number;
  missed_sessions_elapsed: number;
  missed_excused_sessions: number;
  missed_unexcused_sessions: number;
  expected_jp_elapsed: number;

  // Compliance metrics
  status_kepatuhan: KepatuhanStatus;
  persen_kepatuhan_jadwal: number | null; // null if no schedule blocks elapsed
  last_jurnal_tanggal: string | null;
  last_jurnal_hari_lalu: number | null;

  // Presensi summary in range (school days elapsed)
  presensi_hadir: number;
  presensi_sakit_izin: number;
  presensi_alpha: number;
  excused_all_missed: boolean;

  days: TeacherDayRecord[];
  jurnal_list: JurnalEntrySummary[];
  missed_blocks: ScheduledBlockSummary[];
}

export interface DailyStatItem {
  tanggal: string;
  hari: string;
  hari_singkat: string;
  label_tanggal: string;
  is_sunday: boolean;
  is_holiday: boolean;
  libur_nama: string | null;
  is_future: boolean;
  total_jurnal: number;
  guru_mengisi_count: number;
  guru_seharusnya_count: number;
  guru_bolong_count: number;
  guru_bolong_names: string[];
  persen_kepatuhan_hari: number;
}

export interface JenjangStatItem {
  jenjang: JenjangType;
  total_guru: number;
  guru_mengisi: number;
  guru_tidak_mengisi: number;
  persen_mengisi: number;
  persen_tidak_mengisi: number;
  total_jurnal: number;
}

export interface JurnalMonitoringSummary {
  total_guru_mapel: number;
  guru_mengisi: number;
  guru_tidak_mengisi: number;
  guru_lengkap: number;
  guru_sebagian: number;
  guru_belum_isi: number;
  guru_belum_jadwal: number;
  persen_mengisi: number;
  persen_tidak_mengisi: number;
  persen_lengkap: number;
  persen_sebagian: number;
  total_jurnal: number;
  total_sesi_jadwal: number;
  total_sesi_jadwal_elapsed: number;
  sesi_terisi: number;
  sesi_terisi_elapsed: number;
  sesi_terlewat: number;
  persen_sesi: number | null;
  school_days_total: number;
  school_days_elapsed: number;
  holiday_days_count: number;
  has_any_schedule: boolean;
  evaluation_basis: "jadwal" | "campuran" | "penugasan";
  unassigned_guru_count: number;
}

export interface JurnalMonitoringReport {
  meta: {
    start_date: string;
    end_date: string;
    today_iso: string;
    period_label: string;
    jenjang_filter: string;
    kelas_filter: string;
    tipe_pekan: TipePekanFilter;
    include_unassigned: boolean;
    generated_at: string;
  };
  summary: JurnalMonitoringSummary;
  teachers: TeacherMonitoringItem[];
  missed_details: MissedSlotDetail[];
  daily_stats: DailyStatItem[];
  jenjang_stats: JenjangStatItem[];
  days_calendar: {
    tanggal: string;
    hari: string;
    hari_singkat: string;
    label_tanggal: string;
    is_sunday: boolean;
    is_holiday: boolean;
    libur_nama: string | null;
    is_future: boolean;
    week_parity: "ganjil" | "genap";
  }[];
  filter_options: {
    kelas: { id: string; nama: string; jenjang: JenjangType }[];
    jenjang: JenjangType[];
  };
}

export function normalizeClassLabel(
  rawName: string,
  rawJenjang?: string | null,
): { kelasNama: string; jenjang: JenjangType } {
  const trimmed = (rawName || "").trim();
  const jenjang = getJenjangFromKelas(trimmed, rawJenjang);
  const clean = trimmed.replace(/\s*\([^)]*\)/g, "").trim();
  const upper = clean.toUpperCase();

  if (
    jenjang === "IL" ||
    upper === "IL" ||
    upper.includes("I'DAD") ||
    upper.includes("IDAD") ||
    upper.includes("LUGHOW")
  ) {
    return { kelasNama: "IL", jenjang: "IL" };
  }

  let canonicalNama = clean || trimmed || "-";
  if (/^(7|8|9)$/.test(canonicalNama)) {
    canonicalNama = `${canonicalNama} MTs`;
  } else if (/^(10|11|12)$/.test(canonicalNama)) {
    canonicalNama = `${canonicalNama} MA`;
  }

  return {
    kelasNama: canonicalNama,
    jenjang,
  };
}

export function normalizeMapelKey(
  rawName: string,
  jenjang: JenjangType,
): { displayName: string; standardKey: string } {
  const cleaned = (rawName || "").replace(/^\[.*?\]\s*/, "").trim();
  const std = getStandardMapelName(cleaned, jenjang === "MA");
  return {
    displayName: cleaned || "-",
    standardKey: (std || cleaned).trim().toLowerCase(),
  };
}

export function parsePegawaiMapelString(
  mapelStr: string | null | undefined,
): AssignedMapelInfo[] {
  if (!mapelStr || !mapelStr.trim()) return [];

  const parsed: AssignedMapelInfo[] = [];
  const groups = mapelStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const group of groups) {
    if (group.includes(":")) {
      const colonIdx = group.indexOf(":");
      const kelasPart = group.slice(0, colonIdx).trim();
      const mapelsPart = group.slice(colonIdx + 1).trim();
      const { kelasNama, jenjang } = normalizeClassLabel(kelasPart);
      const mapels = mapelsPart
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      for (const m of mapels) {
        const { displayName, standardKey } = normalizeMapelKey(m, jenjang);
        parsed.push({
          kelas_nama: kelasNama,
          jenjang,
          mapel_nama: displayName,
          standard_mapel: standardKey,
          source: "profil",
        });
      }
    } else {
      const items = group
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      for (const item of items) {
        if (item.startsWith("[") && item.includes("]")) {
          const closeIdx = item.indexOf("]");
          const rawKelas = item.slice(1, closeIdx).trim();
          const rawMapel = item.slice(closeIdx + 1).trim();
          const { kelasNama, jenjang } = normalizeClassLabel(rawKelas);
          const { displayName, standardKey } = normalizeMapelKey(
            rawMapel,
            jenjang,
          );
          parsed.push({
            kelas_nama: kelasNama,
            jenjang,
            mapel_nama: displayName,
            standard_mapel: standardKey,
            source: "profil",
          });
        } else if (item.includes(" - ")) {
          const [rawKelas, rawMapel] = item.split(" - ").map((x) => x.trim());
          const { kelasNama, jenjang } = normalizeClassLabel(rawKelas);
          const { displayName, standardKey } = normalizeMapelKey(
            rawMapel,
            jenjang,
          );
          parsed.push({
            kelas_nama: kelasNama,
            jenjang,
            mapel_nama: displayName,
            standard_mapel: standardKey,
            source: "profil",
          });
        } else {
          const { displayName, standardKey } = normalizeMapelKey(item, "MTs");
          parsed.push({
            kelas_nama: "7 MTs",
            jenjang: "MTs",
            mapel_nama: displayName,
            standard_mapel: standardKey,
            source: "profil",
          });
        }
      }
    }
  }

  return parsed;
}

/**
 * Ekstrak nomor jam pelajaran dari string `jam_ke` pada `JurnalMengajar`.
 * Contoh: "3, 4" -> {3, 4}, "4-6" -> {4, 5, 6}, "Khusus (07:30-08:30)" -> empty set.
 */
export function parseJamKeNumbers(
  jamKe: string | null | undefined,
): Set<number> {
  const hours = new Set<number>();
  if (!jamKe) return hours;

  // Hilangkan keterangan jam dalam kurung atau pola waktu HH:MM / HH.MM
  const sanitized = jamKe
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, " ")
    .replace(/khusus/gi, " ");

  const rangeRegex = /(\d{1,2})\s*[-–]\s*(\d{1,2})/g;
  let match: RegExpExecArray | null = rangeRegex.exec(sanitized);
  while (match) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start >= 1 && end >= start && end <= 15) {
      for (let h = start; h <= end; h++) {
        hours.add(h);
      }
    }
    match = rangeRegex.exec(sanitized);
  }

  const singleMatches = sanitized.match(/\b\d{1,2}\b/g) || [];
  for (const numStr of singleMatches) {
    const n = Number(numStr);
    if (n >= 1 && n <= 15) {
      hours.add(n);
    }
  }

  return hours;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export interface RawPegawaiInput {
  id: string;
  nama_lengkap: string;
  jabatan: string | null;
  kategori_pegawai: string;
  mata_pelajaran: string | null;
  no_hp: string | null;
  foto_url: string | null;
  user?: {
    role: string;
    is_active: boolean;
  } | null;
}

export interface RawKelasInput {
  id: string;
  nama: string;
  jenjang: string | null;
  is_active: boolean;
}

export interface RawMapelInput {
  id: string;
  nama: string;
  kelas_id: string;
}

export interface RawAsatidzMapelInput {
  pegawai_id: string;
  kelas_id: string;
  mapel_id: string;
}

export interface RawJadwalInput {
  id: string;
  hari: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  kelas_id: string;
  pegawai_id: string;
  mapel_id: string;
  tipe_pekan: string;
}

export interface RawJurnalInput {
  id: string;
  pegawai_id: string;
  mapel_id: string;
  kelas_id: string;
  tanggal: Date | string;
  jam_ke: string | null;
  materi: string;
  learning_outcome: string | null;
  kegiatan: string;
  catatan: string | null;
}

export interface RawPresensiAsatidzInput {
  pegawai_id: string;
  tanggal: Date | string;
  status: string;
  keterangan: string | null;
}

export interface RawKalenderLiburInput {
  nama_kegiatan: string;
  tanggal_mulai: Date | string;
  tanggal_selesai: Date | string;
  kategori: string;
  is_libur: boolean;
}

export interface RawLastJurnalByPegawai {
  pegawai_id: string;
  last_tanggal: Date | string;
}

export interface ComputeJurnalMonitoringInput {
  startDate: string;
  endDate: string;
  todayISO: string;
  jenjangFilter?: string; // "ALL" | "MTs" | "IL" | "MA"
  kelasFilter?: string; // "ALL" | canonical kelas_id
  tipePekan?: TipePekanFilter;
  includeUnassigned?: boolean;
  pegawaiList: RawPegawaiInput[];
  kelasList: RawKelasInput[];
  mapelList: RawMapelInput[];
  asatidzMapelList: RawAsatidzMapelInput[];
  jadwalList: RawJadwalInput[];
  jurnalList: RawJurnalInput[];
  presensiList: RawPresensiAsatidzInput[];
  kalenderLiburList: RawKalenderLiburInput[];
  lastJurnalList: RawLastJurnalByPegawai[];
}

function toISO(val: Date | string): string {
  if (val instanceof Date) return formatISODateUTC(val);
  return String(val).slice(0, 10);
}

/**
 * Engine perhitungan murni (pure & deterministic) untuk monitoring kepatuhan
 * pengisian jurnal mengajar guru mapel pada rentang tanggal tertentu.
 */
export function computeJurnalMonitoring(
  input: ComputeJurnalMonitoringInput,
): JurnalMonitoringReport {
  const {
    startDate,
    endDate,
    todayISO,
    jenjangFilter = "ALL",
    kelasFilter = "ALL",
    tipePekan = "otomatis",
    includeUnassigned = false,
    pegawaiList,
    kelasList,
    mapelList,
    asatidzMapelList,
    jadwalList,
    jurnalList,
    presensiList,
    kalenderLiburList,
    lastJurnalList,
  } = input;

  // 1. Canonical lookup maps untuk kelas & mapel
  const kelasRawMap = new Map<
    string,
    {
      id: string;
      rawNama: string;
      kelasNama: string;
      jenjang: JenjangType;
      canonicalKey: string;
    }
  >();
  const canonicalKelasByKey = new Map<
    string,
    { id: string; nama: string; jenjang: JenjangType }
  >();
  const kelasIdToCanonicalId = new Map<string, string>();

  for (const k of kelasList) {
    const norm = normalizeClassLabel(k.nama, k.jenjang);
    const key = `${norm.jenjang}::${norm.kelasNama.toUpperCase()}`;
    let canon = canonicalKelasByKey.get(key);
    if (!canon) {
      canon = {
        id: k.id,
        nama: norm.kelasNama,
        jenjang: norm.jenjang,
      };
      canonicalKelasByKey.set(key, canon);
    }
    kelasIdToCanonicalId.set(k.id, canon.id);
    kelasRawMap.set(k.id, {
      id: canon.id,
      rawNama: k.nama,
      kelasNama: canon.nama,
      jenjang: canon.jenjang,
      canonicalKey: key,
    });
  }

  const effectiveKelasFilter =
    kelasFilter !== "ALL"
      ? kelasIdToCanonicalId.get(kelasFilter) || kelasFilter
      : "ALL";

  const mapelById = new Map<
    string,
    {
      id: string;
      nama: string;
      kelas_id: string;
      jenjang: JenjangType;
      standardKey: string;
    }
  >();
  for (const m of mapelList) {
    const kInfo = kelasRawMap.get(m.kelas_id);
    const jenjang = kInfo?.jenjang || "MTs";
    const { displayName, standardKey } = normalizeMapelKey(m.nama, jenjang);
    mapelById.set(m.id, {
      id: m.id,
      nama: displayName,
      kelas_id: kInfo?.id || m.kelas_id,
      jenjang,
      standardKey,
    });
  }

  // Filter options kelas (active + tercanonicalize)
  const activeKelasOptions = sortKelas(
    Array.from(canonicalKelasByKey.values()).filter((c) => {
      // Tetap tampilkan kelas aktif atau yang muncul di jadwal/jurnal
      const hasRawActive = kelasList.some(
        (raw) => raw.is_active && kelasIdToCanonicalId.get(raw.id) === c.id,
      );
      return hasRawActive;
    }),
  );

  // 2. Kalender libur (mengabaikan kategori PENGATURAN_SISTEM yang dipakai untuk lock modul)
  const validHolidays = kalenderLiburList
    .filter((k) => k.is_libur && k.kategori !== "PENGATURAN_SISTEM")
    .map((k) => ({
      nama: k.nama_kegiatan,
      start: toISO(k.tanggal_mulai),
      end: toISO(k.tanggal_selesai),
    }));

  // 3. Enumerasi hari dalam rentang tanggal
  const dateISOs = enumerateDatesISO(startDate, endDate);
  const daysCalendar = dateISOs.map((iso) => {
    const dow = getDayIndexUTC(iso);
    const hari = DAY_NAMES_ID[dow];
    const hariSingkat = DAY_SHORT_ID[dow];
    const isSunday = dow === 0;
    const liburMatch = validHolidays.find(
      (h) => iso >= h.start && iso <= h.end,
    );
    const isHoliday = isSunday || Boolean(liburMatch);
    const isFuture = iso > todayISO;
    const weekParity = getWeekParityOfDate(iso);

    return {
      tanggal: iso,
      hari,
      hari_singkat: hariSingkat,
      label_tanggal: formatTanggalShortID(iso),
      is_sunday: isSunday,
      is_holiday: isHoliday,
      libur_nama: liburMatch ? liburMatch.nama : isSunday ? "Hari Ahad" : null,
      is_future: isFuture,
      week_parity: weekParity,
    };
  });

  // 4. Last journal ever per pegawai
  const lastJurnalMap = new Map<string, string>();
  for (const lj of lastJurnalList) {
    const iso = toISO(lj.last_tanggal);
    const prev = lastJurnalMap.get(lj.pegawai_id);
    if (!prev || iso > prev) {
      lastJurnalMap.set(lj.pegawai_id, iso);
    }
  }

  // 5. Presensi Asatidz lookup: `${pegawai_id}::${tanggal}`
  const presensiMap = new Map<
    string,
    { status: string; keterangan: string | null }
  >();
  for (const p of presensiList) {
    const iso = toISO(p.tanggal);
    presensiMap.set(`${p.pegawai_id}::${iso}`, {
      status: p.status.toLowerCase(),
      keterangan: p.keterangan,
    });
  }

  // 6. Index JurnalMengajar in range by pegawai
  const jurnalByPegawai = new Map<string, JurnalEntrySummary[]>();
  for (const j of jurnalList) {
    const kInfo = kelasRawMap.get(j.kelas_id);
    const mInfo = mapelById.get(j.mapel_id);
    const jenjang = kInfo?.jenjang || mInfo?.jenjang || "MTs";
    const kelasNama = kInfo?.kelasNama || "-";
    const canonicalKelasId = kInfo?.id || j.kelas_id;

    // Jika ada filter jenjang / kelas aktif, saring entri jurnal sesuai scope
    if (jenjangFilter !== "ALL" && jenjang !== jenjangFilter) continue;
    if (
      effectiveKelasFilter !== "ALL" &&
      canonicalKelasId !== effectiveKelasFilter
    )
      continue;

    const entry: JurnalEntrySummary = {
      id: j.id,
      tanggal: toISO(j.tanggal),
      kelas_id: canonicalKelasId,
      kelas_nama: kelasNama,
      jenjang,
      mapel_id: j.mapel_id,
      mapel_nama: mInfo?.nama || "-",
      jam_ke: j.jam_ke || "-",
      materi: j.materi,
      learning_outcome: j.learning_outcome || "",
      kegiatan: j.kegiatan,
      catatan: j.catatan || "",
    };

    const list = jurnalByPegawai.get(j.pegawai_id) || [];
    list.push(entry);
    jurnalByPegawai.set(j.pegawai_id, list);
  }

  // 7. Index JadwalPelajaran by pegawai
  const jadwalByPegawai = new Map<string, RawJadwalInput[]>();
  for (const jad of jadwalList) {
    const kInfo = kelasRawMap.get(jad.kelas_id);
    const jenjang = kInfo?.jenjang || "MTs";
    const canonicalKelasId = kInfo?.id || jad.kelas_id;
    if (jenjangFilter !== "ALL" && jenjang !== jenjangFilter) continue;
    if (
      effectiveKelasFilter !== "ALL" &&
      canonicalKelasId !== effectiveKelasFilter
    )
      continue;

    const list = jadwalByPegawai.get(jad.pegawai_id) || [];
    list.push(jad);
    jadwalByPegawai.set(jad.pegawai_id, list);
  }

  // Index Jadwal raw (tanpa filter kelas/jenjang) untuk mengetahui siapa guru terplot
  const pegawaiHasAnyJadwal = new Set<string>(
    jadwalList.map((j) => j.pegawai_id),
  );
  const pegawaiHasAnyAsatidzMapel = new Set<string>(
    asatidzMapelList.map((am) => am.pegawai_id),
  );
  const pegawaiHasAnyJurnalInRange = new Set<string>(
    jurnalList.map((j) => j.pegawai_id),
  );

  // 8. Index AsatidzmMapel by pegawai
  const asatidzMapelByPegawai = new Map<string, AssignedMapelInfo[]>();
  for (const am of asatidzMapelList) {
    const kInfo = kelasRawMap.get(am.kelas_id);
    const mInfo = mapelById.get(am.mapel_id);
    if (!kInfo || !mInfo) continue;

    const item: AssignedMapelInfo = {
      kelas_id: kInfo.id,
      kelas_nama: kInfo.kelasNama,
      jenjang: kInfo.jenjang,
      mapel_nama: mInfo.nama,
      standard_mapel: mInfo.standardKey,
      source: "asatidz_mapel",
    };

    const list = asatidzMapelByPegawai.get(am.pegawai_id) || [];
    list.push(item);
    asatidzMapelByPegawai.set(am.pegawai_id, list);
  }

  // 9. Tentukan kandidat guru mapel aktif & bangun data evaluasi
  const activePegawai = pegawaiList.filter(
    (p) => !p.user || p.user.is_active !== false,
  );

  let unassignedGuruCount = 0;
  const evaluatedTeachers: TeacherMonitoringItem[] = [];

  for (const p of activePegawai) {
    const roleUpper = (p.user?.role || "").toUpperCase();
    const katUpper = (p.kategori_pegawai || "").toUpperCase();
    const jabLower = (p.jabatan || "").toLowerCase();

    const hasProfileMapel = Boolean(
      p.mata_pelajaran && p.mata_pelajaran.trim().length > 0,
    );
    const hasRelationalAssignment =
      pegawaiHasAnyJadwal.has(p.id) ||
      pegawaiHasAnyAsatidzMapel.has(p.id) ||
      pegawaiHasAnyJurnalInRange.has(p.id);

    const hasMapelAssignment = hasProfileMapel || hasRelationalAssignment;

    const isAcademicAccount =
      roleUpper.includes("GURU") ||
      roleUpper.includes("KURIKULUM") ||
      roleUpper.includes("WALI_KELAS") ||
      katUpper.includes("GURU") ||
      katUpper.includes("ASATIDZ") ||
      katUpper.includes("PENGAJAR") ||
      jabLower.includes("guru") ||
      jabLower.includes("pengajar") ||
      jabLower.includes("asatidz");

    if (!hasMapelAssignment && isAcademicAccount) {
      unassignedGuruCount++;
    }

    if (!hasMapelAssignment && !(includeUnassigned && isAcademicAccount)) {
      continue;
    }

    // Gabungkan semua penugasan mapel (Jadwal + AsatidzmMapel + String Profil)
    const rawAssigned: AssignedMapelInfo[] = [];

    for (const jad of jadwalList) {
      if (jad.pegawai_id !== p.id) continue;
      const kInfo = kelasRawMap.get(jad.kelas_id);
      const mInfo = mapelById.get(jad.mapel_id);
      if (!kInfo || !mInfo) continue;
      rawAssigned.push({
        kelas_id: kInfo.id,
        kelas_nama: kInfo.kelasNama,
        jenjang: kInfo.jenjang,
        mapel_nama: mInfo.nama,
        standard_mapel: mInfo.standardKey,
        source: "jadwal",
      });
    }

    const relAm = asatidzMapelByPegawai.get(p.id) || [];
    rawAssigned.push(...relAm);

    const profileParsed = parsePegawaiMapelString(p.mata_pelajaran);
    for (const pp of profileParsed) {
      const canonicalByKey = canonicalKelasByKey.get(
        `${pp.jenjang}::${pp.kelas_nama.toUpperCase()}`,
      );
      rawAssigned.push({
        ...pp,
        kelas_id: canonicalByKey?.id,
      });
    }

    // Deduplikasi penugasan mapel per (jenjang, kelas_nama, standard_mapel)
    const assignedDedupMap = new Map<string, AssignedMapelInfo>();
    for (const item of rawAssigned) {
      const kKey = `${item.jenjang}::${item.kelas_nama.toUpperCase()}::${item.standard_mapel}`;
      if (!assignedDedupMap.has(kKey)) {
        assignedDedupMap.set(kKey, item);
      }
    }

    let teacherAssigned = Array.from(assignedDedupMap.values());
    if (jenjangFilter !== "ALL") {
      teacherAssigned = teacherAssigned.filter(
        (a) => a.jenjang === jenjangFilter,
      );
    }
    if (effectiveKelasFilter !== "ALL") {
      const targetCanon = Array.from(canonicalKelasByKey.values()).find(
        (c) => c.id === effectiveKelasFilter,
      );
      teacherAssigned = teacherAssigned.filter(
        (a) =>
          (a.kelas_id
            ? kelasIdToCanonicalId.get(a.kelas_id) || a.kelas_id
            : undefined) === effectiveKelasFilter ||
          (targetCanon &&
            a.jenjang === targetCanon.jenjang &&
            a.kelas_nama.toUpperCase() === targetCanon.nama.toUpperCase()),
      );
    }

    const teacherJurnals = (jurnalByPegawai.get(p.id) || []).sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal),
    );
    const teacherJadwals = jadwalByPegawai.get(p.id) || [];

    // Bila user memfilter jenjang / kelas tertentu, abaikan guru yang tidak mengajar jenjang/kelas tsb
    if (
      (jenjangFilter !== "ALL" || effectiveKelasFilter !== "ALL") &&
      teacherAssigned.length === 0 &&
      teacherJadwals.length === 0 &&
      teacherJurnals.length === 0
    ) {
      continue;
    }

    // Evaluasi hari-demi-hari untuk guru ini
    const days: TeacherDayRecord[] = [];
    const allBlocks: ScheduledBlockSummary[] = [];
    const matchedJurnalIds = new Set<string>();

    let presensiHadir = 0;
    let presensiSakitIzin = 0;
    let presensiAlpha = 0;

    for (const calDay of daysCalendar) {
      const pres = presensiMap.get(`${p.id}::${calDay.tanggal}`) || null;
      const isExcusedAbsent =
        pres?.status === "sakit" || pres?.status === "izin";
      if (!calDay.is_holiday && !calDay.is_future && pres) {
        if (pres.status === "hadir" || pres.status === "telat") presensiHadir++;
        else if (isExcusedAbsent) presensiSakitIzin++;
        else if (pres.status === "alpha") presensiAlpha++;
      }

      const dayJurnals = teacherJurnals.filter(
        (j) => j.tanggal === calDay.tanggal,
      );

      // Cari jadwal guru pada hari ini
      const dayBlocks: ScheduledBlockSummary[] = [];
      if (!calDay.is_holiday) {
        const effectiveParity =
          tipePekan === "ganjil"
            ? "ganjil"
            : tipePekan === "genap"
              ? "genap"
              : tipePekan === "semua"
                ? null
                : calDay.week_parity;

        const matchingSlots = teacherJadwals
          .filter((slot) => {
            if (slot.hari.toLowerCase() !== calDay.hari.toLowerCase())
              return false;
            if (!effectiveParity) return true;
            const slotTipe = (slot.tipe_pekan || "semua").toLowerCase();
            return slotTipe === "semua" || slotTipe === effectiveParity;
          })
          .sort((a, b) => a.jam_ke - b.jam_ke);

        // Kelompokkan per (canonicalKelasId, standardMapel) lalu pecah ke blok jam berurutan
        const byClassMapel = new Map<
          string,
          {
            kelas_id: string;
            kelas_nama: string;
            jenjang: JenjangType;
            mapel_id: string;
            mapel_nama: string;
            standardKey: string;
            slots: RawJadwalInput[];
          }
        >();

        for (const s of matchingSlots) {
          const kInfo = kelasRawMap.get(s.kelas_id);
          const mInfo = mapelById.get(s.mapel_id);
          const canonKelasId = kInfo?.id || s.kelas_id;
          const jenjang = kInfo?.jenjang || "MTs";
          const stdKey =
            mInfo?.standardKey ||
            normalizeMapelKey(mInfo?.nama || "-", jenjang).standardKey;
          const groupKey = `${canonKelasId}::${stdKey}`;

          let grp = byClassMapel.get(groupKey);
          if (!grp) {
            grp = {
              kelas_id: canonKelasId,
              kelas_nama: kInfo?.kelasNama || "-",
              jenjang,
              mapel_id: s.mapel_id,
              mapel_nama: mInfo?.nama || "-",
              standardKey: stdKey,
              slots: [],
            };
            byClassMapel.set(groupKey, grp);
          }
          grp.slots.push(s);
        }

        for (const group of byClassMapel.values()) {
          const sorted = [...group.slots].sort((a, b) => a.jam_ke - b.jam_ke);
          const subBlocks: RawJadwalInput[][] = [];
          for (const sl of sorted) {
            const lastBlock = subBlocks[subBlocks.length - 1];
            if (!lastBlock) {
              subBlocks.push([sl]);
            } else {
              const prevJam = lastBlock[lastBlock.length - 1].jam_ke;
              if (sl.jam_ke === prevJam || sl.jam_ke === prevJam + 1) {
                lastBlock.push(sl);
              } else {
                subBlocks.push([sl]);
              }
            }
          }

          subBlocks.forEach((blkSlots, idx) => {
            const jamList = Array.from(
              new Set(blkSlots.map((b) => b.jam_ke)),
            ).sort((a, b) => a - b);
            const first = blkSlots[0];
            const last = blkSlots[blkSlots.length - 1];
            const jamLabel =
              jamList.length === 1
                ? `Jam ${jamList[0]}`
                : `Jam ${jamList[0]}–${jamList[jamList.length - 1]}`;
            const jamDetail =
              jamList.length === 1
                ? `Jam ke-${jamList[0]}`
                : `Jam ke-${jamList.join(", ")}`;

            dayBlocks.push({
              block_id: `${calDay.tanggal}__${group.kelas_id}__${group.standardKey}__${idx}`,
              hari: calDay.hari,
              hari_singkat: calDay.hari_singkat,
              tanggal: calDay.tanggal,
              label_tanggal: formatTanggalLongID(calDay.tanggal),
              kelas_id: group.kelas_id,
              kelas_nama: group.kelas_nama,
              jenjang: group.jenjang,
              mapel_id: group.mapel_id,
              mapel_nama: group.mapel_nama,
              jam_list: jamList,
              jam_label: jamLabel,
              jam_detail: jamDetail,
              waktu_mulai: first.waktu_mulai,
              waktu_selesai: last.waktu_selesai,
              tipe_pekan: first.tipe_pekan || "semua",
              is_future: calDay.is_future,
              is_holiday: calDay.is_holiday,
              is_covered: false,
              covered_by_jurnal_ids: [],
              presensi_status: pres?.status || null,
              presensi_keterangan: pres?.keterangan || null,
              is_excused: isExcusedAbsent,
            });
          });
        }
      }

      // Cocokkan jurnal hari ini dengan scheduled blocks
      const usedNoHourJurnalIds = new Set<string>();
      for (const blk of dayBlocks) {
        const blkStdKey = normalizeMapelKey(
          blk.mapel_nama,
          blk.jenjang,
        ).standardKey;

        const matchingJurnals = dayJurnals.filter((j) => {
          const jStdKey = normalizeMapelKey(
            j.mapel_nama,
            j.jenjang,
          ).standardKey;
          const sameKelas =
            j.kelas_id === blk.kelas_id ||
            j.kelas_nama.toUpperCase() === blk.kelas_nama.toUpperCase();
          return sameKelas && jStdKey === blkStdKey;
        });

        if (matchingJurnals.length > 0) {
          const sameKeyBlocksCount = dayBlocks.filter(
            (other) =>
              other.kelas_id === blk.kelas_id &&
              normalizeMapelKey(other.mapel_nama, other.jenjang).standardKey ===
                blkStdKey,
          ).length;

          for (const j of matchingJurnals) {
            const parsedHours = parseJamKeNumbers(j.jam_ke);
            const intersects = blk.jam_list.some((h) => parsedHours.has(h));
            if (parsedHours.size === 0) {
              if (sameKeyBlocksCount > 1 && usedNoHourJurnalIds.has(j.id)) {
                continue;
              }
              blk.is_covered = true;
              blk.covered_by_jurnal_ids.push(j.id);
              matchedJurnalIds.add(j.id);
              usedNoHourJurnalIds.add(j.id);
            } else if (intersects || sameKeyBlocksCount === 1) {
              blk.is_covered = true;
              blk.covered_by_jurnal_ids.push(j.id);
              matchedJurnalIds.add(j.id);
            }
          }
        }
      }

      allBlocks.push(...dayBlocks);

      // Tentukan status hari ini untuk heatmap
      let dayStatus: TeacherDayRecord["day_status"] = "tanpa_jadwal";
      if (calDay.is_holiday) {
        dayStatus = "libur";
      } else if (dayBlocks.length > 0) {
        const coveredInDay = dayBlocks.filter((b) => b.is_covered).length;
        if (coveredInDay === dayBlocks.length) {
          dayStatus = "terisi";
        } else if (coveredInDay > 0 || dayJurnals.length > 0) {
          dayStatus = "parsial";
        } else if (calDay.is_future) {
          dayStatus = "menunggu";
        } else if (isExcusedAbsent) {
          dayStatus = "izin_sakit";
        } else {
          dayStatus = "bolong";
        }
      } else if (dayJurnals.length > 0) {
        dayStatus = "terisi";
      } else if (isExcusedAbsent) {
        dayStatus = "izin_sakit";
      } else if (calDay.is_future) {
        dayStatus = "menunggu";
      } else {
        dayStatus = "tanpa_jadwal";
      }

      days.push({
        tanggal: calDay.tanggal,
        hari: calDay.hari,
        hari_singkat: calDay.hari_singkat,
        label_tanggal: calDay.label_tanggal,
        is_sunday: calDay.is_sunday,
        is_holiday: calDay.is_holiday,
        libur_nama: calDay.libur_nama,
        is_future: calDay.is_future,
        week_parity: calDay.week_parity,
        presensi_status: pres?.status || null,
        presensi_keterangan: pres?.keterangan || null,
        scheduled_blocks: dayBlocks,
        jurnal_entries: dayJurnals,
        day_status: dayStatus,
      });
    }

    // Agregasi metrik guru
    const totalJurnal = teacherJurnals.length;
    const sudahMengisi = totalJurnal > 0;
    const hasSchedule = teacherJadwals.length > 0;

    const elapsedBlocks = allBlocks.filter((b) => !b.is_future);
    const coveredElapsedBlocks = elapsedBlocks.filter((b) => b.is_covered);
    const missedBlocksElapsed = elapsedBlocks.filter((b) => !b.is_covered);

    const missedExcusedSessions = missedBlocksElapsed.filter((blk) => {
      const pres = presensiMap.get(`${p.id}::${blk.tanggal}`);
      return pres?.status === "sakit" || pres?.status === "izin";
    }).length;
    const missedUnexcusedSessions =
      missedBlocksElapsed.length - missedExcusedSessions;

    const excusedAllMissed =
      missedBlocksElapsed.length > 0 &&
      missedExcusedSessions === missedBlocksElapsed.length;

    const expectedJpElapsed = elapsedBlocks.reduce(
      (sum, b) => sum + b.jam_list.length,
      0,
    );

    // Hitung cakupan mapel (berguna terutama ketika jadwal_pelajaran kosong)
    const coveredAssignedKeys = new Set<string>();
    for (const j of teacherJurnals) {
      const jStd = normalizeMapelKey(j.mapel_nama, j.jenjang).standardKey;
      coveredAssignedKeys.add(
        `${j.jenjang}::${j.kelas_nama.toUpperCase()}::${jStd}`,
      );
    }
    const coveredMapelsCount = teacherAssigned.filter((a) =>
      coveredAssignedKeys.has(
        `${a.jenjang}::${a.kelas_nama.toUpperCase()}::${a.standard_mapel}`,
      ),
    ).length;

    let statusKepatuhan: KepatuhanStatus;
    if (hasSchedule) {
      if (allBlocks.length > 0 && elapsedBlocks.length === 0) {
        statusKepatuhan = sudahMengisi ? "lengkap" : "belum_jadwal";
      } else if (elapsedBlocks.length > 0) {
        if (sudahMengisi && missedUnexcusedSessions === 0) {
          statusKepatuhan = "lengkap";
        } else if (sudahMengisi) {
          statusKepatuhan = "sebagian";
        } else {
          statusKepatuhan = "belum_isi";
        }
      } else {
        // Guru punya jadwal minggu/pekan lain tapi tidak di tipe pekan/rentang ini
        statusKepatuhan = sudahMengisi ? "lengkap" : "belum_jadwal";
      }
    } else {
      // Mode fallback tanpa JadwalPelajaran
      if (!sudahMengisi) {
        statusKepatuhan = "belum_isi";
      } else if (
        teacherAssigned.length > 1 &&
        coveredMapelsCount < teacherAssigned.length
      ) {
        statusKepatuhan = "sebagian";
      } else {
        statusKepatuhan = "lengkap";
      }
    }

    const persenKepatuhanJadwal =
      elapsedBlocks.length > 0
        ? round1((coveredElapsedBlocks.length / elapsedBlocks.length) * 100)
        : null;

    const jenjangSet = new Set<JenjangType>();
    const kelasSet = new Set<string>();
    for (const a of teacherAssigned) {
      jenjangSet.add(a.jenjang);
      kelasSet.add(a.kelas_nama);
    }
    for (const j of teacherJurnals) {
      jenjangSet.add(j.jenjang);
      kelasSet.add(j.kelas_nama);
    }

    const lastJurnalTanggal = lastJurnalMap.get(p.id) || null;
    const lastJurnalHariLalu = lastJurnalTanggal
      ? Math.max(0, diffDaysISO(todayISO, lastJurnalTanggal))
      : null;

    evaluatedTeachers.push({
      pegawai_id: p.id,
      nama_lengkap: p.nama_lengkap,
      jabatan: p.jabatan,
      kategori_pegawai: p.kategori_pegawai,
      user_role: p.user?.role || null,
      no_hp: p.no_hp,
      foto_url: p.foto_url,
      mata_pelajaran_raw: p.mata_pelajaran,
      has_mapel_assignment: hasMapelAssignment,
      has_schedule: hasSchedule,
      jenjang_list: Array.from(jenjangSet),
      kelas_list: Array.from(kelasSet),
      assigned_mapels: teacherAssigned,
      covered_mapels_count: coveredMapelsCount,
      assigned_mapels_count: teacherAssigned.length,
      total_jurnal: totalJurnal,
      sudah_mengisi: sudahMengisi,
      expected_sessions_total: allBlocks.length,
      expected_sessions_elapsed: elapsedBlocks.length,
      covered_sessions: allBlocks.filter((b) => b.is_covered).length,
      covered_sessions_elapsed: coveredElapsedBlocks.length,
      missed_sessions_elapsed: missedBlocksElapsed.length,
      missed_excused_sessions: missedExcusedSessions,
      missed_unexcused_sessions: missedUnexcusedSessions,
      expected_jp_elapsed: expectedJpElapsed,
      status_kepatuhan: statusKepatuhan,
      persen_kepatuhan_jadwal: persenKepatuhanJadwal,
      last_jurnal_tanggal: lastJurnalTanggal,
      last_jurnal_hari_lalu: lastJurnalHariLalu,
      presensi_hadir: presensiHadir,
      presensi_sakit_izin: presensiSakitIzin,
      presensi_alpha: presensiAlpha,
      excused_all_missed: excusedAllMissed,
      days,
      jurnal_list: teacherJurnals,
      missed_blocks: missedBlocksElapsed,
    });
  }

  // Urutkan prioritas rapat: Belum Mengisi dahulu (terbanyak terlewat), lalu Sebagian, Belum Jadwal, Lengkap
  const statusPriority: Record<KepatuhanStatus, number> = {
    belum_isi: 0,
    sebagian: 1,
    belum_jadwal: 2,
    lengkap: 3,
  };
  evaluatedTeachers.sort((a, b) => {
    const pDiff =
      statusPriority[a.status_kepatuhan] - statusPriority[b.status_kepatuhan];
    if (pDiff !== 0) return pDiff;
    if (a.missed_unexcused_sessions !== b.missed_unexcused_sessions) {
      return b.missed_unexcused_sessions - a.missed_unexcused_sessions;
    }
    return a.nama_lengkap.localeCompare(b.nama_lengkap, "id");
  });

  // 10. Ringkasan Global
  const totalGuruMapel = evaluatedTeachers.length;
  const guruMengisi = evaluatedTeachers.filter((t) => t.sudah_mengisi).length;
  const guruTidakMengisi = totalGuruMapel - guruMengisi;
  const guruLengkap = evaluatedTeachers.filter(
    (t) => t.status_kepatuhan === "lengkap",
  ).length;
  const guruSebagian = evaluatedTeachers.filter(
    (t) => t.status_kepatuhan === "sebagian",
  ).length;
  const guruBelumIsi = evaluatedTeachers.filter(
    (t) => t.status_kepatuhan === "belum_isi",
  ).length;
  const guruBelumJadwal = evaluatedTeachers.filter(
    (t) => t.status_kepatuhan === "belum_jadwal",
  ).length;

  const persenMengisi =
    totalGuruMapel > 0 ? round1((guruMengisi / totalGuruMapel) * 100) : 0;
  const persenTidakMengisi =
    totalGuruMapel > 0 ? round1(100 - persenMengisi) : 0;
  const persenLengkap =
    totalGuruMapel > 0 ? round1((guruLengkap / totalGuruMapel) * 100) : 0;
  const persenSebagian =
    totalGuruMapel > 0 ? round1((guruSebagian / totalGuruMapel) * 100) : 0;

  const totalJurnal = evaluatedTeachers.reduce(
    (sum, t) => sum + t.total_jurnal,
    0,
  );
  const totalSesiJadwal = evaluatedTeachers.reduce(
    (sum, t) => sum + t.expected_sessions_total,
    0,
  );
  const totalSesiJadwalElapsed = evaluatedTeachers.reduce(
    (sum, t) => sum + t.expected_sessions_elapsed,
    0,
  );
  const sesiTerisi = evaluatedTeachers.reduce(
    (sum, t) => sum + t.covered_sessions,
    0,
  );
  const sesiTerisiElapsed = evaluatedTeachers.reduce(
    (sum, t) => sum + t.covered_sessions_elapsed,
    0,
  );
  const sesiTerlewat = evaluatedTeachers.reduce(
    (sum, t) => sum + t.missed_sessions_elapsed,
    0,
  );
  const persenSesi =
    totalSesiJadwalElapsed > 0
      ? round1((sesiTerisiElapsed / totalSesiJadwalElapsed) * 100)
      : null;

  // Rincian lengkap setiap sesi jadwal yang terlewat / tidak diisi (Tanggal, Mapel, Kelas, Jam ke)
  const missedDetails: MissedSlotDetail[] = [];
  for (const t of evaluatedTeachers) {
    for (const blk of t.missed_blocks) {
      missedDetails.push({
        block_id: `${t.pegawai_id}__${blk.block_id}`,
        pegawai_id: t.pegawai_id,
        guru_nama: t.nama_lengkap,
        jabatan: t.jabatan,
        no_hp: t.no_hp,
        tanggal: blk.tanggal,
        hari: blk.hari,
        hari_singkat: blk.hari_singkat,
        label_tanggal: blk.label_tanggal,
        kelas_id: blk.kelas_id,
        kelas_nama: blk.kelas_nama,
        jenjang: blk.jenjang,
        mapel_id: blk.mapel_id,
        mapel_nama: blk.mapel_nama,
        jam_list: blk.jam_list,
        jam_label: blk.jam_label,
        jam_detail: blk.jam_detail,
        waktu_mulai: blk.waktu_mulai,
        waktu_selesai: blk.waktu_selesai,
        tipe_pekan: blk.tipe_pekan,
        presensi_status: blk.presensi_status,
        presensi_keterangan: blk.presensi_keterangan,
        is_excused: blk.is_excused,
      });
    }
  }
  missedDetails.sort((a, b) => {
    const tDiff = a.tanggal.localeCompare(b.tanggal);
    if (tDiff !== 0) return tDiff;
    const jDiff = (a.jam_list[0] ?? 99) - (b.jam_list[0] ?? 99);
    if (jDiff !== 0) return jDiff;
    const gDiff = a.guru_nama.localeCompare(b.guru_nama, "id");
    if (gDiff !== 0) return gDiff;
    return a.kelas_nama.localeCompare(b.kelas_nama, "id");
  });

  const scheduledTeacherCount = evaluatedTeachers.filter(
    (t) => t.has_schedule,
  ).length;
  const evaluationBasis: "jadwal" | "campuran" | "penugasan" =
    scheduledTeacherCount === 0
      ? "penugasan"
      : scheduledTeacherCount === totalGuruMapel
        ? "jadwal"
        : "campuran";

  // 11. Statistik Harian (Chart & Matriks)
  const dailyStats: DailyStatItem[] = daysCalendar.map((calDay, idx) => {
    let dayJurnalCount = 0;
    let guruMengisiCount = 0;
    let guruSeharusnyaCount = 0;
    const guruBolongNames: string[] = [];

    for (const t of evaluatedTeachers) {
      const td = t.days[idx];
      if (!td) continue;
      dayJurnalCount += td.jurnal_entries.length;
      const hadFilled = td.jurnal_entries.length > 0;
      if (hadFilled) guruMengisiCount++;

      if (!calDay.is_holiday) {
        if (t.has_schedule) {
          if (td.scheduled_blocks.length > 0) {
            guruSeharusnyaCount++;
            if (
              td.scheduled_blocks.some((b) => !b.is_covered) &&
              !calDay.is_future
            ) {
              guruBolongNames.push(t.nama_lengkap);
            }
          }
        } else {
          // Tanpa jadwal terstruktur, semua guru aktif dihitung sebagai basis harian opsional
          guruSeharusnyaCount++;
        }
      }
    }

    const denom =
      guruSeharusnyaCount > 0
        ? guruSeharusnyaCount
        : calDay.is_holiday
          ? 0
          : totalGuruMapel;
    const persenHari =
      denom > 0 && !calDay.is_holiday
        ? round1((guruMengisiCount / denom) * 100)
        : 0;

    return {
      tanggal: calDay.tanggal,
      hari: calDay.hari,
      hari_singkat: calDay.hari_singkat,
      label_tanggal: calDay.label_tanggal,
      is_sunday: calDay.is_sunday,
      is_holiday: calDay.is_holiday,
      libur_nama: calDay.libur_nama,
      is_future: calDay.is_future,
      total_jurnal: dayJurnalCount,
      guru_mengisi_count: guruMengisiCount,
      guru_seharusnya_count: guruSeharusnyaCount,
      guru_bolong_count: guruBolongNames.length,
      guru_bolong_names: guruBolongNames,
      persen_kepatuhan_hari: persenHari,
    };
  });

  // 12. Ringkasan per Jenjang
  const allJenjangs: JenjangType[] = ["MTs", "IL", "MA"];
  const jenjangStats: JenjangStatItem[] = allJenjangs
    .map((jType) => {
      const teachersInJenjang = evaluatedTeachers.filter(
        (t) =>
          t.jenjang_list.includes(jType) ||
          t.jurnal_list.some((jl) => jl.jenjang === jType),
      );
      const tot = teachersInJenjang.length;
      const filling = teachersInJenjang.filter((t) =>
        t.jurnal_list.some((jl) => jl.jenjang === jType),
      ).length;
      const notFilling = tot - filling;
      const pctMengisi = tot > 0 ? round1((filling / tot) * 100) : 0;
      const pctTidakMengisi = tot > 0 ? round1(100 - pctMengisi) : 0;
      const jurnalTotalJ = teachersInJenjang.reduce(
        (acc, t) =>
          acc + t.jurnal_list.filter((jl) => jl.jenjang === jType).length,
        0,
      );

      return {
        jenjang: jType,
        total_guru: tot,
        guru_mengisi: filling,
        guru_tidak_mengisi: notFilling,
        persen_mengisi: pctMengisi,
        persen_tidak_mengisi: pctTidakMengisi,
        total_jurnal: jurnalTotalJ,
      };
    })
    .filter((js) => js.total_guru > 0 || js.total_jurnal > 0);

  return {
    meta: {
      start_date: startDate,
      end_date: endDate,
      today_iso: todayISO,
      period_label: formatPeriodLabelID(startDate, endDate),
      jenjang_filter: jenjangFilter,
      kelas_filter: effectiveKelasFilter,
      tipe_pekan: tipePekan,
      include_unassigned: includeUnassigned,
      generated_at: new Date().toISOString(),
    },
    summary: {
      total_guru_mapel: totalGuruMapel,
      guru_mengisi: guruMengisi,
      guru_tidak_mengisi: guruTidakMengisi,
      guru_lengkap: guruLengkap,
      guru_sebagian: guruSebagian,
      guru_belum_isi: guruBelumIsi,
      guru_belum_jadwal: guruBelumJadwal,
      persen_mengisi: persenMengisi,
      persen_tidak_mengisi: persenTidakMengisi,
      persen_lengkap: persenLengkap,
      persen_sebagian: persenSebagian,
      total_jurnal: totalJurnal,
      total_sesi_jadwal: totalSesiJadwal,
      total_sesi_jadwal_elapsed: totalSesiJadwalElapsed,
      sesi_terisi: sesiTerisi,
      sesi_terisi_elapsed: sesiTerisiElapsed,
      sesi_terlewat: sesiTerlewat,
      persen_sesi: persenSesi,
      school_days_total: daysCalendar.filter((d) => !d.is_holiday).length,
      school_days_elapsed: daysCalendar.filter(
        (d) => !d.is_holiday && !d.is_future,
      ).length,
      holiday_days_count: daysCalendar.filter(
        (d) => d.is_holiday && !d.is_sunday,
      ).length,
      has_any_schedule: jadwalList.length > 0,
      evaluation_basis: evaluationBasis,
      unassigned_guru_count: unassignedGuruCount,
    },
    teachers: evaluatedTeachers,
    missed_details: missedDetails,
    daily_stats: dailyStats,
    jenjang_stats: jenjangStats,
    days_calendar: daysCalendar,
    filter_options: {
      kelas: activeKelasOptions.map((c) => ({
        id: c.id,
        nama: c.nama,
        jenjang: c.jenjang,
      })),
      jenjang: Array.from(
        new Set(activeKelasOptions.map((c) => c.jenjang)),
      ) as JenjangType[],
    },
  };
}

/**
 * Server-side data loader dari PostgreSQL via Prisma untuk Laporan Kepatuhan Jurnal.
 */
export async function getJurnalMonitoringReport(options: {
  startDate?: string | null;
  endDate?: string | null;
  jenjangFilter?: string | null;
  kelasFilter?: string | null;
  tipePekan?: TipePekanFilter | null;
  includeUnassigned?: boolean;
}): Promise<JurnalMonitoringReport> {
  const todayISO = getJakartaTodayISO();
  const defaultWeek = getPresetRange("pekan_ini", todayISO);

  let startDate = isValidISODate(options.startDate)
    ? options.startDate
    : defaultWeek.startDate;
  let endDate = isValidISODate(options.endDate)
    ? options.endDate
    : defaultWeek.endDate;

  if (startDate > endDate) {
    const tmp = startDate;
    startDate = endDate;
    endDate = tmp;
  }

  // Batasi rentang maksimal 366 hari agar query tetap ringan
  if (diffDaysISO(endDate, startDate) > 365) {
    endDate = addDaysISO(startDate, 365);
  }

  // Pastikan jadwal resmi tersinkronkan terlebih dahulu bila masih kosong
  await syncScheduleFromPDF().catch(() => {});

  const startDateObj = new Date(`${startDate}T00:00:00.000Z`);
  const endDateObj = new Date(`${endDate}T23:59:59.999Z`);

  const [
    pegawaiList,
    kelasList,
    mapelList,
    asatidzMapelList,
    jadwalList,
    jurnalList,
    presensiList,
    kalenderLiburList,
    lastJurnalGroups,
  ] = await Promise.all([
    prisma.pegawai.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        jabatan: true,
        kategori_pegawai: true,
        mata_pelajaran: true,
        no_hp: true,
        foto_url: true,
        user: { select: { role: true, is_active: true } },
      },
      orderBy: { nama_lengkap: "asc" },
    }),
    prisma.kelas.findMany({
      select: { id: true, nama: true, jenjang: true, is_active: true },
    }),
    prisma.mataPelajaran.findMany({
      where: { is_active: true },
      select: { id: true, nama: true, kelas_id: true },
    }),
    prisma.asatidzmMapel.findMany({
      select: { pegawai_id: true, kelas_id: true, mapel_id: true },
    }),
    prisma.jadwalPelajaran.findMany({
      select: {
        id: true,
        hari: true,
        jam_ke: true,
        waktu_mulai: true,
        waktu_selesai: true,
        kelas_id: true,
        pegawai_id: true,
        mapel_id: true,
        tipe_pekan: true,
      },
    }),
    prisma.jurnalMengajar.findMany({
      where: {
        tanggal: { gte: startDateObj, lte: endDateObj },
      },
      select: {
        id: true,
        pegawai_id: true,
        mapel_id: true,
        kelas_id: true,
        tanggal: true,
        jam_ke: true,
        materi: true,
        learning_outcome: true,
        kegiatan: true,
        catatan: true,
      },
      orderBy: { tanggal: "desc" },
    }),
    prisma.presensiAsatidz.findMany({
      where: {
        tanggal: { gte: startDateObj, lte: endDateObj },
      },
      select: {
        pegawai_id: true,
        tanggal: true,
        status: true,
        keterangan: true,
      },
    }),
    prisma.kalenderAkademik.findMany({
      where: {
        is_libur: true,
        kategori: { not: "PENGATURAN_SISTEM" },
        tanggal_mulai: { lte: endDateObj },
        tanggal_selesai: { gte: startDateObj },
      },
      select: {
        nama_kegiatan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        kategori: true,
        is_libur: true,
      },
    }),
    prisma.jurnalMengajar.groupBy({
      by: ["pegawai_id"],
      _max: { tanggal: true },
    }),
  ]);

  const lastJurnalList: RawLastJurnalByPegawai[] = lastJurnalGroups.flatMap(
    (g) =>
      g._max.tanggal
        ? [
            {
              pegawai_id: g.pegawai_id,
              last_tanggal: g._max.tanggal,
            },
          ]
        : [],
  );

  return computeJurnalMonitoring({
    startDate,
    endDate,
    todayISO,
    jenjangFilter: options.jenjangFilter || "ALL",
    kelasFilter: options.kelasFilter || "ALL",
    tipePekan: options.tipePekan || "otomatis",
    includeUnassigned: Boolean(options.includeUnassigned),
    pegawaiList,
    kelasList,
    mapelList,
    asatidzMapelList,
    jadwalList,
    jurnalList,
    presensiList,
    kalenderLiburList,
    lastJurnalList,
  });
}
