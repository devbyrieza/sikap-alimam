"use client";

import React, { useState, useEffect } from "react";
import { Search, Sun, Moon, Cloud, ArrowLeft, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  subuh:   { label: "Subuh",         icon: <Sun size={18} />,   tone: "bg-amber-50 text-amber-600 border-amber-200" },
  maghrib: { label: "Ba'da Maghrib", icon: <Moon size={18} />,  tone: "bg-violet-50 text-violet-600 border-violet-200" },
  dhuha:   { label: "Dhuha",         icon: <Cloud size={18} />, tone: "bg-sky-50 text-sky-600 border-sky-200" },
};

export default function BadalHalaqohPage() {
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // mode=all ensures we get ALL groups regardless of who is logged in
    fetch("/api/halaqoh/kelompok?mode=all")
      .then(res => res.json())
      .then(data => {
        setKelompokList(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = kelompokList.filter(k =>
    k.nama_kelompok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.pegawai?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const tanggal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/halaqoh"
          aria-label="Kembali ke halaqoh"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Setor badal (gantikan pengampu)</h1>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Cari kelompok ustaz yang berhalangan hadir dan input setorannya.
          </p>
        </div>
      </div>

      {/* Pencarian */}
      <div className="relative w-full max-w-lg">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama kelompok atau nama ustaz"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-5 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary"
        />
      </div>

      {/* Daftar */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-3.5 h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary" />
          <div className="font-semibold text-slate-400">Mencari data kelompok...</div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center font-semibold text-slate-500">
          Tidak ada kelompok yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map(k => {
            const info = SESI_INFO[k.sesi] || SESI_INFO.subuh;
            return (
              <div
                key={k.id}
                className="flex flex-col justify-between gap-5 rounded-2xl border border-[#e8d5b7] bg-white p-5 shadow-sm shadow-primary/5"
              >
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${info.tone}`}>
                      {info.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-slate-500">{k.nama_kelompok}</div>
                      <div className="text-base font-extrabold text-slate-900">{info.label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
                    <UserCheck size={14} /> {k.pegawai?.nama_lengkap || "Tanpa pengampu"}
                  </div>
                </div>

                <Link
                  href={`/halaqoh/input?kelompok=${k.id}&sesi=${k.sesi}&tanggal=${tanggal}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-[13px] font-bold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white"
                >
                  Isi catatan sesi <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}