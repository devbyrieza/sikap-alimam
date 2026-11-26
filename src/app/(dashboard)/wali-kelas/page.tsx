"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ModuleTabs from "@/components/ModuleTabs";
import {
  Users,
  FileText,
  BarChart3,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
} from "lucide-react";

interface EkskulItem {
  nama_ekskul: string;
  nilai: string;
  nilai_angka?: string;
}

interface SantriWaliKelas {
  id: string;
  nama: string;
  nis: string | null;
  penilaian: {
    nilai_sikap: string;
    skor_sikap: number | null;
    nilai_kedisiplinan: string;
    skor_kedisiplinan: number | null;
    catatan_wali_kelas: string | null;
  } | null;
  ekskul: Array<{
    id: string;
    nama_ekskul: string;
    nilai: string;
    nilai_angka: number | null;
  }>;
}

const PREDIKAT_OPTIONS = ["Sangat Baik", "Baik", "Cukup", "Kurang"];

export default function WaliKelasHubPage() {
  const [kelasList, setKelasList] = useState<Array<{ id: string; nama: string }>>([]);
  const [kelasId, setKelasId] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [santriList, setSantriList] = useState<SantriWaliKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<SantriWaliKelas | null>(null);
  const [nilaiSikap, setNilaiSikap] = useState("Baik");
  const [skorSikap, setSkorSikap] = useState("");
  const [nilaiKedisiplinan, setNilaiKedisiplinan] = useState("Baik");
  const [skorKedisiplinan, setSkorKedisiplinan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [ekskulList, setEkskulList] = useState<EkskulItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        semester,
        tahun_ajaran: tahunAjaran,
        ...(kelasId ? { kelas_id: kelasId } : {}),
      });
      const res = await fetch(`/api/wali-kelas/penilaian?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data wali kelas");
      }
      setKelasList(json.kelasList || []);
      if (!kelasId && json.selectedKelasId) {
        setKelasId(json.selectedKelasId);
      }
      setSantriList(json.santriList || []);
    } catch (err: any) {
      setError(err?.message || "Akses ditolak atau gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [kelasId, semester, tahunAjaran]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (s: SantriWaliKelas) => {
    setEditing(s);
    setNilaiSikap(s.penilaian?.nilai_sikap || "Baik");
    setSkorSikap(s.penilaian?.skor_sikap != null ? String(s.penilaian.skor_sikap) : "");
    setNilaiKedisiplinan(s.penilaian?.nilai_kedisiplinan || "Baik");
    setSkorKedisiplinan(
      s.penilaian?.skor_kedisiplinan != null ? String(s.penilaian.skor_kedisiplinan) : ""
    );
    setCatatan(s.penilaian?.catatan_wali_kelas || "");
    setEkskulList(
      s.ekskul.length > 0
        ? s.ekskul.map((e) => ({
            nama_ekskul: e.nama_ekskul,
            nilai: e.nilai,
            nilai_angka: e.nilai_angka != null ? String(e.nilai_angka) : "",
          }))
        : [{ nama_ekskul: "", nilai: "", nilai_angka: "" }]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/wali-kelas/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: editing.id,
          semester,
          tahun_ajaran: tahunAjaran,
          nilai_sikap: nilaiSikap,
          skor_sikap: skorSikap,
          nilai_kedisiplinan: nilaiKedisiplinan,
          skor_kedisiplinan: skorKedisiplinan,
          catatan_wali_kelas: catatan,
          ekskulList,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan penilaian");
      }
      setToast({ type: "success", msg: `Penilaian ${editing.nama} berhasil disimpan.` });
      setEditing(null);
      loadData();
    } catch (err: any) {
      setToast({ type: "error", msg: err?.message || "Gagal menyimpan penilaian" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-7 max-w-7xl mx-auto flex flex-col gap-5 pb-20 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black m-0 flex items-center gap-3">
            <Users size={28} /> Hub Wali Kelas
          </h1>
          <p className="m-0 mt-1.5 opacity-90 text-xs sm:text-sm">
            Input Nilai Sikap Keseluruhan, Kedisiplinan Keseluruhan & Ekstrakurikuler Santri
          </p>
        </div>
        <Link
          href="/kurikulum/kenaikan-kelas"
          className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-xs font-extrabold text-white transition-colors shrink-0"
        >
          <ArrowUpCircle size={16} /> Kenaikan Kelas Otomatis
        </Link>
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Sikap, Disiplin & Ekskul", href: "/wali-kelas", exact: true, icon: <Users size={16} /> },
          { label: "Cetak Rapor", href: "/wali-kelas/rapor", exact: true, icon: <FileText size={16} /> },
          { label: "Rekap Nilai Total", href: "/wali-kelas/rekap", exact: true, icon: <BarChart3 size={16} /> },
        ]}
      />

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Filter */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
            Kelas
          </label>
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
            Tahun Ajaran
          </label>
          <select
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
          >
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>
      </div>

      {/* Table Santri */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Memuat daftar santri...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-bold text-rose-600">{error}</div>
        ) : santriList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Belum ada santri aktif pada kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Santri</th>
                  <th className="px-4 py-3">Sikap Keseluruhan</th>
                  <th className="px-4 py-3">Kedisiplinan Keseluruhan</th>
                  <th className="px-4 py-3">Ekstrakurikuler</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] text-slate-400">NIS: {s.nis || "-"}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {s.penilaian?.nilai_sikap || <span className="text-slate-300">Belum diisi</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {s.penilaian?.nilai_kedisiplinan || (
                        <span className="text-slate-300">Belum diisi</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.ekskul.length === 0 ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.ekskul.map((e) => (
                            <span
                              key={e.id}
                              className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                            >
                              {e.nama_ekskul}: {e.nilai}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        <Edit3 size={13} /> Input / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Wali Kelas */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Penilaian Wali Kelas · {editing.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  Semester {semester} · {tahunAjaran}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sikap Keseluruhan
                  </label>
                  <select
                    value={nilaiSikap}
                    onChange={(e) => setNilaiSikap(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold"
                  >
                    {PREDIKAT_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Skor Sikap (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={skorSikap}
                    onChange={(e) => setSkorSikap(e.target.value)}
                    placeholder="Contoh: 90"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kedisiplinan Keseluruhan
                  </label>
                  <select
                    value={nilaiKedisiplinan}
                    onChange={(e) => setNilaiKedisiplinan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold"
                  >
                    {PREDIKAT_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Skor Kedisiplinan (Opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={skorKedisiplinan}
                    onChange={(e) => setSkorKedisiplinan(e.target.value)}
                    placeholder="Contoh: 88"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Nilai Ekstrakurikuler</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEkskulList((prev) => [
                        ...prev,
                        { nama_ekskul: "", nilai: "", nilai_angka: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                  >
                    <Plus size={14} /> Tambah Ekskul
                  </button>
                </div>
                <div className="space-y-2">
                  {ekskulList.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ex.nama_ekskul}
                        onChange={(e) =>
                          setEkskulList((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, nama_ekskul: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Nama Ekskul (mis. Panahan)"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      />
                      <input
                        type="text"
                        value={ex.nilai}
                        onChange={(e) =>
                          setEkskulList((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, nilai: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Nilai (mis. A / 90)"
                        className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEkskulList((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Wali Kelas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan perkembangan santri di kelas..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2 text-xs font-extrabold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Penilaian
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
