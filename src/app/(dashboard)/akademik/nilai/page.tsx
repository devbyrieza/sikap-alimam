"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Printer, Download, BookOpen, GraduationCap } from "lucide-react";

export default function FilterNilaiPage() {
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [santri, setSantri] = useState("");
  const [kelasList, setKelasList] = useState<{ id: string; nama: string; jenjang?: string }[]>([]);
  const [mapelByKelas, setMapelByKelas] = useState<Record<string, { id: string; nama: string; kategori?: string }[]>>({});
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Reset mapel jika kelas berganti
  const handleKelasChange = (newKelasId: string) => {
    setKelas(newKelasId);
    setMapel("");
  };

  const handleFilter = async () => {
    setLoading(true);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
        <h1 className="text-3xl font-bold mb-2">Pusat Data Nilai Akademik</h1>
        <p className="text-blue-100">Filter, pantau, dan unduh data nilai santri per jenjang dan mata pelajaran.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        {/* 1. Filter Kelas */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Kelas</label>
          <select
            value={kelas}
            onChange={(e) => handleKelasChange(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2.5 text-sm"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Filter Mapel (Menyesuaikan dengan kelas) */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Filter Mata Pelajaran {kelas ? "(Sesuai Kelas)" : ""}
          </label>
          <select
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2.5 text-sm"
          >
            <option value="">{kelas ? `Semua Mapel di Kelas Ini` : "Semua Mata Pelajaran"}</option>
            {availableMapelList.map((m, idx) => (
              <option key={`${m.id}-${idx}`} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Cari Santri */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cari Santri (NIS / Nama)</label>
          <input 
            type="text" 
            placeholder="Ketik nama santri..." 
            value={santri} 
            onChange={(e) => setSantri(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 py-2 text-sm"
          />
        </div>

        <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">
          <Filter size={18} />
          Terapkan Filter
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        data.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Hasil Pencarian: {data.length} Data</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-all">
                  <Download size={16} /> Export Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Santri</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{item.santri.nama_lengkap}</div>
                        <div className="text-xs text-gray-500 font-mono">NIS: {item.santri.nis}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          {item.kelas.nama}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                        {item.mapel.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">
                        {item.nilai}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {item.keterangan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
