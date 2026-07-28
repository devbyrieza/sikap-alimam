"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Printer, Download } from "lucide-react";

export default function FilterNilaiPage() {
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [santri, setSantri] = useState("");
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kelas) params.append("kelas_id", kelas);
      if (mapel) params.append("mapel_id", mapel);
      if (santri) params.append("santri_id", santri);

      // In real app, fetch from `/api/akademik/filter?${params.toString()}`
      // For now, mock data
      setTimeout(() => {
        setData([
          {
            id: "1",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7A MTs" },
            mapel: { nama: "Matematika", kategori: "umum" },
            nilai: 85,
            keterangan: "Lulus"
          },
          {
            id: "2",
            santri: { nama_lengkap: "Ahmad Zaki", nis: "2026001" },
            kelas: { nama: "7A MTs" },
            mapel: { nama: "Tauhid", kategori: "syariah" },
            nilai: 92,
            keterangan: "Mumtaz"
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
        <h1 className="text-3xl font-bold mb-2">Pusat Data Nilai Akademik</h1>
        <p className="text-blue-100">Filter, pantau, dan unduh data nilai santri secara spesifik.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Semua Kelas</option>
            <option value="kelas-1">7A MTs</option>
            <option value="kelas-2">7B MTs</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Mapel</label>
          <select value={mapel} onChange={(e) => setMapel(e.target.value)} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Semua Mata Pelajaran</option>
            <option value="mapel-1">Tauhid (Syariah)</option>
            <option value="mapel-2">Matematika (Umum)</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri (NIS/Nama)</label>
          <input 
            type="text" 
            placeholder="Ketik nama santri..." 
            value={santri} 
            onChange={(e) => setSantri(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-medium transition-all shadow-md flex items-center gap-2">
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Santri</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{row.santri.nama_lengkap}</div>
                        <div className="text-xs text-gray-500">{row.santri.nis}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{row.kelas.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{row.mapel.nama}</div>
                        <div className="text-xs text-blue-600 font-medium uppercase">{row.mapel.kategori}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                          row.nilai >= 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.nilai}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <a 
                          href={`/rapor/print/${row.id}`} 
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-center gap-1"
                        >
                          <Printer size={16} /> Cetak Rapor
                        </a>
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
