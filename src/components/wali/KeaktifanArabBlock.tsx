"use client";

import React from "react";
import { Languages } from "lucide-react";
import type { WaliDashboardData } from "./types";

function getArabBadgeStyle(predikat: string) {
  const low = predikat.toLowerCase();
  if (low === "baik") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (low === "cukup") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }
  return "bg-rose-100 text-rose-800 border-rose-300";
}

export default function KeaktifanArabBlock({
  data,
}: {
  data: WaliDashboardData["keaktifanArab"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-200/70">
            <Languages size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              2. Keaktifan Berbahasa Arab
            </h2>
            <p className="text-[11px] text-slate-500">Evaluasi komunikasi harian di asrama</p>
          </div>
        </div>

        {!data ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Penilaian keaktifan berbahasa Arab untuk semester ini belum diinput oleh Musyrif.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-bold text-slate-600">Predikat Saat Ini</span>
              <span
                className={`inline-flex items-center rounded-full border px-4 py-1 text-sm font-black ${getArabBadgeStyle(
                  data.predikat
                )}`}
              >
                {data.predikat}
              </span>
            </div>

            {data.catatan && (
              <div className="rounded-2xl bg-sky-50/50 p-3.5 border border-sky-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-sky-900 block mb-0.5">Catatan Petugas:</span>
                {data.catatan}
              </div>
            )}

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Diperbarui: {new Date(data.tanggal).toLocaleDateString("id-ID")}</span>
              {data.petugas && <span>Oleh: {data.petugas}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-bold text-slate-400">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Baik
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-2" /> Cukup
        <span className="inline-block h-2 w-2 rounded-full bg-rose-500 ml-2" /> Kurang
      </div>
    </section>
  );
}
