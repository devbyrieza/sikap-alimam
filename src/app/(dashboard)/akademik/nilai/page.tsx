"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Download, BookOpen, Users, TrendingUp, Trophy, Inbox } from "lucide-react";

interface NilaiRow {
  id: string;
  santri: { nama_lengkap: string; nis: string };
  kelas: { nama: string };
  mapel: { nama: string; kategori?: string };
  nilai: number;
  keterangan: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white";

const nilaiTone = (n: number) =>
  n >= 90
    ? "bg-emerald-100 text-emerald-700"
    : n >= 80
    ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";

export default function FilterNilaiPage() {
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [santri, setSantri] = useState("");
  const [kelasList, setKelasList] = useState<{ id: string; nama: string; jenjang?: string }[]>([]);
  const [mapelByKelas, setMapelByKelas] = useState<Record<string, { id: string; nama: string; kategori?: string }[]>>({});

  const [data, setData] = useState<NilaiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch("/api/master")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.kelas) setKelasList(resData.kelas);
        if (resData.mapel) setMapelByKelas(resData.mapel);
      })
      .catch(console.error);
  }, []);

  // Filter mapel list strictly based on selected kelas
  const availableMapelList = useMemo(() => {
    if (kelas && mapelByKelas[kelas]) {
      return mapelByKelas[kelas];
    }
    // Jika tidak ada kelas dipilih, kumpulkan semua mapel unik
    const allM: { id: string; nama: string; kategori?: string }[] = [];
    const seen = new Set<string>();
    Object.values(mapelByKelas).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((m) => {
          if (!seen.has(m.nama)) {
            seen.add(m.nama);
            allM.push(m);
          }
        });
      }
    });
    return allM;
  }, [kelas, mapelByKelas]);

  // Ringkasan dari data yang tampil
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const nilai = data.map((d) => d.nilai);
    const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length;
    return { total: data.length, rata: rata.toFixed(1), tertinggi: Math.max(...nilai) };
  }, [data]);

  // Reset mapel jika kelas berganti
  const handleKelasChange = (newKelasId: string) => {
    setKelas(newKelasId);
    setMapel("");
  };

  const handleFilter = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (kelas) params.append("kelas_id", kelas);
      if (mapel) params.append("mapel_id", mapel);
      if (santri) params.append("santri_id", santri);

      // Mock / query filter
      setTimeout(() => {
        setData([
          {
            id: "1",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7 MTs" },
            mapel: { nama: "Matematika", kategori: "umum" },
            nilai: 85,
            keterangan: "Lulus",
          },
          {
            id: "2",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7 MTs" },
            mapel: { nama: "Akidah", kategori: "syariah" },
            nilai: 92,
            keterangan: "Mumtaz",
          },
        ]);
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const [isLocked, setIsLocked] = useState(false);
  const [loadingLock, setLoadingLock] = useState(false);

  useEffect(() => {
    fetch("/api/setting-nilai")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.is_locked === "boolean") {
          setIsLocked(data.is_locked);
        }
      })
      .catch(console.error);
  }, []);

  const toggleLock = async () => {
    if (!confirm(isLocked ? "Buka kembali akses penginputan nilai untuk seluruh guru?" : "Kunci akses penginputan nilai? Guru tidak akan bisa lagi menyimpan atau mengubah nilai.")) return;
    setLoadingLock(true);
    try {
      const res = await fetch("/api/setting-nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_locked: !isLocked })
      });
      if (res.ok) {
        setIsLocked(!isLocked);
      } else {
        alert("Gagal merubah pengaturan");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLock(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-7">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#7e141a] to-[#4a080d] p-7 text-white shadow-xl shadow-primary/20 sm:p-9 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BookOpen size={180} className="pointer-events-none absolute -right-6 -top-6 opacity-10" />
        <div className="relative z-10">
          <h1 className="mb-2 flex items-center gap-3 text-2xl font-extrabold sm:text-3xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <BookOpen size={22} />
            </span>
            Pusat Data Nilai Akademik
          </h1>
          <p className="max-w-xl text-sm text-white/85 sm:text-base">
            Filter, pantau, dan unduh data nilai santri per kelas dan mata pelajaran.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <button 
            onClick={toggleLock} 
            disabled={loadingLock}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md ${isLocked ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/50' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/50'}`}
          >
            {loadingLock ? (
              <span>Loading...</span>
            ) : isLocked ? (
              <>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span>Akses Guru Dikunci</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                <span>Akses Guru Terbuka</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Kelas</label>
          <select value={kelas} onChange={(e) => handleKelasChange(e.target.value)} className={inputClass}>
            <option value="">Semua kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Mata pelajaran {kelas ? "(sesuai kelas)" : ""}
          </label>
          <select value={mapel} onChange={(e) => setMapel(e.target.value)} className={inputClass}>
            <option value="">{kelas ? "Semua mapel di kelas ini" : "Semua mata pelajaran"}</option>
            {availableMapelList.map((m, idx) => (
              <option key={`${m.id}-${idx}`} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Cari santri</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nama atau NIS santri"
              value={santri}
              onChange={(e) => setSantri(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <button
          onClick={handleFilter}
          className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-light md:col-span-2 lg:col-span-1"
        >
          <Filter size={16} />
          Terapkan filter
        </button>
      </div>

      {/* Hasil */}
      {loading ? (
        <div className="flex justify-center py-14">
          <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : data.length > 0 ? (
        <>
          {stats && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users size={20} />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Jumlah data</p>
                  <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <TrendingUp size={20} />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Rata-rata nilai</p>
                  <p className="text-2xl font-extrabold text-slate-800">{stats.rata}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Trophy size={20} />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Nilai tertinggi</p>
                  <p className="text-2xl font-extrabold text-slate-800">{stats.tertinggi}</p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <h3 className="font-bold text-slate-800">Hasil pencarian: {data.length} data</h3>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download size={16} /> Export Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 sm:px-6">Santri</th>
                    <th className="px-5 py-3.5">Kelas</th>
                    <th className="px-5 py-3.5">Mata pelajaran</th>
                    <th className="px-5 py-3.5 text-center">Nilai</th>
                    <th className="px-5 py-3.5 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                            {(item?.santri?.nama_lengkap || "S").charAt(0)}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{item?.santri?.nama_lengkap}</div>
                            <div className="font-mono text-xs text-slate-500">NIS: {item?.santri?.nis}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                          {item?.kelas?.nama}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">{item?.mapel?.nama}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <span className={`inline-block min-w-[3.25rem] rounded-lg px-3 py-1 text-base font-extrabold ${nilaiTone(item.nilai)}`}>
                          {item.nilai}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <span className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                          {item.keterangan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Inbox size={26} />
          </span>
          <p className="font-bold text-slate-800">
            {searched ? "Tidak ada data nilai yang cocok" : "Belum ada data ditampilkan"}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            {searched
              ? "Coba ubah kelas, mata pelajaran, atau kata kunci santri."
              : "Pilih kelas atau mata pelajaran, lalu tekan Terapkan filter."}
          </p>
        </div>
      )}
    </div>
  );
}