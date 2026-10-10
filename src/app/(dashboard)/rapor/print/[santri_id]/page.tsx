"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

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

  const { santri, nilai_akademik, kedisiplinan, kepribadian, absen, tahfidz } = data;

  const toArabicNum = (num: number | string) => {
    if (num === null || num === undefined) return "-";
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, function(w) {
      return arabicNumbers[+w] || w;
    });
  };

  const renderTabelKategori = (judul: string, judulArab: string, mapelList: any[], startIndex: number = 1) => {
    if (mapelList.length === 0) return null;
    return (
      <>
        {/* Header Kategori */}
        <tr style={{ backgroundColor: "#f1f5f9" }}>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold", fontSize: "13px" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold", fontSize: "13px", textAlign: "right" }} dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel */}
        {mapelList.map((m, index) => {
          const isEven = index % 2 === 0;
          return (
            <tr 
              key={index} 
              style={{ backgroundColor: isEven ? "white" : "#fafafa" }}
            >
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }}>{startIndex + index}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontSize: "13px" }}>{m.nama}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }}>{m.kkm}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }}>{m.nilai}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }}>{m.rata_rata_kelas}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }} dir="rtl">{toArabicNum(m.kkm)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontSize: "13px", fontFamily: "Traditional Arabic, serif" }} dir="rtl">{m.nama_arab}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontSize: "13px" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
            </tr>
          );
        })}
      </>
    );
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }} className="print:p-0 print:m-0 print:max-w-none print:block bg-gray-50 min-h-screen font-serif text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; -webkit-print-color-adjust: exact; color: black; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Hero Banner for Print Page */}
      <div className="no-print" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 10px 30px rgba(85, 0, 0, 0.35)",
        color: "white"
      }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center" }}>
            <Printer size={28} style={{ marginRight: 12 }} /> Cetak Rapor Santri (10 Kolom)
          </h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
            Preview dokumen rapor identik format Ustadz Wahab
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{ 
            padding: "10px 18px", 
            borderRadius: "14px", 
            backgroundColor: "#550000", 
            color: "white", 
            border: "none", 
            cursor: "pointer", 
            fontWeight: "bold", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        >
          <Printer size={18} /> Cetak Sekarang
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" style={{ borderRadius: "24px" }}>
        
        {/* Kop Surat */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-arabic mb-1" dir="rtl" style={{ fontFamily: "Traditional Arabic, serif" }}>كشف الدرجات للمرحلة المتوسطة</h1>
          <h2 className="text-lg font-bold font-arabic mb-1" dir="rtl" style={{ fontFamily: "Traditional Arabic, serif" }}>بمعهد الإمام الإسلامي</h2>
        </div>

        {/* Biodata */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "16px", fontWeight: "bold" }}>
          <div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr><td style={{ width: 80, padding: "4px 0" }}>Nama</td><td style={{ padding: "4px" }}>:</td><td style={{ textTransform: "uppercase", padding: "4px 0" }}>{santri.nama}</td></tr>
                <tr><td style={{ width: 80, padding: "4px 0" }}>Kelas</td><td style={{ padding: "4px" }}>:</td><td style={{ padding: "4px 0" }}>{santri.kelas}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr><td style={{ width: 96, padding: "4px 0" }}>Semester</td><td style={{ padding: "4px" }}>:</td><td style={{ padding: "4px 0" }}>{santri.semester === "1" ? "Gasal" : "Genap"}</td></tr>
                <tr><td style={{ width: 96, padding: "4px 0" }}>Tahun Pelajaran</td><td style={{ padding: "4px" }}>:</td><td style={{ padding: "4px 0" }}>{santri.tahun_ajaran}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Utama 10 Kolom */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "13px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "40px", textAlign: "center" }}>No</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", textAlign: "center" }}>Mata Pelajaran</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "45px", textAlign: "center" }}>KKM</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "50px", textAlign: "center" }}>Nilai</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center" }}>Rata-<br/>Rata</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "65px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">المعدل<br/>التراكمي</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "60px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">النتيجة</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">الدرجة<br/>الصغرى</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">المواد الدراسية</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "40px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">رقم</th>
            </tr>
          </thead>
          <tbody>
            {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik.syariah, 1)}
            {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik.bahasa, nilai_akademik.syariah.length + 1)}
            {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik.umum, nilai_akademik.syariah.length + nilai_akademik.bahasa.length + 1)}
            
            {/* Bagian D. Kedisiplinan & Akumulasi */}
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold", fontSize: "13px" }}>D. Kedisiplinan</td>
              <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold", fontSize: "13px", textAlign: "right" }} dir="rtl">د . المواظبة</td>
            </tr>
            <tr style={{ backgroundColor: "white" }}>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Nilai</td>
              <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.totalNilai}</td>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }} dir="rtl">مجموع الدرجات</td>
            </tr>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Rata-rata</td>
              <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.rataRata}</td>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }} dir="rtl">المعدل التراكمي</td>
            </tr>
            <tr style={{ backgroundColor: "white" }}>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Ranking</td>
              <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.ranking}</td>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }} dir="rtl">الترتيب</td>
            </tr>
            <tr style={{ backgroundColor: "#fafafa" }}>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Santri</td>
              <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.jumlahSantri}</td>
              <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }} dir="rtl">عددالطلاب</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Ekstra: Kepribadian & Absensi */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px", pageBreakInside: "avoid" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Kepribadian Santri</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Perilaku</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.perilaku}</td></tr>
                <tr style={{ backgroundColor: "#fafafa" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kedisiplinan</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kedisiplinan}</td></tr>
                <tr style={{ backgroundColor: "white" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kerajinan</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kerajinan}</td></tr>
                <tr style={{ backgroundColor: "#fafafa" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kebersihan</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kebersihan}</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>Ketidakhadiran</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Sakit</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen.sakit} <span style={{ fontWeight: "normal", fontSize: "12px" }}>Jam Pelajaran</span></td></tr>
                <tr style={{ backgroundColor: "#fafafa" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Ijin</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen.izin} <span style={{ fontWeight: "normal", fontSize: "12px" }}>Jam Pelajaran</span></td></tr>
                <tr style={{ backgroundColor: "white" }}><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Alpha</td><td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen.alpha} <span style={{ fontWeight: "normal", fontSize: "12px" }}>Jam Pelajaran</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-12 text-[13px] text-center px-8 page-break-inside-avoid" style={{ pageBreakInside: "avoid" }}>
          <div>
            <p className="mb-20">Mengetahui<br/><br/>Orang Tua</p>
            <p className="font-semibold px-4 inline-block min-w-[150px]">( ......................................... )</p>
          </div>
          <div>
            <p className="mb-20">Tengaran, 18 Desember 2026<br/><br/>Kepala Madrasah</p>
            <p className="font-semibold px-4 inline-block min-w-[150px]">( Aziz Basuki, S.H.I, M.Pd. )</p>
          </div>
          <div>
            <p className="mb-20"><br/><br/>Wali Kelas</p>
            <p className="font-semibold px-4 inline-block min-w-[150px]">( ......................................... )</p>
          </div>
        </div>

      </div>
    </div>
  );
}
