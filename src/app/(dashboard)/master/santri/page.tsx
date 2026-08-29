"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Printer,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  X,
  Loader2
} from "lucide-react";
import Swal from "sweetalert2";
import NavTabs from "../NavTabs";

interface Santri {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  kelas_id: string;
  jenis_kelamin: string | null;
  foto_url: string | null;
  is_active: boolean;
  status_kesiswaan: "aktif" | "mengundurkan_diri" | "dikeluarkan" | "mutasi" | "lulus";
  tanggal_keluar: string | null;
  alasan_keluar: string | null;
  no_sk_keluar: string | null;
  catatan_keluar: string | null;
  kelas?: { id: string; nama: string; jenjang: string | null };
  halaqoh_anggota?: {
    kelompok?: {
      nama_kelompok: string;
      sesi: string;
      pegawai?: { nama_lengkap: string };
    };
  }[];
}

interface KelasOption {
  id: string;
  nama: string;
  jenjang: string | null;
}

const STATUS_CONFIG = {
  aktif: {
    label: "Aktif",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    color: "#059669"
  },
  dikeluarkan: {
    label: "Dikeluarkan (DO)",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    icon: XCircle,
    color: "#e11d48"
  },
  mengundurkan_diri: {
    label: "Mengundurkan Diri",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    color: "#d97706"
  },
  mutasi: {
    label: "Mutasi Keluar",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: ArrowRightLeft,
    color: "#7c3aed"
  },
  lulus: {
    label: "Lulus (Alumni)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: GraduationCap,
    color: "#2563eb"
  }
};

