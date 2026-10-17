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
  MessageSquare
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

  // Verifikasi Konfirmasi Pembayaran dari Wali Santri (1-Click Approval)
  async function handleVerifyPending(item: any) {
    setVerifyingId(item.id);
    try {
      const res = await fetch("/api/keuangan/spp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: item.santri_id,
          bulan: item.bulan,
          tahun: item.tahun,
          status: "lunas",
          nominal: item.nominal,
          tanggal_bayar: new Date().toISOString().split("T")[0],
          metode_bayar: item.metode_bayar || "transfer",
          catatan: item.catatan ? `${item.catatan} (Diverifikasi Keuangan)` : "Diverifikasi Keuangan via antrean konfirmasi"
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Pembayaran Diverifikasi & Lunas!",
          text: `SPP ananda ${item.santri?.nama_lengkap} bulan ${NAMA_BULAN[item.bulan - 1]} ${item.tahun} resmi dicatat LUNAS. Akses portal wali telah dibuka penuh.`,
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
      {/* Header Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        color: "white",
        flexWrap: "wrap",
        gap: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: "bold", width: "fit-content" }}>
            <Sparkles className="w-3.5 h-3.5" /> Modul Admin Keuangan
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
            Manajemen Pembayaran SPP Santri
          </h1>
          <p style={{ color: "#cbd5e1", margin: 0, fontSize: "14px", maxWidth: "600px" }}>
            Pantau kepatuhan SPP bulanan (jatuh tempo tgl 10) & kendalikan akses gembok portal wali santri secara real-time.
          </p>
        </div>

        {/* Month & Year Switcher Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "8px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)", position: "relative", zIndex: 10 }}>
          <button 
            onClick={() => {
              if (selectedBulan === 1) {
                setSelectedBulan(12);
                setSelectedTahun(selectedTahun - 1);
              } else {
                setSelectedBulan(selectedBulan - 1);
              }
            }}
            style={{ padding: "8px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Bulan Sebelumnya"
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
          </button>

          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(Number(e.target.value))}
            style={{ background: "transparent", color: "white", fontWeight: "bold", fontSize: "14px", padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", outline: "none", cursor: "pointer", height: "32px", display: "flex", alignItems: "center" }}
          >
            {NAMA_BULAN.map((nama, idx) => (
              <option key={idx} value={idx + 1} style={{ background: "#0f172a", color: "white" }}>
                {nama}
              </option>
            ))}
          </select>

          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            style={{ background: "transparent", color: "white", fontWeight: "bold", fontSize: "14px", padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", outline: "none", cursor: "pointer", height: "32px", display: "flex", alignItems: "center" }}
          >
            {[2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr} style={{ background: "#0f172a", color: "white" }}>
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
            style={{ padding: "8px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Bulan Berikutnya"
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>

          <button
            onClick={fetchData}
            style={{ padding: "8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.4)", color: "#a7f3d0", border: "none", cursor: "pointer", marginLeft: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Segarkan Data"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      {/* Antrean Konfirmasi Pembayaran Menunggu Verifikasi */}
      {pendingList.length > 0 && (
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
                  Wali santri telah mengirim bukti transfer / melunasi SPP via portal. Verifikasi penerimaan dana lalu klik tombol <strong>[Setujui &amp; Lunas]</strong> untuk membuka akses portal secara permanen.
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
                        style={{ marginTop: "8px", width: "100%", padding: "6px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        className="hover:bg-slate-100"
                      >
                        <Eye style={{ width: "13px", height: "13px" }} />
                        <span>Lihat Bukti Transfer</span>
                      </button>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleVerifyPending(item)}
                      disabled={verifyingId === item.id}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "12px", background: "#059669", color: "white", fontWeight: "bold", fontSize: "12px", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)" }}
                      className="hover:bg-emerald-700 transition-colors"
                    >
                      {verifyingId === item.id ? (
                        <RefreshCw className="animate-spin" style={{ width: "13px", height: "13px" }} />
                      ) : (
                        <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                      )}
                      <span>Setujui (Lunas)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
            <button
              onClick={() => setStatusFilter("ALL")}
              style={{ padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "ALL" ? "white" : "transparent", color: statusFilter === "ALL" ? "#0f172a" : "#475569", boxShadow: statusFilter === "ALL" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("LUNAS")}
              style={{ padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "LUNAS" ? "#059669" : "transparent", color: statusFilter === "LUNAS" ? "white" : "#475569", boxShadow: statusFilter === "LUNAS" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Lunas
            </button>
            <button
              onClick={() => setStatusFilter("BELUM_LUNAS")}
              style={{ padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "BELUM_LUNAS" ? "#d97706" : "transparent", color: statusFilter === "BELUM_LUNAS" ? "white" : "#475569", boxShadow: statusFilter === "BELUM_LUNAS" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Belum Lunas
            </button>
            <button
              onClick={() => setStatusFilter("TERKUNCI")}
              style={{ padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "TERKUNCI" ? "#e11d48" : "transparent", color: statusFilter === "TERKUNCI" ? "white" : "#475569", boxShadow: statusFilter === "TERKUNCI" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Terkunci
            </button>
            <button
              onClick={() => setStatusFilter("DISPENSASI")}
              style={{ padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", transition: "all 0.2s", background: statusFilter === "DISPENSASI" ? "#ea580c" : "transparent", color: statusFilter === "DISPENSASI" ? "white" : "#475569", boxShadow: statusFilter === "DISPENSASI" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
            >
              Dispensasi ({summary?.total_dispensasi || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: "white", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>
                <th style={{ padding: "16px 20px", textAlign: "center", width: "48px" }}>No</th>
                <th style={{ padding: "16px 20px", minWidth: "200px" }}>Nama Santri &amp; NIS</th>
                <th style={{ padding: "16px 20px", minWidth: "130px" }}>Kelas</th>
                <th style={{ padding: "16px 20px", minWidth: "140px" }}>Tagihan SPP</th>
                <th style={{ padding: "16px 20px", minWidth: "140px", textAlign: "center" }}>Status Pembayaran</th>
                <th style={{ padding: "16px 20px", minWidth: "160px", textAlign: "center" }}>Akses Portal Wali</th>
                <th style={{ padding: "16px 20px", minWidth: "140px" }}>Tgl Bayar</th>
                <th style={{ padding: "16px 20px", minWidth: "160px", textAlign: "center" }}>Aksi Cepat</th>
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

                  return (
                    <tr key={item.id} className="hover:bg-[#f0fdf4] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "#94a3b8" }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 900, color: "#1e293b", fontSize: "14px" }}>{item.nama_lengkap}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", marginTop: "2px" }}>NIS: {item.nis || "-"}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "8px", background: "#f1f5f9", color: "#1e293b", fontWeight: "bold", fontSize: "11px" }}>
                          {item.kelas_nama}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "bold", color: "#1e293b" }}>
                        {formatRupiah(item.spp.nominal)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        {isLunas ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "#d1fae5", color: "#065f46", fontWeight: 900, fontSize: "11px" }}>
                            <CheckCircle2 style={{ width: "14px", height: "14px", color: "#059669" }} /> LUNAS
                          </span>
                        ) : isMenunggu ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: 900, fontSize: "11px", border: "1px solid #fde68a" }}>
                            <Clock style={{ width: "14px", height: "14px", color: "#d97706" }} className="animate-spin" /> VERIFIKASI WALI
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: 900, fontSize: "11px" }}>
                            <Clock style={{ width: "14px", height: "14px", color: "#d97706" }} /> BELUM BAYAR
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        {item.is_locked_manual ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#fff1f2", color: "#be123c", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(225, 29, 72, 0.3)" }}>
                            <Lock style={{ width: "12px", height: "12px", color: "#e11d48" }} /> Terkunci (Manual Admin)
                          </span>
                        ) : item.is_unlocked_manual ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#fff7ed", color: "#c2410c", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(234, 88, 12, 0.3)" }}>
                            <Unlock style={{ width: "12px", height: "12px", color: "#ea580c" }} /> Terbuka (Dispensasi)
                          </span>
                        ) : isLunas ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#ecfdf5", color: "#047857", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                            <Unlock style={{ width: "12px", height: "12px", color: "#059669" }} /> Terbuka (Lunas)
                          </span>
                        ) : isMenunggu ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#eff6ff", color: "#1d4ed8", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                            <Unlock style={{ width: "12px", height: "12px", color: "#2563eb" }} /> Terbuka (Verifikasi)
                          </span>
                        ) : isTenggang ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#eff6ff", color: "#1d4ed8", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(59, 130, 246, 0.2)" }} title="Akses dibuka hingga tgl 10">
                            <Clock style={{ width: "12px", height: "12px", color: "#2563eb" }} /> Masa Tenggang (Tgl 1-10)
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", background: "#fff1f2", color: "#be123c", fontWeight: "bold", fontSize: "11px", border: "1px solid rgba(225, 29, 72, 0.2)" }} className="animate-pulse">
                            <Lock style={{ width: "12px", height: "12px", color: "#e11d48" }} /> Terkunci Otomatis
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#64748b", fontWeight: 500 }}>
                        {item.spp.tanggal_bayar ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.spp.tanggal_bayar}</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>{item.spp.metode_bayar}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                          {/* 1. Toggle Lunas */}
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={updatingId === item.id}
                            style={{
                              padding: "7px 11px",
                              borderRadius: "10px",
                              fontWeight: "bold",
                              fontSize: "11px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              border: isLunas ? "1px solid #fecdd3" : "none",
                              background: isLunas ? "#fff1f2" : isMenunggu ? "#059669" : "#10b981",
                              color: isLunas ? "#be123c" : "white",
                              boxShadow: isLunas ? "none" : "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                              transition: "all 0.2s"
                            }}
                            className={isLunas ? "hover:bg-rose-100" : isMenunggu ? "hover:bg-emerald-700" : "hover:bg-emerald-600"}
                            title={isLunas ? "Batalkan status lunas" : "Tandai lunas"}
                          >
                            {updatingId === item.id ? (
                              <RefreshCw className="animate-spin" style={{ width: "13px", height: "13px" }} />
                            ) : isLunas ? (
                              <>
                                <XCircle style={{ width: "13px", height: "13px" }} /> Batal Lunas
                              </>
                            ) : (
                              <>
                                <CheckCircle2 style={{ width: "13px", height: "13px" }} /> {isMenunggu ? "Setujui" : "Lunas"}
                              </>
                            )}
                          </button>

                          {/* 2. Tombol Buka / Kunci Akses Portal Wali */}
                          {item.is_unlocked_manual ? (
                            <button
                              onClick={() => handleTogglePortalLock(item, "auto")}
                              disabled={updatingId === item.id}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "10px",
                                fontWeight: "bold",
                                fontSize: "11px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                                border: "1px solid #fed7aa",
                                background: "#fff7ed",
                                color: "#c2410c",
                                transition: "all 0.2s"
                              }}
                              className="hover:bg-amber-100"
                              title="Kembalikan status akses portal ke otomatisasi sistem"
                            >
                              <RefreshCw style={{ width: "13px", height: "13px" }} /> Reset
                            </button>
                          ) : (isTerkunci || item.is_locked_manual) ? (
                            <button
                              onClick={() => handleTogglePortalLock(item, "unlock")}
                              disabled={updatingId === item.id}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "10px",
                                fontWeight: "bold",
                                fontSize: "11px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                                border: "none",
                                background: "#059669",
                                color: "white",
                                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                                transition: "all 0.2s"
                              }}
                              className="hover:bg-emerald-700"
                              title="Buka akses portal wali santri secara manual (beri dispensasi)"
                            >
                              <Unlock style={{ width: "13px", height: "13px" }} /> Buka Akses
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePortalLock(item, "lock")}
                              disabled={updatingId === item.id}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "10px",
                                fontWeight: "bold",
                                fontSize: "11px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                                border: "1px solid #fecdd3",
                                background: "#fff1f2",
                                color: "#be123c",
                                transition: "all 0.2s"
                              }}
                              className="hover:bg-rose-100"
                              title="Kunci akses portal wali santri secara manual"
                            >
                              <Lock style={{ width: "13px", height: "13px" }} /> Kunci
                            </button>
                          )}

                          {/* 3. Tombol Edit Rincian */}
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
