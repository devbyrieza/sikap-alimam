"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Edit2, Save } from "lucide-react";
import Swal from "sweetalert2";

export default function MasterSesiPage() {
  const [sesi, setSesi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ jam_ke: "", waktu_mulai: "", waktu_selesai: "", durasi_menit: "40" });

  useEffect(() => {
    // Mock Fetching initial data
    setLoading(true);
    setTimeout(() => {
      setSesi([
        { id: "1", jam_ke: 1, waktu_mulai: "04:50", waktu_selesai: "05:30", durasi_menit: 40 },
        { id: "2", jam_ke: 2, waktu_mulai: "05:30", waktu_selesai: "06:10", durasi_menit: 40 },
        { id: "3", jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", durasi_menit: 40 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = () => {
    if (!form.jam_ke || !form.waktu_mulai || !form.waktu_selesai) {
      Swal.fire("Error", "Semua kolom wajib diisi", "error");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      jam_ke: parseInt(form.jam_ke),
      waktu_mulai: form.waktu_mulai,
      waktu_selesai: form.waktu_selesai,
      durasi_menit: parseInt(form.durasi_menit),
    };

    setSesi([...sesi, newEntry].sort((a, b) => a.jam_ke - b.jam_ke));
    setIsAdding(false);
    setForm({ jam_ke: "", waktu_mulai: "", waktu_selesai: "", durasi_menit: "40" });
    Swal.fire("Berhasil", "Sesi jam pelajaran berhasil ditambahkan", "success");
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Hapus Sesi?",
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        setSesi(sesi.filter((s) => s.id !== id));
        Swal.fire("Terhapus!", "Sesi berhasil dihapus.", "success");
      }
    });
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-blue-600" size={28} /> Master Sesi Waktu
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">Kelola slot jam pelajaran KBM per harinya secara dinamis.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 text-xs sm:text-sm transition-all"
        >
          {isAdding ? "Batal" : <><Plus size={16} /> Tambah Sesi</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-md mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Form Tambah Sesi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Ke-</label>
              <input type="number" value={form.jam_ke} onChange={(e) => setForm({...form, jam_ke: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="Misal: 11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
              <input type="time" value={form.waktu_mulai} onChange={(e) => setForm({...form, waktu_mulai: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai</label>
              <input type="time" value={form.waktu_selesai} onChange={(e) => setForm({...form, waktu_selesai: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
              <input type="number" value={form.durasi_menit} onChange={(e) => setForm({...form, durasi_menit: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
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
        <div className="text-center py-10">Memuat data...</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jam Ke</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rentang Waktu</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Durasi</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sesi.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full font-bold">Sesi {s.jam_ke}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold font-mono">
                    {s.waktu_mulai} - {s.waktu_selesai}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500 font-medium">
                    {s.durasi_menit} Menit
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-amber-500 hover:text-amber-700 mx-2 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
