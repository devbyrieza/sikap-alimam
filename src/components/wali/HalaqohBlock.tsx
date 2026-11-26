"use client";

import React from "react";
import { BookHeart } from "lucide-react";
import type { WaliDashboardData } from "./types";

const NAMA_BULAN = [
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
];

export default function HalaqohBlock({
  halaqoh,
}: {
  halaqoh: WaliDashboardData["halaqoh"];
}) {
  if (!halaqoh) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200/70">
            <BookHeart size={18} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            6. Halaqoh
          </h2>
        </div>
        <p className="text-xs text-slate-500">Data halaqoh belum tersedia.</p>
      </section>
    );
  }

  const bulanLabel = NAMA_BULAN[(halaqoh.bulan - 1) % 12] || "";

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200/70">
            <BookHeart size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              6. Halaqoh
            </h2>
            <p className="text-[11px] text-slate-500">
              {halaqoh.kelompokNama || "Kelompok Halaqoh"}
              {halaqoh.pengampuNama ? ` · ${halaqoh.pengampuNama}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan otomatis Total Dihafal & Target */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-purple-50/70 border border-purple-200/70 p-3.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
            Total Dihafal (Otomatis)
          </div>
          <div className="mt-1 text-xl font-black text-purple-950">
            {halaqoh.totalDihafalJuz} <span className="text-xs font-bold">Juz</span>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Target Halaqoh
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">
            {halaqoh.targetJuz} <span className="text-xs font-bold">Juz</span>
          </div>
        </div>
      </div>

      {/* Capaian Bulan Ini & Kehadiran S/I/A */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-700">
            Capaian {bulanLabel} {halaqoh.tahun}
          </span>
          <span className="font-bold text-purple-700">
            {halaqoh.capaianBulanIni.jumlahSetoran} setoran ({halaqoh.capaianBulanIni.totalJuz} juz)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl bg-white border border-slate-200/70 py-1.5">
            <span className="text-slate-400 block text-[10px]">Sakit</span>
            <span className="font-black text-amber-700">{halaqoh.capaianBulanIni.sakit}</span>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/70 py-1.5">
            <span className="text-slate-400 block text-[10px]">Izin</span>
            <span className="font-black text-sky-700">{halaqoh.capaianBulanIni.izin}</span>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/70 py-1.5">
            <span className="text-slate-400 block text-[10px]">Alpa</span>
            <span className="font-black text-rose-700">{halaqoh.capaianBulanIni.alfa}</span>
          </div>
        </div>
      </div>

      {/* Daftar Setoran Terbaru */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
          Riwayat Setoran Halaqoh Terbaru
        </div>
        {halaqoh.setoranTerbaru.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
            Belum ada catatan setoran halaqoh.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {halaqoh.setoranTerbaru.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {s.surahNama} ({s.ayatDari}–{s.ayatKe})
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    {s.jenis} · {s.jumlahHalaman} hal · {s.kehadiran}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-purple-800">{s.nilaiAkhir}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(s.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
