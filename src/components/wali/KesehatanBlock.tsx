"use client";

import React from "react";
import { Stethoscope } from "lucide-react";
import type { WaliDashboardData } from "./types";

function hygieneTone(val: string | null) {
  if (!val) return "bg-slate-100 text-slate-500";
  const low = val.toLowerCase();
  if (low.includes("baik") || low.includes("bersih")) return "bg-emerald-100 text-emerald-800";
  if (low.includes("cukup")) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function KesehatanBlock({
  kesehatan,
}: {
  kesehatan: WaliDashboardData["kesehatan"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/70">
          <Stethoscope size={18} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            7. Riwayat Kesehatan
          </h2>
          <p className="text-[11px] text-slate-500">
            Tinggi/berat badan, riwayat sakit & kebersihan diri
          </p>
        </div>
      </div>

      {!kesehatan ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-xs text-slate-500">
          Belum ada catatan pemeriksaan kesehatan yang diinput oleh petugas / musyrif.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-cyan-50/60 border border-cyan-200/70 p-3.5">
              <div className="text-[10px] font-extrabold uppercase text-cyan-800">Tinggi Badan</div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {kesehatan.tinggiBadan ?? "-"} <span className="text-xs font-bold">cm</span>
              </div>
            </div>
            <div className="rounded-2xl bg-cyan-50/60 border border-cyan-200/70 p-3.5">
              <div className="text-[10px] font-extrabold uppercase text-cyan-800">Berat Badan</div>
              <div className="mt-1 text-xl font-black text-slate-900">
                {kesehatan.beratBadan ?? "-"} <span className="text-xs font-bold">kg</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
              <div className="text-[10px] font-extrabold uppercase text-slate-500">
                Pemeriksaan Terakhir
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {new Date(kesehatan.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { label: "Rambut", val: kesehatan.rambut },
              { label: "Kuku", val: kesehatan.kuku },
              { label: "Telinga", val: kesehatan.telinga },
              { label: "Gigi", val: kesehatan.gigi },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 flex items-center justify-between"
              >
                <span className="font-bold text-slate-600">{item.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${hygieneTone(
                    item.val
                  )}`}
                >
                  {item.val || "-"}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs space-y-1.5">
            <div>
              <span className="font-bold text-slate-700">Riwayat Sakit: </span>
              <span className="text-slate-600">
                {kesehatan.riwayatSakit || "Tidak ada keluhan / sehat"}
              </span>
            </div>
            {/* TODO: Konfirmasi Mudir terkait detail parameter kesehatan & kecukupan gizi */}
            {kesehatan.catatanGizi && (
              <div>
                <span className="font-bold text-slate-700">Kesehatan & Kecukupan Gizi: </span>
                <span className="text-slate-600">{kesehatan.catatanGizi}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Baik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Cukup
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
