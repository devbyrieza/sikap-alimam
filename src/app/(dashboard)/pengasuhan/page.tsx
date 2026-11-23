"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Home, 
  UserCheck, 
  Award, 
  Save, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  HeartHandshake, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Edit3, 
  ChevronRight,
  Printer
} from "lucide-react";
import Link from "next/link";
import { RaporPengasuhanData, hitungNilaiAkhir, getPredikatArab } from "@/lib/pengasuhanData";

export default function PengasuhanPage() {
  const [santriList, setSantriList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null);
  const [formData, setFormData] = useState<RaporPengasuhanData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchSantri();
  }, []);

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pengasuhan");
      const json = await res.json();
      if (json.success) {
        setSantriList(json.santri || []);
      }
    } catch (err) {
      console.error("Gagal load santri pengasuhan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = async (santri: any) => {
    setSelectedSantri(santri);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pengasuhan?santri_id=${santri.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(json.data);
      }
    } catch (err) {
      console.error("Gagal load detail penilaian:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleScoreChange = (aspekKey: "ibadah_akhlaq" | "kemandirian" | "penampilan_kerapihan", predikat: "Sangat Baik" | "Baik" | "Cukup Baik" | "Kurang Baik") => {
    if (!formData) return;

    let skor = 21;
    let tindak_lanjut = "Perlu ada peningkatan";

    if (predikat === "Sangat Baik") {
      skor = 24;
      tindak_lanjut = "Pertahankan dan tingkatkan keteladanan";
    } else if (predikat === "Baik") {
      skor = 21;
      tindak_lanjut = "Pertahankan dan perbanyak inisiatif positif";
    } else if (predikat === "Cukup Baik") {
      skor = 18;
      tindak_lanjut = "Perlu beberapa perbaikan dan pembiasaan";
    } else {
      skor = 15;
      tindak_lanjut = "Perlu perbaikan secara menyeluruh";
    }

    const updatedAspek = {
      ...formData.aspek[aspekKey],
      predikat,
      predikat_arab: getPredikatArab(predikat),
      tindak_lanjut,
      skor,
    };

    const newFormData = {
      ...formData,
      aspek: {
        ...formData.aspek,
        [aspekKey]: updatedAspek,
      },
    };

    const calc = hitungNilaiAkhir(
      aspekKey === "ibadah_akhlaq" ? skor : newFormData.aspek.ibadah_akhlaq.skor,
      aspekKey === "kemandirian" ? skor : newFormData.aspek.kemandirian.skor,
      aspekKey === "penampilan_kerapihan" ? skor : newFormData.aspek.penampilan_kerapihan.skor,
      newFormData.aspek.kedisiplinan.skor
    );

    setFormData({
      ...newFormData,
      total_skor: calc.total,
      nilai_huruf: calc.nilai_huruf,
      predikat_umum: calc.predikat_umum,
      predikat_umum_arab: calc.predikat_umum_arab,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setSaving(true);
      const res = await fetch("/api/pengasuhan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setNotification({ type: "success", message: `Penilaian pengasuhan ${selectedSantri.nama} berhasil disimpan!` });
        setTimeout(() => setNotification(null), 4000);
        setSelectedSantri(null);
        fetchSantri();
      } else {
        throw new Error(json.error || "Gagal menyimpan");
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Gagal menyimpan penilaian" });
    } finally {
      setSaving(false);
    }
  };

  const filteredSantri = santriList.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kamar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.gedung.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Manajemen Pengasuhan & Asrama
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Penilaian Rapor Pengasuhan (Bagian 3)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Form penilaian karakter, ibadah, kemandirian, dan adab santri oleh Musyrif Asrama (Format Resmi Ulul Albaab).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Total Santri Terdaftar</p>
              <p className="text-sm font-black text-emerald-950">{santriList.length} Santri</p>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri, NIS, kamar, atau gedung..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
          />
        </div>
        <p className="text-xs text-slate-500 font-semibold">
          Menampilkan <span className="font-bold text-slate-800">{filteredSantri.length}</span> santri
        </p>
      </div>

      {/* Santri Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-4 px-5">Santri</th>
                <th className="py-4 px-4">Kelas</th>
                <th className="py-4 px-4">Asrama & Kamar</th>
                <th className="py-4 px-4 text-center">Nilai Angka</th>
                <th className="py-4 px-4 text-center">Predikat Huruf</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Memuat data santri & asrama...
                  </td>
                </tr>
              ) : filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Tidak ada santri yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredSantri.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900 text-sm">{s.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIS: {s.nis}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{s.kelas}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-emerald-800 flex items-center gap-1">
                        <Home className="w-3 h-3 text-emerald-600" /> {s.kamar}
                      </p>
                      <p className="text-[10px] text-slate-400">{s.gedung}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-slate-800 text-sm">{s.nilai_angka}</span>
                      <span className="text-[10px] text-slate-400"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {s.nilai_huruf} ({s.predikat})
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenForm(s)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Nilai Sikap
                        </button>
                        <Link
                          href={`/rapor/print/${s.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" /> Rapor
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form Input Pengasuhan */}
      {selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Evaluasi Rapor Asrama
                </span>
                <h3 className="text-lg font-black mt-1">{selectedSantri.nama}</h3>
                <p className="text-xs text-white/80">
                  NIS: {selectedSantri.nis} • Kelas: {selectedSantri.kelas} • Asrama: {formData?.gedung} ({formData?.nama_kamar})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSantri(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {loadingDetail || !formData ? (
                <div className="py-16 text-center text-slate-400 font-bold">Memuat rincian penilaian...</div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                        {formData.nilai_huruf}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Nilai Akhir Rapor Asrama</p>
                        <p className="text-sm font-black text-slate-900">
                          Skor: {formData.total_skor} / 100 • Predikat: {formData.predikat_umum} ({formData.predikat_umum_arab})
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <p>Pengasuh 1: <strong className="text-slate-800">{formData.pengasuh_1}</strong></p>
                      <p>Pengasuh 2: <strong className="text-slate-800">{formData.pengasuh_2}</strong></p>
                    </div>
                  </div>

                  {/* 1. Ibadah & Akhlaq */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" /> 1. Ibadah dan Akhlaq
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Predikat:</span>
                        <select
                          value={formData.aspek.ibadah_akhlaq.predikat}
                          onChange={(e) => handleScoreChange("ibadah_akhlaq", e.target.value as any)}
                          className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Sangat Baik">Sangat Baik (24)</option>
                          <option value="Baik">Baik (21)</option>
                          <option value="Cukup Baik">Cukup Baik (18)</option>
                          <option value="Kurang Baik">Kurang Baik (15)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Indikator: {formData.aspek.ibadah_akhlaq.indikator}
                    </p>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Deskripsi Naratif Pengasuh
                      </label>
                      <textarea
                        rows={3}
                        value={formData.aspek.ibadah_akhlaq.deskripsi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aspek: {
                              ...formData.aspek,
                              ibadah_akhlaq: { ...formData.aspek.ibadah_akhlaq, deskripsi: e.target.value },
                            },
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 2. Kemandirian */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" /> 2. Kemandirian
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Predikat:</span>
                        <select
                          value={formData.aspek.kemandirian.predikat}
                          onChange={(e) => handleScoreChange("kemandirian", e.target.value as any)}
                          className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Sangat Baik">Sangat Baik (24)</option>
                          <option value="Baik">Baik (21)</option>
                          <option value="Cukup Baik">Cukup Baik (18)</option>
                          <option value="Kurang Baik">Kurang Baik (15)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Indikator: {formData.aspek.kemandirian.indikator}
                    </p>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Deskripsi Naratif Pengasuh
                      </label>
                      <textarea
                        rows={3}
                        value={formData.aspek.kemandirian.deskripsi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aspek: {
                              ...formData.aspek,
                              kemandirian: { ...formData.aspek.kemandirian, deskripsi: e.target.value },
                            },
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 3. Penampilan dan Kerapihan */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" /> 3. Penampilan dan Kerapihan
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Predikat:</span>
                        <select
                          value={formData.aspek.penampilan_kerapihan.predikat}
                          onChange={(e) => handleScoreChange("penampilan_kerapihan", e.target.value as any)}
                          className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Sangat Baik">Sangat Baik (24)</option>
                          <option value="Baik">Baik (21)</option>
                          <option value="Cukup Baik">Cukup Baik (18)</option>
                          <option value="Kurang Baik">Kurang Baik (15)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Indikator: {formData.aspek.penampilan_kerapihan.indikator}
                    </p>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Deskripsi Naratif Pengasuh
                      </label>
                      <textarea
                        rows={3}
                        value={formData.aspek.penampilan_kerapihan.deskripsi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aspek: {
                              ...formData.aspek,
                              penampilan_kerapihan: { ...formData.aspek.penampilan_kerapihan, deskripsi: e.target.value },
                            },
                          })
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 4. Kedisiplinan & Pelanggaran */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" /> 4. Kedisiplinan (Rekap Pelanggaran)
                      </h4>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {formData.aspek.kedisiplinan.predikat} (24)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pelanggaran Berat</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.aspek.kedisiplinan.berat}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              aspek: {
                                ...formData.aspek,
                                kedisiplinan: { ...formData.aspek.kedisiplinan, berat: parseInt(e.target.value) || 0 },
                              },
                            })
                          }
                          className="w-16 text-center font-black text-lg text-slate-800 mt-1 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pelanggaran Sedang</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.aspek.kedisiplinan.sedang}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              aspek: {
                                ...formData.aspek,
                                kedisiplinan: { ...formData.aspek.kedisiplinan, sedang: parseInt(e.target.value) || 0 },
                              },
                            })
                          }
                          className="w-16 text-center font-black text-lg text-slate-800 mt-1 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pelanggaran Ringan</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.aspek.kedisiplinan.ringan}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              aspek: {
                                ...formData.aspek,
                                kedisiplinan: { ...formData.aspek.kedisiplinan, ringan: parseInt(e.target.value) || 0 },
                              },
                            })
                          }
                          className="w-16 text-center font-black text-lg text-slate-800 mt-1 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Nasihat Khusus Pengasuh */}
                  <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                    <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" /> 5. Nasihat & Motivasi Pengasuh
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tuliskan nasihat personal pengasuh kepada santri, doa, dan kutipan ayat/hadits/kata bijak.
                    </p>
                    <textarea
                      rows={3}
                      value={formData.nasihat_pengasuh}
                      onChange={(e) => setFormData({ ...formData, nasihat_pengasuh: e.target.value })}
                      placeholder="Tuliskan nasihat atau doa untuk santri..."
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                    />
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        Kutipan Ayat / Hadits / Mutiara Bijak
                      </label>
                      <input
                        type="text"
                        value={formData.kutipan_mutiara}
                        onChange={(e) => setFormData({ ...formData, kutipan_mutiara: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSelectedSantri(null)}
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Penilaian"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
