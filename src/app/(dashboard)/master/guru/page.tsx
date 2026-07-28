"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Save, Mail, Phone, RefreshCw, BookOpen } from "lucide-react";
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
            <div key={g.id} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300 group min-h-[290px]">
              <div>
                {/* Header: Avatar & Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-emerald-500/10 shrink-0">
                    {g.nama_lengkap.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug tracking-tight line-clamp-2 group-hover:text-emerald-700 transition-colors" title={g.nama_lengkap}>
                      {g.nama_lengkap}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-1.5 inline-block bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {g.nik || "GURU-NO-ID"}
                    </p>
                  </div>
                </div>

                {/* Mapel / Mengajar */}
                {g.mata_pelajaran && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-100/50 px-2.5 py-1 rounded-xl font-bold shadow-sm shadow-emerald-500/5 mt-1">
                    <BookOpen size={13} className="text-emerald-600" />
                    <span>{g.mata_pelajaran}</span>
                  </div>
                )}
              </div>

              {/* Contact Info & Footer */}
              <div className="mt-4 space-y-4">
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors shrink-0">
                      <Phone size={13} />
                    </div>
                    <span className="text-xs font-semibold truncate">{g.no_hp || "Belum ada No. HP"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors shrink-0">
                      <Mail size={13} />
                    </div>
                    <span className="text-xs font-semibold truncate">{g.email || "Belum ada Email"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100/50 flex justify-end gap-2">
                  <button className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all shadow-sm cursor-pointer" title="Edit Data"><Edit2 size={14} /></button>
                  <button className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all shadow-sm cursor-pointer" title="Hapus Data"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
