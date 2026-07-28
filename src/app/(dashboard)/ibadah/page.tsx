"use client";

import React, { useState, useEffect } from "react";
import { Check, Save, AlertCircle, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

interface SantriIbadah {
  santri_id: string;
  nama_lengkap: string;
  shubuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  tahajjud: boolean;
  dhuha: boolean;
  shaum: boolean;
  almatsurat: boolean;
  adab_kamar: string;
  adab_masjid: string;
  catatan: string;
}

export default function IbadahHarianPage() {
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [kelasId, setKelasId] = useState("");
  const [kelasList, setKelasList] = useState<{ id: string; nama: string }[]>(
    []
  );
  const [data, setData] = useState<SantriIbadah[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const draftKey = `sikap_ibadah_draft_${tanggal}_${kelasId}`;

  // Load classes
  useEffect(() => {
    // In a real app, fetch from API. Hardcoded for now.
    setKelasList([
      { id: "1", nama: "7A MTs" },
      { id: "2", nama: "7B MTs" },
    ]);
  }, []);

  // Fetch data or load draft
  useEffect(() => {
    if (!tanggal || !kelasId) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Cek LocalStorage Draft (Mandatory UX Rule)
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            setData(parsedDraft);
            setDraftLoaded(true);
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }

        setDraftLoaded(false);
        // Jika tidak ada draft, fetch dari server
        const res = await fetch(
          `/api/ibadah?tanggal=${tanggal}&kelas_id=${kelasId}`
        );
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tanggal, kelasId, draftKey]);

  // Autosave to LocalStorage when data changes
  useEffect(() => {
    if (data.length > 0 && kelasId) {
      localStorage.setItem(draftKey, JSON.stringify(data));
    }
  }, [data, draftKey, kelasId]);

  const handleChange = (
    index: number,
    field: keyof SantriIbadah,
    value: string | boolean
  ) => {
    const newData = [...data];
    // @ts-ignore
    newData[index][field] = value;
    setData(newData);
  };

  const handleSave = async () => {
    if (!tanggal || !kelasId || data.length === 0) return;

    setSaving(true);
    try {
      // Mock pegawai_id for now
      const payload = {
        tanggal,
        pegawai_id: "user-pegawai-123", // Should be from session
        data,
      };

      const res = await fetch("/api/ibadah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Hapus draft karena sudah tersimpan di server
        localStorage.removeItem(draftKey);
        setDraftLoaded(false);

        Swal.fire({
          title: "Berhasil!",
          text: "Ceklist Ibadah Harian berhasil disimpan.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error!",
        text: "Gagal menyimpan data ke server.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const sholatOptions = [
    "Berjamaah",
    "Munfarid",
    "Terlambat",
    "Bolong",
    "Udzur",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner - PPDB Platinum Standard */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Check size={120} />
        </div>
        <h1 className="text-3xl font-bold mb-2 relative z-10">
          Bina Pribadi Islami (BPI)
        </h1>
        <p className="text-emerald-100 relative z-10">
          Ceklist ibadah harian dan adab santri.
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 bg-white"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kelas / Halaqah
          </label>
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 px-4 py-2 bg-white"
          >
            <option value="">Pilih Kelas...</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {draftLoaded && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-center gap-3 border border-amber-200">
          <AlertCircle size={20} />
          <span className="text-sm">
            Menampilkan data <strong>draft yang belum tersimpan</strong> ke server.
            Klik Simpan untuk memperbarui database.
          </span>
        </div>
      )}

      {/* Data Table - Dense layout from Siakad Standard wrapped in Platinum Design */}
      {kelasId && !loading && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-4 py-3 text-left font-semibold text-gray-600 border-b-2 border-emerald-500"
                  >
                    Nama Santri
                  </th>
                  <th
                    colSpan={5}
                    className="px-4 py-2 text-center font-semibold text-gray-600 bg-emerald-50/50"
                  >
                    Sholat Wajib
                  </th>
                  <th
                    colSpan={4}
                    className="px-4 py-2 text-center font-semibold text-gray-600 bg-teal-50/50"
                  >
                    Amalan Sunnah
                  </th>
                </tr>
                <tr>
                  {/* Wajib */}
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-emerald-50/30">Subuh</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-emerald-50/30">Dzuhur</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-emerald-50/30">Ashar</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-emerald-50/30">Maghrib</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-emerald-50/30">Isya</th>
                  {/* Sunnah */}
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-teal-50/30">Tahajjud</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-teal-50/30">Dhuha</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-teal-50/30">Shaum</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 bg-teal-50/30">Matsurat</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={item.santri_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      {item.nama_lengkap}
                    </td>
                    {/* Wajib Selects */}
                    {["shubuh", "dzuhur", "ashar", "maghrib", "isya"].map((waktu) => (
                      <td key={waktu} className="px-1 py-2 text-center">
                        <select
                          value={item[waktu as keyof SantriIbadah] as string}
                          onChange={(e) => handleChange(index, waktu as keyof SantriIbadah, e.target.value)}
                          className={`text-xs rounded-md border-0 py-1 pl-2 pr-6 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-xs
                            ${
                              item[waktu as keyof SantriIbadah] === "Berjamaah"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 focus:ring-emerald-600"
                                : item[waktu as keyof SantriIbadah] === "Bolong"
                                ? "bg-red-50 text-red-700 ring-red-200 focus:ring-red-600"
                                : "bg-amber-50 text-amber-700 ring-amber-200 focus:ring-amber-600"
                            }
                          `}
                        >
                          {sholatOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                    {/* Sunnah Checkboxes */}
                    {["tahajjud", "dhuha", "shaum", "almatsurat"].map((sunnah) => (
                      <td key={sunnah} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item[sunnah as keyof SantriIbadah] as boolean}
                          onChange={(e) => handleChange(index, sunnah as keyof SantriIbadah, e.target.checked)}
                          className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data santri ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || data.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan Ceklist
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      )}
    </div>
  );
}
