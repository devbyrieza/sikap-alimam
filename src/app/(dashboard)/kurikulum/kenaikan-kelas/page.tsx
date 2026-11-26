"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowUpCircle, CheckCircle2, AlertCircle, Loader2, ShieldOff, Play } from "lucide-react";

export default function KenaikanKelasPage() {
  const [tahunAsal, setTahunAsal] = useState("2026/2027");
  const [tahunTujuan, setTahunTujuan] = useState("2027/2028");
  const [preview, setPreview] = useState<any>(null);
  const [pengecualian, setPengecualian] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/kenaikan-kelas?tahun_asal=${encodeURIComponent(
          tahunAsal
        )}&tahun_tujuan=${encodeURIComponent(tahunTujuan)}`
      );
      const json = await res.json();
      if (json.success) {
        setPreview(json.preview);
        setPengecualian(json.pengecualian || []);
      }
    } finally {
      setLoading(false);
    }
  }, [tahunAsal, tahunTujuan]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const toggleException = async (santriId: string, isExcluded: boolean) => {
    await fetch("/api/admin/kenaikan-kelas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isExcluded ? "hapus_pengecualian" : "tambah_pengecualian",
        santri_id: santriId,
        tahunAjaranAsal: tahunAsal,
        alasan: "Pengecualian manual wali kelas / mudir",
      }),
    });
    loadPreview();
  };

  const runPromotion = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/kenaikan-kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "proses",
          tahunAjaranAsal: tahunAsal,
          tahunAjaranTujuan: tahunTujuan,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses kenaikan kelas");
      }
      const r = json.result;
      setMessage({
        type: "success",
        text: `Kenaikan kelas selesai: ${r.naikKelas} naik kelas, ${r.lulus} lulus, ${r.tinggalKelas} tinggal kelas, ${r.dilewatiIdempotent} sudah diproses sebelumnya.`,
      });
      loadPreview();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Gagal memproses kenaikan kelas" });
    } finally {
      setRunning(false);
    }
  };

  const excludedSet = new Set(pengecualian.map((p) => p.santri_id));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5 pb-20">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-800 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <ArrowUpCircle size={26} /> Kenaikan Kelas Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Layanan terpusat kenaikan kelas santri aktif (idempotent & mencatat riwayat per tahun ajaran).
          </p>
        </div>
        <button
          type="button"
          disabled={running || loading}
          onClick={runPromotion}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 text-xs font-black shadow-md disabled:opacity-50"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Proses Kenaikan Kelas
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-500 block mb-1">Tahun Ajaran Asal</label>
          <input
            type="text"
            value={tahunAsal}
            onChange={(e) => setTahunAsal(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold"
          />
        </div>
        <div>
          <label className="font-bold text-slate-500 block mb-1">Tahun Ajaran Tujuan</label>
          <input
            type="text"
            value={tahunTujuan}
            onChange={(e) => setTahunTujuan(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Memuat pratinjau kenaikan kelas...</div>
      ) : preview ? (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 text-xs font-bold">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Total Diperiksa: {preview.totalDiperiksa}
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1">
              Akan Naik: {preview.naikKelas}
            </span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1">
              Tinggal / Pengecualian: {preview.tinggalKelas}
            </span>
            <span className="rounded-full bg-sky-100 text-sky-800 px-3 py-1">
              Sudah Diproses (Idempotent): {preview.dilewatiIdempotent}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Santri</th>
                  <th className="px-4 py-3">Kelas Asal</th>
                  <th className="px-4 py-3">Kelas Tujuan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Pengecualian Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.detail.map((d: any) => {
                  const isExcluded = excludedSet.has(d.santriId);
                  return (
                    <tr key={d.santriId}>
                      <td className="px-4 py-3 font-bold text-slate-900">{d.nama}</td>
                      <td className="px-4 py-3 text-slate-600">{d.kelasAsal}</td>
                      <td className="px-4 py-3 font-bold text-emerald-800">{d.kelasTujuan}</td>
                      <td className="px-4 py-3 uppercase font-bold text-[10px]">
                        {d.status}
                        {d.alasan ? ` (${d.alasan})` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleException(d.santriId, isExcluded)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-[11px] font-bold ${
                            isExcluded
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <ShieldOff size={12} />
                          {isExcluded ? "Batalkan Pengecualian" : "Tandai Tidak Naik"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
