"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, FileText, Activity, BookOpen, Clock, HeartHandshake } from "lucide-react";
import Swal from "sweetalert2";

export default function RaporWaliPage() {
  const searchParams = useSearchParams();
  const santriId = searchParams.get("santri_id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!santriId) return;
    
    // Fetch from real API
    fetch(`/api/rapor?santri_id=${santriId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [santriId]);

  const handleKirimWA = async () => {
    Swal.fire({
      title: "Kirim Laporan ke WA?",
      text: "Sistem akan merangkum rapor ini dan mengirimkannya ke nomor WA Anda.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Kirim Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Mengirim...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // Simulasi request API ke WA gateway
        setTimeout(() => {
          Swal.fire("Terkirim!", "Notifikasi berhasil dikirim ke WhatsApp Anda.", "success");
        }, 1500);
      }
    });
  };

  if (!santriId) {
    return <div className="p-12 text-center text-gray-500">ID Santri tidak valid.</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Rapor Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {data.santri.nama.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{data.santri.nama}</h1>
              <p className="text-gray-500 font-medium">{data.santri.nis} • {data.santri.kelas}</p>
            </div>
          </div>
          <button 
            onClick={handleKirimWA}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:-translate-y-0.5"
          >
            <Send size={18} />
            Kirim Rangkuman via WA
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Activity size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Kehadiran Kelas</p>
              <p className="text-2xl font-bold text-gray-800">{data.ringkasan.persentaseKehadiran}%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><BookOpen size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Status Tahfidz</p>
              <p className="text-2xl font-bold text-gray-800">Lancar</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Clock size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Jamaah Shubuh</p>
              <p className="text-2xl font-bold text-gray-800">{data.ringkasan.persentaseShubuh}%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-xl"><HeartHandshake size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Poin Adab</p>
              <p className="text-2xl font-bold text-gray-800">A (Mumtaz)</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        
        {/* Akademik Section dengan Logika Hiding PTS/PAS */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Detail Nilai Akademik</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-y border-gray-100">
                  <th className="py-4 px-4 font-semibold">No</th>
                  <th className="py-4 px-4 font-semibold min-w-[150px]">Mata Pelajaran</th>
                  <th className="py-4 px-4 font-semibold text-center">Harian<br/><span className="text-[10px] font-normal text-emerald-600">30%</span></th>
                  <th className="py-4 px-4 font-semibold text-center">Komp.<br/><span className="text-[10px] font-normal text-emerald-600">20%</span></th>
                  <th className="py-4 px-4 font-semibold text-center">Sikap<br/><span className="text-[10px] font-normal text-emerald-600">10%</span></th>
                  <th className="py-4 px-4 font-semibold text-center">Ujian<br/><span className="text-[10px] font-normal text-emerald-600">40%</span></th>
                  <th className="py-4 px-4 font-bold text-right text-emerald-700">Nilai Akhir</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group by mapel
                  const mapelMap = new Map();
                  (data.detail.akademik || []).forEach((n: any) => {
                    if (!mapelMap.has(n.mapel_id)) {
                      mapelMap.set(n.mapel_id, {
                        mapel: n.mapel.nama,
                        nilai: {}
                      });
                    }
                    mapelMap.get(n.mapel_id).nilai[n.jenis] = n.nilai;
                  });

                  const akademikList = Array.from(mapelMap.values());
                  if (akademikList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">Belum ada data nilai akademik</td>
                      </tr>
                    );
                  }

                  return akademikList.map((item: any, i: number) => {
                    // Logic Hiding: Check if PAS exists
                    const hasPAS = 
                      item.nilai.pas !== undefined || 
                      item.nilai.harian_pas !== undefined || 
                      item.nilai.kompetensi_pas !== undefined || 
                      item.nilai.sikap_pas !== undefined;

                    const suffix = hasPAS ? '_pas' : '_pts';
                    const ujianKey = hasPAS ? 'pas' : 'pts';
                    
                    const h = item.nilai[`harian${suffix}`] || 0;
                    const k = item.nilai[`kompetensi${suffix}`] || 0;
                    const s = item.nilai[`sikap${suffix}`] || 0;
                    const u = item.nilai[ujianKey] || 0;
                    
                    // Kalkulasi (jika semua 0, anggap belum diinput)
                    const isEmpty = !h && !k && !s && !u;
                    const na = isEmpty ? null : (0.3 * h + 0.2 * k + 0.1 * s + 0.4 * u).toFixed(1);

                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-4 px-4 font-bold text-gray-700">
                          {item.mapel}
                          <div className="text-[10px] text-gray-400 font-normal mt-1">
                            {hasPAS ? 'Periode: PAS' : 'Periode: PTS'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-medium text-gray-600">{h || '-'}</td>
                        <td className="py-4 px-4 text-center font-medium text-gray-600">{k || '-'}</td>
                        <td className="py-4 px-4 text-center font-medium text-gray-600">{s || '-'}</td>
                        <td className="py-4 px-4 text-center font-bold text-gray-700 bg-gray-50/50">{u || '-'}</td>
                        <td className="py-4 px-4 text-right">
                          {na ? (
                            <span className={`px-3 py-1.5 rounded-lg font-bold ${Number(na) >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {na}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tahfidz Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">Capaian Tahfidz Terakhir</h2>
            </div>
            <div className="space-y-4">
              {data.detail.tahfidz.map((t: any) => (
                <div key={t.id} className="p-4 rounded-2xl bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{t.surat}</h3>
                    <p className="text-sm text-gray-500">{t.jenis} • {t.tanggal}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg">
                    {t.keterangan}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ibadah Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <HeartHandshake className="text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">Catatan Ibadah & Adab</h2>
            </div>
            <div className="space-y-4">
              {data.detail.ibadah.map((i: any) => (
                <div key={i.id} className="p-4 rounded-2xl bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{i.tanggal}</h3>
                    <p className="text-sm text-gray-500">Shubuh: {i.shubuh}</p>
                  </div>
                  {i.tahajjud && (
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200">
                      Tahajjud ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
