"use client";

import React from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import type { WaliDashboardData } from "./types";

export default function PelanggaranBlock({
  pelanggaran,
}: {
  pelanggaran: WaliDashboardData["pelanggaran"];
}) {
  const list = pelanggaran || [];

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/70">
          <ShieldAlert size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            3. Riwayat Pelanggaran
          </h2>
          <p className="text-[11px] text-slate-500">Catatan kedisiplinan & pembinaan</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-6 text-center">
          <CheckCircle2 size={28} className="text-emerald-600 mb-2" />
          <p className="text-xs font-extrabold text-emerald-900">
            Alhamdulillah, belum ada catatan pelanggaran.
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Semoga Ananda senantiasa istiqamah dalam adab dan kedisiplinan.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {list.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-400 text-[10px]">
                  {new Date(item.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
                  {item.kategori || "pembinaan"}
                </span>
              </div>
              <div>
                <span className="font-bold text-rose-950 block">Pelanggaran: {item.pelanggaran}</span>
                <span className="text-slate-600 block mt-0.5">
                  <strong className="text-slate-700">Sanksi:</strong> {item.sanksi}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
