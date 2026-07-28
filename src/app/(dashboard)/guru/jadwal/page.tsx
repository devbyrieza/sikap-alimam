"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Info } from "lucide-react";

export default function GuruJadwalPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Jadwal Mengajar Anda Hari Ini</h1>
          <p className="text-blue-100">Selamat bertugas mencetak generasi Rabbani, Ustadz!</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-blue-200 mb-1">Status Pekan Saat Ini</p>
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/30">
            <Info size={18} />
            <span className="font-bold uppercase tracking-wider">
              {currentPekan === "ganjil" ? "Pekan Ganjil (1/3)" : "Pekan Genap (2/4)"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {jadwal.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h2 className="text-xl font-bold text-gray-800">Alhamdulillah!</h2>
              <p className="text-gray-500 mt-2">Anda tidak memiliki jadwal mengajar pada hari ini.</p>
            </div>
          ) : (
            jadwal.map((j) => (
              <div key={j.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 h-16 w-16 rounded-xl border border-blue-100">
                    <span className="text-xs font-bold uppercase mb-0.5">Jam Ke</span>
                    <span className="text-2xl font-black">{j.jam_ke}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{j.mapel.nama}</h3>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                        <Clock size={14} /> {j.waktu_mulai} - {j.waktu_selesai}
                      </span>
                      <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                        Kelas: {j.kelas.nama}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  Isi Jurnal
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
