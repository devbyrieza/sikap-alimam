"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Edit2, Save, Tags } from "lucide-react";
import Swal from "sweetalert2";

export default function MasterMapelPage() {
  const [mapel, setMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMapel([
        { id: "1", nama: "Aqidah", nama_arab: "العقيدة", kategori: "syariah", kelas: { nama: "7 MTs" } },
        { id: "2", nama: "Shorf", nama_arab: "الصرف", kategori: "bahasa", kelas: { nama: "7 MTs" } },
        { id: "3", nama: "Matematika", nama_arab: "الرياضيات", kategori: "umum", kelas: { nama: "7 MTs" } },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = () => {
    if (!form.nama || !form.kelas_id) {
      Swal.fire("Error", "Nama Mapel dan Kelas wajib diisi", "error");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      nama: form.nama,
      nama_arab: form.nama_arab,
      kategori: form.kategori,
      kelas: { nama: form.kelas_id === "7" ? "7 MTs" : "I'dad Lughowy" }
    };

    setMapel([...mapel, newEntry]);
    setIsAdding(false);
    setForm({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
    Swal.fire("Berhasil", "Mata Pelajaran baru berhasil didaftarkan", "success");
  };

  const getKategoriBadge = (kategori: string) => {
    switch(kategori) {
      case 'syariah': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ilmu Syari'ah</span>;
      case 'bahasa': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ilmu Bahasa</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ilmu Umum</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-amber-600" size={32} /> Master Mata Pelajaran
          </h1>
          <p className="text-gray-500 mt-1">Kelola daftar mata pelajaran, kategori (Diniyah/Umum), dan nama terjemahan Arab.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-all"
        >
          {isAdding ? "Batal" : <><Plus size={18} /> Tambah Mapel</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-md mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Form Pendaftaran Mapel Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran</label>
              <input type="text" value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500" placeholder="Contoh: Fiqh" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Arab (Untuk Cetak Rapor)</label>
              <input type="text" value={form.nama_arab} onChange={(e) => setForm({...form, nama_arab: e.target.value})} dir="rtl" className="w-full rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500 font-arabic text-lg" placeholder="الفقه" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Kelompok)</label>
              <select value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <option value="syariah">Ilmu Syari'ah</option>
                <option value="bahasa">Ilmu Bahasa Arab</option>
                <option value="umum">Ilmu Pengetahuan Umum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kelas</label>
              <select value={form.kelas_id} onChange={(e) => setForm({...form, kelas_id: e.target.value})} className="w-full rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                <option value="">-- Pilih Kelas --</option>
                <option value="7">7 MTs</option>
                <option value="IL">I'dad Lughowy</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2">
              <Save size={18} /> Simpan Data
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Memuat data Mapel...</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Mata Pelajaran (Arab)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas Terdaftar</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mapel.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-800">{m.nama}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="font-bold text-gray-800 font-arabic text-xl" dir="rtl">{m.nama_arab || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getKategoriBadge(m.kategori)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold border border-gray-200">
                      {m.kelas.nama}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-amber-500 hover:text-amber-700 mx-2 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
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
