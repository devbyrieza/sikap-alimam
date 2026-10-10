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
    return <div className="p-10 text-center">Memuat Rapor...</div>;
  }

  if (!data || data.error) {
    return <div className="p-10 text-center text-red-500">Data rapor tidak ditemukan.</div>;
  }

  const { santri, nilai_akademik, kedisiplinan, kepribadian, absen, tahfidz, ujian_tahfidz } = data;

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
    <div id="rapor-print-container" style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }} className="print:p-0 print:m-0 print:max-w-none print:block bg-gray-50 min-h-screen font-serif text-black">
      <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; color: black; }
            
            /* Sembunyikan elemen dashboard UI (Header & Sidebar & Security Banner) */
            .no-print, .mobile-header, .app-sidebar, .sidebar-nav { display: none !important; }
            
            /* Sembunyikan alert keamanan spesifik */
            .app-content > div:has(a[href="/profile"]) { display: none !important; }
            
            /* Hilangkan wrapper gap dan margin bawaan Dashboard */
            .app-layout { padding: 0 !important; margin: 0 !important; display: block !important; }
            .app-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
            
            /* Prevent content from starting below hidden sticky headers */
            * { position: static !important; }
            .print\\:block { position: relative !important; }
            
            /* --- COMPRESSION AGAR MUAT 1 HALAMAN --- */
            /* Matikan Flexbox karena sangat bug/merusak layout halaman saat di-print */
            #rapor-print-container { 
              padding: 0 !important; 
              margin: 0 !important; 
              background: white !important; 
              display: block !important; 
            }
            #rapor-print-container > div {
              margin-bottom: 12px !important;
            }
            
            .bg-gray-50 { background-color: white !important; }
            
            /* Paksa margin kertas jadi super tipis (5mm) */
            @page { size: A4; margin: 5mm; }
            
            /* Kompresi Tabel Ekstrem */
            table td, table th { padding: 3px 4px !important; font-size: 10.5px !important; line-height: 1.1 !important; }
            
            /* Perkecil Kop Surat secara masif */
            img[alt="Logo"] { width: 55px !important; height: 55px !important; }
            img[alt="Andalus Logo"] { width: 45px !important; }
            h1.font-arabic { font-size: 16px !important; margin-bottom: 0 !important; }
            h2.font-arabic { font-size: 12px !important; margin-bottom: 0 !important; }
            h3 { font-size: 11px !important; margin-top: 0 !important; }
            h4 { font-size: 10px !important; margin-top: 0 !important; }
            
            /* Pangkas semua jarak kosong / line-height */
            p { margin-bottom: 0 !important; line-height: 1.2 !important; }
            div[style*="marginBottom: \"16px\""] { margin-bottom: 6px !important; }
            div[style*="marginBottom: \"24px\""] { margin-bottom: 8px !important; }
            div[style*="marginTop: \"24px\""] { margin-top: 8px !important; }
            div[style*="marginTop: \"40px\""] { margin-top: 10px !important; }
            div[style*="padding: \"16px\""] { padding: 8px !important; }
            
            /* Perkecil Tanda Tangan */
            div[style*="height: 135px"] { height: 85px !important; }
            
            /* HANYA tr yang tidak boleh terpotong, tabel BOLEH terpotong jika terpaksa */
            tr, td, th { page-break-inside: avoid !important; }
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

      <div className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-0 print:max-w-full relative" style={{ borderRadius: "24px", minHeight: "297mm", position: "relative", fontFamily: "\"Georgia\", \"Times New Roman\", serif" }}>
        

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
              const kls = santri.kelas.toUpperCase();
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
                  <h1 className="text-2xl font-bold font-arabic mb-1" dir="rtl" style={{ fontFamily: "Traditional Arabic, serif" }}>
                    كشف الدرجات {marhalah}
                  </h1>
                  <h2 className="text-lg font-bold font-arabic mb-2" dir="rtl" style={{ fontFamily: "Traditional Arabic, serif" }}>بمعهد الإمام الإسلامي</h2>
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
                  <tr style={{ borderBottom: "none" }}><td style={{ width: 80, padding: "4px 0" , borderBottom: "none"}}>Nama</td><td style={{ padding: "4px" , borderBottom: "none"}}>:</td><td style={{ textTransform: "uppercase", padding: "4px 0" , borderBottom: "none"}}>{santri.nama}</td></tr>
                  <tr style={{ borderBottom: "none" }}><td style={{ width: 80, padding: "4px 0" , borderBottom: "none"}}>Kelas</td><td style={{ padding: "4px" , borderBottom: "none"}}>:</td><td style={{ padding: "4px 0" , borderBottom: "none"}}>{santri.kelas.replace(/\s*(MTs|MA|SMP|SMA|SD|TK)\b/gi, "")}</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: "right" }}>
              <table style={{ display: "inline-block", textAlign: "left" }}>
                <tbody>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "4px 0", whiteSpace: "nowrap" , borderBottom: "none" }}>Semester</td>
                    <td style={{ padding: "4px 8px" , borderBottom: "none"}}>:</td>
                    <td style={{ padding: "4px 0" , borderBottom: "none" }}>{santri.semester.includes("Ganjil") || santri.semester === "1" ? "Ganjil" : santri.semester.includes("Genap") || santri.semester === "2" ? "Genap" : santri.semester}</td>
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "4px 0", whiteSpace: "nowrap" , borderBottom: "none" }}>Tahun Pelajaran</td>
                    <td style={{ padding: "4px 8px" , borderBottom: "none"}}>:</td>
                    <td style={{ padding: "4px 0" , borderBottom: "none" }}>{santri.tahun_ajaran}</td>
                  </tr>
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
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center" }}>KKM</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center" }}>Nilai</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center" }}>Rata-<br/>Rata<br/>Kelas</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">الدرجة<br/>الصغرى</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">النتيجة</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "55px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">الدرجة<br/>الصغرى</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">المواد الدراسية</th>
              <th style={{ border: "1px solid #1a1a1a", padding: "8px", width: "40px", textAlign: "center", fontFamily: "Traditional Arabic, serif" }} dir="rtl">رقم</th>
            </tr>
          </thead>
          <tbody>
            {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik.syariah, 1)}
            {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik.bahasa, nilai_akademik.syariah.length + 1)}
            {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik.umum, nilai_akademik.syariah.length + nilai_akademik.bahasa.length + 1)}
            
            {/* Akumulasi Nilai */}
            <tr style={{ backgroundColor: "white" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Nilai</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan.totalNilai}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "14px" }} dir="rtl">{toArabicNum(kedisiplinan.totalNilai)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, serif" }} dir="rtl">مجموع الدرجات</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Nilai Rata-rata</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan.rataRata}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "14px" }} dir="rtl">{toArabicNum(kedisiplinan.rataRata)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, serif" }} dir="rtl">المعدل التراكمي</td>
              </tr>
              <tr style={{ backgroundColor: "white" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Ranking</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan.ranking}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", backgroundColor: "white" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "14px" }} dir="rtl">{toArabicNum(kedisiplinan.ranking)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, serif" }} dir="rtl">الترتيب</td>
              </tr>
              <tr style={{ backgroundColor: "#fafafa" }}>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", fontWeight: "bold" }}>Jumlah Santri</td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "13px" }}>{kedisiplinan.jumlahSantri}</td>
                <td colSpan={2} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", backgroundColor: "#fafafa" }}></td>
                <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "14px" }} dir="rtl">{toArabicNum(kedisiplinan.jumlahSantri)}</td>
                <td colSpan={3} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontFamily: "Traditional Arabic, serif" }} dir="rtl">عدد الطلاب</td>
              </tr>
            </tbody>
        </table>

        {/* Tabel Ekstra: Catatan & Absensi */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "24px", marginBottom: "32px", pageBreakInside: "avoid" }}>
            
            <div style={{ width: "48%" }}>
              <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>Evaluasi Akademik</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: "white" }}>
                      <td style={{ border: "1px solid #1a1a1a", padding: "8px", verticalAlign: "top", height: "80px", color: "#333", fontStyle: "italic", lineHeight: "1.6" }}>
                        {(() => {
                          const rata = kedisiplinan?.rataRata || 0;
                            const totalAbsen = (absen?.sakit || 0) + (absen?.izin || 0) + (absen?.alpha || 0);
                            const ranking = kedisiplinan?.ranking || 0;
                            const totalSantri = kedisiplinan?.jumlahSantri || 1;
                            
                            // Ambil nama panggilan (kata pertama)
                            let namaPanggilan = "Ananda";
                            
                            let note = "";
                            const persentil = ranking / totalSantri; // 0.1 = top 10%, 0.9 = bottom 10%
                            
                            // Logika Predikat (Menggabungkan Nilai & Kompetisi Kelas)
                            if (rata >= 90 && persentil <= 0.3) {
                              note = `Prestasi akademik sangat memuaskan (Mumtaz). Pertahankan semangat belajar yang tinggi dan jangan cepat berpuas diri.`;
                            } else if (rata >= 80 && persentil <= 0.5) {
                              note = `Prestasi akademik sudah baik (Jayyid Jiddan). Tingkatkan lagi kefokusan dalam belajar agar mencapai target yang lebih maksimal.`;
                            } else if (rata >= 80 && persentil > 0.5) {
                              note = `Pencapaian nilai secara rata-rata sudah baik, namun persaingan di kelas sangat ketat. Perbanyak mengulang pelajaran agar tidak tertinggal dari teman-teman yang lain.`;
                            } else {
                              note = `Perlu lebih giat dan tekun dalam belajar. Jangan mudah menyerah, perbanyak mengulang pelajaran di asrama, dan selalu patuhi tata tertib pesantren.`;
                            }

                            if (totalAbsen > 10 || (absen?.alpha || 0) > 3) {
                              note += " Catatan: Evaluasi kehadiran kelas juga perlu diperhatikan, hindari ketidakhadiran tanpa udzur syar'i.";
                            }
                            
                            return note;
                          })()}
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>

            

            <div style={{ width: "48%" }}>
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


        {/* TABEL TAHFIDZ */}
          <div style={{ marginTop: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "Georgia, serif" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th colSpan={4} style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "left", color: "#64748b", fontWeight: "bold" }}>LAPORAN TAHSIN & TAHFIDZ</th>
                  </tr>
                  <tr style={{ backgroundColor: "#fdf8f0" }}>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "left" }}>Jenis / Materi Ujian</th>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", width: "15%", textAlign: "center" }}>Sikap</th>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", width: "15%", textAlign: "center" }}>Nilai Ujian</th>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", width: "20%", textAlign: "center" }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.ujian_tahfidz || []).filter((u: any) => u.jenis_ujian === 'ujian_pra_target').length > 0 ? (data.ujian_tahfidz || []).filter((u: any) => u.jenis_ujian === 'ujian_pra_target').map((u: any, i: number) => {
                    let sikapStr = "Baik";
                    if (u.nilai_sikap >= 90) sikapStr = "Sangat Baik";
                    else if (u.nilai_sikap >= 80) sikapStr = "Baik";
                    else if (u.nilai_sikap >= 70) sikapStr = "Cukup";
                    else sikapStr = "Kurang";
                    
                    const nilaiAkhir = u.nilai_akhir ? Math.round(u.nilai_akhir) : Math.round(((u.nilai_bacaan || 0) + (u.nilai_kelancaran || u.nilai_sikap || 0)) / 2);
                    
                    return (
                      <tr key={i} style={{ backgroundColor: "white" }}>
                        <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px" }}>
                          {u.jenis_ujian.replace(/_/g, ' ').toUpperCase()}
                          {u.juz ? ` (Juz ${u.juz})` : u.surah_nama ? ` (Surah ${u.surah_nama})` : ''}
                        </td>
                        <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center" }}>
                          {sikapStr}
                        </td>
                        <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>
                          {nilaiAkhir}
                        </td>
                        <td style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "center", color: u.is_lulus ? "#047857" : "#be123c", fontWeight: "bold" }}>
                          {u.is_lulus ? 'LULUS' : 'MENGULANG'}
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

            {/* Evaluasi Tahfidz Box */}
            <div style={{ marginTop: "12px", pageBreakInside: "avoid", marginBottom: "32px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a1a1a", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ border: "1px solid #1a1a1a", padding: "6px 8px", textAlign: "left" }}>Evaluasi Pencapaian Al-Qur'an</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "white" }}>
                    <td style={{ border: "1px solid #1a1a1a", padding: "8px", verticalAlign: "top", color: "#333", fontStyle: "italic", lineHeight: "1.6" }}>
                      {(() => {
                        const ujian = (data?.ujian_tahfidz || []).filter((u: any) => u.jenis_ujian === 'ujian_pra_target');
                        if (ujian.length === 0) {
                          return "Belum ada riwayat ujian tahsin/tahfidz pada periode ini. Tingkatkan semangat tilawah dan muraja'ah bersama Musyrif di halaqoh.";
                        }
                        
                        const passed = ujian.filter((u: any) => u.is_lulus).length;
                        const total = ujian.length;
                        
                        if (passed === total) {
                          return "Alhamdulillah, pencapaian ujian Al-Qur'an sangat memuaskan. Terus tingkatkan muraja'ah mandiri agar hafalan semakin mutqin dan terjaga.";
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

        
          {/* Tanda Tangan */}
          {(() => {
            const isMTs = santri.kelas.toUpperCase().includes("MTS");
            const isMA = santri.kelas.toUpperCase().includes("MA");
            const isIL = santri.kelas.toUpperCase().includes("IL");

            let headTitle = "Kepala Madrasah";
            let headName = "Aziz Basuki, S.H.I., M.Pd.";
            let waliKelasName = "........................................";

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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", marginTop: "40px", fontSize: "13px", pageBreakInside: "avoid", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "135px" }}>
                    <div>
                      <p style={{ marginBottom: "4px" }}>Mengetahui,</p>
                      <p>Orang Tua / Wali</p>
                    </div>
                    <p style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>........................................</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "135px" }}>
                    <div>
                      <p style={{ marginBottom: "4px" }}>Mengetahui,</p>
                      <p>{headTitle}</p>
                    </div>
                    <p style={{ fontWeight: "bold", whiteSpace: "nowrap" }}><span>{headName}</span></p>
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "135px" }}>
                    <div>
                      <p style={{ marginBottom: "4px" }}>Sukabumi, 11 Oktober 2026</p>
                      <p>Wali Kelas</p>
                    </div>
                    
                    
                    
                    <p style={{ fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "15px" }}><span>{waliKelasName}</span></p>
                  </div>
                
                {/* Footer QR Code Validasi */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "40px", borderTop: "1px dashed #ccc", paddingTop: "12px", pageBreakInside: "avoid" }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://sikap.pesantren-alimam.com/verify/${santriId}`} alt="QR Code Verifikasi" style={{ width: "45px", height: "45px", padding: "2px", border: "1px solid #ccc", borderRadius: "4px" }} />
                  <div style={{ fontSize: "10px", color: "#666", lineHeight: "1.4", fontFamily: "Arial, sans-serif" }}>
                    <strong>Verifikasi Keaslian Dokumen</strong><br/>
                    Scan QR Code ini menggunakan kamera ponsel untuk memvalidasi keaslian rapor pada database terpusat SIKAP Pesantren Al-Imam Al-Islami (Managed by Al-Andalus IIBS).
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
