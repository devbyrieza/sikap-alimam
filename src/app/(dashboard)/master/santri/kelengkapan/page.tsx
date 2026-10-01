"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Search, Loader2, Save, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface SantriData {
  id: string;
  nis: string | null;
  nama_lengkap: string;
  tanggal_lahir: string | null;
  kelas?: { nama: string };
}

export default function KelengkapanSantriPage() {
  const [data, setData] = useState<SantriData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "missing_nis" | "missing_tgl" | "missing_both">("all");
  
  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNis, setEditNis] = useState("");
  const [editTgl, setEditTgl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/santri/kelengkapan");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(s => {
      const matchSearch = s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || 
                          (s.nis && s.nis.includes(search));
      if (!matchSearch) return false;

      const hasNis = !!s.nis;
      const hasTgl = !!s.tanggal_lahir;

      if (filterMode === "missing_nis") return !hasNis;
      if (filterMode === "missing_tgl") return !hasTgl;
      if (filterMode === "missing_both") return !hasNis && !hasTgl;
      return true;
    });
  }, [data, search, filterMode]);

  const stats = useMemo(() => {
    const total = data.length;
    let missingNis = 0;
    let missingTgl = 0;
    data.forEach(s => {
      if (!s.nis) missingNis++;
      if (!s.tanggal_lahir) missingTgl++;
    });
    return { total, missingNis, missingTgl };
  }, [data]);

  const handleEdit = (s: SantriData) => {
    setEditingId(s.id);
    setEditNis(s.nis || "");
    setEditTgl(s.tanggal_lahir ? new Date(s.tanggal_lahir).toISOString().split('T')[0] : "");
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/master/santri/kelengkapan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nis: editNis, tanggal_lahir: editTgl || null })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      
      setData(prev => prev.map(s => s.id === id ? { ...s, nis: json.data.nis, tanggal_lahir: json.data.tanggal_lahir } : s));
      setEditingId(null);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.message, confirmButtonColor: "#550000" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
          boxShadow: "0 20px 40px -10px rgba(85,0,0,0.3)"
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-90 text-sm font-medium">
              <Link href="/master/santri" className="hover:underline flex items-center gap-1">
                <ArrowLeft size={16} /> Kembali ke Master Data
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Audit Kelengkapan Data</h1>
            <p className="text-white/80 font-medium max-w-xl leading-relaxed text-sm md:text-base">
              Lengkapi data NIS dan Tanggal Lahir (DDMMYY) yang digunakan sebagai kredensial login default bagi Wali Santri.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[200px]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Total Santri</p>
                <p className="text-2xl font-black">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => setFilterMode(filterMode === "missing_nis" ? "all" : "missing_nis")}
          className={\`cursor-pointer p-5 rounded-2xl border transition-all \${filterMode === "missing_nis" ? "bg-red-50 border-red-200 shadow-md" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}\`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Tanpa NIS</p>
              <h3 className="text-2xl font-black text-red-600">{stats.missingNis} <span className="text-sm font-medium text-gray-400">santri</span></h3>
            </div>
            <AlertCircle className="text-red-400" size={32} />
          </div>
        </div>
        
        <div 
          onClick={() => setFilterMode(filterMode === "missing_tgl" ? "all" : "missing_tgl")}
          className={\`cursor-pointer p-5 rounded-2xl border transition-all \${filterMode === "missing_tgl" ? "bg-amber-50 border-amber-200 shadow-md" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}\`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Tanpa Tanggal Lahir</p>
              <h3 className="text-2xl font-black text-amber-600">{stats.missingTgl} <span className="text-sm font-medium text-gray-400">santri</span></h3>
            </div>
            <AlertCircle className="text-amber-400" size={32} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:border-red-800"
          >
            <option value="all">Semua Santri</option>
            <option value="missing_nis">Tanpa NIS</option>
            <option value="missing_tgl">Tanpa Tgl Lahir</option>
            <option value="missing_both">Tanpa Keduanya</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-800" />
            <p>Memuat data santri...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-lg">Semua data sudah lengkap atau tidak ada kecocokan pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nama Santri</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">NIS</th>
                  <th className="px-6 py-4">Tanggal Lahir</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{s.nama_lengkap}</td>
                    <td className="px-6 py-4 text-gray-600">{s.kelas?.nama}</td>
                    <td className="px-6 py-4">
                      {editingId === s.id ? (
                        <input
                          type="text"
                          value={editNis}
                          onChange={(e) => setEditNis(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:border-red-800"
                          placeholder="NIS"
                        />
                      ) : (
                        <span className={s.nis ? "text-gray-900 font-medium" : "text-red-500 font-medium bg-red-50 px-2 py-1 rounded"}>
                          {s.nis || "BELUM ADA"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === s.id ? (
                        <input
                          type="date"
                          value={editTgl}
                          onChange={(e) => setEditTgl(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-800"
                        />
                      ) : (
                        <span className={s.tanggal_lahir ? "text-gray-900 font-medium" : "text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded"}>
                          {s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : "BELUM ADA"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === s.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors">Batal</button>
                          <button onClick={() => handleSave(s.id)} disabled={saving} className="px-3 py-1.5 bg-[#550000] text-white rounded-lg font-medium hover:bg-[#7a0000] transition-colors flex items-center gap-1">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(s)} className="px-4 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors text-xs">
                          Edit Data
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
