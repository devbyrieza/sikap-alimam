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

  // Grade computation for Kepribadian Santri
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

  // Kedisiplinan grade from absensi
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
        {/* Header Kategori Bilateral */}
        <tr style={{ backgroundColor: "#e8e8e8" }}>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "12px", textAlign: "right", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel */}
        {mapelList.map((m, index) => {
          const isEven = index % 2 === 0;
          return (
            <tr 
              key={index} 
              style={{ backgroundColor: isEven ? "white" : "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }}>{startIndex + index}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontSize: "12px" }}>{m.nama}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }}>{m.kkm}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }}>{m.nilai}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }}>{m.rata_rata_kelas}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }} dir="rtl">{toArabicNum(m.kkm)}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontSize: "12px", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">{m.nama_arab}</td>
              <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "center", fontSize: "12px" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
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
          body * { font-family: Arial, Helvetica, sans-serif !important; }
          .arabic-text { font-family: 'Traditional Arabic', Arial, sans-serif !important; }
          
          @media print {
            @page { size: A4; margin: 5mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; color: black; }
            body * { font-family: Arial, Helvetica, sans-serif !important; }
            .arabic-text { font-family: 'Traditional Arabic', Arial, sans-serif !important; }
            
            /* Sembunyikan elemen dashboard UI (Header & Sidebar & Security Banner) */
            .no-print, .mobile-header, .app-sidebar, .sidebar-nav { display: none !important; }
            
            /* Sembunyikan alert keamanan spesifik */
            .app-content > div:has(a[href="/profile"]) { display: none !important; }
            
            /* Hilangkan wrapper gap dan margin bawaan Dashboard */
            .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; }
            .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
            
            /* --- COMPRESSION AGAR MUAT 1 HALAMAN --- */
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

      <div 
        className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" 
        style={{ 
          borderRadius: "24px", 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >
        
        {/* WATERMARK */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 0, pointerEvents: "none", opacity: 0.05 }}>
          <img src="/logo.png" alt="Watermark" style={{ width: "60%" }} />
        </div>

        {/* CONTENT WRAPPER */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Kop Surat Resmi */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #1a1a1a", paddingBottom: "16px", marginBottom: "24px" }}>
            <img src="/logo.png" alt="Logo Al-Imam" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#1a1a1a" }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
              <p style={{ margin: "2px 0 4px 0", fontSize: "12px", fontWeight: "bold", color: "#666", fontStyle: "italic" }}>Managed by Al-Andalus International Islamic Boarding School</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "bold", color: "#333" }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "8.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
            </div>
            <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
          </div>

          {/* Judul Arab & Terjemahan */}
          <div className="text-center mb-6">
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
                  <h1 className="text-2xl font-bold arabic-text mb-1" dir="rtl" style={{ fontFamily: "Traditional Arabic, Arial, sans-serif" }}>
                    كشف الدرجات {marhalah}
                  </h1>
                  <h2 className="text-lg font-bold arabic-text mb-2" dir="rtl" style={{ fontFamily: "Traditional Arabic, Arial, sans-serif" }}>بمعهد الإمام الإسلامي</h2>
                  <h3 className="text-[13px] font-bold text-slate-800 tracking-wider mt-1 uppercase">
                    Laporan Hasil Evaluasi Belajar (Rapor)
                  </h3>
                  <h4 className="text-[12px] font-bold text-slate-600 tracking-wide mt-0.5 uppercase">
                    {indoMarhalah}
                  </h4>
                </>
              );
            })()}
          </div>

          {/* Biodata */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "16px", fontWeight: "bold" }}>
            <div>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 80, padding: "4px 0", borderBottom: "none" }}>Nama</td>
                    <td style={{ padding: "4px", borderBottom: "none" }}>:</td>
                    <td style={{ textTransform: "uppercase", padding: "4px 0", borderBottom: "none" }}>{santri?.nama}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ width: 80, padding: "4px 0", borderBottom: "none" }}>Kelas</td>
                    <td style={{ padding: "4px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "4px 0", borderBottom: "none" }}>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right" }}>
              <table style={{ display: "inline-block", textAlign: "left" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "4px 0", whiteSpace: "nowrap", borderBottom: "none" }}>Semester</td>
                    <td style={{ padding: "4px 8px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "4px 0", borderBottom: "none" }}>
                      {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester?.includes("Genap") || santri?.semester === "2" ? "Genap" : santri?.semester}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "4px 0", whiteSpace: "nowrap", borderBottom: "none" }}>Tahun Pelajaran</td>
                    <td style={{ padding: "4px 8px", borderBottom: "none" }}>:</td>
                    <td style={{ padding: "4px 0", borderBottom: "none" }}>{santri?.tahun_ajaran}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Table Structure (10 columns, bilateral layout) */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "35px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "50px", textAlign: "center" }}>KKM</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "50px", textAlign: "center" }}>Nilai</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "65px", textAlign: "center" }}>Rata-Rata</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "65px", textAlign: "center", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">المعدل التراكمي</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "50px", textAlign: "center", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">النتيجة</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "50px", textAlign: "center", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">الدرجة الصغرى</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">المواد الدراسية</th>
                <th style={{ border: "1px solid #1a1a1a", padding: "6px 4px", width: "35px", textAlign: "center", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">رقم</th>
              </tr>
            </thead>
            <tbody>
              {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik?.syariah || [], 1)}
              {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik?.bahasa || [], (nilai_akademik?.syariah?.length || 0) + 1)}
              {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik?.umum || [], (nilai_akademik?.syariah?.length || 0) + (nilai_akademik?.bahasa?.length || 0) + 1)}

              {/* Section D. Kedisiplinan header row */}
              <tr style={{ backgroundColor: "#e8e8e8" }}>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>D. Kedisiplinan</td>
                <td colSpan={5} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold", textAlign: "right", fontFamily: "Traditional Arabic, Arial, sans-serif", fontSize: "12px" }} dir="rtl">د. المواظبة</td>
              </tr>
              
              {/* Summary rows */}
              <tr style={{ backgroundColor: "white" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Jumlah Nilai</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.totalNilai}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.totalNilai)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">مجموع الدرجات</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Nilai Rata-rata</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.rataRata}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.rataRata)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">المعدل التراكمي</td>
              </tr>
              <tr style={{ backgroundColor: "white" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Ranking</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.ranking}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.ranking)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">الترتيب</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", fontWeight: "bold" }}>Jumlah Santri</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.jumlahSantri}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "5px 4px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.jumlahSantri)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, Arial, sans-serif" }} dir="rtl">عدد الطلاب</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Section (2 columns: Kepribadian Kiri | Ketidakhadiran Kanan) */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "16px", pageBreakInside: "avoid" }}>
            {/* LEFT (50%): Kepribadian Santri */}
            <div style={{ width: "50%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>
                      Kepribadian Santri
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Perilaku</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold", width: "35%" }}>{sikapGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kedisiplinan</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{disiplinGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kerajinan</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{sikapGrade}</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px" }}>Kebersihan</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{sikapGrade}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT (50%): Ketidakhadiran + Absensi */}
            <div style={{ width: "50%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>Ketidakhadiran</th>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", width: "45%" }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Sakit</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen?.sakit || 0} Jam Pelajaran</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Ijin</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen?.izin || 0} Jam Pelajaran</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center" }}>Alpha</td>
                    <td style={{ border: "1px solid #1a1a1a", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>{absen?.alpha || 0} Jam Pelajaran</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* LAPORAN TAHSIN & TAHFIDZ (full width) */}
          <div style={{ marginTop: "12px", pageBreakInside: "avoid" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "left", color: "#1a1a1a", fontWeight: "bold" }}>LAPORAN TAHSIN & TAHFIDZ</th>
                </tr>
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "left" }}>Jenis / Materi Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "5px 8px", width: "15%", textAlign: "center" }}>Sikap</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "5px 8px", width: "15%", textAlign: "center" }}>Nilai Ujian</th>
                  <th style={{ border: "1px solid #1a1a1a", padding: "5px 8px", width: "20%", textAlign: "center" }}>Keterangan</th>
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
                      <td style={{ border: "1px solid #1a1a1a", padding: "5px 8px" }}>
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
                    <td colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>Belum ada data ujian</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* EVALUASI PENCAPAIAN AL-QUR'AN (full width) */}
          <div style={{ marginTop: "12px", pageBreakInside: "avoid", marginBottom: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #1a1a1a", padding: "5px 8px", textAlign: "left" }}>EVALUASI PENCAPAIAN AL-QUR'AN</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white" }}>
                  <td style={{ border: "1px solid #1a1a1a", padding: "8px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.5" }}>
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

          {/* Signature Block (3fr 1fr grid) */}
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
                  marginTop: "24px", 
                  pageBreakInside: "avoid", 
                  fontFamily: "Arial, Helvetica, sans-serif" 
                }}
              >
                {/* Left: 3 signatures in a 3-column sub-grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", fontSize: "13px" }}>
                  {/* Col 1: Orang Tua */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "110px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Mengetahui,</p>
                      <p style={{ margin: "2px 0 0 0" }}>Orang Tua / Wali</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>( ........................... )</p>
                  </div>
                  {/* Col 2: Kepala Madrasah */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "110px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Mengetahui,</p>
                      <p style={{ margin: "2px 0 0 0" }}>{headTitle}</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({headName})</p>
                  </div>
                  {/* Col 3: Wali Kelas */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "110px" }}>
                    <div>
                      <p style={{ margin: 0 }}>Sukabumi, 11 Oktober 2026</p>
                      <p style={{ margin: "2px 0 0 0" }}>Wali Kelas</p>
                    </div>
                    <p style={{ fontWeight: "bold", margin: 0 }}>({waliKelasName})</p>
                  </div>
                </div>

                {/* Right: QR Code ONLY (no text description) */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://sikap.pesantren-alimam.com/verify/${santriId}`}
                    alt="QR Code Verifikasi"
                    style={{ width: "90px", height: "90px" }}
                  />
                  <p style={{ fontSize: "8px", textAlign: "center", marginTop: "4px", color: "#666", margin: "4px 0 0 0" }}>Scan untuk verifikasi</p>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
