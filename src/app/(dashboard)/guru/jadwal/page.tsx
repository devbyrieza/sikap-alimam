"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Info, CalendarDays } from "lucide-react";

export default function GuruJadwalPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPekan, setCurrentPekan] = useState("ganjil");

  useEffect(() => {
    // In real app, calculate whether this week is Ganjil or Genap based on Academic Calendar
    // and pass the logged-in Guru's ID to the API.
    const weekNumber = 1; // Mock: Pekan 1
    setCurrentPekan(weekNumber % 2 !== 0 ? "ganjil" : "genap");

    setLoading(true);
    setTimeout(() => {
      // Data statis untuk demo
      setJadwal([
        { id: "1", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran" } },
        { id: "2", jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran" } },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-7">
      {/* Banner */}
      <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#7e141a] to-[#4a080d] p-7 text-white shadow-xl shadow-primary/20 sm:p-9">
        <CalendarDays size={170} className="pointer-events-none absolute -right-4 -top-6 opacity-10" />

        <div className="relative z-10">
          <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Jadwal mengajar hari ini</h1>
          <p className="text-sm text-white/80">Selamat bertugas mencetak generasi Rabbani, Ustadz!</p>
        </div>

        <div className="relative z-10 sm:text-right">
          <p className="mb-1.5 text-xs font-medium text-[#ddc192]">Status pekan saat ini</p>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2 backdrop-blur">
            <Info size={16} />
            <span className="text-sm font-bold uppercase tracking-wide">
              {currentPekan === "ganjil" ? "Pekan ganjil (1/3)" : "Pekan genap (2/4)"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : jadwal.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle size={28} />
          </span>
          <h2 className="text-xl font-bold text-slate-800">Alhamdulillah!</h2>
          <p className="text-sm text-slate-500">Anda tidak memiliki jadwal mengajar pada hari ini.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {jadwal.map((j) => (
            <div
              key={j.id}
              className="flex flex-col justify-between gap-5 rounded-3xl border border-[#ebdcc3] bg-white p-6 shadow-sm shadow-primary/5 transition-shadow hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#fae4e4] bg-[#fdf5f5] text-primary">
                  <span className="text-[10px] font-bold uppercase">Jam ke</span>
                  <span className="text-2xl font-black leading-none">{j.jam_ke}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900">{j?.mapel?.nama}</h3>
                  <div className="flex flex-wrap gap-2 text-sm font-medium">
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
                      <Clock size={14} /> {j.waktu_mulai} - {j.waktu_selesai}
                    </span>
                    <span className="rounded-lg border border-[#fae4e4] bg-[#fdf5f5] px-3 py-1 text-primary">
                      Kelas {j?.kelas?.nama}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-light">
                Isi jurnal
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}