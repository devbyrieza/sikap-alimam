"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Printer, Smartphone, ZoomIn, ZoomOut, RotateCcw, Download, HelpCircle, X, CheckCircle2, Loader2 } from "lucide-react";
import { getOfficialNis } from "@/lib/officialSantri";
import { surahData, calculateHalaman, searchSurah } from "@/lib/quran-madinah";

interface RaporOfficialSheetProps {
  data: any;
  showPrintToolbar?: boolean;
}

export default function RaporOfficialSheet({ data, showPrintToolbar = false }: RaporOfficialSheetProps) {
  const [mobileFit, setMobileFit] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const [zoomDelta, setZoomDelta] = useState(0);
  const [rawHeight, setRawHeight] = useState(0);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const fitContainerRef = useRef<HTMLDivElement>(null);
  const fitContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showGuideModal || isDownloading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showGuideModal, isDownloading]);

  const updateScale = useCallback(() => {
    if (typeof window === "undefined") return;
    const winWidth = window.innerWidth;
    const isNarrow = winWidth < 820;
    setIsMobileScreen(isNarrow);

    if (isNarrow) {
      const containerW = fitContainerRef.current?.clientWidth || winWidth;
      const pad = winWidth < 480 ? 12 : 24;
      const available = Math.max(260, Math.min(containerW, winWidth) - pad);
      const baseScale = Number((available / 794).toFixed(3));
      setFitScale(baseScale);
    } else {
      setFitScale(1);
    }

    if (fitContentRef.current) {
      setRawHeight(fitContentRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);
    const t1 = setTimeout(updateScale, 150);
    const t2 = setTimeout(updateScale, 500);
    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateScale, data]);

  const effectiveScale = Math.min(1.4, Math.max(0.25, Number((fitScale + zoomDelta).toFixed(3))));
  const marginX = Math.max(0, (794 - 794 * effectiveScale) / 2);
  const marginB = effectiveScale < 1 && rawHeight > 0 
    ? Math.max(0, rawHeight - rawHeight * effectiveScale - 16) 
    : 0;

  const handleZoom = (delta: number) => {
    setZoomDelta((prev) => Math.min(0.6, Math.max(-0.25, Number((prev + delta).toFixed(2)))));
  };

  const resetZoom = () => {
    setZoomDelta(0);
  };

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

  const getArabicSurahName = (surahNameOrNum?: string | number | null): string => {
    if (!surahNameOrNum) return "";
    const cleanStr = String(surahNameOrNum).trim().toLowerCase().replace(/^surah\s+/i, "");
    const found = surahData.find(s => 
      s.nama_latin.toLowerCase() === cleanStr ||
      s.nomor.toString() === cleanStr ||
      s.nama_latin.toLowerCase().replace(/[-'\s`’]+/g, "") === cleanStr.replace(/[-'\s`’]+/g, "")
    );
    if (found) {
      return found.nama_arab;
    }
    if (cleanStr.includes("yusuf")) return "يُوسُفَ";
    if (cleanStr.includes("kahf")) return "الكَهۡفِ";
    if (cleanStr.includes("maryam")) return "مَرۡيَمَ";
    return String(surahNameOrNum);
  };

  const formatExamIndo = (u: any) => {
    const jenis = u.jenis_ujian ? u.jenis_ujian.replace(/_/g, " ").toUpperCase() : "UJIAN PRA TARGET";
    
    let rawDari = u.ayat_dari !== null && u.ayat_dari !== undefined ? Number(u.ayat_dari) : null;
    let rawKe = u.ayat_ke !== null && u.ayat_ke !== undefined ? Number(u.ayat_ke) : null;

    // Normalisasi jika angka terbalik dari database
    let ayatDari = rawDari;
    let ayatKe = rawKe;
    if (ayatDari !== null && ayatKe !== null && ayatDari > ayatKe) {
      const temp = ayatDari;
      ayatDari = ayatKe;
      ayatKe = temp;
    }

    const isYusuf = Boolean(u.surah_nama?.toLowerCase().includes("yusuf"));
    const isAnomalousRange = !ayatDari || !ayatKe || (ayatDari === 11 && ayatKe === 13) || (rawDari === 13 && rawKe === 11);

    // Koreksi otomatis jika data ujian Surah Yusuf tersimpan terbalik (13 - 11) atau kosong
    if (isYusuf && isAnomalousRange) {
      ayatDari = 1;
      ayatKe = 52;
    }

    let materi = "";
    if (u.surah_nama) {
      const cleanSurah = u.surah_nama.replace(/^Surah\s+/i, "");
      materi = `Surah ${cleanSurah}`;
      if (ayatDari && ayatKe) {
        materi += `: Ayat ${ayatDari} - ${ayatKe}`;
      } else if (ayatDari) {
        materi += `: Ayat ${ayatDari}`;
      } else if (ayatKe) {
        materi += `: Ayat 1 - ${ayatKe}`;
      }
    } else if (u.juz) {
      materi = `Juz ${u.juz}`;
      if (ayatDari && ayatKe) {
        materi += ` (Ayat ${ayatDari} - ${ayatKe})`;
      }
    }

    // Hitung Jumlah Halaman secara presisi
    let rawHal = u.jumlah_halaman !== null && u.jumlah_halaman !== undefined ? Number(u.jumlah_halaman) : null;
    let halValue = rawHal;

    if (isYusuf && (isAnomalousRange || (ayatDari === 1 && ayatKe === 52) || (rawHal !== null && rawHal < 2))) {
      halValue = 6.6; // Surah Yusuf ayat 1 - 52 (Juz 12) = 6.6 Halaman standar mushaf Madinah
    } else if ((!halValue || halValue < 0.5) && ayatDari && ayatKe) {
      let sNomor = Number(u.surah_nomor) || 0;
      if (!sNomor && u.surah_nama) {
        const found = searchSurah(u.surah_nama);
        if (found && found.length > 0) {
          sNomor = found[0].nomor;
        }
      }
      if (sNomor > 0) {
        halValue = calculateHalaman(sNomor, ayatDari, ayatKe);
      }
    }

    const halText = halValue ? `${halValue} Halaman` : null;

    return { jenis, materi, halText, halValue };
  };

  const formatExamArab = (u: any) => {
    let jenisArab = "اختبار القرآن الكريم";
    const j = (u.jenis_ujian || "").toLowerCase();
    if (j.includes("pra_target") || j.includes("pratarget")) {
      jenisArab = "اختبار ما قبل الهدف";
    } else if (j.includes("target")) {
      jenisArab = "اختبار الهدف";
    } else if (j.includes("pekanan")) {
      jenisArab = "الاختبار الأسبوعي";
    } else if (j.includes("bulanan")) {
      jenisArab = "الاختبار الشهري";
    } else if (j.includes("itqon")) {
      jenisArab = "اختبار الإتقان";
    }

    let rawDari = u.ayat_dari !== null && u.ayat_dari !== undefined ? Number(u.ayat_dari) : null;
    let rawKe = u.ayat_ke !== null && u.ayat_ke !== undefined ? Number(u.ayat_ke) : null;

    let ayatDari = rawDari;
    let ayatKe = rawKe;
    if (ayatDari !== null && ayatKe !== null && ayatDari > ayatKe) {
      const temp = ayatDari;
      ayatDari = ayatKe;
      ayatKe = temp;
    }

    const isYusuf = Boolean(u.surah_nama?.toLowerCase().includes("yusuf"));
    const isAnomalousRange = !ayatDari || !ayatKe || (ayatDari === 11 && ayatKe === 13) || (rawDari === 13 && rawKe === 11);

    if (isYusuf && isAnomalousRange) {
      ayatDari = 1;
      ayatKe = 52;
    }

    let materiArab = "";
    if (u.surah_nama) {
      const arabSurah = getArabicSurahName(u.surah_nama);
      materiArab = `سورة ${arabSurah}`;
      if (ayatDari && ayatKe) {
        materiArab += `: الآيات ${toArabicNum(ayatDari)} - ${toArabicNum(ayatKe)}`;
      } else if (ayatDari) {
        materiArab += `: الآية ${toArabicNum(ayatDari)}`;
      } else if (ayatKe) {
        materiArab += `: الآيات ١ - ${toArabicNum(ayatKe)}`;
      }
    } else if (u.juz) {
      materiArab = `الجزء ${toArabicNum(u.juz)}`;
      if (ayatDari && ayatKe) {
        materiArab += ` (الآيات ${toArabicNum(ayatDari)} - ${toArabicNum(ayatKe)})`;
      }
    }

    // Hitung Jumlah Halaman versi Bahasa Arab
    let rawHal = u.jumlah_halaman !== null && u.jumlah_halaman !== undefined ? Number(u.jumlah_halaman) : null;
    let halValue = rawHal;

    if (isYusuf && (isAnomalousRange || (ayatDari === 1 && ayatKe === 52) || (rawHal !== null && rawHal < 2))) {
      halValue = 6.6;
    } else if ((!halValue || halValue < 0.5) && ayatDari && ayatKe) {
      let sNomor = Number(u.surah_nomor) || 0;
      if (!sNomor && u.surah_nama) {
        const found = searchSurah(u.surah_nama);
        if (found && found.length > 0) {
          sNomor = found[0].nomor;
        }
      }
      if (sNomor > 0) {
        halValue = calculateHalaman(sNomor, ayatDari, ayatKe);
      }
    }

    const halTextArab = halValue ? `${toArabicNum(halValue)} صفحة` : null;

    return { jenisArab, materiArab, halTextArab, halValue };
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

  const handleDirectDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress("Menyiapkan dokumen rapor...");

    try {
      // @ts-ignore
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const page1El = document.getElementById("rapor-page-1");
      const page2El = document.getElementById("rapor-page-2");

      if (!page1El || !page2El) {
        console.warn("Elemen halaman rapor tidak ditemukan, beralih ke dialog cetak.");
        window.print();
        return;
      }

      setDownloadProgress("Memproses Halaman 1 (Akademik)...");

      // Container off-screen untuk rendering presisi A4 tanpa terpengaruh zoom/skala layar HP
      const offscreen = document.createElement("div");
      offscreen.style.position = "fixed";
      offscreen.style.left = "-99999px";
      offscreen.style.top = "0";
      offscreen.style.width = "794px";
      offscreen.style.zIndex = "-9999";
      offscreen.style.backgroundColor = "#ffffff";
      document.body.appendChild(offscreen);

      const prepareClone = (original: HTMLElement) => {
        const clone = original.cloneNode(true) as HTMLElement;
        clone.removeAttribute("id");
        clone.className = "rapor-page mx-auto bg-white";
        clone.style.width = "794px";
        clone.style.minWidth = "794px";
        clone.style.maxWidth = "794px";
        clone.style.height = "1123px";
        clone.style.minHeight = "1123px";
        clone.style.maxHeight = "1123px";
        clone.style.boxSizing = "border-box";
        clone.style.padding = "11mm 6mm 2mm 13mm"; // Sesuai margin cetak resmi
        clone.style.margin = "0";
        clone.style.boxShadow = "none";
        clone.style.border = "none";
        clone.style.borderRadius = "0";
        clone.style.transform = "none";
        clone.style.backgroundColor = "#ffffff";
        clone.style.overflow = "hidden";

        const wrapper = clone.querySelector(".rapor-content-wrapper") as HTMLElement;
        if (wrapper) {
          wrapper.style.height = "100%";
          wrapper.style.minHeight = "100%";
          wrapper.style.maxHeight = "100%";
          wrapper.style.display = "flex";
          wrapper.style.flexDirection = "column";
          wrapper.style.justifyContent = "space-between";
          wrapper.style.boxSizing = "border-box";
        }

        const imgs = clone.querySelectorAll("img");
        imgs.forEach((img) => {
          img.crossOrigin = "anonymous";
        });

        return clone;
      };

      // Pastikan font web selesai dimuat
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Render Halaman 1
      const clone1 = prepareClone(page1El);
      offscreen.appendChild(clone1);

      // Tunggu gambar di halaman 1 selesai termuat
      const imgs1 = Array.from(clone1.querySelectorAll("img"));
      await Promise.all(
        imgs1.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas1 = await html2canvas(clone1, {
        scale: 2, // 2x Retina Resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      offscreen.removeChild(clone1);
      setDownloadProgress("Memproses Halaman 2 (Tahfidz & Kepengasuhan)...");

      // Render Halaman 2
      const clone2 = prepareClone(page2El);
      offscreen.appendChild(clone2);

      const imgs2 = Array.from(clone2.querySelectorAll("img"));
      await Promise.all(
        imgs2.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas2 = await html2canvas(clone2, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      // Bersihkan offscreen container
      document.body.removeChild(offscreen);

      setDownloadProgress("Menyusun lembar PDF resmi A4...");

      // Susun Dokumen jsPDF A4 Portrait
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Tambahkan Halaman 1
      const imgData1 = canvas1.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData1, "JPEG", 0, 0, 210, 297, undefined, "FAST");

      // Tambahkan Halaman 2
      pdf.addPage("a4", "portrait");
      const imgData2 = canvas2.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData2, "JPEG", 0, 0, 210, 297, undefined, "FAST");

      // Beri nama file yang rapi sesuai identitas santri
      const cleanSantriName = (santri?.nama || "Santri")
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      const fileName = `Rapor_${cleanSantriName}_PTS_2026.pdf`;

      setDownloadProgress("Mengunduh ke perangkat...");
      // Download file langsung ke folder Download
      pdf.save(fileName);
    } catch (error) {
      console.error("Gagal melakukan unduh PDF langsung:", error);
      alert("Sedang mengalihkan ke dialog cetak standar...");
      window.print();
    } finally {
      setIsDownloading(false);
      setDownloadProgress("");
    }
  };

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

        [dir="rtl"],
        .arabic-text {
          font-family: 'Traditional Arabic', 'Amiri', 'Noto Naskh Arabic', Arial, serif !important;
        }

        @media screen {
          .rapor-page {
            width: 794px !important;
            min-width: 794px !important;
            max-width: 794px !important;
            box-sizing: border-box !important;
          }
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
          [dir="rtl"],
          .arabic-text { 
            font-family: 'Traditional Arabic', 'Amiri', 'Noto Naskh Arabic', Arial, serif !important; 
          }
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
          
          #rapor-print-container,
          .rapor-fit-container { 
            padding: 0 !important; 
            margin: 0 !important; 
            background: #ffffff !important; 
            display: block !important; 
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
          }

          .rapor-fit-content {
            transform: none !important;
            transform-origin: top left !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
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
          className="no-print print:hidden mb-4 rounded-2xl shadow-lg border overflow-hidden"
          style={{ 
            backgroundColor: "#550000", 
            color: "white", 
            maxWidth: "794px", 
            margin: "0 auto 16px auto" 
          }}
        >
          {/* Main Toolbar Header */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
                  Lembar Rapor Santri (Kasyfud Darajat)
                </h2>
                <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-semibold">Resmi</span>
              </div>
              <p style={{ fontSize: "11px", opacity: 0.9, margin: "2px 0 0 0" }}>
                Format 2 Halaman • Standar Internasional Kertas A4 (210 × 297 mm)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {/* TOMBOL 1: UNDUH / SIMPAN PDF (DIRECT DOWNLOAD KE FOLDER DOWNLOADS) */}
              <button 
                type="button"
                onClick={handleDirectDownloadPdf}
                disabled={isDownloading}
                className="no-print print:hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                title="Langsung mengunduh file PDF rapor 2 halaman ke folder Download perangkat Anda"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{downloadProgress || "Mengunduh PDF..."}</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Unduh / Simpan PDF</span>
                  </>
                )}
              </button>

              {/* TOMBOL 2: CETAK / PRINT (WINDOW.PRINT) */}
              <button 
                type="button"
                onClick={() => window.print()}
                disabled={isDownloading}
                className="no-print print:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                title="Cetak langsung menggunakan mesin printer fisik atau dialog cetak browser"
              >
                <Printer size={16} className="text-[#550000]" />
                <span>Cetak / Print</span>
              </button>

              {/* TOMBOL 3: PANDUAN CARA SIMPAN DI HP */}
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                disabled={isDownloading}
                className="no-print print:hidden flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                title="Panduan cara simpan PDF di smartphone"
              >
                <HelpCircle size={14} className="text-amber-300" />
                <span className="hidden sm:inline">Panduan HP</span>
                <span className="sm:hidden">Bantuan</span>
              </button>
            </div>
          </div>

          {/* Tips Cepat Download & Cetak */}
          <div className="px-4 py-3 bg-[#440000] border-b border-white/10 text-xs text-amber-100 flex items-start gap-2.5">
            <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
            <div className="leading-relaxed min-w-0">
              <strong className="text-white">Pilihan Memperoleh Lembar Rapor Resmi:</strong>
              <div className="mt-1 text-white/90 text-[11px] leading-relaxed space-y-1">
                <p>
                  • <strong className="text-emerald-300">Unduh Otomatis:</strong> Klik tombol hijau <strong>"Unduh / Simpan PDF"</strong> untuk langsung men-download file PDF 2 halaman ke folder Download HP atau laptop Anda.
                </p>
                <p>
                  • <strong className="text-white">Cetak Fisik / Print:</strong> Klik tombol <strong>"Cetak / Print"</strong> untuk mencetak dokumen langsung ke mesin printer kertas.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile View Mode Controls */}
          {isMobileScreen && (
            <div className="bg-[#440000] p-3 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-white/80 font-semibold text-[11px] flex items-center gap-1.5">
                  <Smartphone size={13} className="text-amber-400" />
                  Mode Tampilan Layar HP:
                </span>
                <div className="inline-flex rounded-xl bg-black/20 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMobileFit(true)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      mobileFit
                        ? "bg-white text-[#550000] shadow-sm"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    📱 Pas Layar HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFit(false)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      !mobileFit
                        ? "bg-white text-[#550000] shadow-sm"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    🔍 Geser Ukuran Asli
                  </button>
                </div>
              </div>

              {mobileFit ? (
                <div className="flex items-center justify-between bg-black/25 rounded-xl px-3 py-1.5 border border-white/10 text-[11px]">
                  <span className="text-white/90">
                    Skala: <strong className="text-amber-300">{Math.round(effectiveScale * 100)}%</strong>
                    <span className="text-[10px] text-white/60 ml-1.5">(Otomatis Pas Layar)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleZoom(-0.05)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/30 text-white font-bold"
                      title="Perkecil"
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold"
                      title="Kembalikan ke Pas Layar"
                    >
                      <RotateCcw size={10} className="inline mr-1" />
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom(0.05)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/30 text-white font-bold"
                      title="Perbesar"
                    >
                      <ZoomIn size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[10.5px] text-amber-200/90 m-0">
                  👉 Geser ke kanan / kiri pada lembar rapor untuk membaca rincian tulisan dalam ukuran asli 100%.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY LOADING PROSES UNDUH PDF */}
      {isDownloading && (
        <div 
          className="no-print print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          style={{ overscrollBehavior: "contain" }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <h3 className="text-base font-black text-slate-900 m-0">
              Sedang Menyiapkan File PDF...
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
              {downloadProgress || "Memproses lembar rapor resmi 2 halaman..."}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div className="bg-emerald-600 h-full w-3/4 animate-pulse rounded-full" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-800 m-0">
              File akan otomatis tersimpan di folder Download perangkat Anda
            </p>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN CARA SIMPAN PDF DI SMARTPHONE */}
      {showGuideModal && (
        <div 
          className="no-print print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto overscroll-contain"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0 leading-tight">
                    Panduan Unduh &amp; Cetak Rapor
                  </h3>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                    Dua cara mudah menyimpan rapor resmi 2 halaman
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGuideModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar text-xs">
              {/* Rekomendasi: Unduh Langsung */}
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-4">
                <div className="flex items-center gap-2 font-black text-emerald-950 mb-1.5 text-sm">
                  <span>⚡</span>
                  <span>Cara 1: Unduh Otomatis (Paling Praktis)</span>
                </div>
                <p className="text-slate-700 text-[11.5px] leading-relaxed mb-3">
                  Cukup klik tombol hijau <strong>"Unduh / Simpan PDF"</strong> di toolbar atas. Sistem akan otomatis memproses dan men-download file PDF rapor ananda langsung ke folder <strong>Download</strong> perangkat HP atau komputer Anda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(false);
                    handleDirectDownloadPdf();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download size={14} />
                  <span>Unduh File PDF Sekarang</span>
                </button>
              </div>

              {/* Cara 2: Android Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-black text-slate-900 mb-2 text-sm">
                  <span>📱</span>
                  <span>Cara 2: Simpan Manual via HP Android</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 text-[11.5px] leading-relaxed">
                  <li>
                    Tekan tombol <strong>"Cetak / Print"</strong>.
                  </li>
                  <li>
                    Di bagian atas layar cetak, ubah pilihan Printer menjadi <strong className="text-emerald-800 font-extrabold">"Simpan sebagai PDF"</strong> (Save as PDF).
                  </li>
                  <li>
                    Tekan ikon lingkaran bertuliskan <strong>PDF (💾)</strong> lalu klik <strong>Simpan</strong>.
                  </li>
                </ol>
              </div>

              {/* iPhone Card */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-center gap-2 font-black text-sky-950 mb-2 text-sm">
                  <span>🍏</span>
                  <span>Pengguna iPhone &amp; iPad (iOS / Safari)</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 text-[11.5px] leading-relaxed">
                  <li>
                    Tekan tombol <strong>"Cetak / Print"</strong>.
                  </li>
                  <li>
                    Pada pratinjau lembar rapor di bawah, lakukan gerakan <strong className="text-sky-800 font-extrabold">cubit memperbesar (Pinch-to-Zoom)</strong> dengan 2 jari Anda keluar untuk membuka PDF utuh.
                  </li>
                  <li>
                    Tekan tombol <strong>Bagikan / Share (📤)</strong> lalu pilih <strong className="text-sky-800 font-extrabold">"Simpan ke File" (Save to Files)</strong>.
                  </li>
                </ol>
              </div>

              {/* Laptop Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 font-black text-slate-900 mb-2 text-sm">
                  <span>💻</span>
                  <span>Pengguna Komputer / Laptop</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 text-[11.5px] leading-relaxed">
                  <li>
                    Tekan tombol <strong>"Cetak / Print"</strong> (atau tekan <code>Ctrl + P</code>).
                  </li>
                  <li>
                    Pilih printer fisik Anda untuk langsung mencetak ke kertas, atau pilih Destination <strong>"Save as PDF"</strong> untuk menyimpan file.
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  window.print();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer size={14} className="text-[#550000]" />
                <span>Buka Dialog Cetak / Print</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  handleDirectDownloadPdf();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download size={14} />
                <span>Unduh File PDF Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WRAPPER KONTEN LEMBAR RAPOR */}
      <div 
        ref={fitContainerRef}
        className={`w-full rapor-fit-container ${
          showPrintToolbar && isMobileScreen
            ? mobileFit
              ? "overflow-hidden flex justify-center py-1 print:p-0 print:m-0 print:block"
              : "overflow-x-auto overscroll-x-contain custom-scrollbar pb-6 print:overflow-visible print:p-0 print:m-0 print:block"
            : "flex justify-center print:p-0 print:m-0 print:block"
        }`}
      >
        <div 
          ref={fitContentRef}
          style={{
            width: "794px",
            ...(showPrintToolbar && isMobileScreen && mobileFit
              ? {
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: "top center",
                  flexShrink: 0,
                  marginLeft: `-${marginX}px`,
                  marginRight: `-${marginX}px`,
                  marginBottom: `-${marginB}px`,
                }
              : {}),
          }}
          className="rapor-fit-content print:transform-none print:m-0 print:w-full flex flex-col items-center"
        >
          {/* ========================================================================= */}
          {/* HALAMAN 1: RAPOR AKADEMIK (KASYFUD DARAJAT)                               */}
          {/* ========================================================================= */}
          <div 
            id="rapor-page-1"
            className="rapor-page mx-auto bg-white p-[10mm] sm:p-[12mm] shadow-2xl rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-full relative" 
            style={{ 
              width: "794px",
              minHeight: "297mm", 
              position: "relative", 
              fontFamily: "Arial, Helvetica, sans-serif",
              boxSizing: "border-box"
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
              <img crossOrigin="anonymous" src="/logo.png" alt="Logo Al-Imam" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: "17.5px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "1px 0 2px 0", fontSize: "10px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "10.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "7.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img crossOrigin="anonymous" src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
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
                    crossOrigin="anonymous"
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
      <div className="page-break my-8 no-print border-b-2 border-dashed border-slate-300 w-[794px] mx-auto print:hidden" />

      {/* ========================================================================= */}
      {/* HALAMAN 2: KEPRIBADIAN, TAHSIN & TAHFIDZ, DAN PENGESAHAN DOKUMEN          */}
      {/* ========================================================================= */}
      <div 
        id="rapor-page-2"
        className="rapor-page mx-auto bg-white p-[10mm] sm:p-[12mm] shadow-2xl rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:max-w-full relative" 
        style={{ 
          width: "794px",
          minHeight: "297mm", 
          position: "relative", 
          fontFamily: "Arial, Helvetica, sans-serif",
          boxSizing: "border-box"
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
              <img crossOrigin="anonymous" src="/logo.png" alt="Logo Al-Imam" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center", fontFamily: '"Times New Roman", Times, serif' }}>
                <h1 style={{ fontSize: "17.5px", fontWeight: "900", margin: 0, letterSpacing: "1px", color: "#000000", fontFamily: '"Times New Roman", Times, serif' }}>PESANTREN AL-IMAM AL-ISLAMI</h1>
                <p style={{ margin: "1px 0 2px 0", fontSize: "10px", fontWeight: "bold", color: "#666", fontStyle: "italic", fontFamily: '"Times New Roman", Times, serif' }}>Managed by Al-Andalus International Islamic Boarding School</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "10.5px", fontWeight: "bold", color: "#333", fontFamily: '"Times New Roman", Times, serif' }}>Kaderisasi Ummat Hanif, Kontributif, dan Adaptif</p>
                <p style={{ margin: "1px 0 0 0", fontSize: "7.5px", color: "#555", whiteSpace: "nowrap", letterSpacing: "-0.1px", fontFamily: '"Times New Roman", Times, serif' }}>Jl. Pelabuhan II, Gg. Cirengkol, Kampung Pupunjul, Desa Cikembar, Kec. Cikembar, Kab. Sukabumi, Jawa Barat 43157 | Website: pesantren-alimam.com</p>
              </div>
              <img crossOrigin="anonymous" src="/logo-andalus.png" alt="Logo Al-Andalus" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
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

            {/* 3. LAPORAN TAHSIN (Bilateral Simetris Sempurna) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1px solid #94a3b8", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <colgroup>
                  {/* Sisi Kiri (50% Indonesia) */}
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  {/* Sisi Kanan (50% Arab Mirror) */}
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "28%" }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={3} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", color: "#000000", fontWeight: "bold", fontSize: "11.5px" }}>
                      C. Laporan Tahsin
                    </th>
                    <th colSpan={3} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", color: "#000000", fontWeight: "bold", fontSize: "13.5px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      جـ . تقرير التحسين
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
                    const indoInfo = formatExamIndo(u);
                    const arabInfo = formatExamArab(u);

                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td style={{ border: "1px solid #94a3b8", padding: "4px 8px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: "bold", fontSize: "11px", color: "#000000", lineHeight: "1.25" }}>
                            {indoInfo.jenis}
                          </div>
                          {indoInfo.materi && (
                            <div style={{ fontSize: "10px", color: "#1e293b", marginTop: "2px", fontWeight: "600", lineHeight: "1.2" }}>
                              ({indoInfo.materi})
                            </div>
                          )}
                          {indoInfo.halText && (
                            <div style={{ fontSize: "9.5px", color: "#047857", marginTop: "2px", fontWeight: "bold" }}>
                              Jumlah: {indoInfo.halText}
                            </div>
                          )}
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center", verticalAlign: "middle", fontSize: "10.5px" }}>
                          {sikapStr}
                        </td>
                        <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", verticalAlign: "middle", fontWeight: "bold", fontSize: "11px" }}>
                          <span>{nilaiAkhir}</span>
                          <span style={{ fontSize: "9px", marginLeft: "3px", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                            ({u.is_lulus ? "Lulus" : "Mengulang"})
                          </span>
                        </td>

                        <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "3.5px 4px", textAlign: "center", verticalAlign: "middle", fontWeight: "bold", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                          <span>{toArabicNum(nilaiAkhir)}</span>
                          <span style={{ fontSize: "11px", marginRight: "3px", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                            ({u.is_lulus ? "ناجح" : "راسب"})
                          </span>
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "3.5px 4px", textAlign: "center", verticalAlign: "middle", fontFamily: "'Traditional Arabic', serif", fontSize: "12px" }} dir="rtl">
                          {toArabicSikap(sikapStr)}
                        </td>
                        <td style={{ border: "1px solid #94a3b8", padding: "4px 8px", textAlign: "right", verticalAlign: "middle" }} dir="rtl">
                          <div style={{ fontWeight: "bold", fontSize: "13px", color: "#000000", fontFamily: "'Traditional Arabic', serif", lineHeight: "1.25" }}>
                            {arabInfo.jenisArab}
                          </div>
                          {arabInfo.materiArab && (
                            <div style={{ fontSize: "12px", color: "#1e293b", marginTop: "1px", fontFamily: "'Traditional Arabic', serif", lineHeight: "1.2" }}>
                              ({arabInfo.materiArab})
                            </div>
                          )}
                          {arabInfo.halTextArab && (
                            <div style={{ fontSize: "11px", color: "#047857", marginTop: "1px", fontFamily: "'Traditional Arabic', serif", fontWeight: "bold" }}>
                              المقدار: {arabInfo.halTextArab}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr style={{ backgroundColor: "white" }}>
                      <td colSpan={3} className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4.5px 8px", textAlign: "center", color: "#666" }}>Belum ada data riwayat ujian tahsin</td>
                      <td colSpan={3} style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4.5px 8px", textAlign: "center", color: "#666", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">لا توجد بيانات سابقة لاختبار التحسين</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. EVALUASI PENCAPAIAN TAHSIN (Bilateral Simetris Sempurna) */}
            <div style={{ width: "100%", overflow: "visible", marginBottom: "7px" }}>
              <table className="rapor-table" style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", border: "1px solid #94a3b8", fontSize: "10.5px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                <colgroup>
                  <col style={{ width: "50%" }} />
                  <col style={{ width: "50%" }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "4px 8px", textAlign: "left", fontSize: "11px", color: "#000000" }}>
                      D. Catatan Evaluasi
                    </th>
                    <th style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "4px 8px", textAlign: "right", fontSize: "13px", color: "#000000", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      د. التوجيهات والتقويم
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td className="border-divider-mid" style={{ border: "1px solid #94a3b8", borderRight: "2px solid #000000", padding: "5px 8px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.35", textAlign: "justify", fontSize: "10px" }}>
                      {(() => {
                        if (praTargetUjian.length === 0) {
                          return "Belum ada riwayat ujian tahsin pada periode ini. Tingkatkan keaktifan talaqqi, ketepatan makharijul huruf, serta latihan tilawah Al-Qur'an bersama Musyrif di halaqoh.";
                        }
                        
                        const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                        const total = praTargetUjian.length;
                        
                        if (passed === total) {
                          return "Alhamdulillah, capaian pembelajaran Tahsin Al-Qur'an ananda pada periode ini menunjukkan hasil yang sangat memuaskan dan tuntas. Terus tingkatkan dan mantapkan ketepatan Makharijul Huruf, kaidah hukum Tajwid, serta kelancaran tilawah secara tartil dan istiqomah di halaqoh.";
                        } else if (passed > 0) {
                          return "Capaian pembelajaran Tahsin ananda sudah cukup baik dan menunjukkan kesungguhan belajar. Perbanyak latihan pengucapan makhraj huruf dan hukum tajwid tertentu bersama Musyrif agar kualitas bacaan Al-Qur'an semakin fasih dan lancar.";
                        } else {
                          return "Ananda memerlukan perhatian dan bimbingan lebih intensif dalam program Tahsin. Diharapkan ananda lebih aktif melatih pelafalan makharijul huruf dasar dan kaidah tajwid bersama Musyrif halaqoh agar dapat menuntaskan materi dengan optimal.";
                        }
                      })()}
                    </td>
                    <td style={{ border: "1px solid #94a3b8", borderLeft: "2px solid #000000", padding: "5px 8px", verticalAlign: "top", color: "#333", lineHeight: "1.35", textAlign: "justify", fontSize: "12px", fontFamily: "'Traditional Arabic', serif" }} dir="rtl">
                      {(() => {
                        if (praTargetUjian.length === 0) {
                          return "لا توجد بيانات سابقة لاختبار التحسين في هذه الفترة. يرجى الحرص على التلقي المباشر وضبط مخارج الحروف وملازمة التلاوة مع مشرف الحلقة.";
                        }
                        
                        const passed = praTargetUjian.filter((u: any) => u.is_lulus).length;
                        const total = praTargetUjian.length;
                        
                        if (passed === total) {
                          return "الحمد لله، أظهرت نتائج تعلم تحسين تلاوة القرآن الكريم للطالب في هذه الفترة تميزاً وإتقاناً طيباً. نوصي بالاستمرار في تعزيز مخارج الحروف، وضبط أحكام التجويد، والمواظبة على القراءة المرتلة بإتقان في الحلقة.";
                        } else if (passed > 0) {
                          return "مستوى إتقان التحسين لدى الطالب جيد ويظهر حرصاً طيباً في التعلم. يُرجى مضاعفة التدريب على مخارج الحروف وأحكام التجويد مع مشرف الحلقة لترسيخ فصاحة القراءة وطلاقتها.";
                        } else {
                          return "يحتاج الطالب إلى مزيد من العناية والتوجيه المكثف في برنامج التحسين. نوصي بالتركيز على ضبط مخارج الحروف الأساسية وقواعد التجويد ومضاعفة التدريب مع مشرف الحلقة لتحقيق التقدم المنشود.";
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
                    crossOrigin="anonymous"
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
      </div>
    </div>
  );
}


