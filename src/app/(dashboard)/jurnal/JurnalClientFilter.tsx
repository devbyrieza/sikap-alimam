"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  RotateCcw,
  Eye,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getJenjangFromKelas } from "@/lib/kelas";
import {
  DAY_SHORT_ID,
  MONTH_SHORT_ID,
  getDayIndexUTC,
} from "@/lib/jurnalDateUtils";
import JurnalDetailModal from "@/components/JurnalDetailModal";

export type KelasObject = {
  id?: string;
  nama: string;
  jenjang?: string | null;
};

export type JurnalRow = {
  id: string;
  tanggal: string;
  asatidz: string;
  mapel: string;
  kelas: string;
  kelas_jenjang?: string | null;
  jam_ke: string;
  materi: string;
  learning_outcome?: string;
  kegiatan: string;
  catatan: string;
};

function normalizeKelasDisplay(rawName: string, rawJenjang?: string | null): string {
  const clean = (rawName || "").trim();
  const upper = clean.toUpperCase();
  const jenjang = getJenjangFromKelas(clean, rawJenjang);
  if (
    jenjang === "IL" ||
    upper === "IL" ||
    upper.includes("I'DAD") ||
    upper.includes("IDAD") ||
    upper.includes("LUGHOW")
  ) {
    return "IL";
  }
  if (/^(7|8|9)$/.test(clean)) return `${clean} MTs`;
  if (/^(10|11|12)$/.test(clean)) return `${clean} MA`;
  return clean || "-";
}

function formatTanggal(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "-";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = getDayIndexUTC(iso);
  return `${DAY_SHORT_ID[dow]}, ${d} ${MONTH_SHORT_ID[m - 1] || ""} ${y}`;
}

