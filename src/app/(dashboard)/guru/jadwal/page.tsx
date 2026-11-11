"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  formatTanggalLongID,
  getDayNameID,
  getJakartaTodayISO,
  getWeekParityOfDate,
} from "@/lib/jurnalDateUtils";

interface JadwalSlot {
  id: string;
  hari: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  kelas_id: string;
  pegawai_id: string;
  mapel_id: string;
  tipe_pekan: string;
  kelas: { id: string; nama: string; jenjang: string | null } | null;
  mapel: { id: string; nama: string } | null;
}

interface MergedBlock {
  key: string;
  hari: string;
  kelas_id: string;
  kelas_nama: string;
  mapel_id: string;
  mapel_nama: string;
  jam_list: number[];
  jam_label: string;
  waktu_mulai: string;
  waktu_selesai: string;
  tipe_pekan: string;
  is_covered: boolean;
}

interface JurnalTodayRow {
  id: string;
  kelas_id: string;
  mapel_id: string;
  jam_ke: string | null;
}

const WEEK_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parseJamNumbersClient(raw: string | null | undefined): Set<number> {
  const out = new Set<number>();
  if (!raw) return out;
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d{1,2}[:.]\d{2}\b/g, " ")
    .replace(/khusus/gi, " ");
  const rangeRegex = /(\d{1,2})\s*[-–]\s*(\d{1,2})/g;
  let m = rangeRegex.exec(cleaned);
  while (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    for (let x = a; x <= b && x <= 15; x++) {
      if (x >= 1) out.add(x);
    }
    m = rangeRegex.exec(cleaned);
  }
  const singles = cleaned.match(/\b\d{1,2}\b/g) || [];
  for (const s of singles) {
    const n = Number(s);
    if (n >= 1 && n <= 15) out.add(n);
  }
  return out;
}

