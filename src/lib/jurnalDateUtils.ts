export type PeriodPreset =
  | "pekan_ini"
  | "pekan_lalu"
  | "7_hari"
  | "14_hari"
  | "bulan_ini"
  | "kustom";

export type TipePekanFilter = "otomatis" | "semua" | "ganjil" | "genap";

export const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const DAY_SHORT_ID = [
  "Ahd",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
] as const;

export const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const MONTH_LONG_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function getJakartaTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isValidISODate(val: string | null | undefined): val is string {
  if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [y, m, d] = val.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function parseISODateUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function formatISODateUTC(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function addDaysISO(iso: string, delta: number): string {
  const dt = parseISODateUTC(iso);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return formatISODateUTC(dt);
}

export function diffDaysISO(laterISO: string, earlierISO: string): number {
  const ms =
    parseISODateUTC(laterISO).getTime() - parseISODateUTC(earlierISO).getTime();
  return Math.round(ms / 86_400_000);
}

export function getDayIndexUTC(iso: string): number {
  return parseISODateUTC(iso).getUTCDay();
}

export function getDayNameID(iso: string): string {
  return DAY_NAMES_ID[getDayIndexUTC(iso)] || "Senin";
}

export function formatTanggalShortID(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "-";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_SHORT_ID[m - 1] || ""}`;
}

export function formatTanggalLongID(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "-";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = getDayIndexUTC(iso);
  return `${DAY_NAMES_ID[dow]}, ${d} ${MONTH_LONG_ID[m - 1] || ""} ${y}`;
}

export function formatPeriodLabelID(startISO: string, endISO: string): string {
  if (startISO === endISO) return formatTanggalLongID(startISO);
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  if (sy === ey && sm === em) {
    return `${sd} – ${ed} ${MONTH_LONG_ID[sm - 1]} ${sy}`;
  }
  if (sy === ey) {
    return `${sd} ${MONTH_SHORT_ID[sm - 1]} – ${ed} ${MONTH_SHORT_ID[em - 1]} ${sy}`;
  }
  return `${sd} ${MONTH_SHORT_ID[sm - 1]} ${sy} – ${ed} ${MONTH_SHORT_ID[em - 1]} ${ey}`;
}

/**
 * Pekan KBM Al-Imam berlangsung Senin s.d. Sabtu.
 * Jika hari ini Ahad (dow === 0), pekan berjalan merujuk pada Senin–Sabtu
 * yang baru saja berakhir kemarin (umum dipakai saat evaluasi rapat Ahad).
 */
export function getPresetRange(
  preset: PeriodPreset,
  baseTodayISO: string = getJakartaTodayISO(),
): { startDate: string; endDate: string } {
  const dow = getDayIndexUTC(baseTodayISO);
  const thisMonday =
    dow === 0
      ? addDaysISO(baseTodayISO, -6)
      : addDaysISO(baseTodayISO, -(dow - 1));
  const thisSaturday = addDaysISO(thisMonday, 5);

  if (preset === "pekan_ini") {
    return { startDate: thisMonday, endDate: thisSaturday };
  }
  if (preset === "pekan_lalu") {
    return {
      startDate: addDaysISO(thisMonday, -7),
      endDate: addDaysISO(thisSaturday, -7),
    };
  }
  if (preset === "7_hari") {
    return {
      startDate: addDaysISO(baseTodayISO, -6),
      endDate: baseTodayISO,
    };
  }
  if (preset === "14_hari") {
    return {
      startDate: addDaysISO(baseTodayISO, -13),
      endDate: baseTodayISO,
    };
  }
  if (preset === "bulan_ini") {
    const [y, m] = baseTodayISO.split("-").map(Number);
    const first = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const last = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate: first, endDate: last };
  }
  return { startDate: thisMonday, endDate: thisSaturday };
}

export function enumerateDatesISO(
  startISO: string,
  endISO: string,
  maxDays = 366,
): string[] {
  const out: string[] = [];
  let cur = startISO;
  let guard = 0;
  while (cur <= endISO && guard < maxDays) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
    guard++;
  }
  return out;
}

/**
 * Menentukan paritas pekan (ganjil = pekan 1/3/5, genap = pekan 2/4) berbasis Senin
 * dalam pekan KBM tersebut agar Senin s.d. Sabtu pada pekan yang sama selalu konsisten.
 */
export function getWeekParityOfDate(iso: string): "ganjil" | "genap" {
  const dow = getDayIndexUTC(iso);
  const mondayISO =
    dow === 0 ? addDaysISO(iso, -6) : addDaysISO(iso, -(dow - 1));
  const dayOfMonth = Number(mondayISO.slice(8, 10)) || 1;
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  return weekOfMonth % 2 === 1 ? "ganjil" : "genap";
}
