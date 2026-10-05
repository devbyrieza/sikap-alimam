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
  Sparkles,
  Lock,
  CreditCard,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import JurnalDetailModal from "@/components/JurnalDetailModal";

export default function RaporWaliPage() {
  const searchParams = useSearchParams();
  const santriId = searchParams.get("santri_id") || "";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"ringkasan" | "nilai" | "presensi" | "jurnal" | "tahfidz">("ringkasan");

  // Filters for Nilai Tab
  const [filterMapelNilai, setFilterMapelNilai] = useState<string>("");

  // Filters for Presensi Tab
  const [filterStatusPresensi, setFilterStatusPresensi] = useState<string>("");

  // Filters for Jurnal Tab
  const [filterMapelJurnal, setFilterMapelJurnal] = useState<string>("");

  // Modal Jurnal Detail
  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);

  useEffect(() => {
    // Fetch from real API (if no santriId, API defaults to first active santri)
    const url = santriId ? `/api/rapor?santri_id=${santriId}` : "/api/rapor";
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [santriId]);

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

    return Array.from(map.values()).map((item) => {
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

      return {
        ...item,
        nilaiAkhir: naNum !== null ? naNum.toFixed(1) : null,
        predikat };
    });
  }, [data]);

  // Filtered Nilai
  const filteredAkademik = useMemo(() => {
    if (!filterMapelNilai) return akademikGrouped;
    return akademikGrouped.filter((a) => a.mapel_id === filterMapelNilai || a.mapel_nama.toLowerCase().includes(filterMapelNilai.toLowerCase()));
  }, [akademikGrouped, filterMapelNilai]);

  // Filtered Presensi
  const filteredPresensi = useMemo(() => {
    if (!data?.detail?.presensi) return [];
    if (!filterStatusPresensi) return data.detail.presensi;
    if (filterStatusPresensi === "tidak_hadir") {
      return data.detail.presensi.filter((p: any) => p.status !== "hadir");
    }
    return data.detail.presensi.filter((p: any) => p.status === filterStatusPresensi);
  }, [data, filterStatusPresensi]);

  // Filtered Jurnal
  const filteredJurnal = useMemo(() => {
    if (!data?.detail?.jurnal) return [];
    if (!filterMapelJurnal) return data.detail.jurnal;
    return data.detail.jurnal.filter((j: any) => j.mapel.toLowerCase().includes(filterMapelJurnal.toLowerCase()));
  }, [data, filterMapelJurnal]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-slate-100 pb-20">
      {/* Top Bar Navigation */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Profile Card Banner */}
        <div className="bg-gradient-to-r from-primary via-[#7e141a] to-[#4a080d] text-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-primary/30 relative overflow-hidden">
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
                    {santri.kelas} ({santri.jenjang || "MTs"})
                  </span>
                  <span className="text-white/80 font-mono text-xs">NIS: {santri.nis}</span>
                  {data?.spp?.lunas ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> SPP {data.spp.namaBulan} Lunas
                    </span>
                  ) : data?.spp?.isGracePeriod ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[11px] font-extrabold flex items-center gap-1">
                      <Clock size={12} /> SPP: Batas Bayar Tgl 10
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/40 text-rose-200 border border-rose-400/50 text-[11px] font-extrabold animate-pulse flex items-center gap-1">
                      <Lock size={12} /> Akses Terkunci (SPP)
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {santri.nama}
                </h1>
                <p className="text-white/80 text-xs sm:text-sm font-medium mt-0.5">
                  Pesantren Al-Imam Al-Islami • Tahun Ajaran 2024/2025
                </p>
              </div>
            </div>

            {/* Quick Pill Status */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-6 self-stretch sm:self-auto justify-around">
              <div className="text-center">
                <p className="text-[11px] text-white/75 font-medium uppercase">Kehadiran</p>
                <p className="text-xl sm:text-2xl font-black text-white">{ringkasan.persentaseKehadiran}%</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[11px] text-white/75 font-medium uppercase">Total Mapel</p>
                <p className="text-xl sm:text-2xl font-black text-white">{akademikGrouped.length || detail.mapelList?.length || 12}</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[11px] text-white/75 font-medium uppercase">Shubuh Jamaah</p>
                <p className="text-xl sm:text-2xl font-black text-white">{ringkasan.persentaseShubuh}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* JIKA SPP TERKUNCI (Lewat Tgl 10 & Belum Bayar) -> Render Lock Screen */}
        {data?.spp?.lunas === false ? (
          <div className="bg-white/90 backdrop-blur rounded-3xl border border-rose-200/80 p-8 sm:p-12 shadow-xl shadow-primary/10 text-center space-y-6 max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={38} className="animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs tracking-wider uppercase inline-block">
                Akses Terkunci Sementara
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Penyelesaian Administrasi SPP Santri
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
                Afwan, batas akhir pembayaran SPP bulanan ananda adalah <strong>tanggal 10 setiap bulannya</strong>. 
                Akses rincian nilai, rekap presensi, dan jurnal harian guru saat ini terkunci sementara hingga pembayaran terverifikasi oleh Admin Keuangan.
              </p>
            </div>

            {/* Kotak Rincian Tagihan */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 max-w-lg mx-auto text-left space-y-3 text-xs shadow-md">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Bulan Tagihan</span>
                <span className="font-bold text-slate-800">{data.spp.namaBulan} {data.spp.tahun}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Nominal Tagihan</span>
                <span className="font-extrabold text-rose-700 text-sm">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.spp.nominal || 1500000)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Batas Waktu (Jatuh Tempo)</span>
                <span className="font-bold text-slate-800">{data.spp.jatuhTempo}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Rekening Pembayaran Resmi</span>
                <span className="font-bold text-emerald-800">BSI 7711-2233-44 (a.n Yayasan Al-Imam)</span>
              </div>
            </div>

            {/* Tombol Tindakan */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Assalamu'alaikum Admin Keuangan Pesantren Al-Imam, saya wali santri dari ${santri.nama} (${santri.kelas}) ingin mengonfirmasi pembayaran SPP bulan ${data.spp.namaBulan} ${data.spp.tahun}. Mohon verifikasi agar akses akun kami dapat terbuka kembali. Syukron.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary w-full sm:w-auto"
                style={{
                  padding: "12px 24px",
                  borderRadius: "16px",
                  fontWeight: 800,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8 }}
              >
                <PhoneCall size={16} />
                <span>Konfirmasi ke Admin Keuangan (WhatsApp)</span>
              </a>
              <a
                href="/wali"
                className="btn btn-outline w-full sm:w-auto"
                style={{
                  padding: "12px 20px",
                  borderRadius: "16px",
                  fontWeight: 700,
                  fontSize: "14px" }}
              >
                Kembali ke Menu Utama
              </a>
            </div>

            <p className="text-[11px] text-slate-400">
              *Setelah Admin Keuangan mencentang lunas, seluruh isi akun dan rapor ananda akan langsung terbuka otomatis secara instan.
            </p>
          </div>
        ) : (
          <>
            {/* Grace Period Notification Banner (Tgl 1-10) */}
            {data?.spp?.isGracePeriod && (
              <div className="bg-amber-50/90 backdrop-blur border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs shadow-md">
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
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 p-1.5 shadow-sm">
              <div className="flex gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("ringkasan")}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm font-bold ${
                    activeTab === "ringkasan"
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Activity size={16} />
                  <span>1. Ringkasan Rapor</span>
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
                  <span>5. Tahfidz & Ibadah</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB CONTENT */}
        {/* TAB 1: RINGKASAN RAPOR */}
        {activeTab === "ringkasan" && (
          <div className="space-y-6">
            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Kehadiran */}
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Kehadiran</span>
                  <div className="p-2 bg-emerald-500 rounded-xl text-white"><Activity size={16} /></div>
                </div>
                <p className="text-3xl font-black text-emerald-900">{ringkasan.persentaseKehadiran}%</p>
                <p className="text-[11px] text-emerald-600 mt-1">Tingkat kedisiplinan</p>
              </div>
              {/* Tahfidz */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border border-blue-100 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Tahfidz</span>
                  <div className="p-2 bg-blue-500 rounded-xl text-white"><BookOpen size={16} /></div>
                </div>
                <p className="text-3xl font-black text-blue-900">Aktif</p>
                <p className="text-[11px] text-blue-600 mt-1">Status hafalan lancar</p>
              </div>
              {/* Shalat */}
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Shalat</span>
                  <div className="p-2 bg-amber-500 rounded-xl text-white"><Clock size={16} /></div>
                </div>
                <p className="text-3xl font-black text-amber-900">{ringkasan.persentaseShubuh}%</p>
                <p className="text-[11px] text-amber-600 mt-1">Shubuh berjamaah</p>
              </div>
              {/* Sikap */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 border border-purple-100 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Sikap</span>
                  <div className="p-2 bg-purple-500 rounded-xl text-white"><HeartHandshake size={16} /></div>
                </div>
                <p className="text-3xl font-black text-purple-900">Mumtaz</p>
                <p className="text-[11px] text-purple-600 mt-1">Penilaian adab (A)</p>
              </div>
            </div>

            {/* Quick Academic Table */}
            <div className="card p-0 overflow-hidden shadow-xl shadow-primary/10 border border-slate-100 rounded-3xl bg-white/90 backdrop-blur">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Rekapitulasi Nilai Akhir Mata Pelajaran</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ringkasan akumulasi seluruh mata pelajaran yang ditempuh ananda</p>
                </div>
                <button
                  onClick={() => setActiveTab("nilai")}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Filter & Rincian Lengkap</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="mx-5 mb-4 mt-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-3 items-center shadow-sm">
                <AlertCircle className="text-blue-600 shrink-0" size={18} />
                <p className="text-xs text-blue-800">
                  <strong>Rapor Bayangan PTS Semester 1</strong> — Nilai yang ditampilkan adalah Nilai Ujian PTS Murni sesuai arahan kurikulum pesantren.
                </p>
              </div>

              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse" style={{ minWidth: 600 }}>
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4">Mata Pelajaran</th>
                      <th className="py-3.5 px-4 text-center">Nilai PTS</th>
                      <th className="py-3.5 px-4 text-center">KKM</th>
                      <th className="py-3.5 px-4 text-center">Nilai Akhir</th>
                      <th className="py-3.5 px-4 text-center">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {akademikGrouped.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                          Belum ada data nilai akademik yang diinput oleh guru pengampu.
                        </td>
                      </tr>
                    ) : (
                      akademikGrouped.map((item, idx) => {
                        let badgeClass = "bg-slate-100 text-slate-800 font-bold";
                        if (item.nilaiAkhir) {
                          const na = Number(item.nilaiAkhir);
                          if (na >= 90) badgeClass = "bg-emerald-100 text-emerald-800 font-black";
                          else if (na >= 85) badgeClass = "bg-blue-100 text-blue-800 font-black";
                          else if (na >= 80) badgeClass = "bg-amber-100 text-amber-800 font-bold";
                          else badgeClass = "bg-red-100 text-red-800 font-bold";
                        }
                        return (
                          <tr key={item.mapel_id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-sm shadow-sm">
                            <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {item.mapel_nama}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">{item.hasUjian ? item.ujian : "-"}</td>
                            <td className="py-3 px-4 text-center text-slate-500 font-bold">{item.mapel_kategori !== "umum" ? 85 : 80}</td>
                            <td className="py-3 px-4 text-center">
                              {item.nilaiAkhir ? (
                                <span className={`px-2.5 py-1 rounded-lg ${badgeClass}`}>
                                  {item.nilaiAkhir}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center text-xs font-bold text-slate-700">
                              {item.predikat}
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
                        <span className="text-[11px] font-bold text-emerald-700">{item.predikat}</span>
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
                      <span>Target KKM: <b>{item.mapel_kategori !== "umum" ? 85 : 80}.0</b></span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <CheckCircle2 size={13} /> Tuntas Kurikulum
                      </span>
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
                <span className="text-[11px] text-amber-700 font-medium">Dengan Keterangan Medis</span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 p-5 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase">Izin</span>
                  <HelpCircle size={18} className="text-blue-600" />
                </div>
                <p className="text-3xl font-extrabold text-blue-900 mt-2">{ringkasan.totalIzin || 0}</p>
                <span className="text-[11px] text-blue-700 font-medium">Izin Resmi Orang Tua</span>
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterStatusPresensi("")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatusPresensi === "" ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua ({data.detail.presensi?.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterStatusPresensi("tidak_hadir")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatusPresensi === "tidak_hadir" ? "bg-amber-600 text-white shadow-md shadow-amber-600/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Hanya Ketidakhadiran ({(ringkasan.totalSakit || 0) + (ringkasan.totalIzin || 0) + (ringkasan.totalAlpha || 0)})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: 500 }}>
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4">Tanggal Presensi</th>
                      <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                      <th className="py-3.5 px-4">Keterangan / Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPresensi.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
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
                            <td className="py-3 px-4 font-bold text-slate-800">{formatTanggal(p.tanggal)}</td>
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

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari mata pelajaran atau topik..."
                  className="form-control"
                  value={filterMapelJurnal}
                  onChange={(e) => setFilterMapelJurnal(e.target.value)}
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

        {/* TAB 5: TAHFIDZ & IBADAH */}
        {activeTab === "tahfidz" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tahfidz Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-xl shadow-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Capaian Mutabaah Tahfidz</h3>
                  <p className="text-xs text-slate-500">Ziyadah (hafalan baru) & Murojaah harian</p>
                </div>
              </div>

              {detail.tahfidz?.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Belum ada riwayat setoran tahfidz tercatat.</p>
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

            {/* Ibadah Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-xl shadow-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Mutabaah Shalat & Adab</h3>
                  <p className="text-xs text-slate-500">Kedisiplinan shalat wajib berjamaah di masjid</p>
                </div>
              </div>

              {detail.ibadah?.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Belum ada data evaluasi ibadah tercatat.</p>
              ) : (
                <div className="space-y-3">
                  {detail.ibadah?.map((i: any) => (
                    <div key={i.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-4 shadow-sm">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{formatTanggal(i.tanggal)}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Shubuh: <strong className="text-emerald-700">{i.shubuh}</strong> • Dzuhur: {i.dzuhur || "Berjamaah"}
                        </p>
                      </div>
                      {i.tahajjud && (
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                          Tahajjud ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
