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
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 80 }}>
      {/* Header Banner - Luminous Cream & Warm Gold Platinum Standard */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #fdfbf7 0%, #faf3e5 50%, #f4e7cd 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 14px 30px -10px rgba(184, 151, 88, 0.22), 0 4px 10px rgba(0, 0, 0, 0.03)",
        border: "1.5px solid #ebdcc3",
        color: "#1e293b",
        flexWrap: "wrap",
        gap: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "999px", background: "#550000", color: "#ffffff", fontSize: "12px", fontWeight: "bold", width: "fit-content", boxShadow: "0 2px 6px rgba(85,0,0,0.2)" }}>
            <Sparkles className="w-3.5 h-3.5 text-[#ddc192]" /> Modul Admin Keuangan
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, color: "#550000", letterSpacing: "-0.02em" }}>
            Manajemen Pembayaran SPP Santri
          </h1>
          <p style={{ color: "#6b5636", margin: 0, fontSize: "14px", maxWidth: "600px", lineHeight: "1.5" }}>
            Pantau kepatuhan SPP bulanan (jatuh tempo tgl 10) &amp; kendalikan akses gembok portal wali santri secara real-time.
          </p>
        </div>

        {/* Month & Year Switcher Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)", padding: "8px 10px", borderRadius: "18px", border: "1.5px solid #ebdcc3", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)", position: "relative", zIndex: 10 }}>
          <button 
            onClick={() => {
              if (selectedBulan === 1) {
                setSelectedBulan(12);
                setSelectedTahun(selectedTahun - 1);
              } else {
                setSelectedBulan(selectedBulan - 1);
              }
            }}
            style={{ padding: "8px", borderRadius: "12px", background: "#fdf8f0", color: "#550000", border: "1px solid #ebdcc3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            title="Bulan Sebelumnya"
            className="hover:bg-[#f6ecd9]"
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
          </button>

          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(Number(e.target.value))}
            style={{ background: "#ffffff", color: "#550000", fontWeight: "bold", fontSize: "14px", padding: "6px 10px", borderRadius: "10px", border: "1px solid #ebdcc3", outline: "none", cursor: "pointer", height: "34px", display: "flex", alignItems: "center" }}
          >
            {NAMA_BULAN.map((nama, idx) => (
              <option key={idx} value={idx + 1} style={{ background: "#ffffff", color: "#1e293b" }}>
                {nama}
              </option>
            ))}
          </select>

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            style={{ background: "#ffffff", color: "#550000", fontWeight: "bold", fontSize: "14px", padding: "6px 10px", borderRadius: "10px", border: "1px solid #ebdcc3", outline: "none", cursor: "pointer", height: "34px", display: "flex", alignItems: "center" }}
          >
            {[2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr} style={{ background: "#ffffff", color: "#1e293b" }}>
                {yr}
              </option>
            ))}
          </select>

          <button 
            onClick={() => {
              if (selectedBulan === 12) {
                setSelectedBulan(1);
                setSelectedTahun(selectedTahun + 1);
              } else {
                setSelectedBulan(selectedBulan + 1);
              }
            }}
            style={{ padding: "8px", borderRadius: "12px", background: "#fdf8f0", color: "#550000", border: "1px solid #ebdcc3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            title="Bulan Berikutnya"
            className="hover:bg-[#f6ecd9]"
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>

          <button
            onClick={fetchData}
            style={{ padding: "8px", borderRadius: "12px", background: "#550000", color: "#ffffff", border: "none", cursor: "pointer", marginLeft: "4px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(85,0,0,0.25)", transition: "all 0.15s" }}
            title="Segarkan Data"
            className="hover:bg-[#7a0000]"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      {/* Kartu Panduan Kendali Akses & Verifikasi SPP - Clean Platinum Ivory & Gold */}
      <div style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        borderRadius: "24px",
        padding: "26px 30px",
        color: "#1e293b",
        boxShadow: "0 10px 25px -5px rgba(85, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
        border: "1.5px solid #ebdcc3",
        position: "relative",
        overflow: "hidden"
      }}>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", maxWidth: "680px" }}>
            <div style={{ padding: "12px", borderRadius: "16px", background: "#fdf5f5", border: "1px solid #fae4e4", color: "#550000", flexShrink: 0 }}>
              <ShieldCheck style={{ width: "24px", height: "24px" }} />
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", background: "#fdf8f0", color: "#8b6b28", fontSize: "11px", fontWeight: "bold", border: "1px solid #ebdcc3", marginBottom: "6px" }}>
                <span>Wewenang Admin Keuangan Al-Imam</span>
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: 900, margin: 0, color: "#1e293b", letterSpacing: "-0.01em" }}>
                Kendali Akses Portal Wali Santri &amp; Verifikasi Pembayaran
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 0 0", lineHeight: "1.5" }}>
                Gunakan saklar <strong style={{ color: "#059669" }}>[ON / OFF]</strong> di kolom Akses Portal untuk membuka (Dispensasi) atau mengunci portal wali santri secara instan tanpa menunggu pelunasan. Bukti transfer yang diunggah wali santri akan masuk ke antrean verifikasi untuk disetujui dalam 1-klik.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", width: "100%", maxWidth: "420px" }}>
            <div style={{ background: "#fdfaf5", border: "1px solid #ebdcc3", borderRadius: "16px", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", color: "#550000", fontSize: "12px", marginBottom: "4px" }}>
                <Unlock style={{ width: "14px", height: "14px" }} /> Saklar ON / OFF
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#475569", lineHeight: "1.4" }}>
                Klik tombol switch di kolom <strong>Akses Portal</strong> untuk membuka (ON) atau mengunci (OFF) manual.
              </p>
            </div>
            <div style={{ background: "#fdfaf5", border: "1px solid #ebdcc3", borderRadius: "16px", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", color: "#550000", fontSize: "12px", marginBottom: "4px" }}>
                <Clock style={{ width: "14px", height: "14px" }} /> Verifikasi Bukti
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#475569", lineHeight: "1.4" }}>
                Wali upload bukti transfer &rarr; periksa struk &rarr; klik <strong style={{ color: "#059669" }}>Setujui &amp; Buka</strong> untuk membuka portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Antrean Konfirmasi Pembayaran Menunggu Verifikasi */}
      {pendingList.length > 0 ? (
        <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fff7ed 100%)", border: "2px solid #fcd34d", borderRadius: "24px", padding: "24px", boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #fde68a", paddingBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "10px", borderRadius: "14px", background: "#f59e0b", color: "white", boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock className="animate-spin" style={{ width: "20px", height: "20px" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#78350f", margin: 0 }}>
                    {pendingList.length} Konfirmasi Pembayaran Menunggu Verifikasi
                  </h3>
                  <span style={{ padding: "2px 8px", borderRadius: "999px", background: "#fef08a", color: "#854d0e", fontWeight: 900, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid #fde047" }}>
                    Perlu Tindakan
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#92400e", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                  Wali santri telah mengirim bukti transfer / melunasi SPP via portal. Verifikasi penerimaan dana lalu klik tombol <strong>[Setujui &amp; Buka Akses]</strong> untuk membuka akses portal secara permanen.
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              style={{ padding: "8px 14px", borderRadius: "12px", background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              className="hover:bg-amber-200 transition-colors"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "13px", height: "13px" }} />
              <span>Segarkan Antrean</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
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
        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1px solid #a7f3d0", borderRadius: "20px", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "8px", borderRadius: "12px", background: "#10b981", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#065f46" }}>
                Antrean Verifikasi Kosong (0 Menunggu)
              </div>
              <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
                Semua bukti transfer wali santri telah diproses. Pengajuan konfirmasi baru yang diunggah wali santri via portal akan langsung muncul di sini.
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            style={{ padding: "6px 14px", borderRadius: "10px", background: "white", border: "1px solid #a7f3d0", color: "#065f46", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            className="hover:bg-emerald-50 transition-colors"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "12px", height: "12px" }} />
            <span>Cek Pengajuan Baru</span>
          </button>
        </div>
      )}

      {/* Date 1-10 Rule Alert Card */}
      <div style={{ background: "linear-gradient(to right, #fffbeb, #fef3c7)", border: "1px solid #fde68a", borderRadius: "24px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ padding: "10px", borderRadius: "12px", background: "#f59e0b", color: "white", boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.2)", flexShrink: 0 }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#451a03", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              Kebijakan Jatuh Tempo SPP: Tanggal 1 s/d 10 Setiap Bulan
            </h4>
            <p style={{ fontSize: "12px", color: "#92400e", margin: "4px 0 0 0", lineHeight: "1.5" }}>
              Santri yang <strong style={{ fontWeight: 800 }}>belum lunas setelah tanggal 10</strong> otomatis <span style={{ fontWeight: "bold", color: "#be123c", textDecoration: "underline", textDecorationColor: "#fb7185" }}>terkunci akses portal rapor & nilainya</span>. 
              Admin Keuangan dapat membuka kunci kapan saja dengan menekan tombol <strong style={{ fontWeight: 800 }}>[Tandai Lunas]</strong> di bawah.
            </p>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", border: "1px solid #fde68a", borderRadius: "12px", padding: "8px 16px", textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Tanggal Hari Ini</div>
          <div style={{ fontSize: "14px", fontWeight: "900", color: "#451a03", marginTop: "2px" }}>
            Tgl {todayDate} {NAMA_BULAN[now.getMonth()]} {now.getFullYear()} {isCurrentMonth && (todayDate <= 10 ? "(Masa Pembayaran)" : "(Lewat Batas)")}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Santri</span>
              <div style={{ padding: "8px", borderRadius: "12px", background: "#f1f5f9", color: "#334155" }}>
                <Users style={{ width: "16px", height: "16px" }} />
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#1e293b" }}>{summary.total_santri}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Santri aktif terdaftar</div>
          </div>

          <div style={{ background: "white", borderRadius: "24px", padding: "20px", border: "1px solid #a7f3d0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sudah Lunas</span>
              <div style={{ padding: "8px", borderRadius: "12px", background: "#ecfdf5", color: "#059669" }}>
                <CheckCircle2 style={{ width: "16px", height: "16px" }} />
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#047857", display: "flex", alignItems: "baseline", gap: "8px" }}>
              {summary.total_lunas} 
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>({summary.persentase}%)</span>
            </div>
            <div style={{ fontSize: "12px", color: "#059669", fontWeight: 500 }}>{formatRupiah(summary.total_terkumpul)}</div>
          </div>

          <div style={{ background: "white", borderRadius: "24px", padding: "20px", border: "1px solid #fecdd3", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#be123c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Terkunci / Menunggak</span>
              <div style={{ padding: "8px", borderRadius: "12px", background: "#fff1f2", color: "#e11d48" }}>
                <Lock style={{ width: "16px", height: "16px" }} />
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#be123c", display: "flex", alignItems: "baseline", gap: "8px" }}>
              {summary.total_terkunci}
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#e11d48" }}>Santri</span>
            </div>
            <div style={{ fontSize: "12px", color: "#e11d48", fontWeight: 500 }}>{formatRupiah(summary.total_tunggakan)} tunggakan</div>
          </div>

          <div style={{ background: "white", borderRadius: "24px", padding: "20px", border: "1px solid #fed7aa", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dispensasi Buka Manual</span>
              <div style={{ padding: "8px", borderRadius: "12px", background: "#fff7ed", color: "#ea580c" }}>
                <Unlock style={{ width: "16px", height: "16px" }} />
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#c2410c", display: "flex", alignItems: "baseline", gap: "8px" }}>
              {summary.total_dispensasi || 0}
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#ea580c" }}>Santri</span>
            </div>
            <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: 500 }}>Akses dibuka oleh Admin</div>
          </div>

          <div style={{ background: "white", borderRadius: "24px", padding: "20px", border: "1px solid #bfdbfe", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Target Bulan Ini</span>
              <div style={{ padding: "8px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb" }}>
                <TrendingUp style={{ width: "16px", height: "16px" }} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#1e3a8a", marginTop: "4px" }}>
              {NAMA_BULAN[selectedBulan - 1]} {selectedTahun}
            </div>
            <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 500 }}>Jatuh tempo: 10 {NAMA_BULAN[selectedBulan - 1]}</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          <Search style={{ width: "16px", height: "16px", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Cari santri / NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            style={{ width: "100%", padding: "10px 16px 10px 36px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", fontWeight: 500, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", width: "100%", maxWidth: "fit-content" }}>
          {/* Filter Kelas */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            style={{ padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", color: "#334155", outline: "none", cursor: "pointer" }}
          >
            <option value="ALL">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: "12px", flexWrap: "wrap", gap: "4px" }}>
            <button
              onClick={() => setStatusFilter("ALL")}
              style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "ALL" ? "white" : "transparent", color: statusFilter === "ALL" ? "#0f172a" : "#475569", boxShadow: statusFilter === "ALL" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("MENUNGGU_VERIFIKASI")}
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: statusFilter === "MENUNGGU_VERIFIKASI" ? "#d97706" : pendingList.length > 0 ? "#fef3c7" : "transparent",
                color: statusFilter === "MENUNGGU_VERIFIKASI" ? "white" : pendingList.length > 0 ? "#92400e" : "#475569",
                boxShadow: statusFilter === "MENUNGGU_VERIFIKASI" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
              className={pendingList.length > 0 && statusFilter !== "MENUNGGU_VERIFIKASI" ? "animate-pulse" : ""}
            >
              ⏳ Menunggu Verifikasi ({summary?.total_pending_verifikasi || pendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter("LUNAS")}
              style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "LUNAS" ? "#059669" : "transparent", color: statusFilter === "LUNAS" ? "white" : "#475569", boxShadow: statusFilter === "LUNAS" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Lunas ({summary?.total_lunas || 0})
            </button>
            <button
              onClick={() => setStatusFilter("BELUM_LUNAS")}
              style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "BELUM_LUNAS" ? "#d97706" : "transparent", color: statusFilter === "BELUM_LUNAS" ? "white" : "#475569", boxShadow: statusFilter === "BELUM_LUNAS" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Belum Lunas ({summary?.total_belum_lunas || 0})
            </button>
            <button
              onClick={() => setStatusFilter("TERKUNCI")}
              style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "TERKUNCI" ? "#e11d48" : "transparent", color: statusFilter === "TERKUNCI" ? "white" : "#475569", boxShadow: statusFilter === "TERKUNCI" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Terkunci ({summary?.total_terkunci || 0})
            </button>
            <button
              onClick={() => setStatusFilter("DISPENSASI")}
              style={{ padding: "8px 14px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "DISPENSASI" ? "#ea580c" : "transparent", color: statusFilter === "DISPENSASI" ? "white" : "#475569", boxShadow: statusFilter === "DISPENSASI" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Dispensasi ({summary?.total_dispensasi || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", overflow: "hidden" }}>
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
                  style={{ padding: "8px 16px", borderRadius: "12px", background: "#550000", color: "white", fontWeight: "bold", fontSize: "12px", border: "none", cursor: updatingId !== null ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(85, 0, 0, 0.25)", transition: "background-color 0.2s" }}
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
