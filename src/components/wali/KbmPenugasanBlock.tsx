"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  ClipboardList,
  Award,
  Printer,
  Loader2,
  AlertCircle,
  ChevronDown,
  Lock,
} from "lucide-react";
import type { WaliDashboardData } from "./types";
import { getMapelKkm, getScoreTier } from "@/lib/kkm";

interface JurnalItem {
  id: string;
  tanggal: string;
  jamKe: string | null;
  materi: string;
  subMateri: string | null;
  guru: string;
  mapel: string;
}

function scoreBadgeTone(n: number | null, mapelNama: string) {
  const tier = getScoreTier(n, mapelNama);
  if (tier === "kosong") return "bg-slate-100 text-slate-400";
  if (tier === "atas") return "bg-emerald-100 text-emerald-800";
  if (tier === "pas") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function KbmPenugasanBlock({
  santriId,
  semester,
  tahunAjaran,
  kbm,
}: {
  santriId: string;
  semester: string;
  tahunAjaran: string;
  kbm: WaliDashboardData["kbm"];
}) {
  const [selectedMapel, setSelectedMapel] = useState("");
  const [jurnalList, setJurnalList] = useState<JurnalItem[]>([]);
  const [jurnalPage, setJurnalPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingJurnal, setLoadingJurnal] = useState(false);
  const [errorJurnal, setErrorJurnal] = useState<string | null>(null);

  const fetchJurnal = useCallback(
    async (mapelId: string, pageNum: number, append: boolean) => {
      if (!mapelId) {
        setJurnalList([]);
        setHasMore(false);
        return;
      }
      setLoadingJurnal(true);
      setErrorJurnal(null);
      try {
        const res = await fetch(
          `/api/wali/jurnal?santri_id=${encodeURIComponent(santriId)}&mapel_id=${encodeURIComponent(
            mapelId
          )}&page=${pageNum}&limit=5`
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Gagal memuat jurnal mengajar");
        }
        setJurnalList((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
        setHasMore(Boolean(json.hasMore));
      } catch (err: any) {
        setErrorJurnal(err?.message || "Gagal memuat jurnal mengajar");
      } finally {
        setLoadingJurnal(false);
      }
    },
    [santriId]
  );

  useEffect(() => {
    setSelectedMapel("");
    setJurnalList([]);
    setJurnalPage(1);
    setHasMore(false);
  }, [santriId]);

  const handleMapelChange = (val: string) => {
    setSelectedMapel(val);
    setJurnalPage(1);
    fetchJurnal(val, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = jurnalPage + 1;
    setJurnalPage(nextPage);
    fetchJurnal(selectedMapel, nextPage, true);
  };

  if (!kbm) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs text-slate-500">Data KBM & Penugasan belum tersedia.</p>
      </section>
    );
  }

  const { presensiJpl, mapelOptions, ujianNilai, ekskul, sikapKedisiplinan, raporButtons } = kbm;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70">
          <BookOpen size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            4. Kegiatan KBM & Penugasan
          </h2>
          <p className="text-[11px] text-slate-500">
            Presensi JPL, Jurnal Mengajar per Mapel, Nilai & Rapor
          </p>
        </div>
      </div>

      {/* 4a. Presensi dalam satuan JPL */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
          a. Ringkasan Ketidakhadiran KBM (Satuan Jam Pelajaran / JPL)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase text-amber-800">Sakit</div>
            <div className="mt-1 text-2xl font-black text-amber-950">{presensiJpl.sakit}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              JPL
            </div>
          </div>
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase text-sky-800">Izin</div>
            <div className="mt-1 text-2xl font-black text-sky-950">{presensiJpl.izin}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
              JPL
            </div>
          </div>
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase text-rose-800">Alpa</div>
            <div className="mt-1 text-2xl font-black text-rose-950">{presensiJpl.alpha}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
              JPL
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Keterangan:</strong> Perhitungan kehadiran menggunakan satuan{" "}
          <strong className="text-slate-700">JPL (Jam Pelajaran)</strong>, bukan per hari (misal: 2 JPL berarti tidak mengikuti 2 jam pelajaran).
        </p>
      </div>

      {/* 4b. Jurnal Mengajar per Mapel */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ClipboardList size={14} /> b. Jurnal Mengajar Guru
            </h3>
            <p className="text-[11px] text-slate-400">
              Pilih mata pelajaran untuk melihat materi yang telah dipelajari Ananda
            </p>
          </div>
          <select
            value={selectedMapel}
            onChange={(e) => handleMapelChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white sm:w-60"
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {mapelOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        </div>

        {!selectedMapel ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500 font-medium">
            Silakan pilih mata pelajaran pada dropdown di atas untuk melihat riwayat materi pelajaran Ananda.
          </div>
        ) : loadingJurnal && jurnalList.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Memuat jurnal mengajar...
          </div>
        ) : errorJurnal ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} /> {errorJurnal}
          </div>
        ) : jurnalList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
            Belum ada entri jurnal mengajar untuk mata pelajaran ini.
          </div>
        ) : (
          <div className="space-y-2">
            {jurnalList.map((j) => (
              <div
                key={j.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900">{j.materi}</div>
                  {j.subMateri && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{j.subMateri}</div>
                  )}
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Pengajar: {j.guru}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] font-bold text-slate-500 sm:text-right">
                  {new Date(j.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {j.jamKe && <span className="block text-[10px] text-slate-400">Jam ke-{j.jamKe}</span>}
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingJurnal}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingJurnal ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
                Muat Lebih Banyak
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4c. Ujian-ujian, Nilai, Ekskul, Sikap & Kedisiplinan */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Award size={14} /> c. Ujian-ujian, Ekstrakurikuler & Sikap ({semester} · {tahunAjaran})
        </h3>

        {ujianNilai.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-xs text-slate-500">
            Belum ada nilai ujian yang diinput pada semester {semester} ({tahunAjaran}).
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Mata Pelajaran</th>
                  <th className="px-2 py-2.5 text-center">KKM</th>
                  <th className="px-2.5 py-2.5 text-center">Harian</th>
                  <th className="px-2.5 py-2.5 text-center">PTS</th>
                  <th className="px-2.5 py-2.5 text-center">PAS</th>
                  <th className="px-3 py-2.5 text-center">Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ujianNilai.map((row) => (
                  <tr key={row.mapelId} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-bold text-slate-800">{row.mapelNama}</td>
                    <td className="px-2 py-2 text-center text-[11px] font-bold text-slate-400">
                      {getMapelKkm(row.mapelNama)}
                    </td>
                    <td className="px-2.5 py-2 text-center text-slate-600">
                      {row.harian ?? "—"}
                    </td>
                    <td className="px-2.5 py-2 text-center text-slate-600">{row.pts ?? "—"}</td>
                    <td className="px-2.5 py-2 text-center text-slate-600">{row.pas ?? "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block rounded-lg px-2 py-0.5 font-extrabold ${scoreBadgeTone(
                          row.nilaiAkhir,
                          row.mapelNama
                        )}`}
                      >
                        {row.nilaiAkhir ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ujianNilai.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 px-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Di atas KKM
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Pas KKM
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> Di bawah KKM
            </span>
            <span className="text-slate-400/90">
              · KKM Diniyyah: 85 · Mapel Umum: 80
            </span>
          </div>
        )}

        {/* Ekskul & Sikap/Kedisiplinan (dari Wali Kelas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Ekstrakurikuler
            </div>
            {ekskul.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada nilai ekstrakurikuler.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {ekskul.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{e.namaEkskul}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-extrabold text-[11px]">
                      {e.nilai}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Sikap & Kedisiplinan (Wali Kelas)
            </div>
            {!sikapKedisiplinan ? (
              <p className="text-xs text-slate-400">Belum diinput oleh Wali Kelas.</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Sikap Keseluruhan</span>
                  <span className="font-extrabold text-slate-900">
                    {sikapKedisiplinan.nilaiSikap}
                    {sikapKedisiplinan.skorSikap !== null
                      ? ` (${sikapKedisiplinan.skorSikap})`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Kedisiplinan Keseluruhan</span>
                  <span className="font-extrabold text-slate-900">
                    {sikapKedisiplinan.nilaiKedisiplinan}
                    {sikapKedisiplinan.skorKedisiplinan !== null
                      ? ` (${sikapKedisiplinan.skorKedisiplinan})`
                      : ""}
                  </span>
                </div>
                {sikapKedisiplinan.catatanWaliKelas && (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
                    {sikapKedisiplinan.catatanWaliKelas}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4d. Tombol Cetak Rapor (PTS vs PAS) */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
          d. Cetak Rapor Resmi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {raporButtons.ptsEnabled ? (
            <a
              href={`/rapor/print/${santriId}?semester=${encodeURIComponent(
                semester
              )}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}&mode=pts`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 px-4 py-3 text-xs font-extrabold text-white shadow-sm transition-colors"
            >
              <Printer size={16} />
              Rapor Tengah Semester
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Dinonaktifkan karena Nilai Akhir Semester sudah tersedia"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <Lock size={14} />
              Rapor Tengah Semester (Nonaktif)
            </button>
          )}

          {raporButtons.pasEnabled ? (
            <a
              href={`/rapor/print/${santriId}?semester=${encodeURIComponent(
                semester
              )}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}&mode=pas`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 px-4 py-3 text-xs font-extrabold text-white shadow-sm transition-colors"
            >
              <Printer size={16} />
              Rapor Akhir Semester
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Belum tersedia karena Nilai Akhir Semester belum diinput"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-400 cursor-not-allowed"
            >
              <Lock size={14} />
              Rapor Akhir Semester (Belum Tersedia)
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {raporButtons.hasNilaiAkhirSemester
            ? "Nilai Akhir Semester telah tersedia; silakan cetak Rapor Akhir Semester."
            : "Nilai Akhir Semester belum tersedia; Rapor Tengah Semester aktif untuk dicetak."}
        </p>
      </div>
    </section>
  );
}
