"use client";

import React, { useState, useEffect } from "react";
import { User, ChevronRight, GraduationCap, Printer, CalendarCheck, BookOpen, Sparkles, Phone, ShieldCheck, CheckCircle2, Lock } from "lucide-react";

interface Anak {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jenjang: string;
  lunas: boolean;
}

export default function WaliDashboard() {
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/wali/anak");
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setAnakList(json.data);
        } else {
          // Fallback demo
          setAnakList([
            { id: "demo-santri-1", nama: "Abdul Aziz Ali", nis: "202407001", kelas: "7 MTs", jenjang: "MTs", lunas: true },
          ]);
        }
      } catch (err) {
        console.error("Failed to load children:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Banner - PPDB Platinum Standard */}
      <div className="bg-gradient-to-br from-primary via-[#7e141a] to-[#4a080d] pt-14 pb-20 px-6 relative overflow-hidden rounded-b-[2.5rem] shadow-xl shadow-primary/20 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap size={160} />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Portal Resmi Wali Santri</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Pesantren Al-Imam Al-Islami
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base font-normal">
            Pantau perkembangan nilai akademik, jurnal harian guru, presensi kehadiran, serta mutabaah ibadah dan tahfidz ananda secara transparan dan terpadu.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 -mt-10 space-y-5">
        {loading ? (
          <div className="card p-12 text-center text-slate-500 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm font-medium">Memuat data ananda...</p>
          </div>
        ) : (
          anakList.map((anak) => (
            <div
              key={anak.id}
              className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
            >
              <div className="p-6 sm:p-7 flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0 shadow-inner">
                    {(anak?.nama || "A").charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        Santri Aktif
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-medium">NIS: {anak.nis}</span>
                      {anak.lunas ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> SPP Lunas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Akses Terkunci (SPP)
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 leading-snug">{anak.nama}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Kelas: <strong className="text-slate-700">{anak.kelas}</strong> ({anak.jenjang})
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                  <a
                    href={`/wali/rapor?santri_id=${anak.id}`}
                    className={`btn ${anak.lunas ? "btn-primary" : "bg-rose-600 hover:bg-rose-700 text-white"}`}
                    style={{
                      padding: "11px 20px",
                      borderRadius: "14px",
                      fontWeight: 700,
                      fontSize: "13px",
                      boxShadow: anak.lunas ? "0 4px 14px rgba(155, 27, 34, 0.3)" : "0 4px 14px rgba(225, 29, 72, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8 }}
                  >
                    <span className="flex items-center gap-2">{anak.lunas ? "Buka Rapor & Rekap Lengkap" : <><Lock className="w-4 h-4" /> Lihat Status Tagihan SPP</>}</span>
                    <ChevronRight size={16} />
                  </a>
                  {anak.lunas && (
                    <a
                      href={`/rapor/print/${anak.id}`}
                      target="_blank"
                      className="btn btn-outline"
                      style={{
                        padding: "11px 18px",
                        borderRadius: "14px",
                        fontWeight: 700,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6 }}
                    >
                      <Printer size={15} />
                      <span>Cetak PDF</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Summary Strip */}
              <div className="bg-slate-50/80 px-6 sm:px-8 py-3.5 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={16} className="text-primary" />
                  <span>Presensi & Absensi Harian</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <span>Nilai & Jurnal Guru Transparan</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Sparkles size={16} />
                  <span>Terintegrasi SIAKAD & Mutabaah</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4 text-xs text-slate-600">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
            <Phone size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-0.5">Bantuan & Layanan Wali Santri</h4>
            <p className="leading-relaxed">
              Jika terdapat ketidaksesuaian data presensi atau nilai ananda, silakan hubungi bagian Akademik & Kesantrian Pesantren Al-Imam Al-Islami melalui WhatsApp resmi pesantren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
