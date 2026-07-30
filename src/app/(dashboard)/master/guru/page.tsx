"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Save, Mail, Phone, RefreshCw, BookOpen } from "lucide-react";
import Swal from "sweetalert2";

const formatName = (str: string) => {
  if (!str) return "-";
  return str.split(' ').map(word => {
    if (word.includes('.')) return word; // Biarkan singkatan gelar (misal B.A, S.Pd)
    // Jika semua huruf kapital (misal dari database) atau semua huruf kecil (wahyudi), kita format menjadi Title Case
    if (word === word.toUpperCase() || word === word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  }).join(' ');
};

export default function MasterGuruPage() {
  const [guru, setGuru] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nik: "", nama_lengkap: "", no_hp: "", email: "" });

  const fetchGuru = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/guru");
      const data = await res.json();
      setGuru(data);
    } catch (err) {
      console.error("Gagal memuat data guru:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    Swal.fire({
      title: "Sinkronisasi...",
      text: "Menghubungkan ke database SIMPEG Al-Imam...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch("/api/master/guru/sync", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        await fetchGuru();
        Swal.fire({
          icon: "success",
          title: "Sinkronisasi Berhasil",
          text: data.fallback 
            ? data.message
            : `Berhasil menyinkronkan data. Terupdate/Tambah: ${data.updated}, Terhapus: ${data.deleted}.`,
        });
      } else {
        Swal.fire("Gagal", data.error || "Terjadi kesalahan saat sinkronisasi.", "error");
      }
    } catch (err: any) {
      Swal.fire("Gagal", "Koneksi ke server SIKAP terputus.", "error");
    } finally {
      setIsSyncing(false);
    }
  };



  const handleSave = async () => {
    if (!form.nama_lengkap) {
      Swal.fire("Error", "Nama lengkap wajib diisi", "error");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/master/guru/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          Swal.fire("Berhasil", "Data Guru berhasil diperbarui", "success");
        } else {
          Swal.fire("Gagal", "Gagal memperbarui data", "error");
        }
      } else {
        const res = await fetch("/api/master/guru", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          Swal.fire("Berhasil", "Data Guru berhasil ditambahkan", "success");
        } else {
          Swal.fire("Gagal", "NIK atau Email sudah terdaftar", "error");
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setForm({ nik: "", nama_lengkap: "", no_hp: "", email: "" });
      fetchGuru();
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan server", "error");
    }
  };

  const handleEdit = (g: any) => {
    setForm({ nik: g.nik || "", nama_lengkap: g.nama_lengkap || "", no_hp: g.no_hp || "", email: g.email || "" });
    setEditingId(g.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: "Hapus Data?",
      text: `Anda yakin ingin menghapus ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal"
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/master/guru/${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Terhapus!", "Data guru telah dihapus.", "success");
          fetchGuru();
        } else {
          Swal.fire("Gagal", "Gagal menghapus data", "error");
        }
      } catch (err) {
        Swal.fire("Gagal", "Terjadi kesalahan server", "error");
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-emerald-600" size={32} /> Master Data Guru
          </h1>
          <p className="text-gray-500 mt-1">Registrasi dan kelola staf pengajar (Guru/Musyrif) di Pesantren Al-Imam.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            Sync Data SIMPEG
          </button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) {
                setEditingId(null);
                setForm({ nik: "", nama_lengkap: "", no_hp: "", email: "" });
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            {isAdding ? "Batal" : <><Plus size={18} /> Tambah Guru Baru</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
            {editingId ? "Form Edit Data Guru" : "Form Pendaftaran Guru Baru"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK / Kode Identitas</label>
              <input type="text" value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Kosongkan = Auto Generate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
              <input type="text" value={form.nama_lengkap} onChange={(e) => setForm({...form, nama_lengkap: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Ust. Fulan, Lc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
              <input type="tel" value={form.no_hp} onChange={(e) => setForm({...form, no_hp: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="0812..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Aktif</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="fulan@contoh.com" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2">
              <Save size={18} /> Simpan Data
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Memuat data guru...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guru.map((g) => (
            <div 
              key={g.id} 
              className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 relative flex flex-col gap-4 overflow-hidden"
            >
              {/* Decorative Background Blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-100/40 to-teal-50/10 rounded-full blur-2xl -z-10 group-hover:scale-150 transition-transform duration-500"></div>

              {/* Header: Avatar, Name & Mapel */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                  {formatName(g.nama_lengkap).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <h3 
                    className="font-bold text-slate-800 text-[15px] leading-tight group-hover:text-emerald-700 transition-colors" 
                    title={formatName(g.nama_lengkap)}
                  >
                    {formatName(g.nama_lengkap)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {g.nik || "GURU-NO-ID"}
                    </span>
                    {g.mata_pelajaran && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <BookOpen size={10} />
                        {g.mata_pelajaran}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-slate-100 via-slate-200 to-transparent"></div>

              {/* Contact Info & Actions */}
              <div className="flex items-end justify-between gap-4 mt-auto">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 text-slate-500 group-hover:text-slate-700 transition-colors">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                      <Phone size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <span className="text-xs font-semibold truncate">{g.no_hp || "Belum ada No. HP"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500 group-hover:text-slate-700 transition-colors">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                      <Mail size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <span className="text-xs font-semibold truncate">{g.email || "Belum ada Email"}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => handleEdit(g)} className="p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer group/btn" title="Edit Data">
                    <Edit2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => handleDelete(g.id, g.nama_lengkap)} className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer group/btn" title="Hapus Data">
                    <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
