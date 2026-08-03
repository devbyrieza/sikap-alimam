"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Trash2, Edit2, Save, X, Filter, Sparkles, Layers, Tag, RefreshCw, CheckCircle2, Book } from "lucide-react";
import Swal from "sweetalert2";

interface KelasItem {
  id: string;
  nama: string;
  jenjang: string | null;
}

interface MapelItem {
  id: string;
  nama: string;
  nama_arab: string | null;
  kategori: string;
  kelas_id: string;
  is_active: boolean;
  kelas: KelasItem;
}

export default function MasterMapelPage() {
  const [mapel, setMapel] = useState<MapelItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filter State
  const [activeKelasTab, setActiveKelasTab] = useState<string>("all"); // "all" | "7 MTs" | "IL"
  const [filterKategori, setFilterKategori] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
  const [editForm, setEditForm] = useState({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mapelRes, kelasRes] = await Promise.all([
        fetch("/api/master/mapel"),
        fetch("/api/master/kelas"),
      ]);

      const mapelData = await mapelRes.json();
      const kelasData = await kelasRes.json();

      if (mapelData.mapel) setMapel(mapelData.mapel);
      if (kelasData.kelas) setKelasList(kelasData.kelas);
    } catch (err) {
      console.error("Gagal memuat data mapel/kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncKurikulum = async () => {
    const confirm = await Swal.fire({
      title: "Sinkronkan Kurikulum Ust Aziz?",
      text: "Sistem akan memastikan seluruh mapel standar Kelas 7 MTs dan Kelas IL terdaftar dan aktif secara terpisah di database.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#b45309",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Sinkronkan Sekarang",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/setup-db/cleanup-kelas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal sinkronisasi");

      await Swal.fire({
        icon: "success",
        title: "Sinkronisasi Berhasil!",
        text: "Kurikulum resmi Ustadz Aziz untuk 7 MTs dan IL berhasil disinkronkan ke database.",
        confirmButtonColor: "#b45309",
      });
      fetchData();
    } catch (err: any) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    if (!form.nama.trim() || !form.kelas_id) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama Mata Pelajaran dan Tingkat Kelas wajib diisi.",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/master/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftarkan mata pelajaran");
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Mata Pelajaran "${form.nama}" berhasil didaftarkan!`,
        confirmButtonColor: "#7c1010",
      });

      setForm({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#7c1010",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (m: MapelItem) => {
    setEditingId(m.id);
    setEditForm({
      nama: m.nama,
      nama_arab: m.nama_arab || "",
      kategori: m.kategori || "umum",
      kelas_id: m.kelas_id,
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.nama.trim() || !editForm.kelas_id) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama mapel dan kelas tidak boleh kosong.",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/master/mapel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data");
      }

      Swal.fire({
        icon: "success",
        title: "Tersimpan",
        text: "Perubahan mata pelajaran berhasil disimpan.",
        confirmButtonColor: "#7c1010",
        timer: 1500,
        showConfirmButton: false,
      });
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#7c1010",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: MapelItem) => {
    const result = await Swal.fire({
      title: `Hapus Mapel ${m.nama}?`,
      text: `Mata pelajaran kelas ${m.kelas?.nama} akan dihapus/dinonaktifkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/master/mapel/${m.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        Swal.fire({
          icon: "success",
          title: "Selesai",
          text: data.message || "Mata pelajaran berhasil dihapus.",
          confirmButtonColor: "#7c1010",
        });
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.message, "error");
      }
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case "syariah":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ilmu Syari'ah
          </span>
        );
      case "bahasa":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Bahasa Arab
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Ilmu Umum
          </span>
        );
    }
  };

  // Filter mapel list based on active tab, category, and search query
  const filteredMapel = useMemo(() => {
    return mapel.filter((m) => {
      const kelasName = m.kelas?.nama || "";
      if (activeKelasTab === "7 MTs" && kelasName !== "7 MTs") return false;
      if (activeKelasTab === "IL" && kelasName !== "IL" && kelasName !== "I'dad Lughowy") return false;
      if (filterKategori && m.kategori !== filterKategori) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNama = m.nama.toLowerCase().includes(q);
        const matchArab = m.nama_arab?.toLowerCase().includes(q);
        if (!matchNama && !matchArab) return false;
      }
      return true;
    });
  }, [mapel, activeKelasTab, filterKategori, searchQuery]);

  // Statistics
  const count7MTs = mapel.filter((m) => m.kelas?.nama === "7 MTs").length;
  const countIL = mapel.filter((m) => m.kelas?.nama === "IL" || m.kelas?.nama === "I'dad Lughowy").length;

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-900 rounded-3xl p-8 text-white shadow-xl shadow-amber-900/20 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={30} className="text-amber-300" />
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Master Mata Pelajaran Terpisah (7 MTs &amp; IL)
            </h1>
          </div>
          <p className="text-amber-100 text-sm max-w-2xl">
            Pemisahan kurikulum resmi (Revisi 31 Juli 2026 - Ust. Aziz). Kelola mata pelajaran khusus Kelas 7 MTs dan Kelas IL secara independen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncKurikulum}
            disabled={syncing}
            className="bg-amber-900/60 hover:bg-amber-900/90 text-amber-100 border border-amber-400/30 font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 text-xs sm:text-sm transition-all"
            title="Sinkronkan daftar mapel dengan standar kurikulum resmi Ust Aziz"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sinkronisasi..." : "Sinkron Kurikulum Ust Aziz"}
          </button>

          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
            }}
            className="bg-white hover:bg-amber-50 text-amber-900 font-extrabold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs sm:text-sm transition-all"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? "Tutup Form" : "Tambah Mapel"}
          </button>
        </div>
      </div>

      {/* Tabs Pemisahan Kelas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveKelasTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeKelasTab === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Semua Kelas</span>
            <span className="bg-white/20 text-current px-1.5 py-0.5 rounded-full text-[10px]">
              {mapel.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveKelasTab("7 MTs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeKelasTab === "7 MTs"
                ? "bg-sky-700 text-white shadow-sm"
                : "bg-sky-50 text-sky-800 hover:bg-sky-100"
            }`}
          >
            <span className="flex items-center gap-1"><Book size={14} /> Khusus 7 MTs</span>
            <span className="bg-white/20 text-current px-1.5 py-0.5 rounded-full text-[10px]">
              {count7MTs}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveKelasTab("IL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeKelasTab === "IL"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <span className="flex items-center gap-1"><BookOpen size={14} /> Khusus IL (I&apos;dad Lughowy)</span>
            <span className="bg-white/20 text-current px-1.5 py-0.5 rounded-full text-[10px]">
              {countIL}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold px-2">
          Menampilkan {filteredMapel.length} mata pelajaran
        </div>
      </div>

      {/* Form Tambah Mapel */}
      {isAdding && (
        <div className="bg-amber-50/70 border-2 border-amber-300 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-700" />
            <h3 className="text-base font-bold text-amber-900">
              Pendaftaran Mata Pelajaran Baru (Admin Super)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Mata Pelajaran *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/30 outline-none"
                placeholder="Contoh: Fiqh, Nahwu, IPA"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Arab (Untuk Cetak Rapor)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/30 outline-none font-arabic text-right"
                dir="rtl"
                placeholder="الفقه"
                value={form.nama_arab}
                onChange={(e) => setForm({ ...form, nama_arab: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kelompok / Kategori *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/30 outline-none cursor-pointer"
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                <option value="syariah">Ilmu Syari'ah</option>
                <option value="bahasa">Ilmu Bahasa Arab</option>
                <option value="umum">Ilmu Pengetahuan Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Kelas Pengampu *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/30 outline-none cursor-pointer"
                value={form.kelas_id}
                onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} {k.jenjang ? `(${k.jenjang})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {submitting ? "Menyimpan..." : "Simpan Mata Pelajaran"}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-700 mb-1">Cari Nama Mapel</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="Ketik nama mapel / Arab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="min-w-[180px]">
          <label className="block text-xs font-bold text-slate-700 mb-1">Filter Kategori</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/30 bg-white cursor-pointer"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="syariah">Ilmu Syari'ah</option>
            <option value="bahasa">Ilmu Bahasa Arab</option>
            <option value="umum">Ilmu Pengetahuan Umum</option>
          </select>
        </div>

        {(searchQuery || filterKategori || activeKelasTab !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterKategori("");
              setActiveKelasTab("all");
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3"></div>
            Memuat data mata pelajaran...
          </div>
        ) : filteredMapel.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ada data mata pelajaran yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">No</th>
                  <th className="px-5 py-4">Mata Pelajaran</th>
                  <th className="px-5 py-4 text-right">Nama Arab (Rapor)</th>
                  <th className="px-5 py-4 text-center">Kelompok / Kategori</th>
                  <th className="px-5 py-4 text-center">Tingkat Kelas</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMapel.map((m, idx) => {
                  const isEditing = editingId === m.id;
                  const is7MTs = m.kelas?.nama === "7 MTs";

                  return (
                    <tr key={m.id} className={`hover:bg-amber-50/30 transition-colors ${isEditing ? "bg-amber-50/60" : ""}`}>
                      <td className="px-5 py-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                            value={editForm.nama}
                            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                          />
                        ) : (
                          <span className="font-bold text-slate-800">
                            {m.nama}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="text"
                            dir="rtl"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-arabic text-right"
                            value={editForm.nama_arab}
                            onChange={(e) => setEditForm({ ...editForm, nama_arab: e.target.value })}
                          />
                        ) : (
                          <span className="font-arabic text-base text-amber-900 font-semibold">
                            {m.nama_arab || "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {isEditing ? (
                          <select
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                            value={editForm.kategori}
                            onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                          >
                            <option value="syariah">Ilmu Syari'ah</option>
                            <option value="bahasa">Ilmu Bahasa Arab</option>
                            <option value="umum">Ilmu Pengetahuan Umum</option>
                          </select>
                        ) : (
                          getKategoriBadge(m.kategori)
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {isEditing ? (
                          <select
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                            value={editForm.kelas_id}
                            onChange={(e) => setEditForm({ ...editForm, kelas_id: e.target.value })}
                          >
                            {kelasList.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.nama}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black border ${
                              is7MTs
                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {m.kelas?.nama || "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(m.id)}
                              disabled={submitting}
                              className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800 flex items-center gap-1 shadow-sm"
                            >
                              <Save size={14} /> Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Mapel"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Mapel"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
