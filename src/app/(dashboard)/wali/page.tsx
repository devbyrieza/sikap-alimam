"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ChevronRight,
  GraduationCap,
  Printer,
  CalendarCheck,
  BookOpen,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  HeartHandshake,
  MessageCircle,
  FileText,
  Clock,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";

interface WaliKelas {
  nama: string;
  nama_panggilan?: string;
  no_hp?: string;
}

interface Anak {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jenjang: string;
  wali_kelas?: WaliKelas | null;
  foto_url?: string;
  lunas: boolean;
  spp?: any;
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
            {
              id: "demo-santri-1",
              nama: "Abdul Aziz Ali",
              nis: "202407001",
              kelas: "7 MTs",
              jenjang: "MTs",
              wali_kelas: {
                nama: "Ustadz Ahmad Fauzan, Lc.",
                nama_panggilan: "Fauzan",
                no_hp: "081234567890"
              },
              lunas: true
            }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 pb-20">
      {/* Header Banner - SPMB Platinum Standard Maroon Frame */}
      <div className="bg-gradient-to-br from-primary via-[#7a0000] to-[#450000] pt-14 pb-24 px-6 relative overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-primary/30 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap size={180} />
        </div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full border border-white/10 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-sm">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Portal Resmi Wali Santri &bull; Semester Ganjil 2026/2027</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Pesantren Islam Al-Imam
          </h1>
          <p className="text-rose-100/90 max-w-2xl mx-auto text-sm sm:text-base font-normal leading-relaxed">
            Akses terpadu perkembangan ananda: Lembar Rapor PTS Murni, Jurnal Harian Pengajar, Presensi Kehadiran, Mutabaah Tahfidz, dan Riwayat SPP.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 space-y-6">
        {loading ? (
          <div className="card p-14 text-center text-slate-500 bg-white/95 backdrop-blur rounded-3xl shadow-xl shadow-primary/10 border border-slate-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-600">Memuat data ananda...</p>
          </div>
        ) : (
          anakList.map((anak) => {
            const nisResmi = (anak?.nama ? getOfficialNis(anak.nama) : null) || anak.nis;
            const waClean = anak.wali_kelas?.no_hp
              ? anak.wali_kelas.no_hp.replace(/[^0-9]/g, "").replace(/^0/, "62")
              : "";

            const isLocked = !anak.lunas && anak.spp?.status !== "menunggu_verifikasi" && !anak.spp?.isUnlockedManual;

            return (
              <div
                key={anak.id}
                className="bg-white/95 backdrop-blur rounded-3xl overflow-hidden shadow-xl shadow-primary/10 border border-slate-100/90 hover:shadow-2xl hover:border-primary/30 transition-all duration-300"
              >
                {/* Upper Body */}
                <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-[#7a0000] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-lg shadow-primary/20 ring-4 ring-rose-50">
                      {(anak?.nama || "A").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Santri Aktif
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                          NIS: {nisResmi}
                        </span>
                        {isLocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-sm">
                            <Lock size={12} className="text-rose-600" />
                            <span>Akses Terkunci: Tagihan SPP ({anak.spp?.tunggakanCount || 1} Bulan)</span>
                          </span>
                        ) : anak.spp?.status === "menunggu_verifikasi" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock size={12} className="text-amber-600 animate-spin" />
                            <span>SPP Sedang Diverifikasi</span>
                          </span>
                        ) : anak.lunas ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>SPP Lunas</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>Tagihan SPP ({anak.spp?.tunggakanCount || 1} Bulan)</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
                        {anak.nama}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Kelas <strong className="text-slate-800">{anak.kelas}</strong> &bull; Jenjang {anak.jenjang}
                      </p>

                      {/* Wali Kelas Badge */}
                      {anak.wali_kelas?.nama && (
                        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 inline-flex flex-wrap">
                          <span className="text-slate-400 font-medium">Wali Kelas:</span>
                          <strong className="text-slate-700">{anak.wali_kelas.nama}</strong>
                          {waClean && (
                            <a
                              href={`https://wa.me/${waClean}?text=${encodeURIComponent(
                                `Assalamu'alaikum Ustadz ${anak.wali_kelas.nama_panggilan || anak.wali_kelas.nama}, saya orang tua dari ${anak.nama} (${anak.kelas}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 ml-1 underline decoration-dotted"
                            >
                              <MessageCircle size={13} />
                              <span>Chat WA</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2.5 w-full md:w-auto shrink-0">
                    <a
                      href={`/wali/rapor?santri_id=${anak.id}`}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isLocked
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/20"
                          : "bg-primary hover:bg-[#7a0000] text-white shadow-primary/25"
                      }`}
                    >
                      {isLocked ? <Lock size={16} /> : <FileText size={16} />}
                      <span>{isLocked ? "Akses Terkunci (Selesaikan SPP)" : anak.spp?.status === "menunggu_verifikasi" ? "Buka Rapor (Verifikasi SPP)" : "Buka Rapor & Rekap"}</span>
                      <ChevronRight size={16} />
                    </a>

                    {!isLocked && (
                      <a
                        href={`/rapor/print/${anak.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <Printer size={15} />
                        <span>Cetak PDF</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Notice Box Jika Terkunci */}
                {isLocked && (
                  <div className="mx-6 sm:mx-8 mb-4 p-4 bg-gradient-to-r from-rose-50 to-rose-100/60 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start sm:items-center gap-2.5 text-rose-900">
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                      <span>
                        Akses laporan dinonaktifkan sementara karena ada tagihan SPP. <strong>Sudah membayar tapi akun masih terkunci?</strong> Silakan hubungi Finance di WhatsApp <strong>085111403331</strong> dengan bukti transfer.
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/6285111403331?text=${encodeURIComponent(
                        `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam, saya wali dari ananda ${anak.nama} (NIS: ${nisResmi}, Kelas: ${anak.kelas}). Saya telah melakukan pembayaran SPP dan melampirkan bukti transfer terlampir. Mohon dibukakan akses portal SIKAP ananda. Jazaakumullah khayran.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <MessageCircle size={14} />
                      <span>WA Finance (085111403331)</span>
                    </a>
                  </div>
                )}

                {/* Quick Summary Strip */}
                <div className="bg-slate-50/90 px-6 sm:px-8 py-3.5 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={15} className="text-primary" />
                    <span>Presensi & Absensi Harian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-primary" />
                    <span>Nilai PTS Murni & Jurnal Guru</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-primary" />
                    <span>Riwayat SPP 12 Bulan</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Sparkles size={15} />
                    <span>Halaqoh & Tahfidz Al-Qur&apos;an</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Feature Grid Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-md flex items-start gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Mode Rapor PTS Murni Aktif</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nilai yang ditampilkan pada lembar rapor resmi adalah Nilai Ujian PTS Murni Semester Ganjil sesuai kebijakan akademik kurikulum pesantren.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-md flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
              <Phone size={22} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Layanan Bantuan & Kesantrian</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apabila terdapat pertanyaan seputar perkembangan ananda, konsultasi tahfidz, atau administrasi SPP, Anda dapat langsung menghubungi wali kelas atau staf pesantren.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
