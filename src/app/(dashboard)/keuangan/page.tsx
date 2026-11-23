"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Calendar, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X,
  Eye,
  MessageSquare,
  ShieldCheck,
  ThumbsDown,
  Check,
  Power,
  HelpCircle
} from "lucide-react";
import Swal from "sweetalert2";

interface SantriSPPItem {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  kelas_id: string;
  kelas_nama: string;
  jenjang: string;
  is_unlocked_manual?: boolean;
  is_locked_manual?: boolean;
  portal_access?: "TERBUKA_PENUH" | "TERBUKA_DISPENSASI" | "TERBUKA_VERIFIKASI" | "TERBUKA_TENGGANG" | "TERKUNCI_OTOMATIS" | "TERKUNCI_MANUAL";
  tunggakan_count?: number;
  tunggakan_bulan?: string[];
  spp: {
    id: string | null;
    bulan: number;
    tahun: number;
    nominal: number;
    status: "lunas" | "belum_lunas" | "menunggu_verifikasi";
    lock_status: "LUNAS" | "TENGGANG" | "TERKUNCI";
    tanggal_bayar: string | null;
    metode_bayar: string;
    catatan: string;
  };
}

interface SummaryData {
  total_santri: number;
  total_lunas: number;
  total_belum_lunas: number;
  total_terkunci: number;
  total_dispensasi?: number;
  total_terkumpul: number;
  total_tunggakan: number;
  total_pending_verifikasi?: number;
  persentase: number;
}

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function KeuanganSPPPage() {
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState<number>(now.getFullYear());
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [santriList, setSantriList] = useState<SantriSPPItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [kelasList, setKelasList] = useState<{ id: string; nama: string }[]>([]);

  const [pendingList, setPendingList] = useState<any[]>([]);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Modal Edit Detail
  const [editModalSantri, setEditModalSantri] = useState<SantriSPPItem | null>(null);
  const [editNominal, setEditNominal] = useState<number>(1500000);
  const [editTglBayar, setEditTglBayar] = useState<string>("");
  const [editMetode, setEditMetode] = useState<string>("transfer");
  const [editCatatan, setEditCatatan] = useState<string>("");

  const todayDate = now.getDate();
  const isCurrentMonth = selectedBulan === (now.getMonth() + 1) && selectedTahun === now.getFullYear();

  async function fetchData() {
    setLoading(true);
    try {
      const url = `/api/keuangan/spp?bulan=${selectedBulan}&tahun=${selectedTahun}&kelas_id=${selectedKelas}&status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSantriList(json.data);
        setSummary(json.summary);
        if (json.pending_verifications) {
          setPendingList(json.pending_verifications);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data SPP:", err);
    } finally {
      setLoading(false);
    }
  }

  // Verifikasi Konfirmasi Pembayaran dari Wali Santri (1-Click Approval / Multi-Bulan)
  async function handleVerifyPending(item: any) {
    const sameSantriPending = pendingList.filter((p: any) => p.santri_id === item.santri_id);
    let approveAll = true;

    if (sameSantriPending.length > 1) {
      const bulanListStr = sameSantriPending.map((p: any) => NAMA_BULAN[p.bulan - 1]).join(", ");
      const confirmResult = await Swal.fire({
        title: "Verifikasi Pembayaran SPP?",
        html: `
          <div style="font-size: 13px; text-align: left; line-height: 1.6; color: #334155;">
            <p>Ditemukan <strong>${sameSantriPending.length} bulan SPP</strong> dalam antrean verifikasi ananda <strong>${item.santri?.nama_lengkap}</strong>:</p>
            <p style="margin-top: 6px; font-weight: bold; color: #047857;">• ${bulanListStr}</p>
            <p style="margin-top: 6px;">Total Pembayaran: <strong>Rp ${(sameSantriPending.reduce((acc: number, p: any) => acc + (p.nominal || 1000000), 0)).toLocaleString("id-ID")}</strong>.</p>
            <p style="margin-top: 8px;">Apakah Anda ingin menyetujui dan melunaskan <strong>seluruh ${sameSantriPending.length} bulan</strong> tersebut sekaligus?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: `Ya, Setujui Semua (${sameSantriPending.length} Bulan)`,
        denyButtonText: `Hanya Bulan ${NAMA_BULAN[item.bulan - 1]} Saja`,
        cancelButtonText: "Batal",
        confirmButtonColor: "#059669",
        denyButtonColor: "#3b82f6"
      });

      if (confirmResult.isDismissed) return;
      approveAll = confirmResult.isConfirmed;
    }

    setVerifyingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_verification",
          santri_id: item.santri_id,
          bulan: item.bulan,
          tahun: item.tahun,
          approve_all_pending: approveAll
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Pembayaran Diverifikasi & Lunas!",
          text: data.message || `SPP ananda ${item.santri?.nama_lengkap} resmi dicatat LUNAS. Akses portal wali telah dibuka penuh.`,
          timer: 3000,
          showConfirmButton: false
        });
        fetchData();
      } else {
        Swal.fire("Gagal", data.error || "Gagal memverifikasi", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setVerifyingId(null);
    }
  }

  // Tolak Konfirmasi Pembayaran SPP (Minta Bukti Transfer Ulang)
  async function handleRejectPending(item: any) {
    const { value: alasan } = await Swal.fire({
      title: "Tolak Bukti Transfer?",
      text: `Masukkan alasan penolakan untuk wali santri ananda ${item.santri?.nama_lengkap}:`,
      input: "text",
      inputPlaceholder: "Contoh: Bukti transfer buram / nominal tidak sesuai / dana belum masuk",
      showCancelButton: true,
      confirmButtonText: "Ya, Tolak Bukti",
      cancelButtonText: "Batal",
      confirmButtonColor: "#be123c"
    });

    if (!alasan) return;

    setVerifyingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: item.santri_id,
          bulan: item.bulan,
          tahun: item.tahun,
          status: "belum_lunas",
          catatan: `[DITOLAK_KEUANGAN]: ${alasan}`
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "info",
          title: "Bukti Transfer Ditolak",
          text: "Status dikembalikan ke Belum Lunas. Wali santri dapat mengunggah bukti yang valid.",
          timer: 3000,
          showConfirmButton: false
        });
        fetchData();
      } else {
        Swal.fire("Gagal", data.error || "Gagal menolak bukti transfer", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setVerifyingId(null);
    }
  }

  // Fetch data awal & master kelas
  useEffect(() => {
    fetchData();
  }, [selectedBulan, selectedTahun, selectedKelas, statusFilter]);

  // Fetch daftar kelas
  useEffect(() => {
    async function fetchKelas() {
      try {
        const res = await fetch("/api/kelas");
        const json = await res.json();
        if (json.data) {
          setKelasList(json.data);
        }
      } catch {}
    }
    fetchKelas();
  }, []);

  // Buka / Kunci Akses Portal Wali Santri (Dispensasi Admin / Manual Override)
  async function handleTogglePortalLock(item: SantriSPPItem, targetMode: "unlock" | "lock" | "auto") {
    const title = targetMode === "unlock" 
      ? `Buka Akses Portal (Dispensasi)?`
      : targetMode === "lock"
      ? `Kunci Akses Portal Santri?`
      : `Kembalikan ke Otomatisasi SPP?`;
    
    const text = targetMode === "unlock"
      ? `Akses portal SIKAP wali santri dari ananda ${item.nama_lengkap} akan langsung DIBUKA penuh (dispensasi aktif) meskipun masih terdapat tunggakan SPP.`
      : targetMode === "lock"
      ? `Akses portal SIKAP wali santri dari ananda ${item.nama_lengkap} akan DIKUNCI secara manual oleh Admin Keuangan.`
      : `Status akses portal ananda ${item.nama_lengkap} akan dikembalikan mengikuti aturan otomatisasi tagihan SPP sistem.`;

    const result = await Swal.fire({
      title,
      text,
      icon: targetMode === "unlock" ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: targetMode === "unlock" ? "Ya, Buka Akses" : targetMode === "lock" ? "Ya, Kunci Akses" : "Kembalikan Otomatis",
      cancelButtonText: "Batal",
      confirmButtonColor: targetMode === "unlock" ? "#059669" : targetMode === "lock" ? "#be123c" : "#2563eb"
    });

    if (!result.isConfirmed) return;

    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_portal_lock",
          santri_id: item.id,
          lock_mode: targetMode
        })
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Diperbarui",
          text: json.message,
          timer: 2500,
          showConfirmButton: false
        });
        await fetchData();
      } else {
        Swal.fire("Gagal", json.error || "Gagal mengubah status portal", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  // Lunaskan Seluruh Tunggakan Santri (1-Click Bulk Settle)
  async function handleLunaskanSemua(item: SantriSPPItem) {
    const result = await Swal.fire({
      title: "Lunaskan Semua Tunggakan?",
      text: `Seluruh tagihan SPP ananda ${item.nama_lengkap} dari Juli ${selectedTahun} hingga bulan berjalan akan dicatat LUNAS. Akses portal wali santri akan terbuka penuh.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Lunaskan Semua",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669"
    });

    if (!result.isConfirmed) return;

    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lunaskan_semua",
          santri_id: item.id,
          tahun: selectedTahun
        })
      });
      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Semua Tunggakan Lunas!",
          text: json.message,
          timer: 3000,
          showConfirmButton: false
        });
        await fetchData();
      } else {
        Swal.fire("Gagal", json.error || "Gagal melunaskan semua", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  // Quick Toggle Status Lunas / Belum Lunas
  async function handleToggleStatus(item: SantriSPPItem) {
    const newStatus = item.spp.status === "lunas" ? "belum_lunas" : "lunas";
    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: item.id,
          bulan: selectedBulan,
          tahun: selectedTahun,
          status: newStatus,
          nominal: item.spp.nominal,
          tanggal_bayar: newStatus === "lunas" ? new Date().toISOString().split("T")[0] : null,
          metode_bayar: item.spp.metode_bayar || "transfer",
          catatan: item.spp.catatan || "" }) });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      } else {
        alert(json.error || "Gagal mengubah status");
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setUpdatingId(null);
    }
  }

  // Submit Detail Modal
  async function handleSaveDetail() {
    if (!editModalSantri) return;
    setUpdatingId(editModalSantri.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: editModalSantri.id,
          bulan: selectedBulan,
          tahun: selectedTahun,
          status: editModalSantri.spp.status,
          nominal: Number(editNominal),
          tanggal_bayar: editTglBayar || null,
          metode_bayar: editMetode,
          catatan: editCatatan }) });
      const json = await res.json();
      if (json.success) {
        setEditModalSantri(null);
        await fetchData();
      } else {
        alert(json.error || "Gagal menyimpan rincian");
      }
    } catch {
      alert("Terjadi kesalahan sistem");
    } finally {
      setUpdatingId(null);
    }
  }

  function openEditModal(item: SantriSPPItem) {
    setEditModalSantri(item);
    setEditNominal(item.spp.nominal || 1500000);
    setEditTglBayar(item.spp.tanggal_bayar || (item.spp.status === "lunas" ? new Date().toISOString().split("T")[0] : ""));
    setEditMetode(item.spp.metode_bayar || "transfer");
    setEditCatatan(item.spp.catatan || "");
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 pb-20 w-full overflow-hidden box-border">
      {/* Header Banner - Luminous Cream & Warm Gold Platinum Standard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-br from-[#fdfbf7] via-[#faf3e5] to-[#f4e7cd] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_14px_30px_-10px_rgba(184,151,88,0.22),0_4px_10px_rgba(0,0,0,0.03)] border border-[#ebdcc3] text-[#1e293b] gap-4 sm:gap-6 relative overflow-hidden w-full box-border">
        {/* Subtle gold radial background glow */}
        <div style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(221, 193, 146, 0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="flex flex-col gap-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D7A5F] text-white text-xs font-bold w-fit shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Modul Admin Keuangan
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0D7A5F] tracking-tight m-0">
            Manajemen Pembayaran SPP Santri
          </h1>
          <p className="text-xs sm:text-sm text-[#6b5636] m-0 leading-relaxed">
            Pantau kepatuhan SPP bulanan (jatuh tempo tgl 10) &amp; kendalikan akses gembok portal wali santri secara real-time.
          </p>
        </div>

        {/* Month & Year Switcher Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-[#ebdcc3] shadow-sm w-full sm:w-auto relative z-10 box-border">
          <button 
            onClick={() => {
              if (selectedBulan === 1) {
                setSelectedBulan(12);
                setSelectedTahun(selectedTahun - 1);
              } else {
                setSelectedBulan(selectedBulan - 1);
              }
            }}
            className="p-2 rounded-xl bg-[#FDFCF7] text-[#0D7A5F] border border-[#ebdcc3] hover:bg-[#f6ecd9] transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 grow sm:grow-0 justify-center">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="bg-white text-[#0D7A5F] font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-xl border border-[#ebdcc3] outline-none cursor-pointer h-9"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx} value={idx + 1} className="bg-white text-slate-800">
                  {nama}
                </option>
              ))}
            </select>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="bg-white text-[#0D7A5F] font-bold text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-xl border border-[#ebdcc3] outline-none cursor-pointer h-9"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-white text-slate-800">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => {
              if (selectedBulan === 12) {
                setSelectedBulan(1);
                setSelectedTahun(selectedTahun + 1);
              } else {
                setSelectedBulan(selectedBulan + 1);
              }
            }}
            className="p-2 rounded-xl bg-[#FDFCF7] text-[#0D7A5F] border border-[#ebdcc3] hover:bg-[#f6ecd9] transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-[#0D7A5F] text-white hover:bg-[#059669] transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Kartu Panduan Kendali Akses & Verifikasi SPP - Clean Platinum Ivory & Gold */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_10px_25px_-5px_rgba(85,0,0,0.04)] border border-[#ebdcc3] relative overflow-hidden w-full box-border">
        {/* Subtle gold accent light */}
        <div style={{
          position: "absolute",
          top: "-40%",
          left: "-10%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(221, 193, 146, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6 relative z-10 w-full">
          <div className="flex items-start gap-3 sm:gap-3.5 max-w-2xl w-full">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#0D7A5F] shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="grow min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDFCF7] text-[#8b6b28] text-[10px] sm:text-xs font-bold border border-[#ebdcc3] mb-1.5">
                <span>Wewenang Admin Keuangan Pesantren Al-Basyir</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 m-0 tracking-tight">
                Kendali Akses Portal Wali Santri &amp; Verifikasi Pembayaran
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-0 leading-relaxed">
                Gunakan saklar <strong className="text-emerald-600">[ON / OFF]</strong> di kolom Akses Portal untuk membuka (Dispensasi) atau mengunci portal wali santri secara instan tanpa menunggu pelunasan. Bukti transfer yang diunggah wali santri akan masuk ke antrean verifikasi untuk disetujui dalam 1-klik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:max-w-md shrink-0">
            <div className="bg-[#fdfaf5] border border-[#ebdcc3] rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0D7A5F] text-xs mb-1">
                <Unlock className="w-3.5 h-3.5" /> Saklar ON / OFF
              </div>
              <p className="m-0 text-[11px] sm:text-xs text-slate-600 leading-snug">
                Klik tombol switch di kolom <strong>Akses Portal</strong> untuk membuka (ON) atau mengunci (OFF) manual.
              </p>
            </div>
            <div className="bg-[#fdfaf5] border border-[#ebdcc3] rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0D7A5F] text-xs mb-1">
                <Clock className="w-3.5 h-3.5" /> Verifikasi Bukti
              </div>
              <p className="m-0 text-[11px] sm:text-xs text-slate-600 leading-snug">
                Wali upload bukti transfer &rarr; periksa struk &rarr; klik <strong className="text-emerald-600">Setujui &amp; Buka</strong> untuk membuka portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Antrean Konfirmasi Pembayaran Menunggu Verifikasi */}
      {pendingList.length > 0 ? (
        <div className="bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 w-full box-border">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-amber-200 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0 flex items-center justify-center">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-amber-950 m-0">
                    {pendingList.length} Konfirmasi Pembayaran Menunggu Verifikasi
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-900 font-black text-[10px] uppercase tracking-wider border border-yellow-300">
                    Perlu Tindakan
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1 mb-0 leading-relaxed">
                  Wali santri telah mengirim bukti transfer / melunasi SPP via portal. Verifikasi penerimaan dana lalu klik tombol <strong>[Setujui &amp; Buka Akses]</strong> untuk membuka akses portal secara permanen.
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Segarkan Antrean</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
            {pendingList.map((item) => {
              let proofUrl: string | null = null;
              let noteText = item.catatan || "";
              if (noteText.includes("[BUKTI_TRANSFER:")) {
                const match = noteText.match(/\[BUKTI_TRANSFER:(.*?)\]/);
                if (match && match[1]) {
                  proofUrl = match[1];
                  noteText = noteText.replace(/\[BUKTI_TRANSFER:.*?\]/, "").trim();
                }
              }

              return (
                <div
                  key={item.id}
                  style={{ background: "white", borderRadius: "20px", padding: "16px", border: "1px solid #fde68a", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 900, color: "#1e293b", margin: 0 }}>
                          {item.santri?.nama_lengkap}
                        </h4>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          NIS: {item.santri?.nis || "-"} &bull; <strong style={{ color: "#334155" }}>{item.santri?.kelas?.nama || "Kelas"}</strong>
                        </div>
                      </div>
                      <span style={{ padding: "4px 8px", borderRadius: "8px", background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {NAMA_BULAN[item.bulan - 1]} {item.tahun}
                      </span>
                    </div>

                    <div style={{ background: "#fefce8", borderRadius: "12px", padding: "10px 12px", border: "1px solid #fef08a", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#713f12" }}>Nominal:</span>
                        <strong style={{ color: "#78350f", fontSize: "13px", fontWeight: 900 }}>
                          {formatRupiah(item.nominal)}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                        <span style={{ color: "#713f12" }}>Metode:</span>
                        <span style={{ fontWeight: "bold", color: "#854d0e", textTransform: "capitalize" }}>{item.metode_bayar || "transfer"}</span>
                      </div>
                      {noteText && (
                        <div style={{ fontSize: "11px", color: "#854d0e", fontStyle: "italic", borderTop: "1px solid #fef08a", paddingTop: "4px", marginTop: "2px" }}>
                          &ldquo;{noteText}&rdquo;
                        </div>
                      )}
                    </div>

                    {proofUrl && (
                      <button
                        onClick={() => setSelectedProofUrl(proofUrl)}
                        style={{ marginTop: "8px", width: "100%", padding: "7px 12px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        className="hover:bg-blue-100 transition-colors"
                      >
                        <Eye style={{ width: "13px", height: "13px" }} />
                        <span>Lihat Foto / Bukti Transfer</span>
                      </button>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleVerifyPending(item)}
                      disabled={verifyingId === item.id}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "12px", background: "#059669", color: "white", fontWeight: "bold", fontSize: "12px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)" }}
                      className="hover:bg-emerald-700 transition-colors"
                      title="Setujui transfer dan buka akses portal wali santri"
                    >
                      {verifyingId === item.id ? (
                        <RefreshCw className="animate-spin" style={{ width: "13px", height: "13px" }} />
                      ) : (
                        <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                      )}
                      <span>Setujui &amp; Buka</span>
                    </button>
                    <button
                      onClick={() => handleRejectPending(item)}
                      disabled={verifyingId === item.id}
                      style={{ padding: "8px 12px", borderRadius: "12px", background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", fontWeight: "bold", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                      className="hover:bg-rose-100 transition-colors"
                      title="Tolak bukti transfer jika tidak valid"
                    >
                      <XCircle style={{ width: "14px", height: "14px" }} />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm w-full box-border">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-emerald-900">
                Antrean Verifikasi Kosong (0 Menunggu)
              </div>
              <div className="text-[11px] sm:text-xs text-emerald-700 mt-0.5">
                Semua bukti transfer wali santri telah diproses. Pengajuan konfirmasi baru yang diunggah wali santri via portal akan langsung muncul di sini.
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Cek Pengajuan Baru</span>
          </button>
        </div>
      )}

      {/* Date 1-10 Rule Alert Card */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full shadow-sm box-border">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-amber-950 m-0">
              Kebijakan Jatuh Tempo SPP: Tanggal 1 s/d 10 Setiap Bulan
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-800 m-1 sm:mt-1 mb-0 leading-relaxed">
              Santri yang <strong className="font-extrabold">belum lunas setelah tanggal 10</strong> otomatis <span className="font-bold text-rose-700 underline decoration-rose-400">terkunci akses portal rapor &amp; nilainya</span>. Admin Keuangan dapat membuka kunci kapan saja dengan menekan tombol <strong className="font-extrabold">[Tandai Lunas]</strong> di bawah.
            </p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-xl px-3 py-2 text-left sm:text-right shrink-0 w-full sm:w-auto">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Status Tanggal Hari Ini</div>
          <div className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">
            Tgl {todayDate} {NAMA_BULAN[now.getMonth()]} {now.getFullYear()} {isCurrentMonth && (todayDate <= 10 ? "(Masa Pembayaran)" : "(Lewat Batas)")}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 w-full">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Santri</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-800">{summary.total_santri}</div>
            <div className="text-[11px] sm:text-xs text-slate-500">Santri aktif terdaftar</div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-emerald-200 shadow-sm flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Sudah Lunas</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 flex items-baseline gap-1.5">
              {summary.total_lunas} 
              <span className="text-xs font-bold text-emerald-600">({summary.persentase}%)</span>
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-600 font-semibold truncate">{formatRupiah(summary.total_terkumpul)}</div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-rose-200 shadow-sm flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider">Terkunci / Nunggak</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 text-rose-600">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 flex items-baseline gap-1.5">
              {summary.total_terkunci}
              <span className="text-xs font-bold text-rose-600">Santri</span>
            </div>
            <div className="text-[11px] sm:text-xs text-rose-600 font-semibold truncate">{formatRupiah(summary.total_tunggakan)}</div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-amber-200 shadow-sm flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-orange-700 uppercase tracking-wider">Dispensasi Manual</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-orange-600">
                <Unlock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-700 flex items-baseline gap-1.5">
              {summary.total_dispensasi || 0}
              <span className="text-xs font-bold text-orange-600">Santri</span>
            </div>
            <div className="text-[11px] sm:text-xs text-orange-600 font-semibold truncate">Akses dibuka Admin</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-blue-200 shadow-sm flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider">Target Bulan Ini</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-900 truncate">
              {NAMA_BULAN[selectedBulan - 1]} {selectedTahun}
            </div>
            <div className="text-[11px] sm:text-xs text-blue-600 font-semibold truncate">Jatuh tempo: 10 {NAMA_BULAN[selectedBulan - 1]}</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between w-full box-border">
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari santri / NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 box-border"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto overflow-hidden">
          {/* Filter Kelas */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none cursor-pointer shrink-0"
          >
            <option value="ALL">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama}
              </option>
            ))}
          </select>

          {/* Filter Status (Scrollable on mobile) */}
          <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200 w-full sm:w-auto shrink-0 pb-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("MENUNGGU_VERIFIKASI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "MENUNGGU_VERIFIKASI"
                  ? "bg-amber-600 text-white shadow-sm"
                  : pendingList.length > 0
                  ? "bg-amber-100 text-amber-900 animate-pulse"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              ⏳ Menunggu ({summary?.total_pending_verifikasi || pendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter("LUNAS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "LUNAS" ? "bg-emerald-600 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Lunas ({summary?.total_lunas || 0})
            </button>
            <button
              onClick={() => setStatusFilter("BELUM_LUNAS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "BELUM_LUNAS" ? "bg-amber-600 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Belum Lunas ({summary?.total_belum_lunas || 0})
            </button>
            <button
              onClick={() => setStatusFilter("TERKUNCI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "TERKUNCI" ? "bg-rose-600 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Terkunci ({summary?.total_terkunci || 0})
            </button>
            <button
              onClick={() => setStatusFilter("DISPENSASI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border-none cursor-pointer ${
                statusFilter === "DISPENSASI" ? "bg-orange-600 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Dispensasi ({summary?.total_dispensasi || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View (Khusus Layar HP / Layar Sempit < 768px) */}
      <div className="block md:hidden flex flex-col gap-3 w-full">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 shadow-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
            <span className="text-xs">Memuat data status SPP santri...</span>
          </div>
        ) : santriList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 shadow-sm text-xs">
            Tidak ada data santri yang cocok dengan filter.
          </div>
        ) : (
          santriList.map((item, idx) => {
            const isLunas = item.spp.status === "lunas";
            const isMenunggu = (item.spp.status as any) === "menunggu_verifikasi";
            const isTerkunci = item.spp.lock_status === "TERKUNCI" && !isMenunggu;
            const isTenggang = item.spp.lock_status === "TENGGANG";
            const isPortalOpen = item.is_unlocked_manual || (!item.is_locked_manual && (isLunas || isMenunggu || isTenggang));

            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
                {/* Header: No, Name, NIS, Class & Edit */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="font-extrabold text-slate-800 text-sm truncate m-0">{item.nama_lengkap}</h4>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">NIS: {item.nis || "-"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {item.kelas_nama}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border-none cursor-pointer"
                      title="Edit Rincian"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 1: Nominal & Status Pembayaran */}
                <div className="flex items-center justify-between gap-2 bg-slate-50/70 rounded-xl p-2.5">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tagihan SPP</div>
                    <div className="text-xs font-black text-slate-800 mt-0.5">{formatRupiah(item.spp.nominal)}</div>
                  </div>
                  <div className="text-right">
                    {isLunas ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LUNAS
                        </span>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={updatingId === item.id}
                          className="text-[10px] text-slate-400 underline hover:text-rose-600 bg-transparent border-none cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : isMenunggu ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> Verifikasi
                        </span>
                        <button
                          onClick={() => {
                            const p = pendingList.find((x) => x.santri_id === item.id && x.bulan === selectedBulan && x.tahun === selectedTahun);
                            if (p) handleVerifyPending(p);
                            else handleToggleStatus(item);
                          }}
                          disabled={updatingId === item.id || verifyingId !== null}
                          className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 flex items-center gap-1 border-none cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Setujui
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                          Belum Bayar
                        </span>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={updatingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 flex items-center gap-1 shadow-sm border-none cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Lunaskan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Portal Lock Switch (Finger-friendly for mobile) */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Akses Portal Wali</div>
                    <div className="text-[11px] font-bold mt-0.5">
                      {item.is_unlocked_manual ? (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Dispensasi Admin
                          <button onClick={() => handleTogglePortalLock(item, "auto")} className="text-blue-600 underline ml-1 font-normal text-[10px] bg-transparent border-none cursor-pointer">(Reset)</button>
                        </span>
                      ) : item.is_locked_manual ? (
                        <span className="text-rose-700 flex items-center gap-1">
                          Manual Dikunci
                          <button onClick={() => handleTogglePortalLock(item, "auto")} className="text-blue-600 underline ml-1 font-normal text-[10px] bg-transparent border-none cursor-pointer">(Reset)</button>
                        </span>
                      ) : isLunas ? (
                        <span className="text-emerald-600 font-semibold">Otomatis Lunas</span>
                      ) : isMenunggu ? (
                        <span className="text-blue-600 font-semibold">Verifikasi Wali</span>
                      ) : isTenggang ? (
                        <span className="text-blue-600 font-semibold">Masa Tenggang (Tgl 1-10)</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Terkunci SPP</span>
                      )}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  {isPortalOpen ? (
                    <button
                      type="button"
                      onClick={() => handleTogglePortalLock(item, "lock")}
                      disabled={updatingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black text-xs hover:bg-emerald-100 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      {updatingId === item.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>ON (Terbuka)</span>
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Unlock className="w-2.5 h-2.5 text-white" />
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTogglePortalLock(item, "unlock")}
                      disabled={updatingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border-2 border-rose-500 text-rose-800 font-black text-xs hover:bg-rose-100 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      {updatingId === item.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white">
                            <Lock className="w-2.5 h-2.5 text-white" />
                          </span>
                          <span>OFF (Terkunci)</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Tunggakan Badge if any */}
                {item.tunggakan_count && item.tunggakan_count > 0 ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-[10px] text-rose-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Nunggak {item.tunggakan_count} bln: {item.tunggakan_bulan?.join(", ")}</span>
                  </div>
                ) : null}

                {/* Tanggal Bayar if any */}
                {item.spp.tanggal_bayar ? (
                  <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-50 pt-1.5">
                    <span>Tgl Bayar: <strong className="text-slate-700">{item.spp.tanggal_bayar}</strong></span>
                    <span className="uppercase font-semibold text-slate-400">{item.spp.metode_bayar}</span>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Main Table (Khusus Layar Tablet & Desktop >= 768px) */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div style={{ overflowX: "auto" }} className="custom-scrollbar">
          <div className="w-full overflow-x-auto">
<table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <tr style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em" }}>
                <th style={{ padding: "14px 16px", textAlign: "center", width: "44px" }}>No</th>
                <th style={{ padding: "14px 16px", minWidth: "180px" }}>Nama Santri &amp; NIS</th>
                <th style={{ padding: "14px 16px", minWidth: "90px" }}>Kelas</th>
                <th style={{ padding: "14px 16px", minWidth: "120px" }}>Tagihan SPP</th>
                <th style={{ padding: "14px 16px", minWidth: "190px", textAlign: "center" }}>Status Pembayaran</th>
                <th style={{ padding: "14px 16px", minWidth: "190px", textAlign: "center" }}>Akses Portal (ON / OFF)</th>
                <th style={{ padding: "14px 16px", minWidth: "120px" }}>Tgl Bayar</th>
                <th style={{ padding: "14px 16px", minWidth: "100px", textAlign: "center", position: "sticky", right: 0, background: "#f8fafc", boxShadow: "-3px 0 6px -2px rgba(0,0,0,0.05)", zIndex: 10 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <RefreshCw className="animate-spin text-emerald-600" style={{ width: "16px", height: "16px" }} />
                      <span>Memuat data status SPP santri...</span>
                    </div>
                  </td>
                </tr>
              ) : santriList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                    Tidak ada data santri yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                santriList.map((item, idx) => {
                  const isLunas = item.spp.status === "lunas";
                  const isMenunggu = (item.spp.status as any) === "menunggu_verifikasi";
                  const isTerkunci = item.spp.lock_status === "TERKUNCI" && !isMenunggu;
                  const isTenggang = item.spp.lock_status === "TENGGANG";
                  const isPortalOpen = item.is_unlocked_manual || (!item.is_locked_manual && (isLunas || isMenunggu || isTenggang));

                  return (
                    <tr key={item.id} className="hover:bg-[#f0fdf4] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#94a3b8" }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 900, color: "#1e293b", fontSize: "14px" }}>{item.nama_lengkap}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", marginTop: "2px" }}>NIS: {item.nis || "-"}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "#f1f5f9", color: "#1e293b", fontWeight: "bold", fontSize: "11px" }}>
                          {item.kelas_nama}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "bold", color: "#1e293b" }}>
                        {formatRupiah(item.spp.nominal)}
                      </td>

                      {/* 1. Kolom Status Pembayaran & Tindakan Cepat */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {isLunas ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "#d1fae5", color: "#065f46", fontWeight: 900, fontSize: "11px", border: "1px solid #a7f3d0" }}>
                              <CheckCircle2 style={{ width: "13px", height: "13px", color: "#059669" }} /> LUNAS
                            </span>
                            {item.tunggakan_count && item.tunggakan_count > 0 ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 8px", borderRadius: "6px", background: "#fee2e2", color: "#991b1b", fontWeight: "bold", fontSize: "10px", border: "1px solid #fecaca" }} title={`Menunggak bulan: ${item.tunggakan_bulan?.join(", ")}`}>
                                Nunggak: {item.tunggakan_bulan?.join(", ")}
                              </span>
                            ) : null}
                            <button
                              onClick={() => handleToggleStatus(item)}
                              disabled={updatingId === item.id}
                              style={{ fontSize: "10px", color: "#94a3b8", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
                              className="hover:text-rose-600 transition-colors"
                              title="Batalkan status lunas jika salah catat"
                            >
                              Batalkan
                            </button>
                          </div>
                        ) : isMenunggu ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: 900, fontSize: "11px", border: "1px solid #fde68a" }} className="animate-pulse">
                              <Clock style={{ width: "12px", height: "12px", color: "#d97706" }} className="animate-spin" /> Verifikasi Wali
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button
                                onClick={() => {
                                  const p = pendingList.find((x) => x.santri_id === item.id && x.bulan === selectedBulan && x.tahun === selectedTahun);
                                  if (p) handleVerifyPending(p);
                                  else handleToggleStatus(item);
                                }}
                                disabled={updatingId === item.id || verifyingId !== null}
                                style={{ padding: "4px 8px", borderRadius: "8px", background: "#059669", color: "white", fontSize: "11px", fontWeight: "bold", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}
                                className="hover:bg-emerald-700"
                                title="Setujui transfer dan buka akses portal"
                              >
                                <CheckCircle2 style={{ width: "12px", height: "12px" }} /> Setujui
                              </button>
                              {(() => {
                                const p = pendingList.find((x) => x.santri_id === item.id && x.bulan === selectedBulan && x.tahun === selectedTahun);
                                let pUrl: string | null = null;
                                if (p?.catatan?.includes("[BUKTI_TRANSFER:")) {
                                  const m = p.catatan.match(/\[BUKTI_TRANSFER:(.*?)\]/);
                                  if (m && m[1]) pUrl = m[1];
                                }
                                if (!pUrl && item.spp.catatan?.includes("[BUKTI_TRANSFER:")) {
                                  const m = item.spp.catatan.match(/\[BUKTI_TRANSFER:(.*?)\]/);
                                  if (m && m[1]) pUrl = m[1];
                                }
                                if (pUrl) {
                                  return (
                                    <button
                                      onClick={() => setSelectedProofUrl(pUrl)}
                                      style={{ padding: "4px 6px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", cursor: "pointer" }}
                                      title="Lihat Foto Bukti Transfer"
                                    >
                                      <Eye style={{ width: "12px", height: "12px" }} />
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: "bold", fontSize: "11px", border: "1px solid #fde68a" }}>
                              <Clock style={{ width: "12px", height: "12px", color: "#d97706" }} /> BELUM BAYAR
                            </span>
                            <button
                              onClick={() => handleToggleStatus(item)}
                              disabled={updatingId === item.id}
                              style={{ padding: "5px 12px", borderRadius: "10px", background: "#059669", color: "white", fontSize: "11px", fontWeight: "bold", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)" }}
                              className="hover:bg-emerald-700 transition-all"
                              title="Tandai pembayaran SPP bulan ini lunas dan buka akses portal"
                            >
                              <CheckCircle2 style={{ width: "12px", height: "12px" }} /> Tandai Lunas
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 2. Kolom Akses Portal Wali Santri (Interactive Saklar ON / OFF) */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          {isPortalOpen ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePortalLock(item, "lock")}
                              disabled={updatingId === item.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "999px",
                                background: "#ecfdf5",
                                border: "2px solid #10b981",
                                color: "#065f46",
                                fontWeight: 900,
                                fontSize: "11px",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.15)",
                                transition: "all 0.2s"
                              }}
                              className="hover:bg-emerald-100 hover:scale-[1.02] active:scale-[0.98]"
                              title="Klik untuk MATIKAN / Kunci Akses Portal Santri (OFF)"
                            >
                              {updatingId === item.id ? (
                                <RefreshCw className="animate-spin" style={{ width: "12px", height: "12px" }} />
                              ) : (
                                <>
                                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#10b981" }} className="animate-ping" />
                                  <span>{item.is_unlocked_manual ? "ON (Dispensasi)" : "ON (Terbuka)"}</span>
                                  <span style={{ width: "26px", height: "16px", borderRadius: "999px", background: "#10b981", display: "inline-flex", alignItems: "center", justifyContent: "flex-end", padding: "1px", marginLeft: "2px" }}>
                                    <span style={{ width: "14px", height: "14px", borderRadius: "999px", background: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                                      <Unlock style={{ width: "8px", height: "8px", color: "#059669" }} />
                                    </span>
                                  </span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePortalLock(item, "unlock")}
                              disabled={updatingId === item.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "999px",
                                background: "#fff1f2",
                                border: "2px solid #f43f5e",
                                color: "#9f1239",
                                fontWeight: 900,
                                fontSize: "11px",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(244, 63, 94, 0.15)",
                                transition: "all 0.2s"
                              }}
                              className="hover:bg-rose-100 hover:scale-[1.02] active:scale-[0.98]"
                              title="Klik untuk NYALAKAN / Beri Dispensasi Buka Akses Portal (ON)"
                            >
                              {updatingId === item.id ? (
                                <RefreshCw className="animate-spin" style={{ width: "12px", height: "12px" }} />
                              ) : (
                                <>
                                  <span style={{ width: "26px", height: "16px", borderRadius: "999px", background: "#f43f5e", display: "inline-flex", alignItems: "center", justifyContent: "flex-start", padding: "1px", marginRight: "2px" }}>
                                    <span style={{ width: "14px", height: "14px", borderRadius: "999px", background: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                                      <Lock style={{ width: "8px", height: "8px", color: "#e11d48" }} />
                                    </span>
                                  </span>
                                  <span>OFF (Terkunci)</span>
                                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#f43f5e" }} />
                                </>
                              )}
                            </button>
                          )}

                          {/* Keterangan Status Akses & Tombol Reset */}
                          <div style={{ fontSize: "10px", fontWeight: "bold" }}>
                            {item.is_unlocked_manual ? (
                              <span style={{ color: "#c2410c", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <Sparkles style={{ width: "10px", height: "10px" }} /> Dispensasi Admin
                                <button
                                  type="button"
                                  onClick={() => handleTogglePortalLock(item, "auto")}
                                  style={{ color: "#2563eb", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", marginLeft: "2px" }}
                                  title="Kembalikan ke status otomatisasi SPP"
                                >
                                  (Reset)
                                </button>
                              </span>
                            ) : item.is_locked_manual ? (
                              <span style={{ color: "#be123c", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                Manual Dikunci
                                <button
                                  type="button"
                                  onClick={() => handleTogglePortalLock(item, "auto")}
                                  style={{ color: "#2563eb", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", marginLeft: "2px" }}
                                  title="Kembalikan ke status otomatisasi SPP"
                                >
                                  (Reset)
                                </button>
                              </span>
                            ) : isLunas ? (
                              <span style={{ color: "#059669" }}>Otomatis Lunas</span>
                            ) : isMenunggu ? (
                              <span style={{ color: "#2563eb" }}>Verifikasi Wali</span>
                            ) : isTenggang ? (
                              <span style={{ color: "#2563eb" }}>Masa Tenggang (Tgl 1-10)</span>
                            ) : (
                              <span style={{ color: "#be123c" }}>Terkunci SPP</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 500 }}>
                        {item.spp.tanggal_bayar ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "12px" }}>{item.spp.tanggal_bayar}</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>{item.spp.metode_bayar}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "12px" }}>-</span>
                        )}
                      </td>

                      {/* 3. Kolom Aksi Cepat (Sticky agar tidak terpotong) */}
                      <td style={{ padding: "14px 16px", textAlign: "center", position: "sticky", right: 0, background: "white", boxShadow: "-4px 0 8px -2px rgba(0,0,0,0.06)", zIndex: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <button
                            onClick={() => openEditModal(item)}
                            style={{ padding: "7px 9px", borderRadius: "10px", background: "#f1f5f9", color: "#334155", border: "none", cursor: "pointer", transition: "background-color 0.2s" }}
                            className="hover:bg-slate-200"
                            title="Edit Rincian / Catatan Pembayaran"
                          >
                            <Edit style={{ width: "13px", height: "13px" }} />
                          </button>
                        </div>
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

      {/* Edit Detail Modal */}
      {editModalSantri && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: "24px", maxWidth: "400px", width: "100%", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "16px" }} className="animate-in fade-in zoom-in-95">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontWeight: 900, color: "#1e293b", fontSize: "16px", margin: 0 }}>Edit Rincian SPP</h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>{editModalSantri.nama_lengkap} ({editModalSantri.kelas_nama})</p>
              </div>
              <button 
                onClick={() => setEditModalSantri(null)}
                style={{ padding: "6px", borderRadius: "999px", background: "transparent", color: "#94a3b8", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                className="hover:bg-slate-100 hover:text-slate-600"
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div>
                <label style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Bulan &amp; Tahun</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${NAMA_BULAN[selectedBulan - 1]} ${selectedTahun}`} 
                  style={{ width: "100%", padding: "8px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "12px", fontWeight: "bold", color: "#475569", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Nominal Tagihan (Rp)</label>
                <input 
                  type="number" 
                  value={editNominal}
                  onChange={(e) => setEditNominal(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "12px", fontWeight: "bold", color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Tanggal Pembayaran</label>
                <input 
                  type="date" 
                  value={editTglBayar}
                  onChange={(e) => setEditTglBayar(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "12px", fontWeight: 600, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Metode Pembayaran</label>
                <select
                  value={editMetode}
                  onChange={(e) => setEditMetode(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "12px", fontWeight: 600, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                >
                  <option value="transfer">Transfer Bank (BSI / Mandiri)</option>
                  <option value="tunai">Tunai / Cash Bendahara</option>
                  <option value="beasiswa">Beasiswa / Keringanan</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Catatan Keuangan (Opsional)</label>
                <textarea 
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Misal: Sudah transfer via rekening BSI atas nama Ayah..."
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "12px", fontWeight: 500, color: "#1e293b", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const s = editModalSantri;
                  setEditModalSantri(null);
                  handleLunaskanSemua(s);
                }}
                style={{ padding: "8px 12px", borderRadius: "12px", color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", fontWeight: "bold", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                title="Tandai lunas dari Juli hingga bulan berjalan"
              >
                <CheckCircle2 style={{ width: "13px", height: "13px" }} /> Lunaskan Semua Tunggakan
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setEditModalSantri(null)}
                  style={{ padding: "8px 14px", borderRadius: "12px", color: "#475569", fontWeight: "bold", fontSize: "12px", background: "transparent", border: "none", cursor: "pointer", transition: "background-color 0.2s" }}
                  className="hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveDetail}
                  disabled={updatingId !== null}
                  style={{ padding: "8px 16px", borderRadius: "12px", background: "#0D7A5F", color: "white", fontWeight: "bold", fontSize: "12px", border: "none", cursor: updatingId !== null ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.25)", transition: "background-color 0.2s" }}
                  className="hover:bg-emerald-700"
                >
                  {updatingId ? <RefreshCw className="animate-spin" style={{ width: "14px", height: "14px" }} /> : <Save style={{ width: "14px", height: "14px" }} />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Bukti Transfer */}
      {selectedProofUrl && (
        <div 
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedProofUrl(null)}
        >
          <div 
            style={{ background: "white", borderRadius: "24px", maxWidth: "480px", width: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in zoom-in-95"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: "15px", color: "#1e293b" }}>Bukti Transfer Pembayaran SPP</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>Pratinjau struk / tangkapan layar pembayaran</p>
              </div>
              <button 
                onClick={() => setSelectedProofUrl(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                className="hover:text-slate-600"
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <div style={{ maxHeight: "65vh", overflow: "auto", borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
              <img src={selectedProofUrl} alt="Bukti Transfer" style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "8px" }} />
            </div>
            <button
              onClick={() => setSelectedProofUrl(null)}
              style={{ width: "100%", padding: "10px", borderRadius: "12px", background: "#f1f5f9", border: "none", color: "#334155", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
              className="hover:bg-slate-200 transition-colors"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
