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
    
    // In real app, fetch from `/api/rapor?santri_id=${santriId}`
    // Since DB is not connected yet, we mock the data
    setTimeout(() => {
      setData({
        santri: {
          nama: "Ahmad Zaki",
          nis: "20261011",
          kelas: "7A MTs",
        },
        ringkasan: {
          persentaseKehadiran: 98,
          persentaseShubuh: 100,
        },
        detail: {
          tahfidz: [
            { id: "1", tanggal: "2026-07-28", jenis: "Ziyadah", surat: "An-Naba", keterangan: "Lancar" }
          ],
          ibadah: [
            { id: "1", tanggal: "2026-07-28", shubuh: "Berjamaah", tahajjud: true }
          ],
          akademik: [
            { id: "1", mapel: "Nahwu", guru: "Ust. Agus Ma'mun, S.Pd.I., Lc.", na: 70.45, kkm: 63 },
            { id: "2", mapel: "Tauhid", guru: "Ust. Virnanda Adi Saputra, S.Pd.I.", na: 92.5, kkm: 60 },
            { id: "3", mapel: "Tahfizh Al-Qur'an", guru: "Ustdh. Aisyah Na`im Qibtiyah, Lc", na: 93.03, kkm: 60 },
            { id: "4", mapel: "Tahsin dan Tajwid", guru: "Ustdh. Aisyah Na`im Qibtiyah, Lc", na: 93.53, kkm: 60 },
            { id: "5", mapel: "Tadrib Lughowi", guru: "Ustdh. Jamila Jafar Marie", na: 82.2, kkm: 65 },
            { id: "6", mapel: "Ta'bir", guru: "Ustdh. Jamila Jafar Marie", na: 90.6, kkm: 60 },
          ]
        }
      });
      setLoading(false);
    }, 1000);
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
        
        {/* Card Style Akademik (Sesuai Referensi Gambar HP) */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Detail Nilai Semester 1</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.detail.akademik.map((item: any, index: number) => (
              <div key={item.id} className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                    {index + 1}.
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.mapel}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.guru}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <div className="flex flex-col items-center justify-center border-2 border-emerald-500 rounded-xl px-4 py-1.5 bg-emerald-50/50">
                    <span className="text-[10px] font-bold text-emerald-700 mb-0.5">NA</span>
                    <span className="font-bold text-emerald-600 text-lg leading-none">{item.na}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border border-gray-200 rounded-xl px-4 py-1.5 bg-white">
                    <span className="text-[10px] font-bold text-gray-500 mb-0.5">KKM</span>
                    <span className="font-bold text-gray-700 text-lg leading-none">{item.kkm}</span>
                  </div>
                </div>
              </div>
            ))}
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
