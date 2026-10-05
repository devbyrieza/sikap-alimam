"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Users, Plus, Trash2, Save, Upload, Download, CheckCircle, Search, UserCheck, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Link from "next/link";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-primary";

export default function DistribusiHalaqohPage() {
  const [asatidz, setAsatidz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/halaqoh/distribusi");
      const data = await res.json();
      if (data.success) {
        setAsatidz(data.asatidz);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuru = (guru: any) => {
    setSelectedGuru(guru);
    // clone assignments from halaqoh_kelompok
    const initialAssignments = (guru.halaqoh_kelompok || []).map((k: any) => ({
      id: k.id,
      nama_kelompok: k.nama_kelompok,
      sesi: k.sesi
    }));
    setAssignments(initialAssignments);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { id: null, nama_kelompok: "", sesi: "subuh" }]);
  };

  const updateAssignment = (index: number, field: string, value: string) => {
    const newArr = [...assignments];
    newArr[index][field] = value;
    setAssignments(newArr);
  };

  const removeAssignment = (index: number) => {
    const newArr = [...assignments];
    newArr.splice(index, 1);
    setAssignments(newArr);
  };

  const handleSave = async () => {
    if (!selectedGuru) return;

    // Validasi
    for (const a of assignments) {
      if (!a.nama_kelompok || !a.sesi) {
        Swal.fire("Peringatan", "Semua baris kelompok harus memiliki Nama Kelompok dan Sesi yang valid.", "warning");
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/halaqoh/distribusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: selectedGuru.id,
          kelompok: assignments
        })
      });

      const result = await res.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Disimpan",
          text: result.message,
          showConfirmButton: false,
          timer: 1500
        });
        await fetchData();
        // keep selected guru active, but refresh data
        // note: fetchData will override asatidz. We can update selectedGuru locally to avoid jump
      } else {
        Swal.fire("Gagal", result.error || "Terjadi kesalahan", "error");
      }
    } catch (e) {
      Swal.fire("Gagal", "Terjadi kesalahan sistem", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXCEL IMPORT EXPORT FEATURE ---
  const downloadTemplate = () => {
    const data = [
      { "Nama Pengampu": "Imran Abdillah", "Nama Kelompok": "Halaqoh Subuh 1", "Sesi": "Subuh" },
      { "Nama Pengampu": "Imran Abdillah", "Nama Kelompok": "Halaqoh Dhuha", "Sesi": "Dhuha" },
      { "Nama Pengampu": "Wahyudi Pranata", "Nama Kelompok": "Halaqoh Maghrib MTS", "Sesi": "Maghrib" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DistribusiHalaqoh");
    XLSX.writeFile(wb, "Template_Distribusi_Halaqoh.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire({
      title: "Membaca File...",
      text: "Sedang memproses dokumen Excel.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire("Gagal", "File Excel kosong atau format tidak sesuai.", "error");
          return;
        }

        const res = await fetch("/api/halaqoh/distribusi/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data })
        });
        const result = await res.json();

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diimpor!",
            html: `Berhasil plot: <b>${result.results.berhasil}</b> baris.<br/>Gagal/Lewat: <b>${result.results.gagal}</b> baris.<br/><br/><span style="font-size:12px; color:#ef4444">${result.results.log_gagal.slice(0,5).join("<br/>")}</span>`,
            confirmButtonColor: "#550000"
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire("Gagal", result.message || "Terjadi kesalahan saat memproses data.", "error");
        }
      } catch (err) {
        Swal.fire("Error", "Gagal membaca file Excel. Pastikan format benar.", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  if (loading) {
    return (
      <div className="m-6 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto mb-3.5 h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary" />
        <div className="font-semibold text-slate-400">Memuat daftar pengampu...</div>
      </div>
    );
  }

  const filteredAsatidz = asatidz.filter(g => g.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page-container" style={{ maxWidth: 1400 }}>

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#3a0000] p-7 text-white shadow-xl shadow-primary/20 sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-[#ddc192]/10" />
        <div className="pointer-events-none absolute -bottom-16 right-28 h-40 w-40 rounded-full bg-[#ddc192]/5" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-3">
            <Link
              href="/halaqoh"
              aria-label="Kembali ke halaqoh"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={16} />
            </Link>
            <BookOpen size={28} color="#ddc192" />
            <h1 className="text-2xl font-black sm:text-[26px]">Distribusi halaqoh</h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            Atur beban dan ploting kelompok halaqoh tahfidz untuk setiap pengampu / ustaz.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
          >
            <Download size={18} /> Template Excel
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#ddc192] to-[#c6a673] px-5 py-3 text-sm font-black text-primary shadow-lg shadow-[#ddc192]/30 hover:brightness-105"
          >
            <Upload size={18} /> Import massal
          </button>
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">

        {/* Kiri: daftar pengampu */}
        <div className="flex h-[480px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:h-[700px]">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
            <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-800">
              <Users size={20} className="text-primary" /> Daftar pengampu
            </h2>
            <div className="relative mt-4">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama ustaz"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>

          <div className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto p-5">
            {filteredAsatidz.map(guru => {
              const active = selectedGuru?.id === guru.id;
              const jumlah = guru.halaqoh_kelompok?.length || 0;
              return (
                <button
                  type="button"
                  key={guru.id}
                  onClick={() => handleSelectGuru(guru)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors ${
                    active ? "border-primary bg-[#fffafa]" : "border-slate-100 bg-white hover:border-primary/30"
                  }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${
                    active ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {guru.nama_lengkap.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-extrabold ${active ? "text-primary" : "text-slate-800"}`}>
                      {guru.nama_lengkap}
                    </h3>
                    <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${jumlah > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      <BookOpen size={12} /> {jumlah} kelompok
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredAsatidz.length === 0 && (
              <div className="p-8 text-center text-[13px] font-semibold text-slate-400">Tidak ada ustaz ditemukan.</div>
            )}
          </div>
        </div>

        {/* Kanan: editor */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:h-[700px]">
          {selectedGuru ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-[#fffafa] px-6 py-5 sm:px-7">
                <div>
                  <h2 className="mb-1.5 text-xl font-black text-primary">{selectedGuru.nama_lengkap}</h2>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
                    <UserCheck size={14} /> Atur plot kelompok halaqoh
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-[#ddc192] shadow-md shadow-primary/25 hover:bg-primary-light disabled:opacity-60"
                >
                  {isSaving ? "Menyimpan..." : <><Save size={18} /> Simpan distribusi</>}
                </button>
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[15px] font-extrabold text-slate-800">Daftar kelompok halaqoh</h3>
                  <button
                    onClick={addAssignment}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={16} /> Tambah kelompok
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {assignments.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                      <CheckCircle size={32} className="mx-auto mb-3 text-slate-300" />
                      <div className="text-sm font-bold text-slate-500">Belum ada kelompok.</div>
                      <div className="mt-1 text-[13px] text-slate-400">Klik tombol Tambah kelompok di atas.</div>
                    </div>
                  ) : assignments.map((asg, idx) => (
                    <div key={idx} className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:px-5">
                      <div className="min-w-[200px] flex-1">
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Nama kelompok</label>
                        <input
                          type="text"
                          value={asg.nama_kelompok}
                          placeholder="Cth: Halaqoh Subuh MTs 1"
                          onChange={e => updateAssignment(idx, "nama_kelompok", e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div className="w-full sm:w-44">
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Sesi</label>
                        <select
                          value={asg.sesi}
                          onChange={e => updateAssignment(idx, "sesi", e.target.value)}
                          className={`${fieldClass} cursor-pointer font-bold`}
                        >
                          <option value="subuh">Subuh</option>
                          <option value="dhuha">Dhuha</option>
                          <option value="maghrib">Ba'da Maghrib</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeAssignment(idx)}
                        aria-label="Hapus kelompok"
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-10">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                <Users size={36} className="text-slate-300" />
              </div>
              <p className="mb-2 text-lg font-extrabold text-slate-600">Pilih pengampu di sebelah kiri</p>
              <p className="max-w-xs text-center text-sm leading-relaxed text-slate-400">
                Atur plot kelompok halaqoh untuk setiap ustaz, atau gunakan tombol{" "}
                <b className="text-primary">Import massal</b> untuk upload data Excel secara otomatis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}