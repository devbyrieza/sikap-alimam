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

  // Grade computation for Kepribadian Santri dari nilai_sikap ujian pra-target
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

  // Kedisiplinan grade dari data absensi
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
        {/* Header Kategori Bilateral (Pemisah vertikal tebal 2.5px di tengah) */}
        <tr style={{ backgroundColor: "#e8e8e8" }}>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "13px", textAlign: "right", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
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
              {/* Sisi Kiri: Bahasa Indonesia (Kolom 1 - 5) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>{startIndex + index}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontSize: "12.5px", fontFamily: '"Times New Roman", Times, serif', fontWeight: "bold" }}>{m.nama}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>{m.kkm}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }}>{m.nilai}</td>
              {/* Kolom 5: Rata-Rata dengan garis pemisah kanan tebal 2.5px */}
              <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>{m.rata_rata_kelas}</td>
              
              {/* Sisi Kanan: Bahasa Arab (Kolom 6 - 10) */}
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.kkm)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontSize: "13px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold" }} dir="rtl">{m.nama_arab}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 6px", textAlign: "center", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
            </tr>
          );
        })}
      </>
    );
  };

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
            @page { size: A4; margin: 5mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; color: black; }
            .arabic-text { font-family: 'Traditional Arabic', serif !important; }
            
            /* Sembunyikan elemen dashboard UI */
            .no-print, .mobile-header, .app-sidebar, .sidebar-nav { display: none !important; }
            .app-content > div:has(a[href="/profile"]) { display: none !important; }
            .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; }
            .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
            
            /* --- COMPRESSION AGAR MUAT 1 HALAMAN PAS --- */
            #rapor-print-container { 
              padding: 0 !important; 
              margin: 0 !important; 
              background: white !important; 
              display: block !important; 
              zoom: 0.88; 
              transform-origin: top center; 
              margin-left: 6.8% !important; 
              padding-right: 2px !important;
            }
            #rapor-print-container > div {
              margin-bottom: 8px !important;
            }
            
            .bg-gray-50 { background-color: white !important; }
            div[style*="min-height: 297mm"] { min-height: 0 !important; border-radius: 0 !important; }
            
            /* Kompresi Tabel */
            table td, table th { padding: 3px 4px !important; font-size: 10px !important; line-height: 1.1 !important; }
            
            /* Kop Surat */
            img[alt="Logo Al-Imam"] { width: 50px !important; height: 50px !important; }
            img[alt="Logo Al-Andalus"] { width: 40px !important; height: 40px !important; }
            h1.arabic-text { font-size: 16px !important; margin-bottom: 0 !important; }
            h2.arabic-text { font-size: 12px !important; margin-bottom: 0 !important; }
            h3 { font-size: 11px !important; margin-top: 0 !important; }
            h4 { font-size: 10px !important; margin-top: 0 !important; }
            
            p { margin-bottom: 0 !important; line-height: 1.15 !important; }
            div[style*="margin-bottom: 16px"] { margin-bottom: 4px !important; }
            div[style*="margin-bottom: 24px"] { margin-bottom: 4px !important; }
            div[style*="margin-top: 24px"] { margin-top: 4px !important; }
            div[style*="margin-top: 40px"] { margin-top: 6px !important; }
            div[style*="padding: 16px"] { padding: 6px !important; }
            
            tr, td, th { page-break-inside: avoid !important; }
            table { width: 99.8% !important; margin: 0 auto; }
          }
        `}} />

      {/* Hero Banner for Print Page */}
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
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Cetak Rapor Santri (PTS Murni)</h2>
          <p style={{ fontSize: "12px", opacity: 0.8, margin: "4px 0 0 0" }}>Format cetak resmi bilateral Al-Imam & Al-Andalus untuk wali santri.</p>
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
          <Printer size={18} /> Cetak Sekarang
        </button>
      </div>

      <div 
        className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" 
        style={{ 
          borderRadius: "24px", 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >
        
        {/* WATERMARK AL-IMAM */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 0, pointerEvents: "none", opacity: 0.05 }}>
          <img src="/logo.png" alt="Watermark" style={{ width: "60%" }} />
        </div>

        {/* CONTENT WRAPPER */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Kop Surat Resmi (Tetap mempertahankan font Times New Roman berwibawa) */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #1a1a1a", paddingBottom: "14px", marginBottom: "20px", fontFamily: '"Times New Roman", Times, serif' }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "14px", fontWeight: "bold", fontFamily: "Arial, Helvetica, sans-serif" }}>
            <div>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 80, padding: "3px 0", borderBottom: "none" }}>Nama</td>
                    <td style={{ padding: "3px 6px", borderBottom: "none" }}>:</td>
                    <td style={{ textTransform: "uppercase", padding: "3px 0", borderBottom: "none" }}>{santri?.nama}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 80, padding: "3px 0", borderBottom: "none" }}>Kelas</td>
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Table Structure (10 columns, Bilateral Mirror Layout) */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px", marginBottom: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                {/* Sisi Kiri: Bahasa Indonesia (5 Kolom) */}
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "35px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}>No</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "48px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}>KKM</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "48px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}>Nilai</th>
                {/* Kolom 5: Rata-Rata dengan garis pembatas tengah tebal 2.5px */}
                <th style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "6px 4px", width: "65px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}>Rata-Rata</th>
                
                {/* Sisi Kanan: Bahasa Arab (5 Kolom) */}
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "65px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">المعدل التراكمي</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "48px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">النتيجة</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "48px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">الدرجة الصغرى</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">المواد الدراسية</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "35px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">رقم</th>
              </tr>
            </thead>
            <tbody>
              {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik?.syariah || [], 1)}
              {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik?.bahasa || [], (nilai_akademik?.syariah?.length || 0) + 1)}
              {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik?.umum || [], (nilai_akademik?.syariah?.length || 0) + (nilai_akademik?.bahasa?.length || 0) + 1)}

              {/* Section D. Kedisiplinan header row */}
              <tr style={{ backgroundColor: "#e8e8e8" }}>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>D. Kedisiplinan</td>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">د. المواظبة</td>
              </tr>
              
              {/* Summary rows (dengan pembatas tengah tebal 2.5px) */}
              <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Jumlah Nilai</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.totalNilai}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.totalNilai)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">مجموع الدرجات</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Nilai Rata-rata</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.rataRata}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.rataRata)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">المعدل التراكمي</td>
              </tr>
              <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Ranking</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.ranking}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.ranking)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">الترتيب</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Jumlah Santri</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.jumlahSantri}</td>
                <td style={{ border: "1px solid #1a1a1a", borderRight: "2.5px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.jumlahSantri)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">عدد الطلاب</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Section: Kepribadian Santri (Kiri) & Ketidakhadiran (Kanan) - Menyatu Seamless persis seperti contoh PDF */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid #1a1a1a", marginBottom: "14px", pageBreakInside: "avoid", fontFamily: "Arial, Helvetica, sans-serif" }}>
            {/* SISI KIRI (50%): Kepribadian Santri */}
            <div style={{ borderRight: "2.5px solid #1a1a1a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th colSpan={2} style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>
                      Kepribadian Santri
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "4.5px 8px" }}>Perilaku</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", padding: "4.5px 8px", textAlign: "center", fontWeight: "bold", width: "35%" }}>{sikapGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "4.5px 8px" }}>Kedisiplinan</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", padding: "4.5px 8px", textAlign: "center", fontWeight: "bold" }}>{disiplinGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "4.5px 8px" }}>Kerajinan</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", padding: "4.5px 8px", textAlign: "center", fontWeight: "bold" }}>{sikapGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ borderRight: "1px solid #1a1a1a", padding: "4.5px 8px" }}>Kebersihan</td>
                    <td style={{ padding: "4.5px 8px", textAlign: "center", fontWeight: "bold" }}>{sikapGrade}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SISI KANAN (50%): Ketidakhadiran */}
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th colSpan={3} style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>
                      Ketidakhadiran
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#e8e8e8", fontSize: "11px" }}>
                    <th style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "3px 8px", textAlign: "center" }}>Absensi</th>
                    <th colSpan={2} style={{ borderBottom: "1px solid #1a1a1a", padding: "3px 8px", textAlign: "center" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", width: "40%" }}>Sakit</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "center", fontWeight: "bold", width: "20%" }}>{absen?.sakit || 0}</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", padding: "4px 8px", fontSize: "11px", color: "#444" }}>Jam Pelajaran</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Ijin</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", borderRight: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>{absen?.izin || 0}</td>
                    <td style={{ borderBottom: "1px solid #1a1a1a", padding: "4px 8px", fontSize: "11px", color: "#444" }}>Jam Pelajaran</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ borderRight: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Alpha</td>
                    <td style={{ borderRight: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "center", fontWeight: "bold" }}>{absen?.alpha || 0}</td>
                    <td style={{ padding: "4px 8px", fontSize: "11px", color: "#444" }}>Jam Pelajaran</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* LAPORAN TAHSIN & TAHFIDZ (Ujian Pra-Target Resmi) */}
          <div style={{ marginTop: "10px", pageBreakInside: "avoid" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "left", color: "#1a1a1a", fontWeight: "bold" }}>LAPORAN TAHSIN & TAHFIDZ</th>
                </tr>
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "left" }}>Jenis / Materi Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "4px 8px", width: "15%", textAlign: "center" }}>Sikap</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "4px 8px", width: "15%", textAlign: "center" }}>Nilai Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "4px 8px", width: "20%", textAlign: "center" }}>Keterangan</th>
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
                    <tr key={i} style={{ backgroundColor: "white" }}>
                      <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>
                        {u.jenis_ujian ? u.jenis_ujian.replace(/_/g, " ").toUpperCase() : "UJIAN PRA TARGET"}
                        {u.juz ? ` (Juz ${u.juz})` : u.surah_nama ? ` (Surah ${u.surah_nama})` : ""}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center" }}>
                        {sikapStr}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>
                        {nilaiAkhir}
                      </td>
                      <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                        {u.is_lulus ? "LULUS" : "MENGULANG"}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr style={{ backgroundColor: "white" }}>
                    <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center" }}>Belum ada data ujian pra-target</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* EVALUASI PENCAPAIAN AL-QUR'AN */}
          <div style={{ marginTop: "8px", pageBreakInside: "avoid", marginBottom: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "left" }}>EVALUASI PENCAPAIAN AL-QUR'AN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white" }}>
                  <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.4" }}>
                    {(() => {
                      if (praTargetUjian.length === 0) {
                        return "Belum ada riwayat ujian tahsin/tahfidz pada periode ini. Tingkatkan semangat tilawah dan muraja'ah bersama Musyrif di halaqoh.";
                      }
                      
                      const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                      const total = praTargetUjian.length;
                      
                      if (passed === total) {
                        return "Alhamdulillah, pencapaian Al-Qur'an ananda memuaskan. Terus tingkatkan kualitas Tahsin (Makharijul Huruf & Tajwid) serta rutinkan tilawah harian sebagai pondasi kokoh sebelum memperbanyak Ziyadah (Hafalan Baru).";
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

          {/* Signature Block (3 TTD di Kiri + 1 QR Code Besar di Kanan persis contoh PDF) */}
          {(() => {
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
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "3fr 1fr", 
                  marginTop: "16px", 
                  pageBreakInside: "avoid", 
                  fontFamily: "Arial, Helvetica, sans-serif" 
                }}
              >
                {/* Sisi Kiri: 3 Kolom Tanda Tangan */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", fontSize: "12px" }}>
                  {/* Kolom 1: Orang Tua */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                    <div>
                      <p style={{ margin: 0, opacity: 0 }}>Mengetahui</p>
                      <p style={{ margin: "2px 0 0 0" }}>Orang Tua</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</p>
                  </div>

                  {/* Kolom 2: Kepala Madrasah */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Mengetahui</p>
                      <p style={{ margin: "2px 0 0 0" }}>{headTitle}</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({headName})</p>
                  </div>

                  {/* Kolom 3: Wali Kelas */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Sukabumi, 11 Oktober 2026</p>
                      <p style={{ margin: "2px 0 0 0" }}>Wali Kelas</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({waliKelasName})</p>
                  </div>
                </div>

                {/* Sisi Kanan: Barcode / QR Code Besar tanpa teks panjang (persis contoh PDF) */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sikap.pesantren-alimam.com/verify/${santriId}`}
                    alt="QR Code Verifikasi"
                    style={{ width: "95px", height: "95px", border: "1px solid #1a1a1a", padding: "3px", backgroundColor: "white" }}
                  />
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
