"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Save, AlertCircle, Trash2, Calendar, FileText } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QURAN_SURAH, Surah } from "@/lib/quran";
import Swal from "sweetalert2";

export default function TahfidzDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const santriId = params.santri_id as string;
  const initialType = searchParams.get("type") || "ziyadah";

  const [records, setRecords] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState<{
    tanggal: string;
    jenis: string;
    surat_dari: string;
    ayat_dari: number;
    surat_ke: string;
    ayat_ke: string | number;
    halaman: string;
    nilai: string;
    keterangan: string;
  }>({
    tanggal: new Date().toISOString().split("T")[0],
    jenis: initialType,
    surat_dari: "Al-Fatihah",
    ayat_dari: 1,
    surat_ke: "",
    ayat_ke: "",
    halaman: "",
    nilai: "",
    keterangan: ""
  });

  // Derived states for Ayat ranges
  const [suratDariVerses, setSuratDariVerses] = useState<number>(7);
  const [suratKeVerses, setSuratKeVerses] = useState<number>(0);

  // Fetch student info and records
  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tahfidz/mutabaah/${santriId}`);
      const data = await res.json();
      setRecords(data);
      if (data.length > 0) {
        setStudentInfo(data[0].santri);
      } else {
        // Fallback fetch if no records exist yet
        const listRes = await fetch("/api/tahfidz/mutabaah");
        const listData = await listRes.json();
        const found = listData.find((s: any) => s.id === santriId);
        setStudentInfo(found ? { nama_lengkap: found.nama_lengkap, nis: found.nis, kelas: { nama: found.kelas } } : null);
      }
    } catch (err) {
      console.error("Gagal memuat data detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [santriId]);

  // Adjust verse counts when surah changes
  useEffect(() => {
    const s = QURAN_SURAH.find(item => item.name === form.surat_dari);
    setSuratDariVerses(s ? s.numberOfVerses : 7);
    setForm(prev => ({ ...prev, ayat_dari: 1 }));
  }, [form.surat_dari]);

  useEffect(() => {
    if (form.surat_ke) {
      const s = QURAN_SURAH.find(item => item.name === form.surat_ke);
      setSuratKeVerses(s ? s.numberOfVerses : 0);
      setForm(prev => ({ ...prev, ayat_ke: 1 }));
    } else {
      setSuratKeVerses(0);
      setForm(prev => ({ ...prev, ayat_ke: "" }));
    }
  }, [form.surat_ke]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/tahfidz/mutabaah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: santriId,
          ...form,
          ayat_dari: String(form.ayat_dari),
          ayat_ke: form.ayat_ke ? String(form.ayat_ke) : null,
          surat_ke: form.surat_ke || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        await fetchStudentData();
        Swal.fire("Berhasil", "Catatan Tahfidz berhasil disimpan.", "success");
      } else {
        Swal.fire("Gagal", data.error || "Gagal menyimpan.", "error");
      }
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan koneksi.", "error");
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto space-y-6">
      
      {/* Back & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push("/tahfidz/mutabaah")}
          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tahfidz</span>
          <h2 className="text-xl font-bold text-gray-800 leading-tight">Detail Perkembangan Santri</h2>
        </div>
      </div>

      {/* Student Profile Card */}
      {studentInfo && (
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-3xl p-6 text-white shadow-xl shadow-teal-900/10 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-teal-200 font-semibold mb-1">Nama Santri</div>
            <h1 className="text-2xl font-bold">{studentInfo.nama_lengkap}</h1>
            <div className="flex gap-4 mt-2 text-sm text-teal-100/90 font-medium">
              <span>NIS: {studentInfo.nis || "-"}</span>
              <span>•</span>
              <span>Kelas: {studentInfo.kelas?.nama || studentInfo.kelas}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setForm(prev => ({ ...prev, jenis: initialType }));
              setShowModal(true);
            }}
            className="bg-white hover:bg-teal-50 text-teal-800 px-6 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={18} /> Tambah Setoran
          </button>
        </div>
      )}

      {/* History Log */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <FileText className="text-teal-600" size={20} /> Riwayat Mutabaah Tahfidz
          </h3>
          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
            Total Rekaman: {records.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
            <h4 className="font-bold text-gray-700">Belum ada riwayat setoran</h4>
            <p className="text-sm text-gray-400 mt-1">Silakan klik tombol Tambah Setoran untuk mencatat hafalan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/60 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Batas Setoran</th>
                  <th className="px-6 py-4 text-center">Hal</th>
                  <th className="px-6 py-4 text-center">Nilai</th>
                  <th className="px-6 py-4">Catatan / Keterangan</th>
                  <th className="px-6 py-4">Musyrif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {new Date(r.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                        r.jenis === "ziyadah"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : r.jenis === "murojaah"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      } capitalize`}>
                        {r.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {r.surat_dari} (Ayat {r.ayat_dari}) 
                      {r.surat_ke && ` s.d ${r.surat_ke} (Ayat ${r.ayat_ke})`}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{r.halaman || "-"}</td>
                    <td className="px-6 py-4 text-center font-bold text-teal-600">{r.nilai || "-"}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{r.keterangan || "-"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{r.pegawai?.nama_lengkap || "Sistem"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-teal-700 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Catat Mutabaah Tahfidz</h3>
                <p className="text-teal-100 text-xs mt-0.5">Input perkembangan Al-Quran santri</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm capitalize"
                  >
                    <option value="ziyadah">Ziyadah</option>
                    <option value="murojaah">Murojaah</option>
                    <option value="tilawah">Tilawah</option>
                  </select>
                </div>
              </div>

              {/* Start Range */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="col-span-2 text-xs font-bold text-teal-800 uppercase tracking-wide">Batas Mulai (Dari)</div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Surat</label>
                  <select
                    value={form.surat_dari}
                    onChange={(e) => setForm({ ...form, surat_dari: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  >
                    {QURAN_SURAH.map((s) => (
                      <option key={s.number} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ayat</label>
                  <select
                    value={form.ayat_dari}
                    onChange={(e) => setForm({ ...form, ayat_dari: parseInt(e.target.value) })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  >
                    {Array.from({ length: suratDariVerses }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Range (Optional) */}
              <div className="grid grid-cols-2 gap-4 bg-teal-50/30 p-4 rounded-2xl border border-teal-100/30">
                <div className="col-span-2 text-xs font-bold text-teal-800 uppercase tracking-wide">Batas Akhir (Sampai - Opsional)</div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Surat</label>
                  <select
                    value={form.surat_ke}
                    onChange={(e) => setForm({ ...form, surat_ke: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Pilih Surat...</option>
                    {QURAN_SURAH.map((s) => (
                      <option key={s.number} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ayat</label>
                  <select
                    disabled={!form.surat_ke}
                    value={String(form.ayat_ke)}
                    onChange={(e) => setForm({ ...form, ayat_ke: e.target.value ? parseInt(e.target.value) : "" })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">Pilih Ayat...</option>
                    {Array.from({ length: suratKeVerses }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Halaman & Nilai */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Jumlah Halaman</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 2"
                    value={form.halaman}
                    onChange={(e) => setForm({ ...form, halaman: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nilai</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Contoh: 85.5"
                    value={form.nilai}
                    onChange={(e) => setForm({ ...form, nilai: e.target.value })}
                    className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Catatan / Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Ketik catatan di sini..."
                  rows={2}
                  className="w-full rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer text-sm"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
