"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Filter, Users, BookOpen } from "lucide-react";

export default function KurikulumJadwalPage() {
  const [kelas, setKelas] = useState("all");
  const [tipePekan, setTipePekan] = useState("ganjil");
  const [loading, setLoading] = useState(false);
  const [jadwalList, setJadwalList] = useState<any[]>([]);

  useEffect(() => {
    // Simulasi Fetch API `/api/kurikulum/jadwal?tipe_pekan=${tipePekan}`
    setLoading(true);
    setTimeout(() => {
      // Data statis untuk demo UI sesuai seed
      setJadwalList([
        { id: "1", hari: "Senin", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Tahsin/Tahfizh Al-Quran", kategori: "syariah" }, pegawai: { nama_lengkap: "Abdil Aziz, B.A." }, tipe_pekan: "ganjil" },
        { id: "2", hari: "Senin", jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Indonesia", kategori: "umum" }, pegawai: { nama_lengkap: "Ade Supiana" }, tipe_pekan: "ganjil" },
        { id: "3", hari: "Senin", jam_ke: 5, waktu_mulai: "08:20", waktu_selesai: "09:00", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Indonesia", kategori: "umum" }, pegawai: { nama_lengkap: "Ade Supiana" }, tipe_pekan: "ganjil" },
        { id: "4", hari: "Senin", jam_ke: 6, waktu_mulai: "09:00", waktu_selesai: "09:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Bahasa Arab", kategori: "bahasa" }, pegawai: { nama_lengkap: "Wahyudi Pranata, B.A." }, tipe_pekan: "ganjil" },
        { id: "5", hari: "Selasa", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", kelas: { nama: "7 MTs" }, mapel: { nama: "Hadis", kategori: "syariah" }, pegawai: { nama_lengkap: "Muhammad Thoriq, Lc." }, tipe_pekan: "ganjil" },
      ]);
      setLoading(false);
    }, 800);
  }, [tipePekan]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/20">
        <div className="flex items-center gap-4 mb-2">
          <Calendar size={32} className="text-emerald-200" />
          <h1 className="text-3xl font-bold">Pusat Jadwal Pelajaran</h1>
        </div>
        <p className="text-emerald-100">Manajemen jadwal KBM Pesantren Al-Imam Al-Islami (Sistem Pekan Ganjil & Genap).</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50">
            <option value="all">-- Semua Kelas --</option>
            <option value="7">7 MTs</option>
            <option value="IL">I'dad Lughowy</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Pekan</label>
          <div className="flex rounded-xl shadow-sm border border-gray-300 overflow-hidden">
            <button 
              onClick={() => setTipePekan("ganjil")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tipePekan === 'ganjil' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              Pekan 1 & 3 (Ganjil)
            </button>
            <button 
              onClick={() => setTipePekan("genap")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tipePekan === 'genap' ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              Pekan 2 & 4 (Genap)
            </button>
          </div>
        </div>
      </div>

      {/* Jadwal Table View */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" />
              Tabel Jadwal {tipePekan === "ganjil" ? "Pekan Ganjil" : "Pekan Genap"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Hari</th>
                  <th className="px-6 py-4">Jam Ke</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Guru Pengampu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jadwalList.map((j) => (
                  <tr key={j.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{j.hari}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">
                        {j.jam_ke}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono">
                      {j.waktu_mulai} - {j.waktu_selesai}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                        {j.kelas.nama}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{j.mapel.nama}</div>
                      <div className="text-xs text-emerald-600 uppercase font-medium mt-0.5">{j.mapel.kategori}</div>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{j.pegawai.nama_lengkap}</span>
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
