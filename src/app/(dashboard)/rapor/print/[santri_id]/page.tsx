"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

export default function CetakRaporPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const semester = searchParams.get("semester") || "1";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!santriId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rapor/cetak?santri_id=${santriId}&semester=${semester}&tahun_ajaran=${encodeURIComponent(tahun_ajaran)}`);
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
  }, [santriId, semester, tahun_ajaran]);

  if (loading) {
    return <div className="p-10 text-center" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Memuat Rapor...</div>;
  }

  if (!data || data.error) {
    return <div className="p-10 text-center text-red-500" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Data rapor tidak ditemukan.</div>;
  }

  const { santri, nilai_akademik, kedisiplinan, absen, ujian_tahfidz } = data;

  const toArabicNum = (num: number | string) => {
    if (num === null || num === undefined) return "-";
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, function(w) {
      return arabicNumbers[+w] || w;
    });
  };

  // Nilai Sikap dari Ujian Pra-Target untuk Kepribadian Santri
  const praTargetUjian = (ujian_tahfidz || []).filter((u: any) => u.jenis_ujian === "ujian_pra_target");
  let sikapGrade = "-";
  if (praTargetUjian.length > 0) {
    const avgNilaiSikap = praTargetUjian.reduce((acc: number, curr: any) => acc + (Number(curr.nilai_sikap) || 0), 0) / praTargetUjian.length;
    if (avgNilaiSikap >= 90) sikapGrade = "A";
    else if (avgNilaiSikap >= 80) sikapGrade = "B";
    else if (avgNilaiSikap >= 70) sikapGrade = "C";
    else if (avgNilaiSikap >= 60) sikapGrade = "D";
    else sikapGrade = "E";
  }

  // Nilai Kedisiplinan dari Absensi
  let disiplinGrade = "-";
  const alphaVal = Number(absen?.alpha) || 0;
  const izinVal = Number(absen?.izin) || 0;
  if (alphaVal === 0 && izinVal <= 3) {
    disiplinGrade = "A";
  } else if (alphaVal <= 2) {
    disiplinGrade = "B";
  } else if (alphaVal <= 5) {
    disiplinGrade = "C";
  } else {
    disiplinGrade = "D";
  }

  const renderTabelKategori = (judul: string, judulArab: string, mapelList: any[], startIndex: number = 1) => {
    if (!mapelList || mapelList.length === 0) return null;
    return (
      <>
        {/* Header Kategori Bilateral (50% Kiri Indonesia | 50% Kanan Arab) */}
        <tr style={{ backgroundColor: "#e8e8e8" }}>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", fontWeight: "bold", fontSize: "13px", fontFamily: "Arial, Helvetica, sans-serif" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 10px", fontWeight: "bold", fontSize: "15px", textAlign: "right", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel Simetris Sempurna */}
        {mapelList.map((m, index) => {
          const isEven = index % 2 === 0;
          return (
            <tr 
              key={index} 
              style={{ backgroundColor: isEven ? "white" : "#fafafa" }}
            >
              {/* Kolom 1 (No): width 4.5% */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>{startIndex + index}</td>
              {/* Kolom 2 (Mata Pelajaran): width 25.5% (Times New Roman) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontSize: "13px", fontFamily: '"Times New Roman", Times, serif', fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.25" }}>{m.nama}</td>
              {/* Kolom 3 (KKM): width 6.5% */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>{m.kkm}</td>
              {/* Kolom 4 (Nilai): width 6.5% */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }}>{m.nilai}</td>
              {/* Kolom 5 (Rata-Rata): width 7% dengan Garis Tengah Tebal 2.5px */}
              <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>{m.rata_rata_kelas}</td>
              
              {/* Kolom 6 (المعدل التراكمي): width 7% (Mirror Kolom 5) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              {/* Kolom 7 (النتيجة): width 6.5% (Mirror Kolom 4) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              {/* Kolom 8 (الدرجة الصغرى): width 6.5% (Mirror Kolom 3) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.kkm)}</td>
              {/* Kolom 9 (المواد الدراسية): width 25.5% (Mirror Kolom 2 - Traditional Arabic) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontSize: "15px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.25" }} dir="rtl">{m.nama_arab}</td>
              {/* Kolom 10 (رقم): width 4.5% (Mirror Kolom 1) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
            </tr>
          );
        })}
      </>
    );
  };

  const klsUpper = (santri?.kelas || "").toUpperCase();
  const isMTs = klsUpper.includes("MTS");
  const isMA = klsUpper.includes("MA");
  const isIL = klsUpper.includes("IL");

  let headTitle = "Kepala Madrasah";
  let headName = "Aziz Basuki, S.H.I., M.Pd.";
  let waliKelasName = "...........................";

  if (isMTs) {
    headName = "Ade Supyana, S.Pd.I.";
    waliKelasName = "Agus Cahyono";
  } else if (isMA) {
    headName = "Rethna Kartika Septianiar, S.Pd.";
    waliKelasName = "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.";
  } else if (isIL) {
    headTitle = "Kepala Kurikulum";
    headName = "Imron Abdillah, S.Pd.";
    waliKelasName = "Imron Abdillah, S.Pd.";
  }

  return (
    <div 
      id="rapor-print-container" 
      style={{ 
        padding: "24px 28px", 
        maxWidth: 1200, 
        margin: "0 auto", 
        display: "flex", 
        flexDirection: "column", 
        gap: 24,
        fontFamily: "Arial, Helvetica, sans-serif"
      }} 
      className="print:p-0 print:m-0 print:max-w-none print:block bg-gray-50 min-h-screen text-black"
    >
      <style dangerouslySetInnerHTML={{__html: `
          .arabic-text { font-family: 'Traditional Arabic', serif !important; }
          
          @media print {
            /* Margin A4 Keliling SAMA RATA (Atas, Bawah, Kiri, Kanan = 12mm) */
            @page { 
              size: A4; 
              margin: 12mm 12mm 12mm 12mm; 
            }
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact; 
              color: black; 
            }
            .arabic-text { font-family: 'Traditional Arabic', serif !important; }
            
            /* Sembunyikan elemen dashboard UI */
            .no-print, .mobile-header, .app-sidebar, .sidebar-nav { display: none !important; }
            .app-content > div:has(a[href="/profile"]) { display: none !important; }
            .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; }
            .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
            
            /* Container Cetak Bersih tanpa Zoom */
            #rapor-print-container { 
              padding: 0 !important; 
              margin: 0 !important; 
              background: white !important; 
              display: block !important; 
              width: 100% !important;
            }
            
            .rapor-page {
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              min-height: auto !important;
              border-radius: 0 !important;
              margin-bottom: 0 !important;
            }
            
            /* Pemisah Halaman Tegas untuk 2 Halaman */
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            table td { 
              font-size: 12.5px !important; 
              line-height: 1.25 !important; 
            }
            
            th.col-rata-rata {
              font-size: 10px !important;
              letter-spacing: -0.2px !important;
              padding: 5px 1px !important;
            }
            
            table { width: 100% !important; }
          }
        `}} />

      {/* Hero Banner for Screen View */}
      <div className="no-print" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        color: "white",
        padding: "16px 24px",
        borderRadius: "16px",
        boxShadow: "0 10px 15px -3px rgba(85, 0, 0, 0.2)"
      }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Cetak Rapor Santri (Format 2 Halaman Lega)</h2>
          <p style={{ fontSize: "12px", opacity: 0.8, margin: "4px 0 0 0" }}>Format cetak bilateral resmi 2 halaman dengan tulisan besar, nyaman dibaca, dan margin simetris.</p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{ 
            padding: "10px 20px", 
            borderRadius: "10px", 
            backgroundColor: "#22c55e", 
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
          <Printer size={18} /> Cetak Sekarang (2 Halaman)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* HALAMAN 1: RAPOR AKADEMIK (KASYFUD DARAJAT)                               */}
      {/* ========================================================================= */}
      <div 
        className="rapor-page max-w-[210mm] mx-auto bg-white p-[12mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" 
        style={{ 
          borderRadius: "24px", 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >

        {/* CONTENT WRAPPER HALAMAN 1 */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Kop Surat Resmi (Times New Roman Berwibawa) */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #1a1a1a", paddingBottom: "16px", marginBottom: "22px", fontFamily: '"Times New Roman", Times, serif' }}>
            <img src="/logo.png" alt="Logo Al-Imam" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
            <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
              <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#1a1a1a", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
              <p style={{ margin: "2px 0 4px 0", fontSize: "12px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "8.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
            </div>
            <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
          </div>

          {/* Judul Arab & Terjemahan */}
          <div className="text-center mb-5">
            {(() => {
              const kls = (santri?.kelas || "").toUpperCase();
              let marhalah = "للمرحلة المتوسطة"; // Default MTs
              let indoMarhalah = "TINGKAT MADRASAH TSANAWIYAH (MTs)";
              
              if (kls.includes("MA")) {
                marhalah = "للمرحلة الثانوية";
                indoMarhalah = "TINGKAT MADRASAH ALIYAH (MA)";
              } else if (kls.includes("IL") || kls.includes("I'DAD") || kls.includes("IDAD")) {
                marhalah = "لبرنامج الإعداد اللغوي";
                indoMarhalah = "PROGRAM I'DAD LUGHOWI (IL)";
              }
              
              return (
                <>
                  <h1 className="text-2xl font-bold arabic-text mb-1" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif" }}>
                    كشف الدرجات {marhalah}
                  </h1>
                  <h2 className="text-lg font-bold arabic-text mb-2" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif" }}>بمعهد الإمام الإسلامي</h2>
                  <h3 className="text-[13px] font-bold text-slate-800 tracking-wider mt-1 uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Laporan Hasil Evaluasi Belajar (Rapor)
                  </h3>
                  <h4 className="text-[12px] font-bold text-slate-600 tracking-wide mt-0.5 uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    {indoMarhalah}
                  </h4>
                </>
              );
            })()}
          </div>

          {/* Biodata Santri */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "16px", fontWeight: "bold", fontFamily: "Arial, Helvetica, sans-serif" }}>
            <div>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 85, padding: "3px 0", borderBottom: "none" }}>Nama</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ textTransform: "uppercase", padding: "3px 0", borderBottom: "none" }}>{santri?.nama}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 85, padding: "3px 0", borderBottom: "none" }}>NIS</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "3px 0", borderBottom: "none", letterSpacing: "0.5px" }}>{santri?.nis || "-"}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 85, padding: "3px 0", borderBottom: "none" }}>Kelas</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "3px 0", borderBottom: "none" }}>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right" }}>
              <table style={{ display: "inline-block", textAlign: "left" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "3px 0", whiteSpace: "nowrap", borderBottom: "none" }}>Semester</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "3px 0", borderBottom: "none" }}>
                      {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester?.includes("Genap") || santri?.semester === "2" ? "Genap" : santri?.semester}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "3px 0", whiteSpace: "nowrap", borderBottom: "none" }}>Tahun Pelajaran</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "3px 0", borderBottom: "none" }}>{santri?.tahun_ajaran}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "3px 0", whiteSpace: "nowrap", borderBottom: "none" }}>Wali Kelas</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "3px 0", borderBottom: "none" }}>{waliKelasName}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL UTAMA AKADEMIK (10 Kolom Bilateral Simetris 100% Sempurna) */}
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12.5px" }}>
            <colgroup>
              {/* Sisi Kiri (50%) */}
              <col style={{ width: "4.5%" }} />   {/* 1. No */}
              <col style={{ width: "21%" }} />    {/* 2. Mata Pelajaran */}
              <col style={{ width: "7%" }} />     {/* 3. KKM */}
              <col style={{ width: "7%" }} />     {/* 4. Nilai */}
              <col style={{ width: "10.5%" }} />  {/* 5. Rata-Rata Kelas */}
              
              {/* Sisi Kanan (50% Mirror Sempurna) */}
              <col style={{ width: "10.5%" }} />  {/* 6. متوسط الفصل */}
              <col style={{ width: "7%" }} />     {/* 7. النتيجة */}
              <col style={{ width: "7%" }} />     {/* 8. الدرجة الصغرى */}
              <col style={{ width: "21%" }} />    {/* 9. المواد الدراسية */}
              <col style={{ width: "4.5%" }} />   {/* 10. رقم */}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                {/* Sisi Kiri: Bahasa Indonesia */}
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>No</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 6px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>KKM</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>Nilai</th>
                {/* Kolom 5: Rata-Rata Kelas (Lega 10.5% & Tulisan Utuh Rapi) */}
                <th className="col-rata-rata" style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 1px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", lineHeight: "1.15", letterSpacing: "-0.2px" }}>Rata-Rata<br/>Kelas</th>
                
                {/* Sisi Kanan: Bahasa Arab (Mirror Persis 10.5%) */}
                <th className="col-rata-rata" style={{ border: "1px solid #1a1a1a", padding: "6px 1px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", lineHeight: "1.1" }}>متوسط<br/>الفصل</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }}>النتيجة</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", lineHeight: "1.1" }}>الدرجة<br/>الصغرى</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 6px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px" }}>المواد الدراسية</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }}>رقم</th>
              </tr>
            </thead>
            <tbody>
              {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik?.syariah || [], 1)}
              {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik?.bahasa || [], (nilai_akademik?.syariah?.length || 0) + 1)}
              {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik?.umum || [], (nilai_akademik?.syariah?.length || 0) + (nilai_akademik?.bahasa?.length || 0) + 1)}

              {/* Section D. Kedisiplinan header row */}
              <tr style={{ backgroundColor: "#e8e8e8" }}>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", fontWeight: "bold", fontSize: "13px", fontFamily: "Arial, Helvetica, sans-serif" }}>D. Kedisiplinan</td>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "6px 10px", fontWeight: "bold", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "15px" }} dir="rtl">د. المواظبة</td>
              </tr>
              
              {/* Summary rows (dengan pembatas tengah tebal 2.5px) */}
              <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Nilai</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan?.totalNilai}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", backgroundColor: "transparent" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", backgroundColor: "transparent" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.totalNilai)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "14px" }} dir="rtl">مجموع الدرجات</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Rata-Rata Santri</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan?.rataRata}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", backgroundColor: "rgba(0, 0, 0, 0.025)" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", backgroundColor: "rgba(0, 0, 0, 0.025)" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.rataRata)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "14px" }} dir="rtl">المعدل التراكمي</td>
              </tr>
              <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Ranking</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan?.ranking}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", backgroundColor: "transparent" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", backgroundColor: "transparent" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.ranking)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "14px" }} dir="rtl">الترتيب</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Santri</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan?.jumlahSantri}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", backgroundColor: "rgba(0, 0, 0, 0.025)" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", backgroundColor: "rgba(0, 0, 0, 0.025)" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.jumlahSantri)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "14px" }} dir="rtl">عدد الطلاب</td>
              </tr>
            </tbody>
          </table>

          {/* Catatan Kaki Halaman 1 */}
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
            <p style={{ margin: 0 }}>* Nilai di atas merupakan Hasil Evaluasi Belajar Penilaian Tengah Semester (PTS) Murni.</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>Halaman 1 dari 2</p>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PEMISAH HALAMAN (PAGE BREAK UNTUK CETAK DUA HALAMAN)                      */}
      {/* ========================================================================= */}
      <div className="page-break" style={{ pageBreakBefore: "always", breakBefore: "page" }} />

      {/* ========================================================================= */}
      {/* HALAMAN 2: KEPRIBADIAN, TAHSIN & TAHFIDZ, DAN PENGESAHAN DOKUMEN          */}
      {/* ========================================================================= */}
      <div 
        className="rapor-page max-w-[210mm] mx-auto bg-white p-[12mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" 
        style={{ 
          borderRadius: "24px", 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >

        {/* CONTENT WRAPPER HALAMAN 2 */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Sub-Header Identitas Dokumen Halaman 2 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2.5px solid #1a1a1a", paddingBottom: "12px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "900", margin: 0, letterSpacing: "0.5px", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#555" }}>Laporan Kepribadian serta Tahsin & Tahfidz Al-Qur'an</p>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", fontWeight: "bold" }}>
              <p style={{ margin: 0 }}>Nama: <span style={{ textTransform: "uppercase" }}>{santri?.nama}</span></p>
              <p style={{ margin: "2px 0 0 0", color: "#555" }}>NIS: {santri?.nis || "-"} &nbsp;|&nbsp; Kelas: {(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")} &nbsp;|&nbsp; Semester {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester}</p>
            </div>
          </div>

          {/* 1. KEPRIBADIAN SANTRI (KIRI) & KETIDAKHADIRAN (KANAN) - SATU TABEL SIMETRIS UTUH */}
          <table 
            style={{ 
              width: "100%", 
              tableLayout: "fixed", 
              borderCollapse: "collapse", 
              border: "2px solid #1a1a1a", 
              marginBottom: "20px", 
              pageBreakInside: "avoid", 
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "12.5px"
            }}
          >
            <colgroup>
              {/* Sisi Kiri (50%): Kepribadian Santri */}
              <col style={{ width: "32%" }} />  {/* Aspek Penilaian */}
              <col style={{ width: "18%" }} />  {/* Predikat */}
              {/* Sisi Kanan (50%): Ketidakhadiran */}
              <col style={{ width: "22%" }} />  {/* Absensi */}
              <col style={{ width: "28%" }} />  {/* Jumlah */}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th colSpan={2} style={{ borderBottom: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "7px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>
                  Kepribadian Santri
                </th>
                <th colSpan={2} style={{ borderBottom: "1px solid #1a1a1a", padding: "7px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>
                  Ketidakhadiran
                </th>
              </tr>
              <tr style={{ backgroundColor: "#e8e8e8", fontSize: "12px" }}>
                <th style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "5px 10px", textAlign: "center" }}>Aspek Penilaian</th>
                <th style={{ borderBottom: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 10px", textAlign: "center" }}>Predikat</th>
                <th style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "5px 10px", textAlign: "center" }}>Absensi</th>
                <th style={{ borderBottom: "1px solid #1a1a1a", padding: "5px 10px", textAlign: "center" }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {/* Baris 1: Perilaku & Sakit */}
              <tr style={{ backgroundColor: "transparent" }}>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px" }}>Perilaku</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{sikapGrade}</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center" }}>Sakit</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center", fontSize: "12.5px" }}>
                  <strong style={{ fontSize: "13px" }}>{absen?.sakit || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                </td>
              </tr>
              {/* Baris 2: Kedisiplinan & Izin */}
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px" }}>Kedisiplinan</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{disiplinGrade}</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center" }}>Izin</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center", fontSize: "12.5px" }}>
                  <strong style={{ fontSize: "13px" }}>{absen?.izin || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                </td>
              </tr>
              {/* Baris 3: Kerajinan & Alpha */}
              <tr style={{ backgroundColor: "transparent" }}>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px" }}>Kerajinan</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{sikapGrade}</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center" }}>Alpha</td>
                <td style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center", fontSize: "12.5px" }}>
                  <strong style={{ fontSize: "13px" }}>{absen?.alpha || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                </td>
              </tr>
              {/* Baris 4: Kebersihan & Total (Sempurna & Seimbang) */}
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}>
                <td style={{ borderRight: "1px solid #1a1a1a", padding: "6px 12px" }}>Kebersihan</td>
                <td style={{ borderRight: "2.5px solid #1a1a1a", padding: "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{sikapGrade}</td>
                <td style={{ borderRight: "1px solid #1a1a1a", padding: "6px 12px", textAlign: "center", fontWeight: "bold" }}>Total</td>
                <td style={{ padding: "6px 12px", textAlign: "center", fontSize: "12.5px" }}>
                  <strong style={{ fontSize: "13px" }}>{(absen?.sakit || 0) + (absen?.izin || 0) + (absen?.alpha || 0)}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 2. LAPORAN TAHSIN & TAHFIDZ (UJIAN PRA TARGET RESMI) */}
          <div style={{ marginBottom: "18px", pageBreakInside: "avoid" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "7px 10px", textAlign: "left", color: "#1a1a1a", fontWeight: "bold", fontSize: "13px" }}>
                    LAPORAN TAHSIN & TAHFIDZ (PROGRAM AL-QUR'AN)
                  </th>
                </tr>
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "6px 10px", textAlign: "left" }}>Jenis / Materi Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "6px 10px", width: "15%", textAlign: "center" }}>Sikap</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "6px 10px", width: "15%", textAlign: "center" }}>Nilai Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "6px 10px", width: "20%", textAlign: "center" }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {praTargetUjian.length > 0 ? praTargetUjian.map((u: any, i: number) => {
                  let sikapStr = "Baik";
                  if (u.nilai_sikap >= 90) sikapStr = "Sangat Baik";
                  else if (u.nilai_sikap >= 80) sikapStr = "Baik";
                  else if (u.nilai_sikap >= 70) sikapStr = "Cukup";
                  else sikapStr = "Kurang";
                  
                  const nilaiAkhir = u.nilai_akhir ? Math.round(u.nilai_akhir) : Math.round(((u.nilai_bacaan || 0) + (u.nilai_kelancaran || u.nilai_sikap || 0)) / 2);
                  
                  return (
                    <tr key={i} style={{ backgroundColor: "transparent" }}>
                      <td style={{ border: "1px solid #1a1a1a", padding: "7px 10px", fontWeight: "bold" }}>
                        {u.jenis_ujian ? u.jenis_ujian.replace(/_/g, " ").toUpperCase() : "UJIAN PRA TARGET"}
                        {u.juz ? ` (Juz ${u.juz})` : u.surah_nama ? ` (Surah ${u.surah_nama})` : ""}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "7px 10px", textAlign: "center" }}>
                        {sikapStr}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "7px 10px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>
                        {nilaiAkhir}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "7px 10px", textAlign: "center", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                        {u.is_lulus ? "LULUS" : "MENGULANG"}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr style={{ backgroundColor: "transparent" }}>
                    <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "8px 10px", textAlign: "center" }}>Belum ada data riwayat ujian pra-target</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 3. EVALUASI PENCAPAIAN AL-QUR'AN */}
          <div style={{ marginBottom: "28px", pageBreakInside: "avoid" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "6px 10px", textAlign: "left", fontSize: "13px" }}>EVALUASI PENCAPAIAN AL-QUR'AN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "transparent" }}>
                  <td style={{ border: "1px solid #1a1a1a", padding: "10px 12px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.6", textAlign: "justify", textJustify: "inter-word" }}>
                    {(() => {
                      if (praTargetUjian.length === 0) {
                        return "Belum ada riwayat ujian tahsin/tahfidz pada periode ini. Tingkatkan semangat tilawah dan muraja'ah bersama Musyrif di halaqoh.";
                      }
                      
                      const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                      const total = praTargetUjian.length;
                      
                      if (passed === total) {
                        return "Alhamdulillah, pencapaian pembelajaran Al-Qur'an pada periode ini menunjukkan hasil yang memuaskan. Terus tingkatkan kualitas Tahsin (Makharijul Huruf & Tajwid) serta rutinkan tilawah harian sebagai pondasi kokoh sebelum memperbanyak Ziyadah (Hafalan Baru).";
                      } else if (passed > 0) {
                        return "Pencapaian Al-Qur'an sudah cukup baik, namun perlu lebih memperbanyak porsi muraja'ah dan tahsin untuk menyelesaikan target ujian yang belum tuntas.";
                      } else {
                        return "Perlu memberikan perhatian ekstra pada program Al-Qur'an. Perbanyak waktu tilawah dan muraja'ah bersama rekan halaqoh agar bisa mencapai target ujian.";
                      }
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. AREA TANDA TANGAN (3 Kolom) + QR CODE BESAR (Kanan) - LEGA & BERWIBAWA */}
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "3fr 1fr", 
              marginTop: "20px", 
              pageBreakInside: "avoid", 
              fontFamily: "Arial, Helvetica, sans-serif" 
            }}
          >
                {/* Sisi Kiri: 3 Kolom Tanda Tangan Berjarak Lega & Proporsional (Tinggi 165px - Ruang TTD Ekstra Lega) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", fontSize: "13px" }}>
                  {/* Kolom 1: Orang Tua */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "165px", padding: "0 8px" }}>
                    <div>
                      <p style={{ margin: 0, opacity: 0 }}>Mengetahui</p>
                      <p style={{ margin: "3px 0 0 0" }}>Orang Tua / Wali</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontWeight: "bold", margin: 0, fontSize: "13px" }}><span>(</span><span>)</span></div>
                  </div>

                  {/* Kolom 2: Kepala Madrasah */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "165px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Mengetahui</p>
                      <p style={{ margin: "3px 0 0 0" }}>{headTitle}</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({headName})</p>
                  </div>

                  {/* Kolom 3: Wali Kelas */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "165px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Sukabumi, 11 Oktober 2026</p>
                      <p style={{ margin: "3px 0 0 0" }}>Wali Kelas</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({waliKelasName})</p>
                  </div>
                </div>

                {/* Sisi Kanan: Barcode / QR Code Besar Gagah (Resolusi Tinggi 135px, Seimbang Sempurna dengan Tanda Tangan) */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://sikap.pesantren-alimam.com/verify/${santriId}`}
                    alt="QR Code Verifikasi"
                    style={{ width: "135px", height: "135px", border: "1.5px solid #1a1a1a", padding: "4px", backgroundColor: "transparent" }}
                  />
                  <p style={{ fontSize: "9.5px", color: "#666", margin: "6px 0 0 0", textAlign: "center" }}>Scan Verifikasi Dokumen</p>
                </div>
              </div>

          {/* Catatan Kaki Halaman 2 (Simetris dengan Halaman 1) */}
          <div style={{ marginTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#666", fontStyle: "italic" }}>
            <p style={{ margin: 0 }}>* Dokumen rapor ini sah dan diterbitkan secara resmi oleh Pesantren Al-Imam Al-Islami.</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>Halaman 2 dari 2</p>
          </div>

        </div>
      </div>
    </div>
  );
}
