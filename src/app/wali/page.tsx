"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, ChevronRight, GraduationCap, CalendarDays, Printer } from "lucide-react";
import { cekStatusSpp } from "@/lib/keuangan";

interface Anak {
  id: string;
  nama: string;
  kelas: string;
  lunas: boolean;
  pesanTagihan?: string;
}

export default function WaliDashboard() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi pengambilan data anak dari API (berdasarkan session wali santri)
    const fetchData = async () => {
      setLoading(true);
      
      // Mock data anak
      const dataAnak = [
        { id: "santri-123", nama: "Ahmad Zaki", kelas: "7A MTs" },
        { id: "santri-belum-lunas-123", nama: "Fatimah Azzahra", kelas: "IL" },
      ];

      // Cek status SPP untuk masing-masing anak
      const date = new Date();
      const results = await Promise.all(
        dataAnak.map(async (anak) => {
          const status = await cekStatusSpp(anak.id, date.getMonth() + 1, date.getFullYear());
          return {
            ...anak,
            lunas: status.lunas,
            pesanTagihan: status.pesan,
          };
        })
      );

      setAnakList(results);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Banner - PPDB Platinum Standard */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-900 pt-16 pb-24 px-6 relative overflow-hidden rounded-b-[3rem] shadow-xl shadow-emerald-900/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <GraduationCap size={150} />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Portal Wali Santri
          </h1>
          <p className="text-emerald-100">
            Pantau perkembangan akademik, tahfidz, dan ibadah ananda.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          anakList.map((anak) => (
            <div 
              key={anak.id}
              className={`bg-white rounded-3xl overflow-hidden shadow-lg border transition-all ${
                anak.lunas ? 'border-gray-100 hover:shadow-xl hover:border-emerald-200' : 'border-red-100 ring-2 ring-red-100'
              }`}
            >
              <div className="p-6 sm:p-8 flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-full ${anak.lunas ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{anak.nama}</h2>
                    <p className="text-gray-500 font-medium">{anak.kelas}</p>
                  </div>
                </div>

                {!anak.lunas ? (
                  <div className="flex-1 w-full sm:w-auto sm:max-w-sm bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
                    <Lock className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm mb-1">Akses Rapor Terkunci</h4>
                      <p className="text-xs text-red-600 leading-relaxed">
                        {anak.pesanTagihan} Mohon selesaikan administrasi agar dapat melihat progres ananda.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <a 
                      href={`/wali/rapor?santri_id=${anak.id}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-semibold transition-all shadow-md shadow-emerald-600/20 group"
                    >
                      Lihat Rapor Ringkas
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a 
                      href={`/rapor/print/${anak.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-6 py-2.5 rounded-2xl font-semibold transition-all"
                    >
                      <Printer size={16} /> Cetak Rapor Asli (PDF)
                    </a>
                  </div>
                )}
              </div>

              {/* Sneak peek / Quick stats (Only if Lunas) */}
              {anak.lunas && (
                <div className="bg-gray-50 px-6 sm:px-8 py-4 border-t border-gray-100 flex gap-6 sm:gap-12 overflow-x-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Kehadiran</span>
                    <span className="text-lg font-bold text-gray-800">95%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Hafalan Terakhir</span>
                    <span className="text-lg font-bold text-gray-800">Juz 30 (An-Naba)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Poin Disiplin</span>
                    <span className="text-lg font-bold text-gray-800">100 / 100</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
