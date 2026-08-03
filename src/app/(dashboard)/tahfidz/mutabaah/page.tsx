"use client";

import React, { useState, useEffect } from "react";
import { Book, RefreshCcw, Plus, Search, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TahfidzMutabaahPage() {
  const [santri, setSantri] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSantri = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tahfidz/mutabaah");
        const data = await res.json();
        setSantri(data);
      } catch (err) {
        console.error("Gagal memuat data mutabaah tahfidz:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSantri();
  }, []);

  const filteredSantri = santri.filter(s => 
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    (s.nis && s.nis.includes(search))
  );

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-3xl p-8 text-white shadow-xl shadow-teal-900/20">
        <div className="flex items-center gap-4 mb-2">
          <BookOpen size={32} className="text-teal-200" />
          <h1 className="text-3xl font-bold">Mutabaah Tahfidz Al-Quran</h1>
        </div>
        <p className="text-teal-100">Pusat pemantauan setoran Ziyadah, Murojaah, dan Tilawah santri Al-Imam.</p>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 bg-gray-50/50"
            placeholder="Cari nama santri atau NIS..."
          />
        </div>
        <div className="text-sm font-medium text-gray-500 bg-teal-50 text-teal-700 px-4 py-2 rounded-2xl border border-teal-100">
          Total Santri Aktif: <span className="font-bold">{filteredSantri.length}</span>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredSantri.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800">Santri Tidak Ditemukan</h2>
          <p className="text-gray-500 mt-2">Coba kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Nama / NIS</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Setoran Terakhir</th>
                  <th className="px-6 py-4 text-center">Hafalan Baru</th>
                  <th className="px-6 py-4 text-center">Murojaah</th>
                  <th className="px-6 py-4 text-center">Tilawah / Murojaah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSantri.map((s) => (
                  <tr key={s.id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-base">{s.nama_lengkap}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{s.nis || "Belum ada NIS"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl font-semibold border border-blue-100 text-xs">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.last_tahfidz ? (
                        <div>
                          <div className="font-semibold text-gray-700 capitalize text-sm">
                            {s.last_tahfidz.jenis} : {s.last_tahfidz.surat}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Batas: Ayat {s.last_tahfidz.ayat_dari} - {s.last_tahfidz.ayat_ke} ({s.last_tahfidz.halaman} Hal)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Belum ada catatan setoran</span>
                      )}
                    </td>
                    
                    {/* Ziyadah Button */}
                    <td className="px-6 py-4 text-center">
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=ziyadah`} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 rounded-xl shadow-sm hover:shadow transition-all">
                        <Plus size={18} />
                      </Link>
                    </td>

                    {/* Murojaah Button */}
                    <td className="px-6 py-4 text-center">
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=murojaah`} className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white h-10 w-10 rounded-xl shadow-sm hover:shadow transition-all">
                        <RefreshCcw size={16} />
                      </Link>
                    </td>

                    {/* Tilawah Button */}
                    <td className="px-6 py-4 text-center">
                      <Link href={`/tahfidz/mutabaah/detail/${s.id}?type=tilawah`} className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 rounded-xl shadow-sm hover:shadow transition-all">
                        <Book size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
