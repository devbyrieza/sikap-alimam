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
  X
} from "lucide-react";

interface SantriSPPItem {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  jenis_kelamin: string | null;
  kelas_id: string;
  kelas_nama: string;
  jenjang: string;
  spp: {
    id: string | null;
    bulan: number;
    tahun: number;
    nominal: number;
    status: "lunas" | "belum_lunas";
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
  total_terkumpul: number;
  total_tunggakan: number;
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
      }
    } catch (err) {
      console.error("Gagal memuat data SPP:", err);
    } finally {
      setLoading(false);
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
          catatan: item.spp.catatan || "",
        }),
      });
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
          catatan: editCatatan,
        }),
      });
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
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Modul Admin Keuangan
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manajemen Pembayaran SPP Santri
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              Pantau kepatuhan SPP bulanan (jatuh tempo tgl 10) & kendalikan akses gembok portal wali santri secara real-time.
            </p>
          </div>

          {/* Month & Year Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15">
            <button 
              onClick={() => {
                if (selectedBulan === 1) {
                  setSelectedBulan(12);
                  setSelectedTahun(selectedTahun - 1);
                } else {
                  setSelectedBulan(selectedBulan - 1);
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-sm px-2 py-1.5 rounded-lg border border-white/20 outline-none cursor-pointer focus:bg-slate-900"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx} value={idx + 1} className="bg-slate-900 text-white">
                  {nama}
                </option>
              ))}
            </select>

            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-sm px-2 py-1.5 rounded-lg border border-white/20 outline-none cursor-pointer focus:bg-slate-900"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
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
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-emerald-500/40 hover:bg-emerald-500/60 text-emerald-200 transition ml-1"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Date 1-10 Rule Alert Card */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Kebijakan Jatuh Tempo SPP: Tanggal 1 s/d 10 Setiap Bulan
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              Santri yang <strong>belum lunas setelah tanggal 10</strong> otomatis <span className="font-semibold text-rose-700 underline decoration-rose-400">terkunci akses portal rapor & nilainya</span>. 
              Admin Keuangan dapat membuka kunci kapan saja dengan menekan tombol <strong>[Tandai Lunas]</strong> di bawah.
            </p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur border border-amber-200 rounded-xl px-4 py-2 text-right shrink-0">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Status Tanggal Hari Ini</div>
          <div className="text-sm font-black text-amber-950">
            Tgl {todayDate} {NAMA_BULAN[now.getMonth()]} {now.getFullYear()} {isCurrentMonth && (todayDate <= 10 ? "(Masa Pembayaran)" : "(Lewat Batas)")}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Santri</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{summary.total_santri}</div>
            <div className="text-xs text-slate-500 mt-1">Santri aktif terdaftar</div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sudah Lunas</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700 flex items-baseline gap-2">
              {summary.total_lunas} 
              <span className="text-xs font-semibold text-emerald-600">({summary.persentase}%)</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">{formatRupiah(summary.total_terkumpul)}</div>
          </div>

          <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Terkunci / Menunggak</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-700 flex items-baseline gap-2">
              {summary.total_terkunci}
              <span className="text-xs font-semibold text-rose-600">Santri</span>
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1">{formatRupiah(summary.total_tunggakan)} tunggakan</div>
          </div>

          <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Target Bulan Ini</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-extrabold text-blue-900">
              {NAMA_BULAN[selectedBulan - 1]} {selectedTahun}
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">Jatuh tempo: 10 {NAMA_BULAN[selectedBulan - 1]}</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari santri / NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Kelas */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:bg-white"
          >
            <option value="ALL">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("LUNAS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${statusFilter === "LUNAS" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Lunas
            </button>
            <button
              onClick={() => setStatusFilter("BELUM_LUNAS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${statusFilter === "BELUM_LUNAS" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Belum Lunas
            </button>
            <button
              onClick={() => setStatusFilter("TERKUNCI")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${statusFilter === "TERKUNCI" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Terkunci
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Santri & NIS</th>
                <th className="py-3.5 px-4 min-w-[130px]">Kelas</th>
                <th className="py-3.5 px-4 min-w-[140px]">Tagihan SPP</th>
                <th className="py-3.5 px-4 min-w-[140px] text-center">Status Pembayaran</th>
                <th className="py-3.5 px-4 min-w-[160px] text-center">Akses Portal Wali</th>
                <th className="py-3.5 px-4 min-w-[140px]">Tgl Bayar</th>
                <th className="py-3.5 px-4 min-w-[160px] text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Memuat data status SPP santri...</span>
                    </div>
                  </td>
                </tr>
              ) : santriList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data santri yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                santriList.map((item, idx) => {
                  const isLunas = item.spp.status === "lunas";
                  const isTerkunci = item.spp.lock_status === "TERKUNCI";
                  const isTenggang = item.spp.lock_status === "TENGGANG";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{item.nama_lengkap}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NIS: {item.nis || "-"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {item.kelas_nama}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {formatRupiah(item.spp.nominal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> LUNAS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> BELUM BAYAR
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                            <Unlock className="w-3 h-3 text-emerald-600" /> Terbuka Penuh
                          </span>
                        ) : isTenggang ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/60" title="Akses dibuka hingga tgl 10">
                            <Clock className="w-3 h-3 text-blue-600" /> Masa Tenggang (Tgl 1-10)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200/60 animate-pulse">
                            <Lock className="w-3 h-3 text-rose-600" /> Terkunci Otomatis
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {item.spp.tanggal_bayar ? (
                          <div>
                            <div className="font-semibold text-slate-800">{item.spp.tanggal_bayar}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{item.spp.metode_bayar}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={updatingId === item.id}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-sm ${
                              isLunas 
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                            }`}
                          >
                            {updatingId === item.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isLunas ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Batal Lunas
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Lunas
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Edit Rincian / Catatan Pembayaran"
                          >
                            <Edit className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Edit Rincian SPP</h3>
                <p className="text-xs text-slate-500">{editModalSantri.nama_lengkap} ({editModalSantri.kelas_nama})</p>
              </div>
              <button 
                onClick={() => setEditModalSantri(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bulan & Tahun</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${NAMA_BULAN[selectedBulan - 1]} ${selectedTahun}`} 
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Tagihan (Rp)</label>
                <input 
                  type="number" 
                  value={editNominal}
                  onChange={(e) => setEditNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Pembayaran</label>
                <input 
                  type="date" 
                  value={editTglBayar}
                  onChange={(e) => setEditTglBayar(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                <select
                  value={editMetode}
                  onChange={(e) => setEditMetode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="transfer">Transfer Bank (BSI / Mandiri)</option>
                  <option value="tunai">Tunai / Cash Bendahara</option>
                  <option value="beasiswa">Beasiswa / Keringanan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Keuangan (Opsional)</label>
                <textarea 
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Misal: Sudah transfer via rekening BSI atas nama Ayah..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditModalSantri(null)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDetail}
                disabled={updatingId !== null}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {updatingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