export default function MasterSantriPage() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    mengundurkan_diri: 0,
    mutasi: 0,
    dikeluarkan: 0
  });

  // Modal State: Ubah Status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedSantriForStatus, setSelectedSantriForStatus] = useState<Santri | null>(null);
  const [statusForm, setStatusForm] = useState({
    status_kesiswaan: "dikeluarkan" as Santri["status_kesiswaan"],
    tanggal_keluar: new Date().toISOString().split("T")[0],
    no_sk_keluar: "",
    alasan_keluar: "",
    catatan_keluar: ""
  });
  const [savingStatus, setSavingStatus] = useState(false);

  // Modal State: Cetak Dokumen / Surat
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedSantriForDoc, setSelectedSantriForDoc] = useState<Santri | null>(null);

  // Body Scroll Lock for Modals (Mandatory UX Rule)
  useEffect(() => {
    if (statusModalOpen || docModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [statusModalOpen, docModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSantri, resKelas] = await Promise.all([
        fetch("/api/master/santri"),
        fetch("/api/master/kelas")
      ]);

      if (resSantri.ok) {
        const json = await resSantri.json();
        setSantriList(json.data || []);
        if (json.stats) setStats(json.stats);
      }

      if (resKelas.ok) {
        const jsonK = await resKelas.json();
        setKelasList(jsonK || []);
      }
    } catch (err) {
      console.error("Gagal memuat data santri:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered List
  const filteredSantri = useMemo(() => {
    return santriList.filter((s) => {
      const matchSearch =
        searchQuery === "" ||
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.includes(searchQuery));

      const matchKelas = selectedKelas === "all" || s.kelas_id === selectedKelas;

      const matchStatus =
        selectedStatus === "all" || s.status_kesiswaan === selectedStatus;

      return matchSearch && matchKelas && matchStatus;
    });
  }, [santriList, searchQuery, selectedKelas, selectedStatus]);

  // Open Ubah Status Modal
  const openStatusModal = (santri: Santri) => {
    setSelectedSantriForStatus(santri);
    setStatusForm({
      status_kesiswaan: (santri.status_kesiswaan === "aktif" ? "dikeluarkan" : santri.status_kesiswaan) as any,
      tanggal_keluar: santri.tanggal_keluar 
        ? new Date(santri.tanggal_keluar).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      no_sk_keluar: santri.no_sk_keluar || (santri.status_kesiswaan === "dikeluarkan" ? "SK/DIR/ALIMAM/2026/088" : ""),
      alasan_keluar: santri.alasan_keluar || "",
      catatan_keluar: santri.catatan_keluar || ""
    });
    setStatusModalOpen(true);
  };

  // Submit Status Change
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriForStatus) return;

    // Confirm dialog
    const isDeactivating = statusForm.status_kesiswaan !== "aktif";
    const result = await Swal.fire({
      title: isDeactivating ? "Konfirmasi Perubahan Status" : "Aktifkan Kembali Santri?",
      html: `
        <div class="text-left text-sm text-slate-600 space-y-2">
          <p>Anda akan mengubah status santri <b>${selectedSantriForStatus.nama_lengkap}</b> menjadi: <span class="font-bold uppercase text-primary-700">${statusForm.status_kesiswaan.replace("_", " ")}</span>.</p>
          ${isDeactivating ? "<p class='p-2.5 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200'><b>Peringatan:</b> Santri ini otomatis dikeluarkan dari jadwal halaqoh harian, absensi kelas, dan tagihan SPP berikutnya akan dihentikan.</p>" : ""}
        </div>
      `,
      icon: isDeactivating ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: isDeactivating ? "#550000" : "#059669",
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-100",
        confirmButton: "rounded-xl font-bold px-5 py-2.5",
        cancelButton: "rounded-xl font-bold px-5 py-2.5"
      }
    });

    if (!result.isConfirmed) return;

    setSavingStatus(true);
    try {
      const res = await fetch("/api/master/santri/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: selectedSantriForStatus.id,
          ...statusForm
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");

      Swal.fire({
        icon: "success",
        title: "Status Berhasil Diperbarui!",
        text: data.message,
        confirmButtonColor: "#550000",
        customClass: { popup: "rounded-2xl shadow-xl" }
      });

      setStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#550000"
      });
    } finally {
      setSavingStatus(false);
    }
  };

  // Open Doc Modal
  const openDocModal = (santri: Santri) => {
    setSelectedSantriForDoc(santri);
    setDocModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner - Platinum Standard */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#550000] via-[#6e0000] to-[#800000] p-6 sm:p-8 text-white shadow-xl shadow-[#550000]/25">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Pusat Data Induk Kesiswaan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Data Santri &amp; Status Kesiswaan
            </h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl leading-relaxed">
              Kelola data pokok santri, pembagian kelas, riwayat halaqoh, serta penanganan status mutasi &amp; pemberhentian santri terintegrasi.
            </p>
          </div>
        </div>

        {/* Decorative Background Icon */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* 2. Navigation Tabs Master Data */}
      <NavTabs />

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Santri</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5">Semua data terdaftar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Santri Aktif</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats.aktif}</div>
          <span className="text-[10px] text-emerald-600/70 mt-0.5">KBM &amp; Halaqoh Aktif</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Dikeluarkan (DO)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{stats.dikeluarkan}</div>
          <span className="text-[10px] text-rose-600/70 mt-0.5">Pelanggaran / SK DO</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Undur Diri</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.mengundurkan_diri}</div>
          <span className="text-[10px] text-amber-600/70 mt-0.5">Permintaan Orang Tua</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Mutasi Keluar</span>
            <ArrowRightLeft className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{stats.mutasi}</div>
          <span className="text-[10px] text-purple-600/70 mt-0.5">Pindah Sekolah Lain</span>
        </div>
      </div>

      {/* 4. Filter & Action Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20 focus:border-[#550000] transition-all"
            />
          </div>

          {/* Kelas Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#550000]/20"
            >
              <option value="all">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama} ({k.jenjang || "MTs"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-bold">
          {[
            { id: "all", label: "Semua Status", count: stats.total },
            { id: "aktif", label: "Aktif", count: stats.aktif },
            { id: "dikeluarkan", label: "Dikeluarkan (DO)", count: stats.dikeluarkan },
            { id: "mengundurkan_diri", label: "Mengundurkan Diri", count: stats.mengundurkan_diri },
            { id: "mutasi", label: "Mutasi Keluar", count: stats.mutasi },
            { id: "lulus", label: "Lulus", count: 0 }
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#550000] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Dense Table of Santri */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Nama Santri &amp; NIS</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">Kelompok Halaqoh</th>
                <th className="px-4 py-3.5 text-center">Status Kesiswaan</th>
                <th className="px-6 py-3.5 text-right">Aksi &amp; Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#550000] mb-2" />
                    <p className="font-semibold text-xs">Memuat data santri...</p>
                  </td>
                </tr>
              ) : filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada data santri ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredSantri.map((santri, index) => {
                  const statusConf = STATUS_CONFIG[santri.status_kesiswaan] || STATUS_CONFIG.aktif;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr
                      key={santri.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        santri.status_kesiswaan === "dikeluarkan" ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-slate-400 font-semibold text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{santri.nama_lengkap}</span>
                          {santri.status_kesiswaan === "dikeluarkan" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                              DO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          NIS: {santri.nis || "-"} • JK: {santri.jenis_kelamin || "L"}
                        </div>
                        {santri.alasan_keluar && (
                          <div className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-rose-100">
                            <b>Ket:</b> {santri.alasan_keluar}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {santri.kelas?.nama || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {santri.halaqoh_anggota && santri.halaqoh_anggota.length > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {santri.halaqoh_anggota[0]?.kelompok?.nama_kelompok || "-"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Pengampu: {santri.halaqoh_anggota[0]?.kelompok?.pegawai?.nama_lengkap || "-"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {santri.is_active ? "Belum dialokasikan" : "Nonaktif (Keluar)"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConf.badgeClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ubah Status Button */}
                          <button
                            type="button"
                            onClick={() => openStatusModal(santri)}
                            className="px-3 py-1.5 bg-[#550000] hover:bg-[#700000] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Ubah Status</span>
                          </button>

                          {/* Print Actions */}
                          {santri.status_kesiswaan !== "aktif" && (
                            <button
                              type="button"
                              onClick={() => openDocModal(santri)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Cetak Surat Keputusan / Surat Keterangan"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Cetak SK</span>
                            </button>
                          )}
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

      {/* 6. MODAL: UBAH STATUS KESISWAAN */}
      {statusModalOpen && selectedSantriForStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain overflow-y-auto custom-scrollbar"
          onClick={() => setStatusModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#550000] to-[#7a0000] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ubah Status Kesiswaan</h3>
                  <p className="text-xs text-white/70">
                    Santri: <b>{selectedSantriForStatus.nama_lengkap}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStatus} className="p-6 space-y-4">
              {/* Pilihan Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Status Baru
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "aktif", label: "Aktif", desc: "Santri kembali aktif KBM" },
                    { id: "dikeluarkan", label: "Dikeluarkan (DO)", desc: "Pelanggaran berat / SK Mudir" },
                    { id: "mengundurkan_diri", label: "Mengundurkan Diri", desc: "Permintaan wali santri" },
                    { id: "mutasi", label: "Mutasi Keluar", desc: "Pindah ke sekolah lain" }
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col ${
                        statusForm.status_kesiswaan === st.id
                          ? "border-[#550000] bg-[#550000]/5 text-[#550000]"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{st.label}</span>
                        <input
                          type="radio"
                          name="status_kesiswaan"
                          value={st.id}
                          checked={statusForm.status_kesiswaan === st.id}
                          onChange={(e) =>
                            setStatusForm({ ...statusForm, status_kesiswaan: e.target.value as any })
                          }
                          className="text-[#550000] focus:ring-[#550000]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{st.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {statusForm.status_kesiswaan !== "aktif" && (
                <>
                  {/* Tanggal Efektif */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tanggal Efektif Keluar
                    </label>
                    <input
                      type="date"
                      value={statusForm.tanggal_keluar}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, tanggal_keluar: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20"
                    />
                  </div>

                  {/* Nomor SK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nomor Surat Keputusan (SK)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SK/DIR/ALIMAM/2026/088"
                      value={statusForm.no_sk_keluar}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, no_sk_keluar: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20"
                    />
                  </div>

                  {/* Alasan Pelanggaran / Keterangan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Alasan / Keterangan Resmi
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Pelanggaran berat sesuai surat perjanjian tata tertib pesantren..."
                      value={statusForm.alasan_keluar}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, alasan_keluar: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#550000]/20"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2.5 bg-[#550000] hover:bg-[#700000] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {savingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: CETAK DOKUMEN SK / MUTASI (PREVIEW SIAP CETAK) */}
      {docModalOpen && selectedSantriForDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain overflow-y-auto custom-scrollbar"
          onClick={() => setDocModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar Modal */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold">Cetak Dokumen Resmi Pesantren</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#550000] hover:bg-[#700000] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-white/70 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper */}
            <div className="p-8 bg-white font-serif text-slate-900 space-y-6 text-sm leading-relaxed" id="printable-area">
              {/* KOP SURAT */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-lg font-bold tracking-wider uppercase">PESANTREN AL-IMAM AL-ISLAMI</h2>
                <p className="text-xs font-sans text-slate-600 mt-0.5">
                  Sistem Informasi &amp; Kepengasuhan Santri (SIKAP) • Akreditasi Pesantren
                </p>
                <p className="text-[11px] font-sans text-slate-500">
                  Jl. Ciremai Raya No. 10, Garut - Jawa Barat | Web: pesantren-alimam.com
                </p>
              </div>

              {/* JUDUL SURAT */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold uppercase underline">
                  {selectedSantriForDoc.status_kesiswaan === "dikeluarkan"
                    ? "SURAT KEPUTUSAN PEMBERHENTIAN SANTRI"
                    : "SURAT KETERANGAN MUTASI / PINDAH SEKOLAH"}
                </h3>
                <p className="text-xs font-sans text-slate-600">
                  Nomor: {selectedSantriForDoc.no_sk_keluar || "SK/DIR/ALIMAM/2026/088"}
                </p>
              </div>

              {/* ISI SURAT */}
              <div className="space-y-3 font-sans text-xs">
                <p>
                  Yang bertanda tangan di bawah ini, Pimpinan / Mudir Pesantren Al-Imam Al-Islami menerangkan bahwa:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-bold text-slate-900">: {selectedSantriForDoc.nama_lengkap}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nomor Induk Santri (NIS)</span>
                    <span className="col-span-2 font-bold text-slate-900">: {selectedSantriForDoc.nis || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jenjang / Kelas Terakhir</span>
                    <span className="col-span-2 text-slate-900">: {selectedSantriForDoc.kelas?.nama || "I'dad Lughowy (IL)"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Tanggal Efektif</span>
                    <span className="col-span-2 text-slate-900">
                      : {selectedSantriForDoc.tanggal_keluar ? new Date(selectedSantriForDoc.tanggal_keluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Alasan Keterangan</span>
                    <span className="col-span-2 font-semibold text-rose-700">
                      : {selectedSantriForDoc.alasan_keluar || "Pelanggaran berat sesuai surat perjanjian pesantren."}
                    </span>
                  </div>
                </div>

                <p className="leading-relaxed">
                  Terhitung sejak tanggal ditetapkannya surat keputusan ini, santri yang bersangkutan dinyatakan resmi{" "}
                  <b>
                    {selectedSantriForDoc.status_kesiswaan === "dikeluarkan" ? "DIKELUARKAN" : "MUTASI KELUAR"}
                  </b>{" "}
                  dari Pesantren Al-Imam Al-Islami dan tidak lagi memiliki hak serta kewajiban sebagai santri aktif.
                </p>

                <p className="leading-relaxed">
                  Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* TANDA TANGAN */}
              <div className="pt-8 flex justify-end font-sans text-xs">
                <div className="text-center w-56 space-y-12">
                  <p>
                    Garut, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    <br />
                    Mudir Pesantren Al-Imam,
                  </p>
                  <div>
                    <p className="font-bold underline">Ust. Wahab Rajasam, M.Pd.</p>
                    <p className="text-slate-500 text-[10px]">NIP. 198001012026011001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
