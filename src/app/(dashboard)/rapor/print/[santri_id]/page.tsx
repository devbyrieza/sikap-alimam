"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";

export default function CetakRaporPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const semester = searchParams.get("semester") || "Ganjil";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2026/2027";
  const initialKertas = (searchParams.get("kertas") || "F4").toUpperCase() === "A4" ? "A4" : "F4";
  const [paperSize, setPaperSize] = useState<"A4" | "F4">(initialKertas);
  
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
  const displayNis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri?.nis || "-";

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
    const isF4 = paperSize === "F4";
    const cellPad = isF4 ? "5px 4px" : "4.2px 4px";
    const namePad = isF4 ? "5px 7px" : "4.2px 6px";
    const headPad = isF4 ? "5.5px 8px" : "4.5px 8px";
    const fontSize = isF4 ? "12.5px" : "11.5px";

    return (
      <>
        {/* Header Kategori Bilateral (50% Kiri Indonesia | 50% Kanan Arab) */}
        <tr style={{ backgroundColor: "#f1f5f9" }}>
          <td colSpan={5} className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: headPad, fontWeight: "bold", fontSize: isF4 ? "13.5px" : "12.5px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #000000", padding: headPad, fontWeight: "bold", fontSize: isF4 ? "15.5px" : "14px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", color: "#000000" }} dir="rtl">
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
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{startIndex + index}</td>
              {/* Kolom 2 (Mata Pelajaran): width 21% (Times New Roman) */}
              <td style={{ border: "1px solid #000000", padding: namePad, fontSize: fontSize, fontFamily: '"Times New Roman", Times, serif', fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.25" }}>{m.nama}</td>
              {/* Kolom 3 (KKM): width 7% */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{m.kkm}</td>
              {/* Kolom 4 (Nilai): width 7% */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }}>{m.nilai}</td>
              {/* Kolom 5 (Rata-Rata): width 10.5% dengan Garis Tengah Tebal 2.5px */}
              <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2.5px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{m.rata_rata_kelas}</td>
              
              {/* Kolom 6 (المعدل التراكمي): width 10.5% (Mirror Kolom 5) */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              {/* Kolom 7 (النتيجة): width 7% (Mirror Kolom 4) */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              {/* Kolom 8 (الدرجة الصغرى): width 7% (Mirror Kolom 3) */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.kkm)}</td>
              {/* Kolom 9 (المواد الدراسية): width 21% (Mirror Kolom 2 - Traditional Arabic) */}
              <td style={{ border: "1px solid #000000", padding: namePad, textAlign: "right", fontSize: isF4 ? "15.5px" : "14px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.25" }} dir="rtl">{m.nama_arab}</td>
              {/* Kolom 10 (رقم): width 4.5% (Mirror Kolom 1) */}
              <td style={{ border: "1px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
            </tr>
          );
        })}
      </>
    );
  };

  const klsUpper = (santri?.kelas || "").toUpperCase();
  const jenjangUpper = (santri?.jenjang || "").toUpperCase();

  const isMTs = klsUpper.includes("MTS") || 
                jenjangUpper === "MTS" || 
                ["7", "8", "9"].some(k => klsUpper === k || klsUpper.startsWith(k + " "));

  const isMA = klsUpper.includes("MA") || 
               jenjangUpper === "MA" || 
               ["10", "11", "12"].some(k => klsUpper === k || klsUpper.startsWith(k + " ") || klsUpper.startsWith(k));

  const isIL = klsUpper.includes("IL") || 
               klsUpper.includes("I'DAD") || 
               jenjangUpper.includes("I'DAD") || 
               jenjangUpper.includes("IL");

  let headTitle = "Kepala Madrasah";
  let headName = santri?.kepala_madrasah || "Aziz Basuki, S.H.I., M.Pd.";
  let waliKelasName = santri?.wali_kelas || "...........................";

  if (isMA) {
    headName = "Rethna Kartika Septianiar, S.Pd.";
    waliKelasName = "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.";
  } else if (isMTs) {
    headName = "Ade Supyana, S.Pd.I.";
    waliKelasName = santri?.wali_kelas || "Agus Cahyono";
  } else if (isIL) {
    headTitle = "Kepala Kurikulum";
    headName = "Imron Abdillah, S.Pd.";
    waliKelasName = santri?.wali_kelas || "Imron Abdillah, S.Pd.";
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
        fontFamily: "Arial, Helvetica, sans-serif",
        backgroundColor: "white"
      }} 
      className="print:p-0 print:m-0 print:max-w-none print:block bg-white print:bg-white min-h-screen text-black"
    >
      <style dangerouslySetInnerHTML={{__html: `
          .arabic-text { font-family: 'Traditional Arabic', serif !important; }
          
          /* RESET MUTLAK TABEL RAPOR DOKUMEN RESMI (Sangat Rapi, Solid, Bebas Glitch) */
          .rapor-table {
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            width: 100% !important;
            border: 1px solid #000000 !important;
            background-color: #ffffff !important;
          }
          
          .rapor-table thead,
          .rapor-table tbody,
          .rapor-table tr,
          .rapor-table th,
          .rapor-table td {
            position: static !important;
            top: auto !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            z-index: auto !important;
            box-shadow: none !important;
            transition: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .rapor-table th,
          .rapor-table td {
            border: 1px solid #000000 !important;
            border-color: #000000 !important;
            vertical-align: middle !important;
          }

          /* Header Rapor Elegan & Tajam (Hitam Pekat, Bukan Abu Pudar Dashboard) */
          .rapor-table thead th {
            color: #000000 !important;
            font-weight: bold !important;
            background-color: #f1f5f9 !important;
          }

          /* Garis Pemisah Tengah Tegas (Bilateral Indonesia - Arab) */
          .rapor-table .border-divider-mid {
            border-right: 2px solid #000000 !important;
          }

          /* Matikan total efek hover dari dashboard di tabel rapor */
          .rapor-table tbody tr:hover td {
            background-color: transparent !important;
            box-shadow: none !important;
          }
          .rapor-table tbody tr:hover td:first-child {
            box-shadow: none !important;
          }

          /* BIODATA SANTRI: WAJIB 100% BERSIH DARI GARIS KOTAK APAPUN (BORDERLESS) */
          .biodata-table,
          .biodata-table thead,
          .biodata-table tbody,
          .biodata-table tr,
          .biodata-table th,
          .biodata-table td {
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
            outline: none !important;
          }
          
          @media print {
            /* Margin Keliling SAMA RATA (Atas, Bawah, Kiri, Kanan = 10mm - 12mm) */
            @page { 
              size: ${paperSize === "F4" ? "215mm 330mm" : "A4"}; 
              margin: 10mm 12mm 10mm 12mm; 
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body { 
              background: #ffffff !important; 
              background-color: #ffffff !important; 
              color: black !important; 
              margin: 0 !important;
              padding: 0 !important;
            }
            .arabic-text { font-family: 'Traditional Arabic', serif !important; }
            
            /* Sembunyikan elemen dashboard UI */
            .no-print, .mobile-header, .app-sidebar, .sidebar-nav { display: none !important; }
            .app-content > div:has(a[href="/profile"]) { display: none !important; }
            .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; background: #ffffff !important; background-color: #ffffff !important; }
            .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; background: #ffffff !important; background-color: #ffffff !important; }
            
            /* Container Cetak Bersih tanpa Zoom & Bebas Latar Belakang Abu */
            #rapor-print-container { 
              padding: 0 !important; 
              margin: 0 !important; 
              background: #ffffff !important; 
              background-color: #ffffff !important; 
              display: block !important; 
              width: 100% !important;
              min-height: 0 !important;
              box-shadow: none !important;
            }
            
            .rapor-page {
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
              box-sizing: border-box !important;
              border-radius: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              display: block !important;
              position: relative !important;
              overflow: visible !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .rapor-content-wrapper {
              min-height: 0 !important;
              height: auto !important;
              display: block !important;
            }

            .rapor-footer {
              margin-top: 14px !important;
              padding-top: 6px !important;
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            .rapor-table {
              border: 1px solid #000000 !important;
              border-collapse: collapse !important;
            }
            .rapor-table th,
            .rapor-table td {
              border: 1px solid #000000 !important;
              border-color: #000000 !important;
            }
            .rapor-table thead th {
              color: #000000 !important;
              font-weight: bold !important;
              background-color: #f1f5f9 !important;
            }
            .rapor-table .border-divider-mid {
              border-right: 2px solid #000000 !important;
            }
            .biodata-table,
            .biodata-table tr,
            .biodata-table td {
              border: none !important;
              border-width: 0 !important;
              background-color: transparent !important;
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
              line-height: 1.25 !important; 
            }
            
            th.col-rata-rata {
              font-size: 10.5px !important;
              letter-spacing: -0.2px !important;
              padding: 6px 1px !important;
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
        boxShadow: "0 10px 15px -3px rgba(85, 0, 0, 0.2)",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Cetak Rapor Santri (2 Halaman)</h2>
          <p style={{ fontSize: "12px", opacity: 0.85, margin: "4px 0 0 0" }}>Format resmi Pesantren Al-Imam. Pilih ukuran kertas yang tersedia:</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Switcher Ukuran Kertas */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: "10px", padding: "4px", gap: "4px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <button
              type="button"
              onClick={() => setPaperSize("F4")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12.5px",
                background: paperSize === "F4" ? "#ffffff" : "transparent",
                color: paperSize === "F4" ? "#550000" : "#ffffff",
                boxShadow: paperSize === "F4" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              📄 Kertas F4 / Folio (215 × 330 mm)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize("A4")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12.5px",
                background: paperSize === "A4" ? "#ffffff" : "transparent",
                color: paperSize === "A4" ? "#550000" : "#ffffff",
                boxShadow: paperSize === "A4" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              📄 Kertas A4 (210 × 297 mm)
            </button>
          </div>

          <button 
            type="button"
            onClick={() => window.print()}
            style={{ 
              padding: "9px 20px", 
              borderRadius: "10px", 
              backgroundColor: "#22c55e", 
              color: "white", 
              border: "none", 
              cursor: "pointer", 
              fontWeight: "bold", 
              fontSize: "13px",
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.15)"
            }}
          >
            <Printer size={18} /> Cetak Sekarang ({paperSize})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HALAMAN 1: RAPOR AKADEMIK (KASYFUD DARAJAT)                               */}
      {/* ========================================================================= */}
      <div 
        className={`rapor-page ${paperSize === "F4" ? "max-w-[215mm]" : "max-w-[210mm]"} mx-auto bg-white p-[12mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative`} 
        style={{ 
          borderRadius: "24px", 
          minHeight: paperSize === "F4" ? "330mm" : "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >

        {/* CONTENT WRAPPER HALAMAN 1 */}
        <div 
          className="rapor-content-wrapper"
          style={{ 
            position: "relative", 
            zIndex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "space-between", 
            minHeight: paperSize === "F4" ? "270mm" : "240mm",
            height: "100%"
          }}
        >
          <div>
            {/* Kop Surat Resmi (Times New Roman Berwibawa) */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: paperSize === "F4" ? "10px" : "8px", marginBottom: paperSize === "F4" ? "14px" : "10px", fontFamily: '"Times New Roman", Times, serif' }}>
              <img src="/logo.png" alt="Logo Al-Imam" style={{ width: paperSize === "F4" ? "74px" : "66px", height: paperSize === "F4" ? "74px" : "66px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: paperSize === "F4" ? "21px" : "19px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "2px 0 3px 0", fontSize: paperSize === "F4" ? "11.5px" : "10.5px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "2px 0 0 0", fontSize: paperSize === "F4" ? "12.5px" : "11.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "2px 0 0 0", fontSize: paperSize === "F4" ? "8.5px" : "8px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: paperSize === "F4" ? "74px" : "66px", height: paperSize === "F4" ? "74px" : "66px", objectFit: "contain" }} />
            </div>

            {/* Judul Arab & Terjemahan */}
            <div className="text-center" style={{ marginBottom: paperSize === "F4" ? "14px" : "10px" }}>
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

                const isGanjil = santri?.semester?.includes("Ganjil") || santri?.semester === "1" || !santri?.semester?.includes("Genap");
                const semesterArab = isGanjil ? "الأول" : "الثاني";
                
                return (
                  <>
                    <h1 className="text-2xl font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "23px" : "20px", margin: "0 0 3px 0" }}>
                      كشف درجات وتقويم منتصف الفصل الدراسي {semesterArab}
                    </h1>
                    <h2 className="text-lg font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "17px" : "15px", margin: paperSize === "F4" ? "0 0 8px 0" : "0 0 6px 0" }}>
                      {marhalah} بمعهد الإمام الإسلامي
                    </h2>
                    <h3 className="font-bold text-slate-800 tracking-wider uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "13px" : "12px", margin: "0 0 3px 0" }}>
                      LAPORAN HASIL EVALUASI BELAJAR TENGAH SEMESTER (PTS)
                    </h3>
                    <h4 className="font-bold text-slate-600 tracking-wide uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "11.5px" : "10.5px", margin: 0 }}>
                      RAPOR BAYANGAN • {indoMarhalah}
                    </h4>
                  </>
                );
              })()}
            </div>

            {/* Biodata Santri (100% Borderless, Bersih, Elegan) */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: paperSize === "F4" ? "12.5px" : "11.5px", marginBottom: paperSize === "F4" ? "14px" : "10px", fontWeight: "bold", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <div>
                <table className="biodata-table" style={{ width: "100%", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "2.5px 0", border: "none" }}>Nama</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ textTransform: "uppercase", padding: "2.5px 0", border: "none" }}>{santri?.nama}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "2.5px 0", border: "none" }}>NIS</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "2.5px 0", border: "none", letterSpacing: "0.5px" }}>{displayNis}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "2.5px 0", border: "none" }}>Kelas</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "2.5px 0", border: "none" }}>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right" }}>
                <table className="biodata-table" style={{ display: "inline-block", textAlign: "left", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "2.5px 0", whiteSpace: "nowrap", border: "none" }}>Semester</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "2.5px 0", border: "none" }}>
                        {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester?.includes("Genap") || santri?.semester === "2" ? "Genap" : santri?.semester} (PTS)
                      </td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "2.5px 0", whiteSpace: "nowrap", border: "none" }}>Tahun Pelajaran</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "2.5px 0", border: "none" }}>{santri?.tahun_ajaran}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "2.5px 0", whiteSpace: "nowrap", border: "none" }}>Wali Kelas</td>
                      <td style={{ padding: "2.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "2.5px 0", border: "none" }}>{waliKelasName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL UTAMA AKADEMIK (10 Kolom Bilateral Simetris 100% Sempurna) */}
            <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1.5px solid #000000", fontSize: paperSize === "F4" ? "13px" : "12px" }}>
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
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                  {/* Sisi Kiri: Bahasa Indonesia */}
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "12px" : "11px", color: "#000000" }}>No</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 6px" : "4.5px 6px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "12px" : "11px", color: "#000000" }}>Mata Pelajaran</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "12px" : "11px", color: "#000000" }}>KKM</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: paperSize === "F4" ? "12px" : "11px", color: "#000000" }}>Nilai</th>
                  {/* Kolom 5: Rata-Rata Kelas (Lega 10.5% & Tulisan Utuh Rapi) */}
                  <th className="col-rata-rata border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 1px" : "4px 1px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", lineHeight: "1.15", letterSpacing: "-0.2px", color: "#000000" }}>Rata-Rata<br/>Kelas</th>
                  
                  {/* Sisi Kanan: Bahasa Arab (Mirror Persis 10.5%) */}
                  <th className="col-rata-rata" style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 1px" : "4px 1px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", lineHeight: "1.1", color: "#000000" }}>متوسط<br/>الفصل</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", color: "#000000" }}>النتيجة</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", lineHeight: "1.1", color: "#000000" }}>الدرجة<br/>الصغرى</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 6px" : "4.5px 6px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "13.5px" : "12.5px", color: "#000000" }}>المواد الدراسية</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 2px" : "4.5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", color: "#000000" }}>رقم</th>
                </tr>
              </thead>
              <tbody>
                {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik?.syariah || [], 1)}
                {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik?.bahasa || [], (nilai_akademik?.syariah?.length || 0) + 1)}
                {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik?.umum || [], (nilai_akademik?.syariah?.length || 0) + (nilai_akademik?.bahasa?.length || 0) + 1)}

                {/* Section D. Kedisiplinan header row */}
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <td colSpan={5} className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 8px", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>D. Kedisiplinan</td>
                  <td colSpan={5} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 8px", fontWeight: "bold", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "15px" : "13.5px", color: "#000000" }} dir="rtl">د. المواظبة</td>
                </tr>
                
                {/* Summary rows (dengan pembatas tengah tebal 2px) */}
                <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", fontWeight: "bold", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>Jumlah Nilai</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{kedisiplinan?.totalNilai}</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13.5px" : "12.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.totalNilai)}</td>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "14px" : "13px" }} dir="rtl">مجموع الدرجات</td>
                </tr>
                <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", fontWeight: "bold", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>Rata-Rata Santri</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{Math.round(Number(kedisiplinan?.rataRata || 0))}</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13.5px" : "12.5px" }} dir="rtl">{toArabicNum(Math.round(Number(kedisiplinan?.rataRata || 0)))}</td>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "14px" : "13px" }} dir="rtl">المعدل التراكمي</td>
                </tr>
                <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", fontWeight: "bold", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>Ranking</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{kedisiplinan?.ranking}</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13.5px" : "12.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.ranking)}</td>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "14px" : "13px" }} dir="rtl">الترتيب</td>
                </tr>
                <tr style={{ backgroundColor: "#fafafa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", fontWeight: "bold", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>Jumlah Santri</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{kedisiplinan?.jumlahSantri}</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", backgroundColor: "transparent" }}></td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 4px" : "4.2px 4px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13.5px" : "12.5px" }} dir="rtl">{toArabicNum(kedisiplinan?.jumlahSantri)}</td>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 6px" : "4.2px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "14px" : "13px" }} dir="rtl">عدد الطلاب</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan Kaki Halaman 1 */}
          <div 
            className="rapor-footer"
            style={{ 
              marginTop: paperSize === "F4" ? "14px" : "10px", 
              paddingTop: "6px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              fontSize: "10.5px", 
              color: "#111111", 
              fontStyle: "italic", 
              gap: "16px",
              pageBreakInside: "avoid",
              breakInside: "avoid"
            }}
          >
            <p style={{ margin: 0, flex: 1, color: "#111111" }}>* Nilai di atas merupakan Hasil Evaluasi Belajar Penilaian Tengah Semester (PTS) Murni.</p>
            <p style={{ margin: 0, fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0, color: "#111111" }}>Halaman 1 dari 2</p>
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
        className={`rapor-page ${paperSize === "F4" ? "max-w-[215mm]" : "max-w-[210mm]"} mx-auto bg-white p-[12mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative`} 
        style={{ 
          borderRadius: "24px", 
          minHeight: paperSize === "F4" ? "330mm" : "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >

        {/* CONTENT WRAPPER HALAMAN 2 */}
        <div 
          className="rapor-content-wrapper"
          style={{ 
            position: "relative", 
            zIndex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "space-between", 
            minHeight: paperSize === "F4" ? "270mm" : "240mm",
            height: "100%"
          }}
        >
          <div>
            {/* Kop Surat Resmi Halaman 2 (Identik & Seragam Sempurna dengan Halaman 1) */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: paperSize === "F4" ? "10px" : "8px", marginBottom: paperSize === "F4" ? "14px" : "10px", fontFamily: '"Times New Roman", Times, serif' }}>
              <img src="/logo.png" alt="Logo Al-Imam" style={{ width: paperSize === "F4" ? "74px" : "66px", height: paperSize === "F4" ? "74px" : "66px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: paperSize === "F4" ? "21px" : "19px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "2px 0 3px 0", fontSize: paperSize === "F4" ? "11.5px" : "10.5px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "2px 0 0 0", fontSize: paperSize === "F4" ? "12.5px" : "11.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "2px 0 0 0", fontSize: paperSize === "F4" ? "8.5px" : "8px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: paperSize === "F4" ? "74px" : "66px", height: paperSize === "F4" ? "74px" : "66px", objectFit: "contain" }} />
            </div>

            {/* Judul Resmi Halaman 2 (Tengah, Rapi, Sejajar dengan Halaman 1) */}
            <div className="text-center" style={{ marginBottom: paperSize === "F4" ? "14px" : "10px" }}>
              <h2 className="text-xl font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: paperSize === "F4" ? "20px" : "18px", margin: paperSize === "F4" ? "0 0 6px 0" : "0 0 5px 0", color: "#000000" }}>
                تقرير السلوك والبرنامج القرآني
              </h2>
              <h3 style={{ fontSize: paperSize === "F4" ? "13px" : "12px", fontWeight: "bold", margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "0.5px", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                LAPORAN HASIL EVALUASI BELAJAR TENGAH SEMESTER (PTS)
              </h3>
              <h4 style={{ fontSize: paperSize === "F4" ? "11.5px" : "10.5px", fontWeight: "bold", color: "#444444", margin: 0, textTransform: "uppercase", letterSpacing: "0.3px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                RAPOR BAYANGAN • KEPRIBADIAN, TAHSIN & TAHFIDZ AL-QUR'AN
              </h4>
            </div>

            {/* Identitas Santri Halaman 2 (1 Baris Penuh Bersih & Tanpa Terpotong) */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              fontSize: paperSize === "F4" ? "11.5px" : "10.5px", 
              fontWeight: "bold", 
              marginBottom: paperSize === "F4" ? "14px" : "10px",
              paddingBottom: "5px",
              borderBottom: "1.5px solid #000000",
              color: "#000000",
              fontFamily: "Arial, Helvetica, sans-serif"
            }}>
              <div>Nama: <span style={{ textTransform: "uppercase" }}>{santri?.nama}</span></div>
              <div>NIS: <span>{displayNis}</span></div>
              <div>Kelas: <span>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</span></div>
              <div>Semester: <span>{santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester} (PTS)</span></div>
              <div>Tahun Pelajaran: <span>{santri?.tahun_ajaran || "-"}</span></div>
            </div>

            {/* 1. KEPRIBADIAN SANTRI (KIRI) & KETIDAKHADIRAN (KANAN) - SATU TABEL SIMETRIS UTUH */}
            <table 
              className="rapor-table"
              style={{ 
                width: "100%", 
                tableLayout: "fixed", 
                borderCollapse: "collapse", 
                border: "1px solid #000000", 
                marginBottom: paperSize === "F4" ? "14px" : "10px", 
                pageBreakInside: "avoid", 
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: paperSize === "F4" ? "12.5px" : "11.5px"
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
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th colSpan={2} className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "6px 8px" : "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px", color: "#000000" }}>
                    Kepribadian Santri
                  </th>
                  <th colSpan={2} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "6px 8px" : "5px 8px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px", color: "#000000" }}>
                    Ketidakhadiran
                  </th>
                </tr>
                <tr style={{ backgroundColor: "#f8fafc", fontSize: paperSize === "F4" ? "12px" : "11px" }}>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", textAlign: "center", color: "#000000" }}>Aspek Penilaian</th>
                  <th className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", textAlign: "center", color: "#000000" }}>Predikat</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", textAlign: "center", color: "#000000" }}>Absensi</th>
                  <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", textAlign: "center", color: "#000000" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {/* Baris 1: Perilaku & Sakit */}
                <tr style={{ backgroundColor: "white" }}>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px" }}>Perilaku</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 6px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{sikapGrade}</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center" }}>Sakit</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>
                    <strong style={{ fontSize: paperSize === "F4" ? "13px" : "12px" }}>{absen?.sakit || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                  </td>
                </tr>
                {/* Baris 2: Kedisiplinan & Izin */}
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px" }}>Kedisiplinan</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 6px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{disiplinGrade}</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center" }}>Izin</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>
                    <strong style={{ fontSize: paperSize === "F4" ? "13px" : "12px" }}>{absen?.izin || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                  </td>
                </tr>
                {/* Baris 3: Kerajinan & Alpha */}
                <tr style={{ backgroundColor: "white" }}>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px" }}>Kerajinan</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 6px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{sikapGrade}</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center" }}>Alpha</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>
                    <strong style={{ fontSize: paperSize === "F4" ? "13px" : "12px" }}>{absen?.alpha || 0}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                  </td>
                </tr>
                {/* Baris 4: Kebersihan & Total (Sempurna & Seimbang) */}
                <tr style={{ backgroundColor: "#fafafa" }}>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px" }}>Kebersihan</td>
                  <td className="border-divider-mid" style={{ border: "1px solid #000000", borderRight: "2px solid #000000", padding: paperSize === "F4" ? "5.5px 8px" : "4.5px 6px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>{sikapGrade}</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center", fontWeight: "bold" }}>Total</td>
                  <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5.5px 10px" : "4.5px 8px", textAlign: "center", fontSize: paperSize === "F4" ? "12.5px" : "11.5px" }}>
                    <strong style={{ fontSize: paperSize === "F4" ? "13px" : "12px" }}>{(absen?.sakit || 0) + (absen?.izin || 0) + (absen?.alpha || 0)}</strong> <span style={{ color: "#444" }}>Jam Pelajaran</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2. LAPORAN TAHSIN & TAHFIDZ (UJIAN PRA TARGET RESMI) */}
            <div style={{ marginBottom: paperSize === "F4" ? "14px" : "10px", pageBreakInside: "avoid" }}>
              <table className="rapor-table" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: paperSize === "F4" ? "12.5px" : "11.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={4} style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "6px 8px" : "5px 8px", textAlign: "left", color: "#000000", fontWeight: "bold", fontSize: paperSize === "F4" ? "13px" : "12px" }}>
                      LAPORAN TAHSIN & TAHFIDZ (PROGRAM AL-QUR'AN)
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", textAlign: "left", color: "#000000" }}>Jenis / Materi Ujian</th>
                    <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", width: "15%", textAlign: "center", color: "#000000" }}>Sikap</th>
                    <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", width: "15%", textAlign: "center", color: "#000000" }}>Nilai Ujian</th>
                    <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "5px 8px" : "4px 8px", width: "20%", textAlign: "center", color: "#000000" }}>Keterangan</th>
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
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "7.5px 10px" : "6px 10px", fontWeight: "bold" }}>
                          {u.jenis_ujian ? u.jenis_ujian.replace(/_/g, " ").toUpperCase() : "UJIAN PRA TARGET"}
                          {u.juz ? ` (Juz ${u.juz})` : u.surah_nama ? ` (Surah ${u.surah_nama})` : ""}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "7.5px 10px" : "6px 10px", textAlign: "center" }}>
                          {sikapStr}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "7.5px 10px" : "6px 10px", textAlign: "center", fontWeight: "bold", fontSize: paperSize === "F4" ? "13.5px" : "12.5px" }}>
                          {nilaiAkhir}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "7.5px 10px" : "6px 10px", textAlign: "center", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                          {u.is_lulus ? "LULUS" : "MENGULANG"}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr style={{ backgroundColor: "white" }}>
                      <td colSpan={4} style={{ border: "1px solid #000000", padding: "8px 10px", textAlign: "center" }}>Belum ada data riwayat ujian pra-target</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. EVALUASI PENCAPAIAN AL-QUR'AN */}
            <div style={{ marginBottom: paperSize === "F4" ? "14px" : "10px", pageBreakInside: "avoid" }}>
              <table className="rapor-table" style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: paperSize === "F4" ? "12.5px" : "11.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "6px 10px" : "5px 10px", textAlign: "left", fontSize: paperSize === "F4" ? "13px" : "12px", color: "#000000" }}>EVALUASI PENCAPAIAN AL-QUR'AN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #000000", padding: paperSize === "F4" ? "8px 12px" : "6px 10px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.5", textAlign: "justify", textJustify: "inter-word" }}>
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

            {/* 4. AREA TANDA TANGAN (3 Kolom) + QR CODE (Kanan Sejajar Flush dengan Kotak Evaluasi) */}
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "stretch",
                width: "100%",
                boxSizing: "border-box",
                marginTop: paperSize === "F4" ? "14px" : "10px", 
                pageBreakInside: "avoid", 
                fontFamily: "Arial, Helvetica, sans-serif" 
              }}
            >
              {/* Sisi Kiri: 3 Kolom Tanda Tangan Simetris Presisi & Proporsional */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1.15fr 1.35fr", 
                textAlign: "center", 
                fontSize: paperSize === "F4" ? "12px" : "11px", 
                gap: paperSize === "F4" ? "10px" : "6px",
                flex: 1,
                marginRight: paperSize === "F4" ? "16px" : "12px",
                minWidth: 0
              }}>
                {/* Kolom 1: Orang Tua */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: paperSize === "F4" ? "165px" : "145px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Mengetahui</p>
                    <p style={{ margin: "3px 0 0 0" }}>Orang Tua / Wali</p>
                  </div>
                  <div style={{ minHeight: "32px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ 
                      fontWeight: "bold", 
                      margin: 0, 
                      fontSize: paperSize === "F4" ? "11.5px" : "11px", 
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      maxWidth: paperSize === "F4" ? "165px" : "145px"
                    }}>
                      <span>(</span>
                      <span style={{ display: "inline-block", flex: 1, minWidth: paperSize === "F4" ? "135px" : "115px" }}>&nbsp;</span>
                      <span>)</span>
                    </p>
                  </div>
                </div>

                {/* Kolom 2: Kepala Madrasah (Tepat di Tengah) */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: paperSize === "F4" ? "165px" : "145px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Mengetahui</p>
                    <p style={{ margin: "3px 0 0 0" }}>{headTitle}</p>
                  </div>
                  <div style={{ minHeight: "32px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: paperSize === "F4" ? "11px" : "10.5px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({headName})
                    </p>
                  </div>
                </div>

                {/* Kolom 3: Wali Kelas */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: paperSize === "F4" ? "165px" : "145px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Sukabumi, 11 Oktober 2026</p>
                    <p style={{ margin: "3px 0 0 0" }}>Wali Kelas</p>
                  </div>
                  <div style={{ minHeight: "32px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: paperSize === "F4" ? "11px" : "10px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({waliKelasName})
                    </p>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: Barcode / QR Code (100% Sejajar Rata Kanan / Flush dengan Garis Ujung Kotak Evaluasi Al-Qur'an) */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                alignItems: "flex-end", 
                height: paperSize === "F4" ? "165px" : "145px",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", flex: 1 }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://sikap.pesantren-alimam.com/verify/${santriId}`}
                    alt="QR Code Verifikasi"
                    style={{ 
                      width: paperSize === "F4" ? "105px" : "95px", 
                      height: paperSize === "F4" ? "105px" : "95px", 
                      border: "1.5px solid #000000", 
                      padding: "3px", 
                      backgroundColor: "white",
                      display: "block",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ minHeight: "32px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", width: "100%" }}>
                  <p style={{ fontSize: "8.5px", color: "#666", margin: 0, textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}>
                    Scan Verifikasi Dokumen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Kaki Halaman 2 (Simetris dengan Halaman 1, 1 Baris Rapi & Elegan) */}
          <div 
            className="rapor-footer"
            style={{ 
              marginTop: paperSize === "F4" ? "14px" : "10px", 
              paddingTop: "6px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              fontSize: "10.5px", 
              color: "#111111", 
              fontStyle: "italic", 
              gap: "16px",
              pageBreakInside: "avoid",
              breakInside: "avoid"
            }}
          >
            <p style={{ margin: 0, flex: 1, color: "#111111" }}>* Dokumen rapor ini sah dan diterbitkan secara resmi oleh Pesantren Al-Imam Al-Islami (Managed by Al-Andalus IIBS).</p>
            <p style={{ margin: 0, fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0, color: "#111111" }}>Halaman 2 dari 2</p>
          </div>

        </div>
      </div>
    </div>
  );
}
