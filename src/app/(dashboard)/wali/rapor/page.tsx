"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  FileText,
  Activity,
  BookOpen,
  Clock,
  HeartHandshake,
  ArrowLeft,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  GraduationCap,
  ChevronRight,
  Filter,
  Eye,
  X,
  Target,
  User,
  MessageSquare,
  Trophy,
  Sparkles,
  Lock,
  CreditCard,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  LayoutList,
  ExternalLink,
  Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import JurnalDetailModal from "@/components/JurnalDetailModal";
import RaporOfficialSheet from "@/components/RaporOfficialSheet";
import { getOfficialNis } from "@/lib/officialSantri";

export default function RaporWaliPage() {
  const searchParams = useSearchParams();
  const santriId = searchParams.get("santri_id") || "";
  const [data, setData] = useState<any>(null);
  const [cetakData, setCetakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"ringkasan" | "nilai" | "presensi" | "jurnal" | "tahfidz" | "spp">("ringkasan");

  // Filters for Nilai Tab
  const [filterMapelNilai, setFilterMapelNilai] = useState<string>("");

  // Filters for Presensi Tab
  const [filterStatusPresensi, setFilterStatusPresensi] = useState<string>("");
  const [filterMapelPresensi, setFilterMapelPresensi] = useState<string>("");

  // Filters for Jurnal Tab
  const [filterMapelJurnal, setFilterMapelJurnal] = useState<string>("");
  const [filterKeywordJurnal, setFilterKeywordJurnal] = useState<string>("");

  // Modal Jurnal Detail
  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);

  // SPP History State
  const [sppHistory, setSppHistory] = useState<any>(null);
  const [loadingSpp, setLoadingSpp] = useState(false);

  useEffect(() => {
    // Fetch from real API (if no santriId, API defaults to first active santri)
    const urlRapor = santriId ? `/api/rapor?santri_id=${santriId}` : "/api/rapor";
    const urlCetak = santriId 
      ? `/api/rapor/cetak?santri_id=${santriId}&semester=Ganjil&tahun_ajaran=2026/2027` 
      : "/api/rapor/cetak?semester=Ganjil&tahun_ajaran=2026/2027";

    Promise.all([
      fetch(urlRapor).then((res) => res.json()),
      fetch(urlCetak).then((res) => res.json())
    ])
      .then(([d1, d2]) => {
        setData(d1);
        setCetakData(d2);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading rapor data:", err);
        setLoading(false);
      });
  }, [santriId]);

  // Fetch SPP History when tab is opened
  useEffect(() => {
    if (activeTab !== "spp" || !santriId || sppHistory) return;
    setLoadingSpp(true);
    fetch(`/api/wali/spp-history?santri_id=${santriId}`)
      .then(r => r.json())
      .then(d => { setSppHistory(d); setLoadingSpp(false); })
      .catch(() => setLoadingSpp(false));
  }, [activeTab, santriId, sppHistory]);

  const handleKirimWA = async () => {
    if (!data?.santri) return;
    Swal.fire({
      title: "Kirim Ringkasan ke WhatsApp?",
      text: `Sistem akan merangkum progres ananda ${data?.santri?.nama} dan mengirimkannya ke WhatsApp wali santri.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Kirim Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#9b1b22" }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Mengirim Notifikasi...",
          text: "Menghubungkan ke gateway WhatsApp Pesantren Al-Imam",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading() });

        setTimeout(() => {
          Swal.fire("Laporan Terkirim!", `Ringkasan capaian santri telah berhasil diteruskan ke nomor WhatsApp Anda.`, "success");
        }, 1200);
      }
    });
  };

  const formatTanggal = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric" });
  };

  const isSyariahOrBahasa = (name: string): boolean => {
    const low = name.toLowerCase();
    const umumKeywords = ["matematika", "mtk", "ipa", "ips", "indonesia", "inggris", "pjok", "penjas", "seni", "pkn", "informatika", "prakarya", "kewirausahaan", "entrepreneurship"];
    return !umumKeywords.some(u => low.includes(u));
  };

  const getKategoriMapel = (nama: string): "syariah" | "bahasa" | "umum" => {
    const low = nama.toLowerCase();
    if (["akidah", "hadis", "fikih", "ushul fikih", "sirah", "tahsin", "tahfidz", "adab", "akhlak", "tauhid", "tafsir", "tajwid", "mahfudzot"].some(k => low.includes(k))) return "syariah";
    if (["bahasa arab", "nahwu", "shorof", "kitabah", "muthola", "imla", "khot", "insya", "muhadatsah"].some(k => low.includes(k))) return "bahasa";
    return "umum";
  };

  const getKkm = (nama: string): number => {
    return isSyariahOrBahasa(nama) ? 85 : 80;
  };

  // Group Academic Scores by Mapel
  const akademikGrouped = useMemo(() => {
    if (!data?.detail?.akademik) return [];
    const map = new Map<string, any>();

    data.detail.akademik.forEach((n: any) => {
      if (!map.has(n.mapel_id)) {
        map.set(n.mapel_id, {
          mapel_id: n.mapel_id,
          mapel_nama: n.mapel_nama,
          mapel_kategori: n.mapel_kategori,
          harian: 0,
          kompetensi: 0,
          sikap: 0,
          ujian: 0,
          hasHarian: false,
          hasKomp: false,
          hasSikap: false,
          hasUjian: false });
      }
      const item = map.get(n.mapel_id);
      const val = Number(n.nilai) || 0;
      if (n.jenis.includes("harian") || n.jenis === "tugas" || n.jenis === "uh") {
        item.harian = val;
        item.hasHarian = true;
      } else if (n.jenis.includes("kompetensi") || n.jenis === "komp") {
        item.kompetensi = val;
        item.hasKomp = true;
      } else if (n.jenis.includes("sikap") || n.jenis === "adab") {
        item.sikap = val;
        item.hasSikap = true;
      } else if (n.jenis === "pas" || n.jenis === "pts" || n.jenis.includes("ujian") || n.jenis.includes("sas") || n.jenis.includes("sat")) {
        item.ujian = val;
        item.hasUjian = true;
      }
    });

    const categoryOrder: Record<string, number> = { syariah: 1, bahasa: 2, umum: 3 };
    const items = Array.from(map.values()).map((item) => {
      let naNum = null;
      // MURNI PTS MODE
      if (item.hasUjian) {
        naNum = item.ujian;
      }
      
      let predikat = "-";
      if (naNum !== null) {
        if (naNum >= 90) predikat = "A (Istimewa)";
        else if (naNum >= 80) predikat = "B (Sangat Baik)";
        else if (naNum >= 70) predikat = "C (Cukup)";
        else predikat = "D (Perlu Bimbingan)";
      }

      const kat = getKategoriMapel(item.mapel_nama);
      return {
        ...item,
        kategori: kat,
        kkm: getKkm(item.mapel_nama),
        nilaiAkhir: naNum !== null ? naNum.toFixed(1) : null,
        nilaiAkhirNum: naNum !== null ? naNum : null,
        predikat };
    });

    return items.sort((a, b) => {
      const orderA = categoryOrder[a.kategori] || 99;
      const orderB = categoryOrder[b.kategori] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.mapel_nama.localeCompare(b.mapel_nama, "id");
    });
  }, [data]);

  const computedTotal = useMemo(() => {
    return akademikGrouped.reduce((acc, curr) => acc + (curr.nilaiAkhirNum !== null ? Math.round(curr.nilaiAkhirNum) : 0), 0);
  }, [akademikGrouped]);

  const computedAvg = useMemo(() => {
    const valid = akademikGrouped.filter(a => a.nilaiAkhirNum !== null);
    if (valid.length === 0) return 0;
    return Math.round(computedTotal / valid.length);
  }, [akademikGrouped, computedTotal]);

  // Filtered Nilai
  const filteredAkademik = useMemo(() => {
    if (!filterMapelNilai) return akademikGrouped;
    return akademikGrouped.filter((a) => a.mapel_id === filterMapelNilai || a.mapel_nama.toLowerCase().includes(filterMapelNilai.toLowerCase()));
  }, [akademikGrouped, filterMapelNilai]);

  // Filtered Presensi
  const filteredPresensi = useMemo(() => {
    if (!data?.detail?.presensi) return [];
    let result = data.detail.presensi;

    if (filterStatusPresensi === "tidak_hadir") {
      result = result.filter((p: any) => p.status !== "hadir");
    } else if (filterStatusPresensi) {
      result = result.filter((p: any) => p.status === filterStatusPresensi);
    }

    if (filterMapelPresensi) {
      result = result.filter((p: any) => p.mapel_nama === filterMapelPresensi);
    }

    return result;
  }, [data, filterStatusPresensi, filterMapelPresensi]);

  // Filtered Jurnal
  const filteredJurnal = useMemo(() => {
    if (!data?.detail?.jurnal) return [];
    let result = data.detail.jurnal;

    if (filterMapelJurnal) {
      result = result.filter((j: any) => j.mapel === filterMapelJurnal);
    }

    if (filterKeywordJurnal) {
      const keyword = filterKeywordJurnal.toLowerCase();
      result = result.filter((j: any) => 
        j.materi?.toLowerCase().includes(keyword) || 
        j.kegiatan?.toLowerCase().includes(keyword) ||
        j.catatan?.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [data, filterMapelJurnal, filterKeywordJurnal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-10 text-center bg-white rounded-3xl shadow-sm border border-slate-100 max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="font-bold text-slate-800 text-lg">Memuat Rapor & Rekap Santri</h3>
          <p className="text-xs text-slate-500 mt-1">Mengambil data nilai, presensi, dan jurnal guru...</p>
        </div>
      </div>
    );
  }

  if (!data?.santri) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-10 text-center bg-white rounded-3xl shadow-sm border border-slate-100 max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Data Santri Tidak Ditemukan</h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">Silakan kembali ke halaman utama wali santri.</p>
          <a href="/wali" className="btn btn-primary">Kembali ke Portal</a>
        </div>
      </div>
    );
  }

  const { santri, ringkasan, detail } = data;
  const klsUpper = (santri?.kelas || "").toUpperCase();
  const jenjangUpper = (santri?.jenjang || "").toUpperCase();
  const isMTs = klsUpper.includes("MTS") || jenjangUpper === "MTS" || klsUpper.startsWith("7") || klsUpper.startsWith("8") || klsUpper.startsWith("9");
  const isMA = jenjangUpper === "MA" || ["10", "11", "12"].some(k => klsUpper === k || klsUpper.startsWith(k + " ") || klsUpper.startsWith(k));
  const isIL = klsUpper.includes("IL") || klsUpper.includes("I'DAD") || jenjangUpper.includes("I'DAD") || jenjangUpper.includes("IL");

  let headTitle = "Kepala Madrasah";
  let headName = "Aziz Basuki, S.H.I., M.Pd.";
  let waliKelasName = "Agus Cahyono";

  if (isMA) {
    headName = "Rethna Kartika Septianiar, S.Pd.";
    waliKelasName = "Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.";
  } else if (isMTs) {
    headName = "Ade Supyana, S.Pd.I.";
    waliKelasName = "Agus Cahyono";
  } else if (isIL) {
    headTitle = "Kepala Kurikulum";
    headName = "Imron Abdillah, S.Pd.";
    waliKelasName = "Imron Abdillah, S.Pd.";
  }

  const getArabicMapelName = (nama: string): string => {
    const low = nama.toLowerCase();
    if (low.includes("akidah") || low.includes("tauhid")) return "العقيدة";
    if (low.includes("fikih") || low.includes("fiqh")) return "الفقه";
    if (low.includes("hadis") || low.includes("hadits")) return "الحديث";
    if (low.includes("sirah") || low.includes("siroh")) return "السيرة النبوية";
    if (low.includes("tahsin")) return "تحسين القرآن";
    if (low.includes("tahfidz")) return "حفظ القرآن";
    if (low.includes("bahasa arab")) return "اللغة العربية";
    if (low.includes("kitabah") || low.includes("khot") || low.includes("imla")) return "الكتابة";
    if (low.includes("shorof") || low.includes("shorf")) return "الصرف";
    if (low.includes("nahwu")) return "النحو";
    if (low.includes("indonesia")) return "اللغة الإندونيسية";
    if (low.includes("inggris")) return "اللغة الإنجليزية";
    if (low.includes("matematika") || low.includes("mtk")) return "الرياضيات";
    if (low.includes("ipa")) return "العلوم الطبيعية";
    if (low.includes("ips")) return "العلوم الاجتماعية";
    if (low.includes("kewirausahaan") || low.includes("entrepreneurship")) return "ريادة الأعمال";
    if (low.includes("tik") || low.includes("informatika")) return "تكنولوجيا المعلومات";
    if (low.includes("penjas") || low.includes("pjok")) return "التربية البدنية";
    if (low.includes("pkn") || low.includes("ppkn")) return "التربية الوطنية";
    return nama;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-100 pb-20 print:p-0 print:m-0 print:bg-white print:min-h-0">
      {/* Top Bar Navigation */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30 shadow-sm no-print print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a
            href="/wali"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-primary transition-colors bg-slate-100 hover:bg-slate-200/70 px-3 py-2 rounded-xl"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Pilihan Anak</span>
          </a>

          <div className="flex items-center gap-2">
            <a
              href={`/rapor/print/${santri.id}`}
              target="_blank"
              className="btn btn-outline btn-sm hidden sm:inline-flex items-center gap-1.5"
              style={{ fontSize: 12, borderRadius: 10 }}
            >
              <Printer size={14} /> Cetak PDF
            </a>
            <button
              onClick={handleKirimWA}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
              style={{ fontSize: 12, borderRadius: 10, padding: "8px 14px" }}
            >
              <Send size={14} /> Kirim ke WA
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8 print:p-0 print:m-0 print:max-w-none print:space-y-0">
        {/* Profile Card Banner */}
        <div className="bg-gradient-to-r from-primary via-[#7e141a] to-[#4a080d] text-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-primary/30 relative overflow-hidden no-print print:hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <GraduationCap size={180} />
          </div>
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full border border-white/10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-inner flex-shrink-0 ring-4 ring-white/20">
                {(santri?.nama || "S").charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide">
                    {santri.kelas}
                  </span>
                  <span className="text-white/80 font-mono text-xs">NIS: {(santri?.nama ? getOfficialNis(santri.nama) : null) || santri.nis}</span>
                  {data?.spp?.lunas ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> SPP {data.spp.namaBulan} Lunas
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/40 text-rose-200 border border-rose-400/50 text-[11px] font-extrabold flex items-center gap-1">
                      <AlertCircle size={12} /> Tagihan SPP: {data?.spp?.tunggakanCount || 1} Bulan
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {santri.nama}
                </h1>
                <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5">
                  Pesantren Al-Imam Al-Islami • Managed by Al-Andalus IIBS • Tahun Ajaran {santri?.tahun_ajaran || "2026/2027"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Peringatan Tunggakan SPP (Jika Ada Tunggakan) */}
        {data?.spp?.lunas === false && (
          <div className="bg-gradient-to-r from-rose-50 to-rose-100/70 border border-rose-200/90 rounded-3xl p-5 shadow-lg shadow-rose-950/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs no-print print:hidden">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-600 text-white shrink-0 shadow-md shadow-rose-950/20">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-extrabold text-[10px] uppercase tracking-wider">
                    Peringatan Pembayaran
                  </span>
                  <span className="font-extrabold text-rose-950 text-sm sm:text-base">
                    Tunggakan SPP: {data?.spp?.tunggakanCount || 1} Bulan
                  </span>
                </div>
                <p className="text-rose-800/90 mt-0.5 leading-relaxed text-xs">
                  Batas akhir pembayaran SPP adalah tanggal <strong>10 setiap bulannya</strong>. Mohon segera melakukan pelunasan administrasi ananda atau konfirmasi ke Admin Keuangan melalui <strong>Tab 6 (SPP &amp; Wali Kelas)</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("spp")}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap self-stretch sm:self-auto text-center shrink-0"
            >
              Cek Rincian Tagihan &rarr;
            </button>
          </div>
        )}

        {/* Grace Period Notification Banner (Tgl 1-10 jika lunas tapi masa bayar) */}
        {data?.spp?.isGracePeriod && data?.spp?.lunas && (
          <div className="bg-amber-50/90 backdrop-blur border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs shadow-md no-print print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="font-bold text-amber-950">Masa Pembayaran SPP Bulan {data.spp.namaBulan}</h4>
                <p className="text-amber-800/90 mt-0.5">
                  Batas akhir pembayaran SPP adalah tanggal <strong>10 {data.spp.namaBulan}</strong>. Seluruh akses laporan santri tetap terbuka selama periode ini.
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right shrink-0">
              <span className="px-3 py-1 rounded-lg bg-amber-200/70 text-amber-900 font-bold">
                Masa Tenggang
              </span>
            </div>
          </div>
        )}

            {/* Tab Navigation Menu */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 p-1.5 shadow-sm no-print print:hidden">
              <div className="flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("ringkasan")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "ringkasan"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <FileText size={16} />
                  <span>1. Lembar Rapor Resmi</span>
                </button>

                <button
                  onClick={() => setActiveTab("nilai")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "nilai"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen size={16} />
                  <span>2. Nilai & Filter Mapel</span>
                </button>

                <button
                  onClick={() => setActiveTab("presensi")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "presensi"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Calendar size={16} />
                  <span>3. Rekap Presensi Absen</span>
                </button>

                <button
                  onClick={() => setActiveTab("jurnal")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "jurnal"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <FileText size={16} />
                  <span>4. Jurnal Mengajar Guru</span>
                </button>

                <button
                  onClick={() => setActiveTab("tahfidz")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "tahfidz"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <HeartHandshake size={16} />
                  <span>5. Halaqoh & Tahfidz Al-Qur&apos;an</span>
                </button>

                <button
                  onClick={() => setActiveTab("spp")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "spp"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard size={16} />
                  <span>6. SPP &amp; Wali Kelas</span>
                </button>
              </div>
            </div>

        {/* TAB CONTENT */}
        {/* TAB 1: LEMBAR RAPOR RESMI (KASYFUD DARAJAT) */}
        {activeTab === "ringkasan" && (
          <div className="space-y-6">
            {/* Header & Main Print Action Bar */}
            <div className="card p-5 sm:p-6 shadow-xl shadow-primary/10 border border-slate-100 rounded-3xl bg-white/95 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-rose-900 text-white flex items-center justify-center font-bold shadow-md shadow-primary/20 shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    Rapor Hasil Belajar Santri (Kasyfud Darajat)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Penilaian Tengah Semester (PTS) • T.A. 2026/2027
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <a
                  href={`/rapor/print/${santri.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-bold rounded-2xl px-5 py-2.5 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
                >
                  <Printer size={16} />
                  <span>Cetak / Unduh PDF Resmi</span>
                </a>
              </div>
            </div>

            {/* LEMBAR RAPOR RESMI PESANTREN (100% IDENTIK DENGAN PRINT A4) */}
            {cetakData ? (
              <div className="w-full flex justify-center overflow-x-auto custom-scrollbar pb-4 print:overflow-visible print:p-0 print:m-0 print:block">
                <RaporOfficialSheet data={cetakData} showPrintToolbar={false} />
              </div>
            ) : (
              <div className="card p-12 text-center bg-white rounded-3xl shadow-sm border border-slate-100 no-print print:hidden">
                <Loader2 className="animate-spin text-primary mx-auto mb-3" size={32} />
                <p className="text-sm font-bold text-slate-600">Memuat Dokumen Resmi Rapor (A4)...</p>
              </div>
            )}

            {/* TOMBOL AKSI CETAK DI DASAR RAPOR */}
            <div className="flex justify-center pt-2 pb-6 no-print print:hidden">
              <a
                href={`/rapor/print/${santri?.id || cetakData?.santri?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2 text-sm font-bold rounded-2xl px-8 py-3.5 shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all"
              >
                <Printer size={18} />
                <span>Cetak / Unduh PDF Resmi</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: DETAIL NILAI & FILTER PER MAPEL */}
        {activeTab === "nilai" && (
          <div className="space-y-6">
            {/* Filter Bar specifically for Mapel */}
            <div className="card p-5 bg-white/90 backdrop-blur rounded-2xl border border-slate-100 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Filter Mata Pelajaran</h3>
                  <p className="text-xs text-slate-500">Pilih mata pelajaran tertentu (misal: Fiqh, Nahwu, Matematika) untuk melihat rincian nilai ananda</p>
                </div>
              </div>

              <div className="w-full sm:w-72">
                <select
                  className="form-control"
                  value={filterMapelNilai}
                  onChange={(e) => setFilterMapelNilai(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">— Tampilkan Semua Mata Pelajaran —</option>
                  {(detail.mapelList || []).map((m: any) => (
                    <option key={m.id || m.nama} value={m.nama}>
                      {m.nama}
                    </option>
                  ))}
                  {akademikGrouped.map((a) => (
                    <option key={a.mapel_id} value={a.mapel_nama}>
                      {a.mapel_nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Cards for each filtered Mapel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAkademik.length === 0 ? (
                <div className="col-span-full card p-12 text-center bg-white/90 backdrop-blur rounded-3xl border border-slate-100 text-slate-400 shadow-md">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-slate-700">Belum ada nilai untuk mata pelajaran ini</p>
                  <p className="text-xs text-slate-400 mt-1">Silakan pilih mata pelajaran lain pada dropdown di atas.</p>
                </div>
              ) : (
                filteredAkademik.map((item) => (
                  <div
                    key={item.mapel_id}
                    className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                          {item.mapel_kategori || "Pelajaran Pokok"}
                        </span>
                        <h4 className="text-lg font-bold text-slate-800 mt-1.5">{item.mapel_nama}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Akhir</span>
                        <p className="text-2xl font-black text-primary leading-none mt-0.5">
                          {item.nilaiAkhir || "-"}
                        </p>
                        <span className={`text-[11px] font-bold ${
                          item.nilaiAkhir && parseFloat(item.nilaiAkhir) >= 90 ? "text-emerald-700" :
                          item.nilaiAkhir && parseFloat(item.nilaiAkhir) >= 80 ? "text-blue-700" :
                          item.nilaiAkhir && parseFloat(item.nilaiAkhir) >= 70 ? "text-amber-700" :
                          "text-red-600"
                        }`}>{item.predikat}</span>
                      </div>
                    </div>

                    {/* Breakdown 1 Component Boxes */}
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/15">
                        <span className="text-[10px] font-bold text-primary block">Nilai PTS Murni</span>
                        <span className="text-base font-black text-primary mt-0.5 block">{item.hasUjian ? item.ujian : "-"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Target KKM: <b>{item.kkm || getKkm(item.mapel_nama)}.0</b></span>
                      {(() => {
                        const nilai = item.nilaiAkhir ? parseFloat(item.nilaiAkhir) : null;
                        const kkm = item.kkm || getKkm(item.mapel_nama);
                        if (nilai === null) return <span className="inline-flex items-center gap-1 font-bold text-slate-400">— Belum Ada Nilai</span>;
                        if (nilai >= kkm) return (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 size={13} /> {nilai === kkm ? "Pas KKM" : "Di Atas KKM"}
                          </span>
                        );
                        return (
                          <span className="inline-flex items-center gap-1 font-bold text-red-500">
                            <XCircle size={13} /> Di Bawah KKM
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REKAP PRESENSI LENGKAP */}
        {activeTab === "presensi" && (
          <div className="space-y-6">
            {/* 4 Cards: Hadir, Sakit, Izin, Alpha */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Hadir</span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <p className="text-3xl font-extrabold text-emerald-900 mt-2">{ringkasan.totalHadir || 0}</p>
                <span className="text-[11px] text-emerald-700 font-medium">Hari Mengikuti KBM</span>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase">Sakit</span>
                  <AlertCircle size={18} className="text-amber-600" />
                </div>
                <p className="text-3xl font-extrabold text-amber-900 mt-2">{ringkasan.totalSakit || 0}</p>
                <span className="text-[11px] text-amber-700 font-medium">Beristirahat / Dalam Perawatan</span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase">Izin</span>
                  <HelpCircle size={18} className="text-blue-600" />
                </div>
                <p className="text-3xl font-extrabold text-blue-900 mt-2">{ringkasan.totalIzin || 0}</p>
                <span className="text-[11px] text-blue-700 font-medium">Izin Resmi Pesantren</span>
              </div>

              <div className="bg-rose-50/80 border border-rose-200/80 p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase">Alpha</span>
                  <XCircle size={18} className="text-rose-600" />
                </div>
                <p className="text-3xl font-extrabold text-rose-900 mt-2">{ringkasan.totalAlpha || 0}</p>
                <span className="text-[11px] text-rose-700 font-medium">Tanpa Keterangan</span>
              </div>
            </div>

            {/* Presensi Table & Filter */}
            <div className="card p-0 overflow-hidden shadow-xl shadow-primary/10 border border-slate-100 rounded-3xl bg-white/90 backdrop-blur">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Riwayat Detail Presensi Harian</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Catatan seluruh tanggal kehadiran dan ketidakhadiran ananda di kelas</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="form-control max-w-[200px] text-xs py-1.5"
                    value={filterMapelPresensi}
                    onChange={(e) => setFilterMapelPresensi(e.target.value)}
                  >
                    <option value="">Semua Mata Pelajaran</option>
                    {(data.detail?.mapelList || []).map((m: any) => (
                      <option key={m.id || m.nama} value={m.nama}>{m.nama}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setFilterStatusPresensi("")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatusPresensi === "" ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua Status ({data.detail.presensi?.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterStatusPresensi("tidak_hadir")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatusPresensi === "tidak_hadir" ? "bg-amber-600 text-white shadow-md shadow-amber-600/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Ketidakhadiran ({(ringkasan.totalSakit || 0) + (ringkasan.totalIzin || 0) + (ringkasan.totalAlpha || 0)})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 500 }}>
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4">Tanggal & Waktu</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                      <th className="py-3.5 px-4">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPresensi.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                          Tidak ada catatan presensi pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPresensi.map((p: any, idx: number) => {
                        let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        let statusText = "Hadir";
                        if (p.status === "sakit") {
                          badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                          statusText = "Sakit";
                        } else if (p.status === "izin") {
                          badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                          statusText = "Izin";
                        } else if (p.status === "alpha") {
                          badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                          statusText = "Alpha";
                        }

                        return (
                          <tr key={p.id || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-sm shadow-sm">
                            <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 block">{formatTanggal(p.tanggal)}</span>
                              {p.jam_ke && <span className="text-[10px] text-slate-500 mt-0.5">Jam ke-{p.jam_ke}</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-700 text-xs">
                                {p.mapel_nama || "-"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${badgeClass}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {p.keterangan || <span className="text-slate-300 italic">Tidak ada catatan</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: JURNAL MENGAJAR GURU DI KELAS ANANDA */}
        {activeTab === "jurnal" && (
          <div className="space-y-6">
            {/* Filter Jurnal */}
            <div className="card p-5 bg-white/90 backdrop-blur rounded-2xl border border-slate-100 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Jurnal Mengajar Para Guru</h3>
                  <p className="text-xs text-slate-500">Transparansi KBM harian di kelas {santri.kelas} (Materi, Tujuan Pembelajaran & Aktivitas)</p>
                </div>
              </div>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <select
                  className="form-control text-sm"
                  value={filterMapelJurnal}
                  onChange={(e) => setFilterMapelJurnal(e.target.value)}
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {(data.detail?.mapelList || []).map((m: any) => (
                    <option key={m.id || m.nama} value={m.nama}>{m.nama}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Cari topik materi..."
                  className="form-control text-sm"
                  value={filterKeywordJurnal}
                  onChange={(e) => setFilterKeywordJurnal(e.target.value)}
                />
              </div>
            </div>

            {/* Guidance on Mobile */}
            <div className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[12px] font-medium text-amber-900 shadow-sm">
              <ArrowRight className="w-4 h-4 text-amber-500 inline-block mr-1" /> Geser tabel ke kanan untuk melihat rincian guru, jam pelajaran, dan tombol detail.
            </div>

            {/* Jurnal Table */}
            <div className="card p-0 overflow-hidden shadow-xl shadow-primary/10 border border-slate-100 rounded-3xl bg-white/90 backdrop-blur">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                      <th className="py-3.5 px-4" style={{ position: "sticky", left: 0, background: "#f8fafc", zIndex: 10, minWidth: 120 }}>Tanggal</th>
                      <th className="py-3.5 px-4">Guru Pengampu</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4 text-center">Jam Ke</th>
                      <th className="py-3.5 px-4" style={{ minWidth: 200 }}>Materi Pembelajaran</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJurnal.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                          Belum ada jurnal mengajar yang tersimpan di kelas ananda.
                        </td>
                      </tr>
                    ) : (
                      filteredJurnal.map((j: any) => (
                        <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-sm shadow-sm">
                          <td
                            className="py-3.5 px-4 font-bold text-primary"
                            style={{ position: "sticky", left: 0, background: "#ffffff", zIndex: 5, boxShadow: "3px 0 6px -2px rgba(0,0,0,0.05)" }}
                          >
                            {formatTanggal(j.tanggal)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{j.asatidz}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{j.mapel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                              {j.jam_ke}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 text-xs truncate max-w-xs" title={j.materi}>
                            {j.materi}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedJurnal({ ...j, kelas: j.kelas || santri.kelas, kelas_jenjang: santri.jenjang })}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-sm"
                            >
                              <Eye size={13} className="text-primary" />
                              <span>Lihat Detail</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HALAQOH & TAHFIDZ AL-QUR'AN */}
        {activeTab === "tahfidz" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Hasil Ujian Tahfidz Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-xl shadow-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Hasil Ujian Tahfidz Al-Qur&apos;an</h3>
                  <p className="text-xs text-slate-500">Evaluasi Pra-Target, Target, dan Itqon Santri</p>
                </div>
              </div>

              {(!detail.ujianTahfidz || detail.ujianTahfidz.length === 0) ? (
                <div className="text-center text-slate-400 py-12">
                  <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Belum ada riwayat ujian tahfidz pada periode ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.ujianTahfidz?.map((u: any) => (
                    <div key={u.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {u.jenis_ujian.replace(/_/g, " ")}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">
                            {u.juz ? `Juz ${u.juz}` : u.surah_nama} {u.surah_selesai_nama && u.surah_selesai_nama !== u.surah_nama ? `- ${u.surah_selesai_nama}` : ""}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatTanggal(u.tanggal)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-xl bg-white border border-slate-200 text-sm font-black shadow-sm ${u.is_lulus ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {u.nilai_akhir}
                          </span>
                          <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase">{u.is_lulus ? 'LULUS' : 'MENGULANG'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60">
                        <div className="text-center bg-white rounded-lg p-1.5 border border-slate-100 shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Kelancaran</p>
                          <p className="font-bold text-slate-700 text-xs">{u.nilai_kelancaran || "-"}</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-1.5 border border-slate-100 shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Fashohah</p>
                          <p className="font-bold text-slate-700 text-xs">{u.nilai_bacaan || "-"}</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-1.5 border border-slate-100 shadow-sm">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Adab</p>
                          <p className="font-bold text-slate-700 text-xs">{u.nilai_sikap || "-"}</p>
                        </div>
                      </div>
                      {u.catatan && (
                        <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 mt-1">
                          <p className="text-[10px] italic text-amber-700">&quot;{u.catatan}&quot;</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Capaian Mutabaah Tahfidz Harian Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-xl shadow-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Capaian Setoran Halaqoh Harian</h3>
                  <p className="text-xs text-slate-500">Ziyadah (hafalan baru) &amp; Murojaah ba&apos;da Subuh &amp; Maghrib</p>
                </div>
              </div>

              {(!detail.tahfidz || detail.tahfidz.length === 0) ? (
                <div className="text-center text-slate-400 py-12">
                  <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Belum ada riwayat setoran tahfidz tercatat.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.tahfidz?.map((t: any) => (
                    <div key={t.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-4 shadow-sm">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {t.jenis}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{t.surat} {t.ayat ? `(Ayat ${t.ayat})` : ""}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatTanggal(t.tanggal)}</p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-emerald-700 shadow-sm">
                        {t.keterangan || "Lancar"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SPP & WALI KELAS */}
        {activeTab === "spp" && (
          <div className="space-y-6">
            {loadingSpp ? (
              <div className="card p-12 text-center bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-primary/10 border border-slate-100">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-slate-600 font-semibold text-sm">Memuat informasi SPP dan Wali Kelas...</p>
              </div>
            ) : (
              <>
                {/* 1. KARTU WALI KELAS */}
                <div className="bg-gradient-to-br from-primary via-[#7a0000] to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full border border-white/10 pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border-2 border-white/20 backdrop-blur flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg">
                        {sppHistory?.wali_kelas?.nama ? (
                          sppHistory.wali_kelas.nama.slice(0, 2).toUpperCase()
                        ) : (
                          <User size={32} />
                        )}
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-rose-100 mb-1.5">
                          <ShieldCheck size={13} />
                          <span>Wali Kelas Ananda</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                          {sppHistory?.wali_kelas?.nama || "Ustadz Pembina Kelas"}
                        </h3>
                        <p className="text-xs sm:text-sm text-rose-100/90 mt-1">
                          Kelas {data?.santri?.kelas || sppHistory?.santri?.kelas || "-"} &bull; {data?.santri?.jenjang || sppHistory?.santri?.jenjang || "Pesantren Al-Imam"}
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {sppHistory?.wali_kelas?.no_hp ? (
                        <a
                          href={`https://wa.me/${sppHistory.wali_kelas.no_hp.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
                            `Assalamu'alaikum Warahmatullahi Wabarakatuh Ustadz ${sppHistory.wali_kelas.nama_panggilan || sppHistory.wali_kelas.nama}, saya orang tua dari ${data?.santri?.nama || sppHistory?.santri?.nama} (Kelas ${data?.santri?.kelas || sppHistory?.santri?.kelas}). Mohon izin bersilaturahmi dan berkonsultasi mengenai perkembangan ananda.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <PhoneCall size={18} />
                          <span>Hubungi via WhatsApp</span>
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 text-white/80 text-xs font-medium">
                          <AlertCircle size={15} />
                          <span>Nomor kontak dapat dikoordinasikan via Kesantrian</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. STATS RINGKASAN SPP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Bulan Terbayar</span>
                      <div className="p-2 bg-emerald-500 rounded-xl text-white">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-emerald-900">
                      {sppHistory?.spp_summary?.total_lunas || 0}
                      <span className="text-base font-semibold text-emerald-600 ml-1.5">Bulan</span>
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1">Status kewajiban lunas</p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-5 border border-rose-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Tunggakan / Belum Lunas</span>
                      <div className="p-2 bg-rose-500 rounded-xl text-white">
                        <AlertTriangle size={16} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-rose-900">
                      {sppHistory?.spp_summary?.total_belum_lunas || 0}
                      <span className="text-base font-semibold text-rose-600 ml-1.5">Bulan</span>
                    </p>
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      {sppHistory?.spp_summary?.total_nominal_tunggakan
                        ? `Total Rp ${(sppHistory.spp_summary.total_nominal_tunggakan).toLocaleString("id-ID")}`
                        : "Perlu penyelesaian administrasi"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border border-blue-100 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Terbayar (12 Bulan)</span>
                      <div className="p-2 bg-blue-500 rounded-xl text-white">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-blue-900">
                      Rp {(sppHistory?.spp_summary?.total_nominal_lunas || 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[11px] text-blue-600 mt-1">Akumulasi riwayat tercatat</p>
                  </div>
                </div>

                {/* 3. RIWAYAT PEMBAYARAN SPP 12 BULAN TERAKHIR */}
                <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xl shadow-primary/10 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base sm:text-lg">Riwayat SPP 12 Bulan Terakhir</h3>
                        <p className="text-xs text-slate-500">Transparansi pencatatan SPP bulanan santri di Safina Keuangan</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
                      Tahun Ajaran 2026/2027
                    </span>
                  </div>

                  {(!sppHistory?.spp_history || sppHistory.spp_history.length === 0) ? (
                    <div className="text-center text-slate-400 py-12">
                      <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Belum ada riwayat SPP yang dapat ditampilkan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {sppHistory.spp_history.map((item: any, idx: number) => {
                        const isLunas = item.status === "lunas";
                        const isBelum = item.status === "belum_lunas";
                        const isMendatang = item.status === "mendatang";

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              item.is_bulan_ini
                                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-md"
                                : isLunas
                                ? "bg-slate-50/70 border-slate-200/80 hover:bg-white"
                                : isBelum
                                ? "bg-rose-50/40 border-rose-200 hover:bg-rose-50/70"
                                : "bg-slate-50/30 border-slate-100 opacity-75"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-slate-800 text-sm">{item.label}</h4>
                                  {item.is_bulan_ini && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                      Bulan Ini
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                  Rp {(item.nominal || 0).toLocaleString("id-ID")}
                                </p>
                              </div>

                              {isLunas ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                                  <CheckCircle2 size={13} />
                                  <span>Lunas</span>
                                </span>
                              ) : isBelum ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-[11px] font-bold shrink-0">
                                  <XCircle size={13} />
                                  <span>Belum Lunas</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-semibold shrink-0">
                                  <Clock size={13} />
                                  <span>Mendatang</span>
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                              <span>Tanggal Bayar:</span>
                              <span className="font-medium text-slate-700">
                                {item.tanggal_bayar ? formatTanggal(item.tanggal_bayar) : isMendatang ? "Belum Jatuh Tempo" : "-"}
                              </span>
                            </div>
                            {item.metode_bayar && (
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                <span>Metode:</span>
                                <span className="font-semibold text-slate-600 capitalize">{item.metode_bayar}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Catatan / Panduan Pembayaran */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 mt-4">
                    <AlertCircle className="text-amber-700 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold">Informasi Pembayaran &amp; Rekonsiliasi SPP</p>
                      <p className="mt-0.5 text-amber-800">
                        Pembayaran SPP dilakukan melalui rekening resmi Pesantren Islam Al-Imam. Jika telah melakukan transfer namun status belum terbarui, silakan konfirmasi bukti transfer ke Bagian Keuangan melalui nomor WhatsApp layanan atau wali kelas ananda.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Ultra-Premium Jurnal Detail Modal */}
      <JurnalDetailModal
        data={selectedJurnal}
        onClose={() => setSelectedJurnal(null)}
      />
    </div>
  );
}
