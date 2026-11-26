"use client";

import React from "react";
import { User, School, Home, UserCheck, Calendar } from "lucide-react";
import type { WaliDashboardData } from "./types";

function formatTanggal(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BiodataBlock({
  biodata,
}: {
  biodata: WaliDashboardData["biodata"];
}) {
  const ttlParts = [biodata.tempatLahir, formatTanggal(biodata.tanggalLahir)].filter(Boolean);
  const ttlText = ttlParts.length > 0 ? ttlParts.join(", ") : "-";

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              1. Biodata Singkat
            </h2>
            <p className="text-[11px] text-slate-500">Identitas & penempatan aktif Ananda</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nama Lengkap
            </div>
            <div className="mt-0.5 font-extrabold text-slate-900 text-base">
              {biodata.nama}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NIS
                </div>
                <div className="font-bold text-slate-800 text-xs">{biodata.nis || "-"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NISN
                </div>
                <div className="font-bold text-slate-800 text-xs">{biodata.nisn || "-"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Tempat, Tanggal Lahir
                </span>
                <span className="font-bold text-slate-800">{ttlText}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <School size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Kelas Aktif
                </span>
                <span className="font-bold text-slate-800">{biodata.kelasAktif}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Home size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Kamar Aktif
                </span>
                <span className="font-bold text-slate-800">{biodata.kamarAktif}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserCheck size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Musyrif Aktif
                </span>
                <span className="font-bold text-slate-800">{biodata.musyrifAktif}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
