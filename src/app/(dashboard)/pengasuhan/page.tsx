"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  HeartHandshake,
  Languages,
  ShieldAlert,
  Stethoscope,
  Search,
  Save,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  PENGASUHAN_ASPEK,
  PENGASUHAN_SKALA,
  CATATAN_MUSYRIF_PREFIXES,
} from "@/lib/pengasuhanRules";

type ActiveTab = "pengasuhan" | "arab" | "pelanggaran" | "kesehatan";

export default function PengasuhanPage() {
  const [santriList, setSantriList] = useState<any[]>([]);
  const [musyrifList, setMusyrifList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");

  const [selectedSantri, setSelectedSantri] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("pengasuhan");
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Pengasuhan state
  const [kamarAktif, setKamarAktif] = useState("");
  const [musyrifId, setMusyrifId] = useState("");
  const [aspekScores, setAspekScores] = useState<Record<string, string>>({
    kebersihan_diri_kamar: "Baik",
    kerapian_diri_barang: "Baik",
    kemandirian: "Baik",
    kepatuhan_kedisiplinan: "Baik",
    ibadah_akhlak: "Baik",
    mentoring_mulahadzoh: "Baik",
  });
  const [catatanPrefix, setCatatanPrefix] = useState<string>(CATATAN_MUSYRIF_PREFIXES[0]);
  const [catatanBody, setCatatanBody] = useState("");

  // Arab state
  const [arabPredikat, setArabPredikat] = useState("Baik");
  const [arabCatatan, setArabCatatan] = useState("");

  // Pelanggaran state
  const [pelanggaranList, setPelanggaranList] = useState<any[]>([]);
  const [pelanggaranTanggal, setPelanggaranTanggal] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [pelanggaranTeks, setPelanggaranTeks] = useState("");
  const [pelanggaranSanksi, setPelanggaranSanksi] = useState("");
  const [pelanggaranKategori, setPelanggaranKategori] = useState("ringan");

  // Kesehatan state
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [riwayatSakit, setRiwayatSakit] = useState("");
  const [rambut, setRambut] = useState("Baik");
  const [kuku, setKuku] = useState("Baik");
  const [telinga, setTelinga] = useState("Baik");
  const [gigi, setGigi] = useState("Baik");
  const [catatanGizi, setCatatanGizi] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/musyrif/input?semester=${encodeURIComponent(semester)}&tahun_ajaran=${encodeURIComponent(
          tahunAjaran
        )}`
      );
      const json = await res.json();
      if (json.success) {
        setSantriList(json.santriList || []);
        setMusyrifList(json.musyrifList || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [semester, tahunAjaran]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openSantri = async (s: any) => {
    setSelectedSantri(s);
    setActiveTab("pengasuhan");
    setToast(null);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/musyrif/input?santri_id=${encodeURIComponent(s.id)}&semester=${encodeURIComponent(
          semester
        )}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setKamarAktif(d.santri?.kamarAktif || "");
        setMusyrifId(d.santri?.musyrifId || "");

        if (d.pengasuhan) {
          setAspekScores({
            kebersihan_diri_kamar: d.pengasuhan.kebersihan_diri_kamar,
            kerapian_diri_barang: d.pengasuhan.kerapian_diri_barang,
            kemandirian: d.pengasuhan.kemandirian,
            kepatuhan_kedisiplinan: d.pengasuhan.kepatuhan_kedisiplinan,
            ibadah_akhlak: d.pengasuhan.ibadah_akhlak,
            mentoring_mulahadzoh: d.pengasuhan.mentoring_mulahadzoh,
          });
          const full = d.pengasuhan.catatan_musyrif || "";
          const matched = CATATAN_MUSYRIF_PREFIXES.find((p) => full.startsWith(p));
          if (matched) {
            setCatatanPrefix(matched);
            setCatatanBody(full.slice(matched.length));
          } else {
            setCatatanPrefix(CATATAN_MUSYRIF_PREFIXES[0]);
            setCatatanBody(full);
          }
        } else {
          setCatatanPrefix(CATATAN_MUSYRIF_PREFIXES[0]);
          setCatatanBody("");
        }

        setArabPredikat(d.keaktifanArab?.predikat || "Baik");
        setArabCatatan(d.keaktifanArab?.catatan || "");
        setPelanggaranList(d.pelanggaran || []);

        const latestKes = d.kesehatan?.[0];
        setTinggiBadan(latestKes?.tinggi_badan != null ? String(latestKes.tinggi_badan) : "");
        setBeratBadan(latestKes?.berat_badan != null ? String(latestKes.berat_badan) : "");
        setRiwayatSakit(latestKes?.riwayat_sakit || "");
        setRambut(latestKes?.penilaian_rambut || "Baik");
        setKuku(latestKes?.penilaian_kuku || "Baik");
        setTelinga(latestKes?.penilaian_telinga || "Baik");
        setGigi(latestKes?.penilaian_gigi || "Baik");
        setCatatanGizi(latestKes?.catatan_gizi_kesehatan || "");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const postAction = async (payload: Record<string, any>) => {
    if (!selectedSantri) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/musyrif/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          santri_id: selectedSantri.id,
          semester,
          tahun_ajaran: tahunAjaran,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan data");
      }
      setToast({ type: "success", msg: json.message || "Berhasil disimpan." });
      loadList();
      return json;
    } catch (err: any) {
      setToast({ type: "error", msg: err?.message || "Gagal menyimpan data" });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const filtered = santriList.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      (s.kelas || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 pb-20">
      <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 p-6 sm:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
          <HeartHandshake size={28} /> Portal Musyrif, Pengasuhan & Kesehatan
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-teal-100">
          Input penilaian Pengasuhan (6 aspek & catatan musyrif), Keaktifan Bahasa Arab, Riwayat Pelanggaran, dan Kesehatan Santri.
        </p>
      </div>

      {/* Filter */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama santri atau kelas..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"
        >
          <option value="Ganjil">Semester Ganjil</option>
          <option value="Genap">Semester Genap</option>
        </select>
        <select
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"
        >
          <option value="2026/2027">2026/2027</option>
          <option value="2027/2028">2027/2028</option>
        </select>
      </div>

      {/* Tabel Santri */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Memuat daftar santri...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Santri</th>
                  <th className="px-4 py-3">Kamar & Musyrif</th>
                  <th className="px-4 py-3 text-center">Pengasuhan</th>
                  <th className="px-4 py-3 text-center">B. Arab</th>
                  <th className="px-4 py-3 text-center">Pelanggaran</th>
                  <th className="px-4 py-3 text-center">Kesehatan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] text-slate-400">
                        {s.kelas} · NIS {s.nis || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-bold">{s.kamarAktif || "-"}</div>
                      <div className="text-[11px] text-slate-400">{s.musyrifNama}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.hasPengasuhan
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {s.hasPengasuhan ? "Sudah" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {s.arabPredikat || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{s.jumlahPelanggaran}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.hasKesehatan
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {s.hasKesehatan ? "Ada" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openSantri(s)}
                        className="rounded-xl bg-teal-700 hover:bg-teal-800 px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Kelola Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Multi-Tab */}
      {selectedSantri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedSantri(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">{selectedSantri.nama}</h2>
                <p className="text-xs text-slate-500">
                  {selectedSantri.kelas} · Semester {semester} ({tahunAjaran})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSantri(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 border-b border-slate-100 flex flex-wrap gap-2">
              {[
                { id: "pengasuhan", label: "Pengasuhan", icon: HeartHandshake },
                { id: "arab", label: "B. Arab", icon: Languages },
                { id: "pelanggaran", label: "Pelanggaran", icon: ShieldAlert },
                { id: "kesehatan", label: "Kesehatan", icon: Stethoscope },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.id as ActiveTab);
                      setToast(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-extrabold border-b-2 transition-colors ${
                      active
                        ? "border-teal-700 text-teal-800 bg-teal-50/50"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
            </div>

            {toast && (
              <div
                className={`mx-6 mt-4 rounded-xl border px-3.5 py-2.5 text-xs font-bold flex items-center gap-2 ${
                  toast.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {toast.msg}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {detailLoading ? (
                <div className="py-10 flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin" /> Memuat detail santri...
                </div>
              ) : activeTab === "pengasuhan" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kamar Aktif</label>
                      <input
                        type="text"
                        value={kamarAktif}
                        onChange={(e) => setKamarAktif(e.target.value)}
                        placeholder="Contoh: Kamar Abu Bakar 02"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Musyrif Aktif</label>
                      <select
                        value={musyrifId}
                        onChange={(e) => setMusyrifId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold"
                      >
                        <option value="">-- Pilih Musyrif --</option>
                        {musyrifList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama_lengkap}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {PENGASUHAN_ASPEK.map((aspek) => (
                      <div
                        key={aspek.key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                      >
                        <span className="font-bold text-slate-800">{aspek.label}</span>
                        <div className="flex gap-1.5 shrink-0">
                          {PENGASUHAN_SKALA.map((sk) => (
                            <button
                              key={sk}
                              type="button"
                              onClick={() =>
                                setAspekScores((prev) => ({ ...prev, [aspek.key]: sk }))
                              }
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                                aspekScores[aspek.key] === sk
                                  ? "bg-teal-700 text-white border-teal-700"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {sk}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-3.5 space-y-2">
                    <label className="font-extrabold text-teal-900 block">
                      Catatan Tambahan Musyrif/Pengasuh (Wajib)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={catatanPrefix}
                        onChange={(e) => setCatatanPrefix(e.target.value)}
                        className="rounded-xl border border-teal-200 bg-white px-3 py-2 font-bold text-teal-900"
                      >
                        {CATATAN_MUSYRIF_PREFIXES.map((p) => (
                          <option key={p} value={p}>
                            {p}...
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={catatanBody}
                        onChange={(e) => setCatatanBody(e.target.value)}
                        placeholder="Lanjutan catatan (mis. menjaga kebersihan lemari dan shalat berjamaah)"
                        className="flex-1 rounded-xl border border-teal-200 bg-white px-3 py-2"
                      />
                    </div>
                    <p className="text-[11px] text-teal-700">
                      Tersimpan sebagai: &ldquo;{catatanPrefix}
                      {catatanBody || "..."}&rdquo;
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      postAction({
                        action: "pengasuhan",
                        ...aspekScores,
                        catatan_musyrif: `${catatanPrefix}${catatanBody}`,
                        kamar_aktif: kamarAktif,
                        musyrif_id: musyrifId,
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan Penilaian Pengasuhan
                  </button>
                </div>
              ) : activeTab === "arab" ? (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-2">
                      Predikat Keaktifan Berbahasa Arab
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Baik", "Cukup", "Kurang"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setArabPredikat(p)}
                          className={`rounded-xl border py-2.5 font-extrabold transition-colors ${
                            arabPredikat === p
                              ? "bg-sky-700 text-white border-sky-700"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={arabCatatan}
                      onChange={(e) => setArabCatatan(e.target.value)}
                      placeholder="Catatan keaktifan muhadatsah harian santri..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      postAction({
                        action: "arab",
                        predikat: arabPredikat,
                        catatan: arabCatatan,
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    <Save size={14} /> Simpan Keaktifan Bahasa Arab
                  </button>
                </div>
              ) : activeTab === "pelanggaran" ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
                    <div className="font-extrabold text-rose-900">Tambah Catatan Pelanggaran</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="date"
                        value={pelanggaranTanggal}
                        onChange={(e) => setPelanggaranTanggal(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                      />
                      <select
                        value={pelanggaranKategori}
                        onChange={(e) => setPelanggaranKategori(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold"
                      >
                        <option value="ringan">Ringan</option>
                        <option value="sedang">Sedang</option>
                        <option value="berat">Berat</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={pelanggaranTeks}
                      onChange={(e) => setPelanggaranTeks(e.target.value)}
                      placeholder="Pelanggaran (mis. Keluar pondok tanpa izin)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                    />
                    <input
                      type="text"
                      value={pelanggaranSanksi}
                      onChange={(e) => setPelanggaranSanksi(e.target.value)}
                      placeholder="Sanksi yang diberikan (mis. Pengurangan jatah penjengukan)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        const res = await postAction({
                          action: "pelanggaran",
                          tanggal: pelanggaranTanggal,
                          pelanggaran: pelanggaranTeks,
                          sanksi: pelanggaranSanksi,
                          kategori: pelanggaranKategori,
                        });
                        if (res?.data) {
                          setPelanggaranList((prev) => [res.data, ...prev]);
                          setPelanggaranTeks("");
                          setPelanggaranSanksi("");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 px-4 py-2 font-extrabold text-white"
                    >
                      <Plus size={14} /> Tambah Pelanggaran
                    </button>
                  </div>

                  <div className="space-y-2">
                    {pelanggaranList.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-3"
                      >
                        <div>
                          <div className="text-[10px] font-bold text-slate-400">
                            {new Date(p.tanggal).toLocaleDateString("id-ID")} · {p.kategori}
                          </div>
                          <div className="font-bold text-slate-900">{p.pelanggaran}</div>
                          <div className="text-slate-600">Sanksi: {p.sanksi}</div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await postAction({ action: "hapus_pelanggaran", id: p.id });
                            if (res) {
                              setPelanggaranList((prev) => prev.filter((item) => item.id !== p.id));
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tinggi Badan (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tinggiBadan}
                        onChange={(e) => setTinggiBadan(e.target.value)}
                        placeholder="158"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Berat Badan (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={beratBadan}
                        onChange={(e) => setBeratBadan(e.target.value)}
                        placeholder="48"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: "Rambut", val: rambut, set: setRambut },
                      { label: "Kuku", val: kuku, set: setKuku },
                      { label: "Telinga", val: telinga, set: setTelinga },
                      { label: "Gigi", val: gigi, set: setGigi },
                    ].map((h) => (
                      <div key={h.label}>
                        <label className="font-bold text-slate-700 block mb-1">{h.label}</label>
                        <select
                          value={h.val}
                          onChange={(e) => h.set(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 font-bold"
                        >
                          <option value="Baik">Baik</option>
                          <option value="Cukup">Cukup</option>
                          <option value="Kurang">Kurang</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Riwayat Sakit</label>
                    <input
                      type="text"
                      value={riwayatSakit}
                      onChange={(e) => setRiwayatSakit(e.target.value)}
                      placeholder="Contoh: Demam ringan (sembuh) atau Tidak ada"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Catatan Kesehatan & Kecukupan Gizi
                    </label>
                    <textarea
                      rows={2}
                      value={catatanGizi}
                      onChange={(e) => setCatatanGizi(e.target.value)}
                      placeholder="Catatan kondisi gizi & kesehatan (TODO: konfirmasi Mudir untuk indikator baku)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      postAction({
                        action: "kesehatan",
                        tinggi_badan: tinggiBadan,
                        berat_badan: beratBadan,
                        riwayat_sakit: riwayatSakit,
                        penilaian_rambut: rambut,
                        penilaian_kuku: kuku,
                        penilaian_telinga: telinga,
                        penilaian_gigi: gigi,
                        catatan_gizi_kesehatan: catatanGizi,
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    <Save size={14} /> Simpan Data Kesehatan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
