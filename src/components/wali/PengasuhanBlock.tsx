"use client";

import React from "react";
import { HeartHandshake } from "lucide-react";
import { PENGASUHAN_ASPEK } from "@/lib/pengasuhanRules";
import type { WaliDashboardData } from "./types";

function skalaBadge(val: string) {
  if (val === "Sangat Baik") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (val === "Baik") return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

export default function PengasuhanBlock({
  pengasuhan,
}: {
  pengasuhan: WaliDashboardData["pengasuhan"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70">
          <HeartHandshake size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            5. Pengasuhan
          </h2>
          <p className="text-[11px] text-slate-500">Evaluasi adab, kemandirian & pembinaan asrama</p>
        </div>
      </div>

      {!pengasuhan ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-500">
          Penilaian pengasuhan semester ini belum diinput oleh Musyrif/Pengasuh.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50">
            {PENGASUHAN_ASPEK.map((aspek) => {
              const nilai = (pengasuhan as any)[aspek.key] || "-";
              return (
                <div
                  key={aspek.key}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-semibold text-slate-700">{aspek.label}</span>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${skalaBadge(
                      nilai
                    )}`}
                  >
                    {nilai}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-teal-200/70 bg-teal-50/50 p-3.5 text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
              Catatan Tambahan Musyrif / Pengasuh
            </div>
            <p className="font-semibold text-slate-800 leading-relaxed">
              &ldquo;{pengasuhan.catatan_musyrif}&rdquo;
            </p>
            {pengasuhan.musyrifNama && (
              <div className="mt-1.5 text-[10px] text-teal-700 font-bold">
                — {pengasuhan.musyrifNama} ({new Date(pengasuhan.tanggal).toLocaleDateString("id-ID")})
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Sangat Baik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500" /> Baik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> Kurang
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
