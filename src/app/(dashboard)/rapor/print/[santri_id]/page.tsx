"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Head from "next/head";

export default function CetakRaporPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const semester = searchParams.get("semester") || "1";
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!santriId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rapor/cetak?santri_id=${santriId}&semester=${semester}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch rapor data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [santriId, semester]);

  if (loading) {
    return <div className="p-10 text-center">Memuat Rapor...</div>;
  }

  if (!data || data.error) {
    return <div className="p-10 text-center text-red-500">Data rapor tidak ditemukan.</div>;
  }

  const { santri, nilai_akademik, kedisiplinan, kepribadian, absen } = data;

  const renderTabelKategori = (judul: string, judulArab: string, mapelList: any[], startIndex: number = 1) => {
    if (mapelList.length === 0) return null;
    return (
      <>
        {/* Header Kategori */}
        <tr className="bg-gray-100/60 print:bg-gray-100">
          <td colSpan={2} className="border border-gray-400 p-1 font-bold text-sm">
            {judul}
          </td>
          <td colSpan={3} className="border border-gray-400 p-1 font-bold text-sm text-right" dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel */}
        {mapelList.map((m, index) => (
          <tr key={index}>
            <td className="border border-gray-400 p-1 text-center">{startIndex + index}</td>
            <td className="border border-gray-400 p-1">{m.nama}</td>
            <td className="border border-gray-400 p-1 text-center">{m.kkm}</td>
            <td className="border border-gray-400 p-1 text-center">{m.nilai}</td>
            <td className="border border-gray-400 p-1 text-right" dir="rtl">{m.nama_arab}</td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="bg-gray-200 min-h-screen py-8 print:py-0 print:bg-white font-serif">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative">
        
        {/* Floating Print Button */}
        <button 
          onClick={() => window.print()}
          className="no-print fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition"
        >
          🖨️ Cetak Rapor
        </button>

        {/* Kop Surat */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold font-arabic" dir="rtl">كشف الدرجات للمرحلة المتوسطة</h1>
          <h2 className="text-lg font-bold font-arabic mb-1" dir="rtl">بمعهد الإمام الإسلامي</h2>
          <h3 className="text-sm font-bold uppercase">Hasil Evaluasi Belajar Santri</h3>
          <h3 className="text-sm font-bold uppercase">Pesantren Al Imam Al Islami</h3>
        </div>

        {/* Biodata */}
        <div className="flex justify-between text-sm mb-4">
          <div>
            <table className="w-full">
              <tbody>
                <tr><td className="w-20 font-semibold">Nama</td><td className="px-2">:</td><td className="uppercase font-bold">{santri.nama}</td></tr>
                <tr><td className="w-20 font-semibold">NIS</td><td className="px-2">:</td><td>{santri.nis}</td></tr>
                <tr><td className="w-20 font-semibold">Kelas</td><td className="px-2">:</td><td>{santri.kelas}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr><td className="w-24 font-semibold">Semester</td><td className="px-2">:</td><td>{santri.semester === "1" ? "Gasal" : "Genap"}</td></tr>
                <tr><td className="w-24 font-semibold">Tahun Ajaran</td><td className="px-2">:</td><td>{santri.tahun_ajaran}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Utama */}
        <table className="w-full border-collapse border border-gray-400 text-sm mb-6">
          <thead>
            <tr className="bg-gray-100 font-bold print:bg-gray-100">
              <th className="border border-gray-400 p-2 w-8">No</th>
              <th className="border border-gray-400 p-2">Mata Pelajaran</th>
              <th className="border border-gray-400 p-2 w-16 text-center">KKM</th>
              <th className="border border-gray-400 p-2 w-16 text-center">Nilai</th>
              <th className="border border-gray-400 p-2 text-right w-1/3" dir="rtl">المواد الدراسية</th>
            </tr>
          </thead>
          <tbody>
            {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik.syariah, 1)}
            {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik.bahasa, nilai_akademik.syariah.length + 1)}
            {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik.umum, nilai_akademik.syariah.length + nilai_akademik.bahasa.length + 1)}
            
            {/* Bagian D. Kedisiplinan & Akumulasi */}
            <tr className="bg-gray-100/60 print:bg-gray-100">
              <td colSpan={2} className="border border-gray-400 p-1 font-bold text-sm">D. Kedisiplinan & Akumulasi</td>
              <td colSpan={3} className="border border-gray-400 p-1 font-bold text-sm text-right" dir="rtl">د . المواظبة</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 p-1 font-semibold">Jumlah Nilai</td>
              <td className="border border-gray-400 p-1 text-center font-bold">{kedisiplinan.totalNilai}</td>
              <td className="border border-gray-400 p-1 text-right font-semibold" dir="rtl">مجموع الدرجات</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 p-1 font-semibold">Rata-rata</td>
              <td className="border border-gray-400 p-1 text-center font-bold">{kedisiplinan.rataRata}</td>
              <td className="border border-gray-400 p-1 text-right font-semibold" dir="rtl">المعدل التراكمي</td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-gray-400 p-1 font-semibold">Ranking</td>
              <td className="border border-gray-400 p-1 text-center font-bold">{kedisiplinan.ranking}</td>
              <td className="border border-gray-400 p-1 text-right font-semibold" dir="rtl">الترتيب</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Ekstra: Kepribadian & Absensi */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                  <th colSpan={2} className="border border-gray-400 p-1">Kepribadian Santri</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-400 p-1">Perilaku</td><td className="border border-gray-400 p-1 text-center font-bold">{kepribadian.perilaku}</td></tr>
                <tr><td className="border border-gray-400 p-1">Kedisiplinan</td><td className="border border-gray-400 p-1 text-center font-bold">{kepribadian.kedisiplinan}</td></tr>
                <tr><td className="border border-gray-400 p-1">Kerajinan</td><td className="border border-gray-400 p-1 text-center font-bold">{kepribadian.kerajinan}</td></tr>
                <tr><td className="border border-gray-400 p-1">Kebersihan</td><td className="border border-gray-400 p-1 text-center font-bold">{kepribadian.kebersihan}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex-1">
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                  <th colSpan={2} className="border border-gray-400 p-1">Ketidakhadiran (Absensi)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-400 p-1">Sakit</td><td className="border border-gray-400 p-1 text-center font-bold">{absen.sakit} Hari</td></tr>
                <tr><td className="border border-gray-400 p-1">Izin</td><td className="border border-gray-400 p-1 text-center font-bold">{absen.izin} Hari</td></tr>
                <tr><td className="border border-gray-400 p-1">Alpha</td><td className="border border-gray-400 p-1 text-center font-bold">{absen.alpha} Hari</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-12 text-sm text-center">
          <div>
            <p className="mb-16">Mengetahui,<br/>Orang Tua / Wali Santri</p>
            <p className="font-semibold border-b border-black pb-1 px-4 inline-block min-w-[150px]">(.........................................)</p>
          </div>
          <div>
            <p className="mb-16">Mengetahui,<br/>Kepala Madrasah</p>
            <p className="font-semibold border-b border-black pb-1 px-4 inline-block min-w-[150px]">Ust. Wahab, Lc., M.A.</p>
          </div>
          <div>
            <p className="mb-16">Wali Kelas</p>
            <p className="font-semibold border-b border-black pb-1 px-4 inline-block min-w-[150px]">(.........................................)</p>
          </div>
        </div>

      </div>
    </div>
  );
}