export default function JurnalClientFilter({
  data,
  kelasList = [],
  asatidzList = [],
  isAdminSuper = false,
}: {
  data: JurnalRow[];
  kelasList?: (string | KelasObject)[];
  asatidzList?: string[];
  isAdminSuper?: boolean;
}) {
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<string>("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterAsatidz, setFilterAsatidz] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const [selectedJurnal, setSelectedJurnal] = useState<JurnalRow | null>(null);

  const normalizedKelasList = useMemo<KelasObject[]>(() => {
    const list: KelasObject[] = [];
    const seen = new Set<string>();

    if (kelasList.length > 0) {
      for (const k of kelasList) {
        const rawNama = typeof k === "string" ? k : k.nama;
        const rawJenjang = typeof k === "string" ? null : k.jenjang;
        const name = normalizeKelasDisplay(rawNama, rawJenjang);
        if (!seen.has(name)) {
          seen.add(name);
          list.push({
            id: typeof k === "string" ? name : k.id,
            nama: name,
            jenjang: getJenjangFromKelas(name, rawJenjang),
          });
        }
      }
    } else {
      for (const j of data) {
        const name = normalizeKelasDisplay(j.kelas, j.kelas_jenjang);
        if (!seen.has(name)) {
          seen.add(name);
          list.push({
            nama: name,
            jenjang: getJenjangFromKelas(name, j.kelas_jenjang),
          });
        }
      }
    }

    return list;
  }, [kelasList, data]);

  const availableClasses = useMemo(() => {
    if (!filterJenjang) return [];
    return normalizedKelasList.filter((k) => {
      const jenjang = getJenjangFromKelas(k.nama, k.jenjang);
      return jenjang === filterJenjang;
    });
  }, [normalizedKelasList, filterJenjang]);

  const handleJenjangChange = (newJenjang: string) => {
    setFilterJenjang(newJenjang);
    setFilterKelas("");
  };

  const finalAsatidzList = useMemo(() => {
    const set = new Set<string>();
    for (const a of asatidzList) {
      if (a && a.trim()) set.add(a.trim());
    }
    for (const j of data) {
      if (j.asatidz && j.asatidz.trim() && j.asatidz !== "-") {
        set.add(j.asatidz.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [asatidzList, data]);

  const filtered = useMemo(() => {
    return data.filter((j) => {
      if (filterTanggal && j.tanggal !== filterTanggal) return false;
      const canonicalKelas = normalizeKelasDisplay(j.kelas, j.kelas_jenjang);
      if (filterJenjang) {
        const itemJenjang = getJenjangFromKelas(canonicalKelas, j.kelas_jenjang);
        if (itemJenjang !== filterJenjang) return false;
      }
      if (filterKelas && canonicalKelas !== filterKelas) return false;
      if (filterAsatidz && j.asatidz !== filterAsatidz) return false;
      return true;
    });
  }, [data, filterTanggal, filterJenjang, filterKelas, filterAsatidz]);

  const handleReset = () => {
    setFilterTanggal("");
    setFilterJenjang("");
    setFilterKelas("");
    setFilterAsatidz("");
  };

  const isFiltered = Boolean(
    filterTanggal || filterJenjang || filterKelas || filterAsatidz,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3.5 rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs md:p-5">
        <div className="min-w-[150px] flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
            <Calendar size={14} /> Filter Tanggal
          </label>
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          />
        </div>

        <div className="min-w-[160px] flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
            <GraduationCap size={14} /> Filter Jenjang
          </label>
          <select
            value={filterJenjang}
            onChange={(e) => handleJenjangChange(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs font-medium text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          >
            <option value="">Semua Jenjang</option>
            <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
            <option value="IL">IL (I&apos;dad Lughowy)</option>
            <option value="MA">MA (Madrasah Aliyah)</option>
          </select>
        </div>

        <div className="min-w-[160px] flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
            <BookOpen size={14} /> Filter Kelas
          </label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            disabled={!filterJenjang || availableClasses.length === 0}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs text-[#1a1a1a] outline-none focus:border-[#550000] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#78716c]"
          >
            {!filterJenjang ? (
              <option value="">— Pilih Jenjang Dahulu —</option>
            ) : availableClasses.length === 0 ? (
              <option value="">(Belum ada kelas aktif {filterJenjang})</option>
            ) : (
              <>
                <option value="">Semua Kelas di {filterJenjang}</option>
                {availableClasses.map((k) => (
                  <option key={k.nama} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="min-w-[180px] flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
            <User size={14} /> Filter Guru
          </label>
          <select
            value={filterAsatidz}
            onChange={(e) => setFilterAsatidz(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-xs text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          >
            <option value="">Semua Guru</option>
            {finalAsatidzList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}

        <div className="ml-auto rounded-full border border-[#e7e2da] bg-[#fdf5f5] px-3.5 py-1.5 text-xs font-bold tabular-nums text-[#550000]">
          {filtered.length} Jurnal
        </div>
      </div>

      {/* Control Bar: View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-[12px] border border-[#e7e2da] bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#550000]">
          <Sparkles size={15} className="text-[#b89758]" />
          <span>Tampilan Jurnal</span>
        </div>

        <div className="flex gap-1.5 rounded-[10px] border border-[#e7e2da] bg-[#faf6ee] p-1">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              viewMode === "card"
                ? "bg-[#550000] text-white"
                : "text-[#44403c] hover:bg-white"
            }`}
          >
            <LayoutGrid size={13} />
            <span>Kartu</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              viewMode === "table"
                ? "bg-[#550000] text-white"
                : "text-[#44403c] hover:bg-white"
            }`}
          >
            <TableIcon size={13} />
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[12px] border border-[#e7e2da] bg-white px-5 py-14 text-center shadow-xs">
          <BookOpen size={40} className="mx-auto mb-3 text-[#ddc192]" />
          <div className="text-base font-bold text-[#1a1a1a]">
            Belum ada jurnal yang sesuai dengan filter
          </div>
          <div className="mt-1 text-xs text-[#44403c]">
            Coba ubah filter tanggal, jenjang, kelas, atau guru pengampu di atas.
          </div>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => {
            const jenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);

            return (
              <div
                key={j.id}
                className="flex flex-col justify-between gap-3.5 rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs transition-colors duration-150 hover:border-[#b89758]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#e7e2da] bg-[#fdf5f5] px-2.5 py-1 text-xs font-semibold text-[#550000]">
                    <Calendar size={12} />
                    {formatTanggal(j.tanggal)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded-[8px] border border-[#e7e2da] bg-[#faf6ee] px-2 py-0.5 text-[11px] font-semibold text-[#44403c]">
                      {jenjang}
                    </span>
                    <span className="rounded-[8px] bg-[#550000] px-2 py-0.5 text-[11px] font-semibold text-white">
                      {j.kelas}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold leading-snug text-[#1a1a1a]">
                    {j.mapel}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#44403c]">
                    <User size={13} className="text-[#b89758]" />
                    <span>{j.asatidz}</span>
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#f0ece4] bg-[#fcfaf8] p-3 text-xs text-[#44403c]">
                  <div className="mb-0.5 font-semibold text-[#550000]">Materi:</div>
                  <div className="line-clamp-2">{j.materi}</div>
                </div>

                <div className="flex items-center justify-between border-t border-[#f0ece4] pt-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#550000]">
                    <Clock size={13} className="text-[#b89758]" />
                    <span>{j.jam_ke !== "-" ? `Jam ke-${j.jam_ke}` : "Reguler"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedJurnal(j)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-[#550000] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000]"
                  >
                    <Eye size={13} className="text-[#ddc192]" />
                    <span>Detail</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white shadow-xs">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e7e2da] bg-[#faf6ee] text-[#1a1a1a]">
                  <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                  <th className="px-4 py-2.5 font-semibold">Guru Pengampu</th>
                  <th className="px-4 py-2.5 font-semibold">Mata Pelajaran</th>
                  <th className="px-4 py-2.5 text-center font-semibold">
                    Jenjang &amp; Kelas
                  </th>
                  <th className="px-4 py-2.5 text-center font-semibold">Jam</th>
                  <th className="px-4 py-2.5 font-semibold">Materi</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => {
                  const jenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);

                  return (
                    <tr
                      key={j.id}
                      className="border-b border-[#f0ece4] transition-colors duration-150 hover:bg-[#faf6ee]"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-[#550000]">
                        {formatTanggal(j.tanggal)}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[#1a1a1a]">
                        {j.asatidz}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                        {j.mapel}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="rounded-[8px] border border-[#e7e2da] bg-[#faf6ee] px-2 py-0.5 text-[11px] font-semibold text-[#44403c]">
                            {jenjang}
                          </span>
                          <span className="rounded-[8px] bg-[#550000] px-2 py-0.5 text-[11px] font-semibold text-white">
                            {j.kelas}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span className="rounded-[8px] border border-[#e7e2da] bg-[#fdf5f5] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#550000]">
                          {j.jam_ke}
                        </span>
                      </td>
                      <td
                        className="max-w-[240px] truncate px-4 py-2.5 text-[#44403c]"
                        title={j.materi}
                      >
                        {j.materi}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedJurnal(j)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-[10px] bg-[#550000] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#380000]"
                        >
                          <Eye size={12} className="text-[#ddc192]" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedJurnal && (
        <JurnalDetailModal
          isOpen={!!selectedJurnal}
          onClose={() => setSelectedJurnal(null)}
          data={selectedJurnal}
          isAdminSuper={isAdminSuper}
        />
      )}
    </div>
  );
}
