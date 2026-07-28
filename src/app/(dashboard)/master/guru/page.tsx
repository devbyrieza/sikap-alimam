"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Save, Mail, Phone, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

export default function MasterGuruPage() {
  const [guru, setGuru] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
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

  const handleSave = () => {
    if (!form.nama_lengkap) {
      Swal.fire("Error", "Nama lengkap wajib diisi", "error");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      nik: form.nik || `GURU-${Date.now()}`,
      nama_lengkap: form.nama_lengkap,
      no_hp: form.no_hp,
      email: form.email,
    };

    setGuru([...guru, newEntry]);
    setIsAdding(false);
    setForm({ nik: "", nama_lengkap: "", no_hp: "", email: "" });
    Swal.fire("Berhasil", "Data Guru berhasil ditambahkan", "success");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-emerald-600" size={32} /> Master Data Asatidz
          </h1>
          <p className="text-gray-500 mt-1">Registrasi dan kelola staf pengajar (Guru/Musyrif) di Pesantren Al-Imam.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            Sync dari SIMPEG
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all"
          >
            {isAdding ? "Batal" : <><Plus size={18} /> Tambah Guru Baru</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Form Pendaftaran Asatidz Baru</h3>
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
        <div className="text-center py-10">Memuat data asatidz...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guru.map((g) => (
            <div key={g.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                    {g.nama_lengkap.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{g.nama_lengkap}</h3>
                    <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{g.nik}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  {g.no_hp || "Belum ada No. HP"}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  {g.email || "Belum ada Email"}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
