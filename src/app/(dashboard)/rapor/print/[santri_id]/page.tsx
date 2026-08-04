"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Head from "next/head";
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

  const renderTabelKategori = (judul: string, judulArab: string, mapelList: any[], startIndex: number = 1) => {
    if (mapelList.length === 0) return null;
    return (
      <>
        {/* Header Kategori */}
        <tr style={{ backgroundColor: "#f1f5f9" }}>
          <td colSpan={2} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: "bold", fontSize: "14px" }}>
            {judul}
          </td>
          <td colSpan={3} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: "bold", fontSize: "14px", textAlign: "right" }} dir="rtl">
            {judulArab}
          </td>
        </tr>
        {/* Isi Mapel */}
        {mapelList.map((m, index) => {
          const isEven = index % 2 === 0;
          return (
            <tr 
              key={index} 
              style={{ backgroundColor: isEven ? "white" : "#fafafa", transition: "background-color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEven ? "white" : "#fafafa"}
            >
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center" }}>{startIndex + index}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>{m.nama}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center" }}>{m.kkm}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center" }}>{m.nilai}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right" }} dir="rtl">{m.nama_arab}</td>
            </tr>
          );
        })}
      </>
    );
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }} className="print:p-0 print:m-0 print:max-w-none print:block bg-gray-50 min-h-screen font-serif">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          td, th { padding: 4px !important; border-color: #9ca3af !important; }
        }
      `}} />

      {/* Hero Banner for Print Page */}
      <div className="no-print" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #8b5cf6 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        color: "white"
      }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center" }}>
            <Printer size={28} style={{ marginRight: 12 }} /> Cetak Rapor Santri
          </h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
            Preview dokumen rapor sebelum dicetak
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{ 
            padding: "10px 18px", 
            borderRadius: "14px", 
            backgroundColor: "#10b981", 
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
          <h1 className="text-xl font-bold font-arabic" dir="rtl">كشف الدرجات للمرحلة المتوسطة</h1>
          <h2 className="text-lg font-bold font-arabic mb-1" dir="rtl">بمعهد الإمام الإسلامي</h2>
          <h3 className="text-sm font-bold uppercase">Hasil Evaluasi Belajar Santri</h3>
          <h3 className="text-sm font-bold uppercase">Pesantren Al Imam Al Islami</h3>
        </div>

        {/* Biodata */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "24px" }}>
          <div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr><td style={{ width: 80, fontWeight: 600, padding: "8px 12px" }}>Nama</td><td style={{ padding: "8px 4px" }}>:</td><td style={{ textTransform: "uppercase", fontWeight: "bold", padding: "8px 12px" }}>{santri.nama}</td></tr>
                <tr><td style={{ width: 80, fontWeight: 600, padding: "8px 12px" }}>NIS</td><td style={{ padding: "8px 4px" }}>:</td><td style={{ padding: "8px 12px" }}>{santri.nis}</td></tr>
                <tr><td style={{ width: 80, fontWeight: 600, padding: "8px 12px" }}>Kelas</td><td style={{ padding: "8px 4px" }}>:</td><td style={{ padding: "8px 12px" }}>{santri.kelas}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr><td style={{ width: 96, fontWeight: 600, padding: "8px 12px" }}>Semester</td><td style={{ padding: "8px 4px" }}>:</td><td style={{ padding: "8px 12px" }}>{santri.semester === "1" ? "Gasal" : "Genap"}</td></tr>
                <tr><td style={{ width: 96, fontWeight: 600, padding: "8px 12px" }}>Tahun Ajaran</td><td style={{ padding: "8px 4px" }}>:</td><td style={{ padding: "8px 12px" }}>{santri.tahun_ajaran}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Utama */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "14px", marginBottom: "24px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
              <th style={{ border: "1px solid #cbd5e1", padding: "16px 20px", width: "32px", textAlign: "center" }}>No</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "left" }}>Mata Pelajaran</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "16px 20px", width: "64px", textAlign: "center" }}>KKM</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "16px 20px", width: "64px", textAlign: "center" }}>Nilai</th>
              <th style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right", width: "33%" }} dir="rtl">المواد الدراسية</th>
            </tr>
          </thead>
          <tbody>
            {renderTabelKategori("A. Ilmu Syari'ah", "أ. العلوم الشرعية", nilai_akademik.syariah, 1)}
            {renderTabelKategori("B. Ilmu Bahasa", "ب. علوم اللغة العربية", nilai_akademik.bahasa, nilai_akademik.syariah.length + 1)}
            {renderTabelKategori("C. Ilmu Pengetahuan Umum", "جـ . العلوم العامة", nilai_akademik.umum, nilai_akademik.syariah.length + nilai_akademik.bahasa.length + 1)}
            
            {/* Bagian D. Kedisiplinan & Akumulasi */}
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <td colSpan={2} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: "bold", fontSize: "14px" }}>D. Kedisiplinan & Akumulasi</td>
              <td colSpan={3} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: "bold", fontSize: "14px", textAlign: "right" }} dir="rtl">د . المواظبة</td>
            </tr>
            <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
              <td colSpan={3} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: 600 }}>Jumlah Nilai</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.totalNilai}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right", fontWeight: 600 }} dir="rtl">مجموع الدرجات</td>
            </tr>
            <tr style={{ backgroundColor: "#fafafa", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}>
              <td colSpan={3} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: 600 }}>Rata-rata</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.rataRata}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right", fontWeight: 600 }} dir="rtl">المعدل التراكمي</td>
            </tr>
            <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
              <td colSpan={3} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", fontWeight: 600 }}>Ranking</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kedisiplinan.ranking}</td>
              <td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right", fontWeight: 600 }} dir="rtl">الترتيب</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Ekstra: Kepribadian & Absensi */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th colSpan={2} style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Kepribadian Santri</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Perilaku</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.perilaku}</td></tr>
                <tr style={{ backgroundColor: "#fafafa", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Kedisiplinan</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kedisiplinan}</td></tr>
                <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Kerajinan</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kerajinan}</td></tr>
                <tr style={{ backgroundColor: "#fafafa", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Kebersihan</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{kepribadian.kebersihan}</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th colSpan={2} style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Ketidakhadiran (Absensi)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Sakit</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{absen.sakit} Hari</td></tr>
                <tr style={{ backgroundColor: "#fafafa", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Izin</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{absen.izin} Hari</td></tr>
                <tr style={{ backgroundColor: "white", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0fdf4"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px" }}>Alpha</td><td style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", fontWeight: "bold" }}>{absen.alpha} Hari</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Mutabaah Tahfidz */}
        <div style={{ marginBottom: "32px", pageBreakInside: "avoid" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th colSpan={4} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "left" }}>
                  Mutaba'ah Tahfidz Al-Qur'an (Riwayat Terakhir)
                </th>
                <th colSpan={1} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "right" }} dir="rtl">
                  متابعة تحفيظ القرآن
                </th>
              </tr>
              <tr style={{ backgroundColor: "#f8fafc", fontSize: "12px", color: "#475569", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #cbd5e1", padding: "10px", width: "40px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "center" }}>Tanggal</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "left" }}>Jenis</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "left" }}>Surat & Ayat</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "center" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {!tahfidz || tahfidz.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ border: "1px solid #cbd5e1", padding: "16px 20px", textAlign: "center", color: "#94a3b8" }}>
                    Belum ada riwayat capaian tahfidz pada semester ini.
                  </td>
                </tr>
              ) : (
                tahfidz.slice(0, 10).map((t: any, idx: number) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={t.id || idx} style={{ backgroundColor: isEven ? "white" : "#fafafa" }}>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "center" }}>
                        {new Date(t.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px" }}>
                        <span style={{ padding: "4px 8px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                          {t.jenis}
                        </span>
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px", fontWeight: "bold" }}>
                        {t.surat} {t.ayat ? `(Ayat ${t.ayat})` : ""}
                      </td>
                      <td style={{ border: "1px solid #cbd5e1", padding: "10px", textAlign: "center", fontWeight: 600 }}>
                        {t.keterangan || "Lancar"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {tahfidz && tahfidz.length > 10 && (
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", fontStyle: "italic", textAlign: "right" }}>
              *Menampilkan 10 capaian tahfidz terakhir. Selengkapnya dapat dilihat pada aplikasi wali santri.
            </div>
          )}
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
