"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

interface MasterSesiRow {
  id: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  durasi_menit: number;
  is_active: boolean;
}

const DRAFT_KEY = "sikap_master_sesi_form_draft";

function calcDurationMinutes(mulai: string, selesai: string): number {
  const m1 = /^(\d{2}):(\d{2})$/.exec(mulai);
  const m2 = /^(\d{2}):(\d{2})$/.exec(selesai);
  if (!m1 || !m2) return 40;
  const t1 = Number(m1[1]) * 60 + Number(m1[2]);
  const t2 = Number(m2[1]) * 60 + Number(m2[2]);
  const diff = t2 - t1;
  return diff > 0 ? diff : 40;
}

export default function MasterSesiPage() {
  const [sesi, setSesi] = useState<MasterSesiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    jam_ke: "",
    waktu_mulai: "07:00",
    waktu_selesai: "07:40",
    durasi_menit: "40",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    jam_ke: "",
    waktu_mulai: "",
    waktu_selesai: "",
    durasi_menit: "40",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sesiRes, profileRes] = await Promise.all([
        fetch("/api/master/sesi", { cache: "no-store" }),
        fetch("/api/profile", { cache: "no-store" }),
      ]);
      const sesiJson = await sesiRes.json();
      if (Array.isArray(sesiJson)) {
        setSesi(sesiJson);
      }
      const pJson = await profileRes.json();
      const roleStr = String(pJson?.user?.role || "").toLowerCase();
      const namaStr = String(
        pJson?.pegawai?.nama_lengkap || pJson?.user?.nama || "",
      ).toLowerCase();
      const allowed =
        roleStr.includes("admin_super") ||
        roleStr.includes("mudir") ||
        roleStr.includes("kepala_sekolah") ||
        roleStr.includes("kepala_kurikulum") ||
        roleStr.includes("kadiv_kurikulum") ||
        namaStr.includes("imron");
      setCanManage(allowed);
    } catch (err) {
      console.error("Gagal memuat master sesi:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Tidak dapat mengambil daftar sesi waktu dari server.",
        confirmButtonColor: "#550000",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pulihkan draf tambah sesi dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.jam_ke || parsed.waktu_mulai)) {
          setForm({
            jam_ke: String(parsed.jam_ke || ""),
            waktu_mulai: String(parsed.waktu_mulai || "07:00"),
            waktu_selesai: String(parsed.waktu_selesai || "07:40"),
            durasi_menit: String(parsed.durasi_menit || "40"),
          });
          if (parsed.isAdding) setIsAdding(true);
        }
      }
    } catch {
      // Abaikan draf rusak
    }
  }, []);

  // Autosave draf form tambah sesi
  useEffect(() => {
    if (!isAdding && !form.jam_ke) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form, isAdding }),
      );
    } catch {
      // Abaikan kuota penuh
    }
  }, [form, isAdding]);

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jam_ke || !form.waktu_mulai || !form.waktu_selesai) {
      Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Jam ke-, waktu mulai, dan waktu selesai wajib diisi.",
        confirmButtonColor: "#550000",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/master/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jam_ke: Number.parseInt(form.jam_ke, 10),
          waktu_mulai: form.waktu_mulai,
          waktu_selesai: form.waktu_selesai,
          durasi_menit: Number.parseInt(form.durasi_menit, 10) || 40,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal menyimpan sesi waktu");
      }
      localStorage.removeItem(DRAFT_KEY);
      setIsAdding(false);
      setForm({
        jam_ke: "",
        waktu_mulai: "07:00",
        waktu_selesai: "07:40",
        durasi_menit: "40",
      });
      await loadData();
      Swal.fire({
        icon: "success",
        title: "Sesi Ditambahkan",
        text: "Slot jam pelajaran berhasil disimpan dan tersinkron ke jadwal KBM.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menambah Sesi",
        text: msg,
        confirmButtonColor: "#550000",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row: MasterSesiRow) => {
    setEditingId(row.id);
    setEditForm({
      jam_ke: String(row.jam_ke),
      waktu_mulai: row.waktu_mulai,
      waktu_selesai: row.waktu_selesai,
      durasi_menit: String(row.durasi_menit),
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.jam_ke || !editForm.waktu_mulai || !editForm.waktu_selesai) {
      Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Semua kolom waktu wajib diisi.",
        confirmButtonColor: "#550000",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/master/sesi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          jam_ke: Number.parseInt(editForm.jam_ke, 10),
          waktu_mulai: editForm.waktu_mulai,
          waktu_selesai: editForm.waktu_selesai,
          durasi_menit: Number.parseInt(editForm.durasi_menit, 10) || 40,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal memperbarui sesi waktu");
      }
      setEditingId(null);
      await loadData();
      Swal.fire({
        icon: "success",
        title: "Sesi Diperbarui",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Memperbarui",
        text: msg,
        confirmButtonColor: "#550000",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: MasterSesiRow) => {
    Swal.fire({
      title: `Hapus Sesi Jam ke-${row.jam_ke}?`,
      text: "Penghapusan ini akan menghilangkan slot jam dari daftar master sesi.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(
          `/api/master/sesi?id=${encodeURIComponent(row.id)}`,
          { method: "DELETE" },
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Gagal menghapus sesi");
        }
        await loadData();
        Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: `Sesi jam ke-${row.jam_ke} telah dihapus.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: msg,
          confirmButtonColor: "#550000",
        });
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:p-6">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Link
              href="/master"
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-[#fcfaf8] px-2.5 py-1 text-xs font-semibold text-[#44403c] transition-colors duration-150 hover:bg-[#f6f1e8]"
            >
              <ArrowLeft size={14} /> Master Data
            </Link>
            <Link
              href="/kurikulum/jadwal"
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-[#fcfaf8] px-2.5 py-1 text-xs font-semibold text-[#550000] transition-colors duration-150 hover:bg-[#f6f1e8]"
            >
              <CalendarDays size={14} /> Pusat Jadwal Pelajaran
            </Link>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-[#550000]">
            <Clock size={24} className="text-[#550000]" /> Master Sesi Waktu KBM
          </h1>
          <p className="mt-1 text-sm text-[#44403c]">
            Pengaturan slot jam pelajaran resmi yang tersinkron langsung ke jadwal KBM dan form jurnal mengajar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2 text-xs font-semibold text-[#1a1a1a] transition-colors duration-150 hover:bg-[#f6f1e8] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Muat Ulang
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000] active:scale-[0.98]"
            >
              {isAdding ? <X size={15} /> : <Plus size={15} />}
              {isAdding ? "Tutup Form" : "Tambah Sesi"}
            </button>
          )}
        </div>
      </div>

      {/* Form Tambah Sesi */}
      {isAdding && canManage && (
        <form
          onSubmit={handleSaveNew}
          className="rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs"
        >
          <div className="mb-4 flex items-center justify-between border-b border-[#f0ece4] pb-3">
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              Tambah Slot Jam Pelajaran Baru
            </h2>
            <span className="rounded-[8px] bg-[#faf6ee] px-2.5 py-1 text-xs font-medium text-[#550000]">
              Draf tersimpan otomatis
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Jam Ke-
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.jam_ke}
                onChange={(e) => setForm({ ...form, jam_ke: e.target.value })}
                placeholder="Misal: 10"
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2 text-sm tabular-nums text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Waktu Mulai
              </label>
              <input
                type="time"
                value={form.waktu_mulai}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    waktu_mulai: val,
                    durasi_menit: String(
                      calcDurationMinutes(val, form.waktu_selesai),
                    ),
                  });
                }}
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2 text-sm tabular-nums text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Waktu Selesai
              </label>
              <input
                type="time"
                value={form.waktu_selesai}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    waktu_selesai: val,
                    durasi_menit: String(
                      calcDurationMinutes(form.waktu_mulai, val),
                    ),
                  });
                }}
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2 text-sm tabular-nums text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#44403c]">
                Durasi (Menit)
              </label>
              <input
                type="number"
                min={10}
                max={240}
                value={form.durasi_menit}
                onChange={(e) =>
                  setForm({ ...form, durasi_menit: e.target.value })
                }
                className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3.5 py-2 text-sm tabular-nums text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(DRAFT_KEY);
                setForm({
                  jam_ke: "",
                  waktu_mulai: "07:00",
                  waktu_selesai: "07:40",
                  durasi_menit: "40",
                });
                setIsAdding(false);
              }}
              className="cursor-pointer rounded-[10px] border border-[#e7e2da] bg-white px-4 py-2 text-xs font-semibold text-[#44403c] transition-colors duration-150 hover:bg-[#f6f1e8]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Simpan Sesi
            </button>
          </div>
        </form>
      )}

      {/* Tabel Sesi Waktu */}
      <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ece4] px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a]">
              Daftar Sesi Jam Pelajaran
            </h2>
            <p className="text-xs text-[#44403c]">
              Sesi 1–2 untuk program Diniyah Subuh; Sesi 3–9 untuk KBM Kelas Reguler (07:00–12:00 WIB).
            </p>
          </div>
          <span className="rounded-full bg-[#faf6ee] px-3 py-1 text-xs font-semibold tabular-nums text-[#550000]">
            {sesi.length} Sesi Terdaftar
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-sm text-[#44403c]">
            <Loader2 size={18} className="animate-spin text-[#550000]" />
            Memuat daftar sesi waktu...
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e7e2da] bg-[#faf6ee] text-[#1a1a1a]">
                  <th className="px-4 py-2.5 font-semibold">Jam Ke</th>
                  <th className="px-4 py-2.5 font-semibold">Rentang Waktu</th>
                  <th className="px-4 py-2.5 text-center font-semibold">
                    Durasi
                  </th>
                  <th className="px-4 py-2.5 font-semibold">Kategori</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  {canManage && (
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sesi.map((s) => {
                  const isEditing = editingId === s.id;
                  const isSubuh = s.jam_ke <= 2;

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-[#f0ece4] transition-colors duration-150 hover:bg-[#faf6ee]"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.jam_ke}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                jam_ke: e.target.value,
                              })
                            }
                            className="w-20 rounded-[8px] border border-[#550000] px-2.5 py-1 text-xs font-semibold tabular-nums"
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#fdf5f5] px-3 py-1 text-xs font-semibold tabular-nums text-[#550000]">
                            Jam ke-{s.jam_ke}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap font-semibold tabular-nums text-[#1a1a1a]">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={editForm.waktu_mulai}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditForm({
                                  ...editForm,
                                  waktu_mulai: val,
                                  durasi_menit: String(
                                    calcDurationMinutes(
                                      val,
                                      editForm.waktu_selesai,
                                    ),
                                  ),
                                });
                              }}
                              className="rounded-[8px] border border-[#550000] px-2 py-1 text-xs tabular-nums"
                            />
                            <span className="text-xs text-[#44403c]">–</span>
                            <input
                              type="time"
                              value={editForm.waktu_selesai}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditForm({
                                  ...editForm,
                                  waktu_selesai: val,
                                  durasi_menit: String(
                                    calcDurationMinutes(
                                      editForm.waktu_mulai,
                                      val,
                                    ),
                                  ),
                                });
                              }}
                              className="rounded-[8px] border border-[#550000] px-2 py-1 text-xs tabular-nums"
                            />
                          </div>
                        ) : (
                          `${s.waktu_mulai} – ${s.waktu_selesai} WIB`
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-center whitespace-nowrap tabular-nums text-[#44403c]">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.durasi_menit}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                durasi_menit: e.target.value,
                              })
                            }
                            className="w-20 rounded-[8px] border border-[#550000] px-2 py-1 text-center text-xs tabular-nums"
                          />
                        ) : (
                          `${s.durasi_menit} Menit`
                        )}
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isSubuh
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isSubuh ? "Sesi Pagi / Halaqoh" : "KBM Reguler"}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Aktif
                        </span>
                      </td>

                      {canManage && (
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(s.id)}
                                disabled={saving}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                <Check size={13} /> Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-white px-2.5 py-1 text-xs font-semibold text-[#44403c] hover:bg-[#f6f1e8]"
                              >
                                <X size={13} /> Batal
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(s)}
                                title="Edit waktu sesi"
                                className="cursor-pointer rounded-[8px] p-1.5 text-amber-700 transition-colors duration-150 hover:bg-amber-50"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(s)}
                                title="Hapus sesi"
                                className="cursor-pointer rounded-[8px] p-1.5 text-rose-700 transition-colors duration-150 hover:bg-rose-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