export default function GuruJadwalPage() {
  const todayISO = useMemo(() => getJakartaTodayISO(), []);
  const todayDayName = useMemo(() => getDayNameID(todayISO), [todayISO]);
  const currentPekan = useMemo(() => getWeekParityOfDate(todayISO), [todayISO]);

  const [viewMode, setViewMode] = useState<"hari_ini" | "pekanan">("hari_ini");
  const [pegawaiId, setPegawaiId] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("Ustadz");
  const [jadwal, setJadwal] = useState<JadwalSlot[]>([]);
  const [todayJurnals, setTodayJurnals] = useState<JurnalTodayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const profRes = await fetch("/api/profile", { cache: "no-store" });
      const profJson = await profRes.json();
      const pid = profJson?.pegawai?.id || "";
      const nama = profJson?.pegawai?.nama_lengkap || profJson?.user?.nama || "Ustadz";
      setPegawaiId(pid);
      setTeacherName(nama);

      if (!pid) {
        setJadwal([]);
        setTodayJurnals([]);
        setLoading(false);
        return;
      }

      const [jadRes, jurRes] = await Promise.all([
        fetch(
          `/api/kurikulum/jadwal?pegawai_id=${encodeURIComponent(pid)}&tipe_pekan=${encodeURIComponent(currentPekan)}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/jurnal?pegawai_id=${encodeURIComponent(pid)}&tanggal=${encodeURIComponent(todayISO)}`,
          { cache: "no-store" },
        ),
      ]);

      const [jadJson, jurJson] = await Promise.all([
        jadRes.json(),
        jurRes.json(),
      ]);

      if (Array.isArray(jadJson)) setJadwal(jadJson);
      if (Array.isArray(jurJson?.data)) setTodayJurnals(jurJson.data);
    } catch (err) {
      console.error("Gagal memuat jadwal mengajar:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPekan, todayISO]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const buildMergedBlocks = useCallback(
    (slots: JadwalSlot[], checkCoverage: boolean): MergedBlock[] => {
      const sorted = [...slots].sort((a, b) => {
        const dayDiff = WEEK_DAYS.indexOf(a.hari) - WEEK_DAYS.indexOf(b.hari);
        if (dayDiff !== 0) return dayDiff;
        if (a.kelas_id !== b.kelas_id)
          return a.kelas_id.localeCompare(b.kelas_id);
        if (a.mapel_id !== b.mapel_id)
          return a.mapel_id.localeCompare(b.mapel_id);
        return a.jam_ke - b.jam_ke;
      });

      const grouped = new Map<string, JadwalSlot[]>();
      for (const s of sorted) {
        const key = `${s.hari}::${s.kelas_id}::${s.mapel_id}`;
        const list = grouped.get(key) || [];
        list.push(s);
        grouped.set(key, list);
      }

      const blocks: MergedBlock[] = [];
      for (const [groupKey, groupSlots] of grouped.entries()) {
        const byHour = [...groupSlots].sort((a, b) => a.jam_ke - b.jam_ke);
        const chunks: JadwalSlot[][] = [];
        for (const sl of byHour) {
          const prevChunk = chunks[chunks.length - 1];
          if (!prevChunk) {
            chunks.push([sl]);
          } else {
            const lastHour = prevChunk[prevChunk.length - 1].jam_ke;
            if (sl.jam_ke === lastHour || sl.jam_ke === lastHour + 1) {
              prevChunk.push(sl);
            } else {
              chunks.push([sl]);
            }
          }
        }

        chunks.forEach((chunk, idx) => {
          const jamList = Array.from(new Set(chunk.map((c) => c.jam_ke))).sort(
            (a, b) => a - b,
          );
          const first = chunk[0];
          const last = chunk[chunk.length - 1];
          const jamLabel =
            jamList.length === 1
              ? `Jam ke-${jamList[0]}`
              : `Jam ke-${jamList[0]}–${jamList[jamList.length - 1]}`;

          let covered = false;
          if (checkCoverage) {
            const matches = todayJurnals.filter(
              (j) =>
                j.kelas_id === first.kelas_id && j.mapel_id === first.mapel_id,
            );
            for (const jm of matches) {
              const parsedHours = parseJamNumbersClient(jm.jam_ke);
              if (
                parsedHours.size === 0 ||
                jamList.some((h) => parsedHours.has(h)) ||
                chunks.length === 1
              ) {
                covered = true;
                break;
              }
            }
          }

          blocks.push({
            key: `${groupKey}::${idx}`,
            hari: first.hari,
            kelas_id: first.kelas_id,
            kelas_nama: first.kelas?.nama || "-",
            mapel_id: first.mapel_id,
            mapel_nama: first.mapel?.nama || "-",
            jam_list: jamList,
            jam_label: jamLabel,
            waktu_mulai: first.waktu_mulai,
            waktu_selesai: last.waktu_selesai,
            tipe_pekan: first.tipe_pekan,
            is_covered: covered,
          });
        });
      }

      return blocks.sort((a, b) => {
        const da = WEEK_DAYS.indexOf(a.hari);
        const db = WEEK_DAYS.indexOf(b.hari);
        if (da !== db) return da - db;
        return (a.jam_list[0] ?? 99) - (b.jam_list[0] ?? 99);
      });
    },
    [todayJurnals],
  );

  const todayBlocks = useMemo(() => {
    const todaySlots = jadwal.filter(
      (j) => j.hari.toLowerCase() === todayDayName.toLowerCase(),
    );
    return buildMergedBlocks(todaySlots, true);
  }, [jadwal, todayDayName, buildMergedBlocks]);

  const weeklyBlocksByDay = useMemo(() => {
    const allBlocks = buildMergedBlocks(jadwal, false);
    const byDay = new Map<string, MergedBlock[]>();
    for (const day of WEEK_DAYS) {
      byDay.set(
        day,
        allBlocks.filter((b) => b.hari.toLowerCase() === day.toLowerCase()),
      );
    }
    return byDay;
  }, [jadwal, buildMergedBlocks]);

  const filledTodayCount = todayBlocks.filter((b) => b.is_covered).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#550000]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf5f5] px-2.5 py-0.5">
              <Info size={13} />
              {currentPekan === "ganjil"
                ? "Pekan Ganjil (Pekan 1 & 3)"
                : "Pekan Genap (Pekan 2 & 4)"}
            </span>
            <span className="text-[#44403c]">
              {formatTanggalLongID(todayISO)}
            </span>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-[#550000]">
            <CalendarDays size={24} className="text-[#550000]" /> Jadwal Mengajar
          </h1>
          <p className="mt-1 text-sm text-[#44403c]">
            Pengampu: <strong className="text-[#1a1a1a]">{teacherName}</strong>
            {todayBlocks.length > 0 && (
              <>
                {" · "}
                <span className="tabular-nums">
                  {filledTodayCount}/{todayBlocks.length} sesi hari ini telah diisi jurnalnya
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] p-1">
            <button
              type="button"
              onClick={() => setViewMode("hari_ini")}
              className={`cursor-pointer rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                viewMode === "hari_ini"
                  ? "bg-[#550000] text-white"
                  : "text-[#44403c] hover:bg-[#f6f1e8]"
              }`}
            >
              Hari Ini ({todayDayName})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pekanan")}
              className={`cursor-pointer rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                viewMode === "pekanan"
                  ? "bg-[#550000] text-white"
                  : "text-[#44403c] hover:bg-[#f6f1e8]"
              }`}
            >
              Jadwal Sepekan (Sen–Sab)
            </button>
          </div>

          <button
            type="button"
            onClick={loadSchedule}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e7e2da] bg-white px-3 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Segarkan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 rounded-[12px] border border-[#e7e2da] bg-white py-16 text-sm text-[#44403c] shadow-xs">
          <Loader2 size={20} className="animate-spin text-[#550000]" />
          Memuat jadwal mengajar dari database...
        </div>
      ) : viewMode === "hari_ini" ? (
        todayBlocks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[12px] border border-[#e7e2da] bg-white px-6 py-14 text-center shadow-xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </span>
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              Tidak ada jadwal mengajar hari ini ({todayDayName})
            </h2>
            <p className="max-w-md text-sm text-[#44403c]">
              Anda tetap dapat mencatat jurnal tambahan atau melihat jadwal hari lain lewat tab{" "}
              <button
                type="button"
                onClick={() => setViewMode("pekanan")}
                className="cursor-pointer font-semibold text-[#550000] underline"
              >
                Jadwal Sepekan
              </button>
              .
            </p>
            <Link
              href="/jurnal/tambah"
              className="mt-2 inline-flex items-center gap-2 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#380000]"
            >
              <BookMarked size={14} /> Isi Jurnal Manual
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {todayBlocks.map((b) => {
              const fillHref = `/jurnal/tambah?pegawai_id=${encodeURIComponent(
                pegawaiId,
              )}&kelas_id=${encodeURIComponent(
                b.kelas_id,
              )}&mapel_id=${encodeURIComponent(
                b.mapel_id,
              )}&mapel_nama=${encodeURIComponent(
                b.mapel_nama,
              )}&tanggal=${encodeURIComponent(
                todayISO,
              )}&jam_ke=${encodeURIComponent(b.jam_list.join(","))}`;

              return (
                <div
                  key={b.key}
                  className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs transition-colors duration-150 hover:border-[#b89758]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-[10px] border border-[#e7e2da] bg-[#fdf5f5] text-[#550000]">
                        <span className="text-[10px] font-semibold">Jam</span>
                        <span className="text-lg font-bold tabular-nums leading-tight">
                          {b.jam_list.length === 1
                            ? b.jam_list[0]
                            : `${b.jam_list[0]}–${b.jam_list[b.jam_list.length - 1]}`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#1a1a1a]">
                          {b.mapel_nama}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-medium">
                          <span className="inline-flex items-center gap-1 rounded-[8px] bg-[#faf6ee] px-2.5 py-1 tabular-nums text-[#44403c]">
                            <Clock size={12} /> {b.waktu_mulai}–{b.waktu_selesai}
                          </span>
                          <span className="inline-flex rounded-[8px] border border-[#e7e2da] bg-[#fdf5f5] px-2.5 py-1 font-semibold text-[#550000]">
                            Kelas {b.kelas_nama}
                          </span>
                        </div>
                      </div>
                    </div>

                    {b.is_covered ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={13} /> Sudah Diisi
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        <AlertCircle size={13} /> Belum Diisi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#f0ece4] pt-3">
                    <span className="text-xs text-[#44403c]">
                      {b.jam_label} ({b.jam_list.length} JP)
                    </span>
                    {b.is_covered ? (
                      <Link
                        href="/jurnal"
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#f6f1e8]"
                      >
                        Lihat di Daftar Jurnal
                      </Link>
                    ) : (
                      <Link
                        href={fillHref}
                        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000]"
                      >
                        <BookMarked size={14} /> Isi Jurnal Sekarang
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WEEK_DAYS.map((day) => {
            const list = weeklyBlocksByDay.get(day) || [];
            const isToday = day.toLowerCase() === todayDayName.toLowerCase();
            return (
              <div
                key={day}
                className={`flex flex-col overflow-hidden rounded-[12px] border bg-white shadow-xs ${
                  isToday ? "border-[#550000]" : "border-[#e7e2da]"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b px-4 py-3 ${
                    isToday
                      ? "border-[#e7e2da] bg-[#fdf5f5]"
                      : "border-[#f0ece4] bg-[#faf6ee]"
                  }`}
                >
                  <span className="font-bold text-[#1a1a1a]">{day}</span>
                  <span className="text-xs font-semibold tabular-nums text-[#550000]">
                    {isToday ? "Hari Ini · " : ""}
                    {list.length} sesi
                  </span>
                </div>

                {list.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-6 text-xs text-[#78716c]">
                    Tidak ada jadwal pada hari {day}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#f0ece4]">
                    {list.map((b) => (
                      <div key={b.key} className="p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[#1a1a1a]">
                              {b.mapel_nama}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#44403c]">
                              <span className="rounded bg-[#fdf5f5] px-1.5 py-0.5 font-semibold text-[#550000]">
                                {b.kelas_nama}
                              </span>
                              <span className="tabular-nums">
                                {b.jam_label} ({b.waktu_mulai}–{b.waktu_selesai})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
