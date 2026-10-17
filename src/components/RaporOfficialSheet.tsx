"use client";

import React from "react";
import { Printer } from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";

interface RaporOfficialSheetProps {
  data: any;
  showPrintToolbar?: boolean;
}

export default function RaporOfficialSheet({ data, showPrintToolbar = false }: RaporOfficialSheetProps) {
  if (!data || data.error) {
    return (
      <div className="p-10 text-center text-red-500 font-sans">
        Data rapor tidak ditemukan.
      </div>
    );
  }

  const { santri, nilai_akademik, kedisiplinan, absen, absen_akademik, absen_halaqoh, ujian_tahfidz } = data;
  const absenAkad = absen_akademik || { sakit: 0, izin: 0, alpha: 0, total: 0 };
  const absenHalaq = absen_halaqoh || absen || { sakit: 0, izin: 0, alpha: 0, total: 0 };
  const paperSize = "A4";
  const displayNis = (santri?.nama ? getOfficialNis(santri.nama) : null) || santri?.nis || "-";

  const toArabicNum = (num: number | string) => {
    if (num === null || num === undefined) return "-";
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, function(w) {
      return arabicNumbers[+w] || w;
    });
  };

  const toArabicPredikat = (grade: string) => {
    switch ((grade || "").toUpperCase().trim()) {
      case "A": return "ممتاز (أ)";
      case "B": return "جيد جداً (ب)";
      case "C": return "جيد (جـ)";
      case "D": return "مقبول (د)";
      default: return "-";
    }
  };

  const toArabicSikap = (sikap: string) => {
    const s = (sikap || "").toLowerCase();
    if (s.includes("sangat") || s.includes("a")) return "ممتاز";
    if (s.includes("baik") || s.includes("b")) return "جيد جداً";
    if (s.includes("cukup") || s.includes("c")) return "جيد";
    return "مقبول";
  };

  const toArabicExamType = (jenis: string, juz?: number | null, surah?: string | null) => {
    let base = "اختبار القرآن الكريم";
    const j = (jenis || "").toLowerCase();
    if (j.includes("pra_target") || j.includes("pratarget")) {
      base = "اختبار ما قبل الهدف";
    } else if (j.includes("target")) {
      base = "اختبار الهدف";
    } else if (j.includes("pekanan")) {
      base = "الاختبار الأسبوعي";
    } else if (j.includes("bulanan")) {
      base = "الاختبار الشهري";
    } else if (j.includes("itqon")) {
      base = "اختبار الإتقان";
    }
    
    if (juz) {
      base += ` (الجزء ${toArabicNum(juz)})`;
    } else if (surah) {
      base += ` (سورة ${surah})`;
    }
    return base;
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

  // Nilai Kedisiplinan dari Absensi Halaqoh Kepengasuhan
  let disiplinGrade = "-";
  const alphaVal = Number(absenHalaq?.alpha) || 0;
  const izinVal = Number(absenHalaq?.izin) || 0;
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
    const cellPad = "3.8px 4px";
    const namePad = "3.8px 5px";
    const headPad = "4.2px 5px";
    const fontSize = "11px";

    return (
      <React.Fragment key={judul}>
        {/* Header Kategori Bilateral (50% Kiri Indonesia | 50% Kanan Arab) */}
        <tr style={{ backgroundColor: "#f1f5f9" }}>
          <td colSpan={5} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: headPad, fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>
            {judul}
          </td>
          <td colSpan={5} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: headPad, fontWeight: "bold", fontSize: "14px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", color: "#000000" }} dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel Simetris Sempurna */}
        {mapelList.map((m, index) => {
          const isEven = index % 2 === 0;
          // KKM: Diniyah (Syariah) & Bahasa = 85, Umum = 80
          const kkmVal = m.kkm && m.kkm !== 75 ? m.kkm : (judul.includes("Umum") ? 80 : 85);
          return (
            <tr 
              key={index} 
              style={{ backgroundColor: isEven ? "white" : "#fafafa" }}
            >
              {/* Kolom 1 (No): width 4.5% */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{startIndex + index}</td>
              {/* Kolom 2 (Mata Pelajaran): width 21% */}
              <td style={{ border: "1px solid #94a3b8", padding: namePad, fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.2" }}>{m.nama}</td>
              {/* Kolom 3 (KKM): width 7% */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{kkmVal}</td>
              {/* Kolom 4 (Nilai): width 7% */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }}>{m.nilai}</td>
              {/* Kolom 5 (Rata-Rata): width 10.5% dengan Garis Tengah Tebal 2.5px */}
              <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }}>{m.rata_rata_kelas}</td>
              
              {/* Kolom 6 (المعدل التراكمي): width 10.5% (Mirror Kolom 5) */}
              <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(m.rata_rata_kelas)}</td>
              {/* Kolom 7 (النتيجة): width 7% (Mirror Kolom 4) */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold" }} dir="rtl">{toArabicNum(m.nilai)}</td>
              {/* Kolom 8 (الدرجة الصغرى): width 7% (Mirror Kolom 3) */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(kkmVal)}</td>
              {/* Kolom 9 (المواد الدراسية): width 21% (Mirror Kolom 2 - Traditional Arabic) */}
              <td style={{ border: "1px solid #94a3b8", padding: namePad, textAlign: "right", fontSize: "14px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold", whiteSpace: "normal", lineHeight: "1.2" }} dir="rtl">{m.nama_arab}</td>
              {/* Kolom 10 (رقم): width 4.5% (Mirror Kolom 1) */}
              <td style={{ border: "1px solid #94a3b8", padding: cellPad, textAlign: "center", fontSize: fontSize, fontFamily: "Arial, Helvetica, sans-serif" }} dir="rtl">{toArabicNum(startIndex + index)}</td>
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  const klsUpper = (santri?.kelas || "").toUpperCase();
  const jenjangUpper = (santri?.jenjang || "").toUpperCase();

  const isMTs = klsUpper.includes("MTS") || 
                jenjangUpper === "MTS" || 
                ["7", "8", "9"].some(k => klsUpper === k || klsUpper.startsWith(k + " "));

  const isMA = klsUpper.includes("MA") || 
               jenjangUpper === "MA" || 
               ["10", "11", "12"].some(k => klsUpper === k || klsUpper.startsWith(k + " "));

  const isIL = klsUpper.includes("IL") || 
               jenjangUpper === "IL" || 
               klsUpper.includes("IDAD") || 
               klsUpper.includes("I'DAD");

  const headTitle = isMA 
    ? "Kepala Madrasah Aliyah" 
    : isIL 
      ? "Mudir Program I'dad Lughowi" 
      : "Kepala Madrasah Tsanawiyah";

  const headName = isMA 
    ? "Ade Supriatna, S.Pd.I." 
    : isIL 
      ? "Lutfi Zubaidi, Lc." 
      : "Ade Supyana, S.Pd.I.";

  const waliKelasName = santri?.wali_kelas 
    ? santri.wali_kelas 
    : isMTs 
      ? "Agus Cahyono" 
      : isIL 
        ? "Imron Abdillah, S.Pd." 
        : isMA 
          ? "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag." 
          : "Wali Kelas";

  const kepalaPengasuhanNama = santri?.kepala_kepengasuhan || "Wahyudi Pranata, Lc.";
  const pengampuHalaqohNama = santri?.pengampu_halaqoh || (
    isMTs ? "M. Iqbal" : "Wahyudi Pranata, Lc."
  );

  return (
    <div id="rapor-print-container" className="rapor-root-print-wrapper" style={{ width: "100%", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
      <style>{`
        /* Reset and Print Styling Presisi Standar Internasional A4 */
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .rapor-root-print-wrapper {
          width: 100%;
          display: block;
        }

        .rapor-table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          border: 1px solid #94a3b8 !important;
          border-radius: 0 !important;
          font-family: Arial, Helvetica, sans-serif;
          margin-bottom: 0px;
          box-sizing: border-box !important;
        }
        
        .rapor-table,
        .rapor-table thead,
        .rapor-table tbody,
        .rapor-table tr,
        .rapor-table th,
        .rapor-table td {
          border-radius: 0 !important;
          box-sizing: border-box !important;
        }

        .rapor-table th,
        .rapor-table td {
          border: 1px solid #94a3b8;
          border-color: #94a3b8;
          vertical-align: middle !important;
          position: static !important;
          top: auto !important;
          z-index: auto !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .rapor-table thead th,
        .rapor-table thead th:first-child,
        .rapor-table thead th:last-child {
          position: static !important;
          top: auto !important;
          z-index: auto !important;
          color: #000000 !important;
          font-weight: bold !important;
          background-color: #f1f5f9 !important;
          border: 1px solid #94a3b8;
          border-color: #94a3b8;
          border-radius: 0 !important;
          box-shadow: none !important;
          white-space: normal !important;
        }

        .rapor-table tbody tr:last-child td {
          border-bottom: 1px solid #94a3b8 !important;
        }

        /* GARIS PEMISAH TENGAH SOLID HITAM (TAK TERBANTAHKAN) */
        .rapor-table .border-divider-mid,
        .rapor-table th.border-divider-mid,
        .rapor-table td.border-divider-mid,
        .rapor-table thead th.border-divider-mid,
        .rapor-table thead th:first-child.border-divider-mid,
        .rapor-table tbody td.border-divider-mid {
          border-right: 2px solid #000000 !important;
          border-right-color: #000000 !important;
          border-right-width: 2px !important;
          border-right-style: solid !important;
        }

        .rapor-table .border-divider-mid + th,
        .rapor-table .border-divider-mid + td,
        .rapor-table thead th.border-divider-mid + th,
        .rapor-table tbody td.border-divider-mid + td {
          border-left: 2px solid #000000 !important;
          border-left-color: #000000 !important;
          border-left-width: 2px !important;
          border-left-style: solid !important;
        }

        .rapor-table tbody tr:hover td {
          background-color: transparent !important;
          box-shadow: none !important;
        }

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
          @page { 
            size: A4 portrait; 
            margin: 11mm 6mm 2mm 13mm; 
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
          .no-print, .mobile-header, .app-sidebar, .sidebar-nav, .sidebar-scroll-menu, nav, header, aside, .btn, button {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
          }
          .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; background: #ffffff !important; }
          .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; background: #ffffff !important; }
          
          #rapor-print-container { 
            padding: 0 !important; 
            margin: 0 !important; 
            background: #ffffff !important; 
            display: block !important; 
            width: 100% !important;
          }

          .rapor-table,
          .rapor-table table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 1px solid #94a3b8 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }

          .rapor-table th,
          .rapor-table td,
          .rapor-table thead th,
          .rapor-table tbody td {
            position: static !important;
            top: auto !important;
            z-index: auto !important;
            border: 1px solid #94a3b8;
            border-color: #94a3b8;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .rapor-table thead th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            border-bottom: 1px solid #94a3b8 !important;
          }

          .rapor-table tbody tr:last-child td {
            border-bottom: 1px solid #94a3b8 !important;
          }

          .rapor-table .border-divider-mid,
          .rapor-table th.border-divider-mid,
          .rapor-table td.border-divider-mid,
          .rapor-table thead th.border-divider-mid,
          .rapor-table thead th:first-child.border-divider-mid,
          .rapor-table tbody td.border-divider-mid {
            border-right: 2px solid #000000 !important;
            border-right-color: #000000 !important;
            border-right-width: 2px !important;
            border-right-style: solid !important;
          }

          .rapor-table .border-divider-mid + th,
          .rapor-table .border-divider-mid + td,
          .rapor-table thead th.border-divider-mid + th,
          .rapor-table tbody td.border-divider-mid + td {
            border-left: 2px solid #000000 !important;
            border-left-color: #000000 !important;
            border-left-width: 2px !important;
            border-left-style: solid !important;
          }

          .rapor-page {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: 275mm !important;
            height: 275mm !important;
          }

          .rapor-page:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }

          .rapor-content-wrapper {
            height: 100% !important;
            min-height: 275mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }

          .page-break {
            display: none !important;
          }
        }
      `}</style>

      {/* TOOLBAR JIKA DIMINTA */}
      {showPrintToolbar && (
        <div 
          className="no-print print:hidden flex items-center justify-between p-4 mb-6 rounded-2xl shadow-lg border"
          style={{ 
            backgroundColor: "#550000", 
            color: "white", 
            maxWidth: "210mm", 
            margin: "0 auto 24px auto" 
          }}
        >
          <div>
            <h2 style={{ fontSize: "17.5px", fontWeight: "bold", margin: 0 }}>
              Lembar Rapor Santri (Kasyfud Darajat)
            </h2>
            <p style={{ fontSize: "11.5px", opacity: 0.9, margin: "3px 0 0 0" }}>
              Format Resmi 2 Halaman • Standar Internasional Kertas A4 (210 × 297 mm)
            </p>
          </div>

          <button 
            type="button"
            onClick={() => window.print()}
            className="no-print print:hidden"
            style={{ 
              padding: "10px 24px", 
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
            <Printer size={16} /> Cetak / Download PDF (A4)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HALAMAN 1: RAPOR AKADEMIK (KASYFUD DARAJAT)                               */}
      {/* ========================================================================= */}
      <div 
        className="rapor-page max-w-[210mm] mx-auto bg-white p-[10mm] sm:p-[12mm] shadow-2xl rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-full relative" 
        style={{ 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >
        <div 
          className="rapor-content-wrapper"
          style={{ 
            position: "relative", 
            zIndex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "space-between", 
            minHeight: "265mm",
            height: "100%"
          }}
        >
          <div>
            {/* Kop Surat Resmi */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: "4px", marginBottom: "6px", fontFamily: '"Times New Roman", Times, serif' }}>
              <img src="/logo.png" alt="Logo Al-Imam" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: "17.5px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "1px 0 2px 0", fontSize: "10px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "10.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "7.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
            </div>

            {/* Judul Arab & Terjemahan */}
            <div className="text-center" style={{ marginBottom: "6px" }}>
              {(() => {
                let marhalah = "للمرحلة المتوسطة"; // Default MTs
                let indoMarhalah = "TINGKAT MADRASAH TSANAWIYAH (MTs)";
                
                if (isMA) {
                  marhalah = "للمرحلة الثانوية";
                  indoMarhalah = "TINGKAT MADRASAH ALIYAH (MA)";
                } else if (isIL) {
                  marhalah = "لبرنامج الإعداد اللغوي";
                  indoMarhalah = "PROGRAM I'DAD LUGHOWI (IL)";
                }

                const isGanjil = santri?.semester?.includes("Ganjil") || santri?.semester === "1" || !santri?.semester?.includes("Genap");
                const semesterArab = isGanjil ? "الأول" : "الثاني";
                
                return (
                  <>
                    <h1 className="text-2xl font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: "18px", margin: "0 0 2px 0" }}>
                      كشف درجات وتقويم منتصف الفصل الدراسي {semesterArab}
                    </h1>
                    <h2 className="text-lg font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", margin: "0 0 4px 0" }}>
                      {marhalah} بمعهد الإمام الإسلامي
                    </h2>
                    <h3 className="font-bold text-slate-800 tracking-wider uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", margin: "0 0 2px 0" }}>
                      LAPORAN HASIL EVALUASI BELAJAR TENGAH SEMESTER (PTS)
                    </h3>
                    <h4 className="font-bold text-slate-600 tracking-wide uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9.5px", margin: 0 }}>
                      RAPOR BAYANGAN • {indoMarhalah}
                    </h4>
                  </>
                );
              })()}
            </div>

            {/* Biodata Santri */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", fontWeight: "bold", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <div>
                <table className="biodata-table" style={{ width: "100%", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>Nama</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ textTransform: "uppercase", padding: "1.5px 0", border: "none" }}>{santri?.nama}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>NIS</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none", letterSpacing: "0.5px" }}>{displayNis}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>Kelas</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right" }}>
                <table className="biodata-table" style={{ display: "inline-block", textAlign: "left", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Semester</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>
                        {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester?.includes("Genap") || santri?.semester === "2" ? "Genap" : santri?.semester} (PTS)
                      </td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Tahun Pelajaran</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{santri?.tahun_ajaran}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Wali Kelas</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{waliKelasName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL UTAMA AKADEMIK (10 Kolom Bilateral Simetris) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "8px" }}>
              <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1px solid #94a3b8", fontSize: "11.5px" }}>
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
                  <col style={{ width: "21%" }} />    {/* 9. المواد الدراasية */}
                  <col style={{ width: "4.5%" }} />   {/* 10. رقم */}
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#000000" }}>No</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 6px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#000000" }}>Mata Pelajaran</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#000000" }}>KKM</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", color: "#000000" }}>Nilai</th>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "5px 1px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", lineHeight: "1.15", letterSpacing: "-0.2px", color: "#000000" }}>Rata-Rata<br/>Kelas</th>
                    
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "5px 1px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", lineHeight: "1.1", color: "#000000" }}>متوسط<br/>الفصل</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", color: "#000000" }}>النتيجة</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", lineHeight: "1.1", color: "#000000" }}>الدرجة<br/>الصغرى</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 6px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", color: "#000000" }}>المواد الدراسية</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "5px 2px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", color: "#000000" }}>رقم</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik?.syariah || [], 1)}
                  {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik?.bahasa || [], (nilai_akademik?.syariah?.length || 0) + 1)}
                  {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik?.umum || [], (nilai_akademik?.syariah?.length || 0) + (nilai_akademik?.bahasa?.length || 0) + 1)}

                  {/* Summary rows: Rekapitulasi Nilai Akademik Langsung di Bawah Mapel Umum */}
                  <tr style={{ backgroundColor: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", fontWeight: "bold", fontSize: "11.5px" }}>Jumlah Nilai</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.totalNilai}</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.totalNilai)}</td>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px" }} dir="rtl">مجموع الدرجات</td>
                  </tr>
                  <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", fontWeight: "bold", fontSize: "11.5px" }}>Rata-Rata Santri</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.rataRata}</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.rataRata)}</td>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px" }} dir="rtl">المعدل التراكمي</td>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", fontWeight: "bold", fontSize: "11.5px" }}>Ranking</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.ranking}</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.ranking)}</td>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px" }} dir="rtl">الترتيب</td>
                  </tr>
                  <tr style={{ backgroundColor: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", fontWeight: "bold", fontSize: "11.5px" }}>Jumlah Santri</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>{kedisiplinan?.jumlahSantri}</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 3px", backgroundColor: "transparent" }}></td>
                    <td style={{ border: "1px solid #94a3b8", padding: "4px 3px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} dir="rtl">{toArabicNum(kedisiplinan?.jumlahSantri)}</td>
                    <td colSpan={3} style={{ border: "1px solid #94a3b8", padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px" }} dir="rtl">عدد الطلاب</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. TABEL KETIDAKHADIRAN KELAS (Kotak Terpisah Bilateral Simetris) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "8px" }}>
              <table 
                className="rapor-table" 
                style={{ 
                  width: "100%", 
                  tableLayout: "fixed", 
                  borderCollapse: "collapse", 
                  border: "1px solid #94a3b8", 
                  fontSize: "11px", 
                  fontFamily: "Arial, Helvetica, sans-serif" 
                }}
              >
                <colgroup>
                  {/* Sisi Kiri (50% Indonesia) */}
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "18%" }} />
                  {/* Sisi Kanan (50% Arab Mirror) */}
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
                <thead>
                  {/* Section D. Ketidakhadiran Kelas */}
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={2} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", fontWeight: "bold", fontSize: "11.5px", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                      D. Ketidakhadiran Kelas
                    </th>
                    <th colSpan={2} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13.5px", color: "#000000", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      د. الغياب الدراسي
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontSize: "10.5px" }}>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "left", color: "#000000" }}>Keterangan Absensi</th>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000" }}>Jumlah</th>
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">العدد</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">بيان الغياب</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>1. Sakit</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>{absenAkad.sakit_kali || 0} Kali</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }} dir="rtl">{toArabicNum(absenAkad.sakit_kali || 0)} مرات</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">١. المرض</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>2. Izin</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>{absenAkad.izin_kali || 0} Kali</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }} dir="rtl">{toArabicNum(absenAkad.izin_kali || 0)} مرات</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٢. الإذن</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>3. Alpha / Tanpa Keterangan</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>{absenAkad.alpha_kali || 0} Kali</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }} dir="rtl">{toArabicNum(absenAkad.alpha_kali || 0)} مرات</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "13px" }} dir="rtl">٣. الغياب</td>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", fontWeight: "bold" }}>Total Ketidakhadiran Kelas</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{absenAkad.total_kali || 0} Kali</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }} dir="rtl">{toArabicNum(absenAkad.total_kali || 0)} مرات</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", fontWeight: "bold" }} dir="rtl">مجموع الغياب الدراسي</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AREA TANDA TANGAN AKADEMIK (3 Kolom) + QR CODE */}
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "stretch",
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px", 
                fontFamily: "Arial, Helvetica, sans-serif" 
              }}
            >
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1.05fr 1.55fr", 
                textAlign: "center", 
                fontSize: "10.5px", 
                gap: "6px",
                flex: 1,
                marginRight: "16px",
                minWidth: 0
              }}>
                {/* Kolom 1: Orang Tua */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "500" }}>Mengetahui,</p>
                    <p style={{ margin: "2px 0 0 0", fontWeight: "bold" }}>Orang Tua / Wali</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ 
                      fontWeight: "bold", 
                      margin: 0, 
                      fontSize: "10px", 
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      maxWidth: "130px"
                    }}>
                      <span>(</span>
                      <span style={{ display: "inline-block", flex: 1, minWidth: "100px" }}>&nbsp;</span>
                      <span>)</span>
                    </p>
                  </div>
                </div>

                {/* Kolom 2: Kepala Madrasah */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "500" }}>Mengetahui,</p>
                    <p style={{ margin: "2px 0 0 0", fontWeight: "bold" }}>{headTitle}</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: "10px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({headName})
                    </p>
                  </div>
                </div>

                {/* Kolom 3: Wali Kelas */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "500" }}>Sukabumi, 11 Oktober 2026</p>
                    <p style={{ margin: "2px 0 0 0", fontWeight: "bold" }}>Wali Kelas</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: "10px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({waliKelasName})
                    </p>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: QR Code Resmi Akademik */}
              <div style={{ 
                width: "90px", 
                height: "140px",
                flexShrink: 0, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "flex-end",
                textAlign: "center"
              }}>
                <div style={{ 
                  padding: "5px", 
                  backgroundColor: "white", 
                  border: "1px solid #94a3b8", 
                  display: "inline-block" 
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://sikap.pesantren-alimam.com/verify/${santri?.id || "santri"}?doc=akademik`}
                    alt="QR Verifikasi Dokumen"
                    style={{ width: "78px", height: "78px", display: "block" }}
                  />
                </div>
                <p style={{ 
                  margin: "4px 0 0 0", 
                  fontSize: "7px", 
                  fontWeight: "bold", 
                  letterSpacing: "0.2px", 
                  color: "#000000",
                  whiteSpace: "nowrap"
                }}>
                  Scan Verifikasi Dokumen
                </p>
              </div>
            </div>
          </div>

          {/* Catatan Kaki Halaman 1 */}
          <div 
            className="rapor-footer" 
            style={{ 
              marginTop: "8px", 
              paddingTop: "4px", 
              fontSize: "9px", 
              fontStyle: "italic", 
              borderTop: "1px dashed #cbd5e1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <p style={{ margin: 0, flex: 1, color: "#111111", whiteSpace: "nowrap" }}>* Nilai di atas merupakan Hasil Evaluasi Belajar Penilaian Tengah Semester (PTS) Murni.</p>
            <p style={{ margin: 0, fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0, color: "#111111" }}>Bagian 1: Rapor Akademik (Halaman 1 dari 2)</p>
          </div>
        </div>
      </div>

      {/* PEMISAH HALAMAN */}
      <div className="page-break my-8 no-print border-b-2 border-dashed border-slate-300 max-w-[210mm] mx-auto" />

      {/* ========================================================================= */}
      {/* HALAMAN 2: KEPRIBADIAN, TAHSIN & TAHFIDZ, DAN PENGESAHAN DOKUMEN          */}
      {/* ========================================================================= */}
      <div 
        className="rapor-page max-w-[210mm] mx-auto bg-white p-[10mm] sm:p-[12mm] shadow-2xl rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-full relative" 
        style={{ 
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif" 
        }}
      >
        <div 
          className="rapor-content-wrapper"
          style={{ 
            position: "relative", 
            zIndex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "space-between", 
            minHeight: "265mm",
            height: "100%"
          }}
        >
          <div>
            {/* Kop Surat Resmi Halaman 2 */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #000000", paddingBottom: "4px", marginBottom: "6px", fontFamily: '"Times New Roman", Times, serif' }}>
              <img src="/logo.png" alt="Logo Al-Imam" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: "17.5px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "1px 0 2px 0", fontSize: "10px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "10.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "7.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
            </div>

            {/* Judul Arab & Terjemahan Halaman 2 */}
            <div className="text-center" style={{ marginBottom: "6px" }}>
              {(() => {
                let marhalah = "للمرحلة المتوسطة";
                let indoMarhalah = "TINGKAT MADRASAH TSANAWIYAH (MTs)";
                
                if (isMA) {
                  marhalah = "للمرحلة الثانوية";
                  indoMarhalah = "TINGKAT MADRASAH ALIYAH (MA)";
                } else if (isIL) {
                  marhalah = "لبرنامج الإعداد اللغوي";
                  indoMarhalah = "PROGRAM I'DAD LUGHOWI (IL)";
                }

                const isGanjil = santri?.semester?.includes("Ganjil") || santri?.semester === "1" || !santri?.semester?.includes("Genap");
                const semesterArab = isGanjil ? "الأول" : "الثاني";
                
                return (
                  <>
                    <h1 className="text-2xl font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: "18px", margin: "0 0 2px 0" }}>
                      كشف تقويم رعاية الطلاب والقرآن الكريم منتصف الفصل {semesterArab}
                    </h1>
                    <h2 className="text-lg font-bold arabic-text" dir="rtl" style={{ fontFamily: "'Traditional Arabic', serif", fontSize: "13.5px", margin: "0 0 4px 0" }}>
                      {marhalah} بمعهد الإمام الإسلامي
                    </h2>
                    <h3 className="font-bold text-slate-800 tracking-wider uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10.5px", margin: "0 0 2px 0" }}>
                      LAPORAN HASIL EVALUASI KEPENGASUHAN &amp; AL-QUR'AN (PTS)
                    </h3>
                    <h4 className="font-bold text-slate-600 tracking-wide uppercase" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9.5px", margin: 0 }}>
                      RAPOR BAYANGAN • {indoMarhalah}
                    </h4>
                  </>
                );
              })()}
            </div>

            {/* Biodata Santri Halaman 2 */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", fontWeight: "bold", fontFamily: "Arial, Helvetica, sans-serif" }}>
              <div>
                <table className="biodata-table" style={{ width: "100%", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>Nama</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ textTransform: "uppercase", padding: "1.5px 0", border: "none" }}>{santri?.nama}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>NIS</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none", letterSpacing: "0.5px" }}>{displayNis}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ width: 85, padding: "1.5px 0", border: "none" }}>Kelas</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{(santri?.kelas || "").replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right" }}>
                <table className="biodata-table" style={{ display: "inline-block", textAlign: "left", border: "none", borderCollapse: "separate" }}>
                  <tbody>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Semester</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>
                        {santri?.semester?.includes("Ganjil") || santri?.semester === "1" ? "Ganjil" : santri?.semester?.includes("Genap") || santri?.semester === "2" ? "Genap" : santri?.semester} (PTS)
                      </td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Tahun Pelajaran</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{santri?.tahun_ajaran || "-"}</td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td style={{ padding: "1.5px 0", whiteSpace: "nowrap", border: "none" }}>Pengampu Halaqoh</td>
                      <td style={{ padding: "1.5px 6px", border: "none" }}>:</td>
                      <td style={{ padding: "1.5px 0", border: "none" }}>{pengampuHalaqohNama}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 1. KEPRIBADIAN SANTRI (Kotak Terpisah Bilateral Simetris) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table 
                className="rapor-table" 
                style={{ 
                  width: "100%", 
                  tableLayout: "fixed", 
                  borderCollapse: "collapse", 
                  border: "1px solid #94a3b8", 
                  marginBottom: "0px", 
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "11px"
                }}
              >
                <colgroup>
                  {/* Sisi Kiri (50% Indonesia) */}
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "18%" }} />
                  {/* Sisi Kanan (50% Arab Mirror) */}
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
                <thead>
                  {/* Section A. Kepribadian Santri */}
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={2} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", fontWeight: "bold", fontSize: "11.5px", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                      A. Kepribadian Santri
                    </th>
                    <th colSpan={2} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13.5px", color: "#000000", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      أ. شخصية الطالب ومكارم الأخلاق
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontSize: "10.5px" }}>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "left", color: "#000000" }}>Aspek Penilaian</th>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000" }}>Predikat</th>
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">التقدير</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">جوانب التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>1. Sopan Santun</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{sikapGrade}</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">{toArabicPredikat(sikapGrade)}</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">١. السلوك والأدب</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>2. Kedisiplinan</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{disiplinGrade}</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">{toArabicPredikat(disiplinGrade)}</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٢. المواظبة والانضباط</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>3. Kebersihan</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{sikapGrade}</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">{toArabicPredikat(sikapGrade)}</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٣. النظافة</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>4. Kerapian</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{sikapGrade}</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">{toArabicPredikat(sikapGrade)}</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٤. الترتيب والهندام</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>5. Kerja Sama</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11.5px" }}>{sikapGrade}</td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">{toArabicPredikat(sikapGrade)}</td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٥. التعاون والمشاركة</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. KETIDAKHADIRAN HALAQOH (Kotak Terpisah Bilateral Simetris) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table 
                className="rapor-table" 
                style={{ 
                  width: "100%", 
                  tableLayout: "fixed", 
                  borderCollapse: "collapse", 
                  border: "1px solid #94a3b8", 
                  marginBottom: "0px", 
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "11px"
                }}
              >
                <colgroup>
                  {/* Sisi Kiri (50% Indonesia) */}
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "18%" }} />
                  {/* Sisi Kanan (50% Arab Mirror) */}
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "32%" }} />
                </colgroup>
                <thead>
                  {/* Section B. Ketidakhadiran Halaqoh */}
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={2} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", fontWeight: "bold", fontSize: "11.5px", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif" }}>
                      B. Ketidakhadiran Halaqoh
                    </th>
                    <th colSpan={2} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13.5px", color: "#000000", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      ب. غياب الحلقات
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontSize: "10.5px" }}>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "left", color: "#000000" }}>Keterangan Absensi</th>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000" }}>Jumlah</th>
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">العدد</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">بيان الغياب</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>1. Sakit</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "11px" }}>
                      <strong style={{ fontSize: "11.5px" }}>{absenHalaq?.sakit || 0}</strong> <span style={{ color: "#444" }}>Pertemuan</span>
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "12.5px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      <strong>{toArabicNum(absenHalaq?.sakit || 0)}</strong> لقاء
                    </td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">١. المرض</td>
                  </tr>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>2. Izin</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "11px" }}>
                      <strong style={{ fontSize: "11.5px" }}>{absenHalaq?.izin || 0}</strong> <span style={{ color: "#444" }}>Pertemuan</span>
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "12.5px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      <strong>{toArabicNum(absenHalaq?.izin || 0)}</strong> لقاء
                    </td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٢. الإذن</td>
                  </tr>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px" }}>3. Alpha / Tanpa Keterangan</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "11px" }}>
                      <strong style={{ fontSize: "11.5px" }}>{absenHalaq?.alpha || 0}</strong> <span style={{ color: "#444" }}>Pertemuan</span>
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "12.5px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      <strong>{toArabicNum(absenHalaq?.alpha || 0)}</strong> لقاء
                    </td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px" }} dir="rtl">٣. الغياب</td>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", fontWeight: "bold" }}>Total Ketidakhadiran Halaqoh</td>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "11.5px" }}>
                      <strong style={{ fontSize: "12px" }}>{absenHalaq?.total ?? ((absenHalaq?.sakit || 0) + (absenHalaq?.izin || 0) + (absenHalaq?.alpha || 0))}</strong> <span style={{ color: "#444", fontWeight: "bold" }}>Pertemuan</span>
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 8px", textAlign: "center", fontSize: "13px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold" }} dir="rtl">
                      <strong>{toArabicNum(absenHalaq?.total ?? ((absenHalaq?.sakit || 0) + (absenHalaq?.izin || 0) + (absenHalaq?.alpha || 0)))}</strong> لقاء
                    </td>
                    <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "13px", fontWeight: "bold" }} dir="rtl">مجموع غياب الحلقات</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. LAPORAN TAHSIN & TAHFIDZ (Bilateral Simetris Sempurna) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1px solid #94a3b8", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <colgroup>
                  {/* Sisi Kiri (50% Indonesia) */}
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  {/* Sisi Kanan (50% Arab Mirror) */}
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "26%" }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={3} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", color: "#000000", fontWeight: "bold", fontSize: "11.5px" }}>
                      C. Laporan Tahsin &amp; Tahfidz (Program Al-Qur'an)
                    </th>
                    <th colSpan={3} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", color: "#000000", fontWeight: "bold", fontSize: "13.5px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      جـ . تقرير التحسين والتحفيظ (برنامج القرآن الكريم)
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontSize: "10.5px" }}>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "left", color: "#000000" }}>Jenis / Materi Ujian</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center", color: "#000000" }}>Sikap</th>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", color: "#000000" }}>Nilai</th>
                    
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">النتيجة</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">السلوك</th>
                    <th style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", color: "#000000", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">نوع ومادة الاختبار</th>
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
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", fontWeight: "bold" }}>
                          {u.jenis_ujian ? u.jenis_ujian.replace(/_/g, " ").toUpperCase() : "UJIAN PRA TARGET"}
                          {u.juz ? ` (Juz ${u.juz})` : u.surah_nama ? ` (Surah ${u.surah_nama})` : ""}
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center" }}>
                          {sikapStr}
                        </td>
                        <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
                          <span>{nilaiAkhir}</span>
                          <span style={{ fontSize: "9px", marginLeft: "3px", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                            ({u.is_lulus ? "Lulus" : "Mengulang"})
                          </span>
                        </td>

                        <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                          <span>{toArabicNum(nilaiAkhir)}</span>
                          <span style={{ fontSize: "11px", marginRight: "3px", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                            ({u.is_lulus ? "ناجح" : "راسب"})
                          </span>
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">
                          {toArabicSikap(sikapStr)}
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 8px", textAlign: "right", fontFamily: "'Traditional Arabic', serif", fontSize: "12.5px", fontWeight: "bold" }} dir="rtl">
                          {toArabicExamType(u.jenis_ujian, u.juz, u.surah_nama)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr style={{ backgroundColor: "white" }}>
                      <td colSpan={3} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4.5px 8px", textAlign: "center", color: "#666" }}>Belum ada data riwayat ujian pra-target</td>
                      <td colSpan={3} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4.5px 8px", textAlign: "center", color: "#666", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">لا توجد بيانات سابقة لاختبار ما قبل الهدف</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. EVALUASI PENCAPAIAN AL-QUR'AN (Bilateral Simetris Sempurna) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1px solid #94a3b8", fontSize: "10.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <colgroup>
                  <col style={{ width: "50%" }} />
                  <col style={{ width: "50%" }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", fontSize: "11px", color: "#000000" }}>
                      D. Catatan Evaluasi Pembelajaran Al-Qur'an
                    </th>
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", fontSize: "13px", color: "#000000", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      د. التوجيهات والتقويم في تعلم القرآن الكريم
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "5px 8px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.35", textAlign: "justify", fontSize: "10px" }}>
                      {(() => {
                        if (praTargetUjian.length === 0) {
                          return "Belum ada riwayat ujian tahsin/tahfidz pada periode ini. Tingkatkan semangat tilawah dan muraja'ah bersama Musyrif di halaqoh.";
                        }
                        
                        const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                        const total = praTargetUjian.length;
                        
                        if (passed === total) {
                          return "Alhamdulillah, pencapaian pembelajaran Al-Qur'an santri pada periode ini menunjukkan hasil yang memuaskan. Terus tingkatkan kualitas Tahsin (Makharijul Huruf & Tajwid) serta rutinkan tilawah harian sebagai pondasi kokoh sebelum memperbanyak Ziyadah (Hafalan Baru).";
                        } else if (passed > 0) {
                          return "Pencapaian Al-Qur'an sudah cukup baik, namun perlu lebih memperbanyak porsi muraja'ah dan tahsin untuk menyelesaikan target ujian yang belum tuntas.";
                        } else {
                          return "Perlu memberikan perhatian ekstra pada program Al-Qur'an. Perbanyak waktu tilawah dan muraja'ah bersama rekan halaqoh agar bisa mencapai target ujian.";
                        }
                      })()}
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "5px 8px", verticalAlign: "top", color: "#333", lineHeight: "1.35", textAlign: "justify", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      {(() => {
                        if (praTargetUjian.length === 0) {
                          return "لا توجد بيانات اختبار للتحسين أو التحفيظ في هذه الفترة. يرجى زيادة الحرص على التلاوة والمراجعة مع مشرف الحلقة.";
                        }
                        
                        const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                        const total = praTargetUjian.length;
                        
                        if (passed === total) {
                          return "الحمد لله، أظهرت نتائج تعلم القرآن الكريم للطالب في هذه الفترة نتائج طيبة ومرضية. نوصي بالاستمرار في تحسين جودة التحسين (مخارج الحروف والتجويد) والمواظبة على التلاوة اليومية كأساس متين قبل زيادة الحفظ الجديد.";
                        } else if (passed > 0) {
                          return "مستوى إنجاز القرآن الكريم جيد، لكن يرجى تكثيف المراجعة والتحسين لإتمام ما تبقى من أهداف الاختبار المقررة.";
                        } else {
                          return "يحتاج الطالب إلى اهتمام إضافي ببرنامج القرآن الكريم. يرجى مضاعفة وقت التلاوة والمراجعة مع الإخوة في الحلقة لتحقيق الأهداف المنشودة.";
                        }
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. AREA TANDA TANGAN (3 Kolom) + QR CODE */}
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "stretch",
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px", 
                fontFamily: "Arial, Helvetica, sans-serif" 
              }}
            >
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1.05fr 1.55fr", 
                textAlign: "center", 
                fontSize: "10.5px", 
                gap: "6px",
                flex: 1,
                marginRight: "16px",
                minWidth: 0
              }}>
                {/* Kolom 1: Orang Tua */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Mengetahui,</p>
                    <p style={{ margin: "2px 0 0 0" }}>Orang Tua / Wali</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ 
                      fontWeight: "bold", 
                      margin: 0, 
                      fontSize: "10px", 
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      maxWidth: "130px"
                    }}>
                      <span>(</span>
                      <span style={{ display: "inline-block", flex: 1, minWidth: "100px" }}>&nbsp;</span>
                      <span>)</span>
                    </p>
                  </div>
                </div>

                {/* Kolom 2: Kepala Kepengasuhan */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Mengetahui,</p>
                    <p style={{ margin: "2px 0 0 0" }}>Kepala Kepengasuhan</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: "10px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({kepalaPengasuhanNama})
                    </p>
                  </div>
                </div>

                {/* Kolom 3: Pengampu Halaqoh */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "140px", padding: "0 2px" }}>
                  <div>
                    <p style={{ margin: 0 }}>Sukabumi, 11 Oktober 2026</p>
                    <p style={{ margin: "2px 0 0 0" }}>Pengampu Halaqoh</p>
                  </div>
                  <div style={{ minHeight: "28px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <p style={{ fontWeight: "bold", margin: 0, fontSize: "10px", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                      ({pengampuHalaqohNama})
                    </p>
                  </div>
                </div>
              </div>

              {/* Sisi Kanan: QR Code Resmi Kepengasuhan */}
              <div style={{ 
                width: "90px", 
                height: "140px",
                flexShrink: 0, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "flex-end",
                textAlign: "center"
              }}>
                <div style={{ 
                  padding: "5px", 
                  backgroundColor: "white", 
                  border: "1px solid #94a3b8", 
                  display: "inline-block" 
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://sikap.pesantren-alimam.com/verify/${santri?.id || "santri"}?doc=pengasuhan`}
                    alt="QR Verifikasi Kepengasuhan"
                    style={{ width: "78px", height: "78px", display: "block" }}
                  />
                </div>
                <p style={{ 
                  margin: "4px 0 0 0", 
                  fontSize: "7px", 
                  fontWeight: "bold", 
                  letterSpacing: "0.2px", 
                  color: "#000000",
                  whiteSpace: "nowrap"
                }}>
                  Scan Verifikasi Dokumen
                </p>
              </div>
            </div>
          </div>

          {/* Catatan Kaki Halaman 2 */}
          <div 
            className="rapor-footer" 
            style={{ 
              marginTop: "8px", 
              paddingTop: "4px", 
              fontSize: "9px", 
              fontStyle: "italic", 
              borderTop: "1px dashed #cbd5e1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <p style={{ margin: 0, flex: 1, color: "#111111", whiteSpace: "nowrap" }}>* Dokumen ini sah dan diterbitkan secara resmi oleh Pesantren Al-Imam Al-Islami (Managed by Al-Andalus IIBS).</p>
            <p style={{ margin: 0, fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0, color: "#111111" }}>Bagian 2: Rapor Kepengasuhan (Halaman 2 dari 2)</p>
          </div>
        </div>
      </div>
    </div>
  );
}


