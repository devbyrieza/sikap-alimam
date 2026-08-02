"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Trash2, Edit2, Save, X, Filter, Sparkles, Layers, Tag } from "lucide-react";
import Swal from "sweetalert2";

interface KelasItem {
  id: string;
  nama: string;
  jenjang: string | null;
}

interface MapelItem {
  id: string;
  nama: string;
  nama_arab: string | null;
  kategori: string;
  kelas_id: string;
  is_active: boolean;
  kelas: KelasItem;
}

export default function MasterMapelPage() {
  const [mapel, setMapel] = useState<MapelItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterKelasId, setFilterKelasId] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
  const [editForm, setEditForm] = useState({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mapelRes, kelasRes] = await Promise.all([
        fetch("/api/master/mapel"),
        fetch("/api/master/kelas"),
      ]);

      const mapelData = await mapelRes.json();
      const kelasData = await kelasRes.json();

      if (mapelData.mapel) setMapel(mapelData.mapel);
      if (kelasData.kelas) setKelasList(kelasData.kelas);
    } catch (err) {
      console.error("Gagal memuat data mapel/kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!form.nama.trim() || !form.kelas_id) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama Mata Pelajaran dan Tingkat Kelas wajib diisi.",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/master/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftarkan mata pelajaran");
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Mata Pelajaran "${form.nama}" berhasil didaftarkan!`,
        confirmButtonColor: "#7c1010",
      });

      setForm({ nama: "", nama_arab: "", kategori: "umum", kelas_id: "" });
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#7c1010",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (m: MapelItem) => {
    setEditingId(m.id);
    setEditForm({
      nama: m.nama,
      nama_arab: m.nama_arab || "",
      kategori: m.kategori || "umum",
      kelas_id: m.kelas_id,
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.nama.trim() || !editForm.kelas_id) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama mapel dan kelas tidak boleh kosong.",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/master/mapel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data");
      }

      Swal.fire({
        icon: "success",
        title: "Tersimpan",
        text: "Perubahan mata pelajaran berhasil disimpan.",
        confirmButtonColor: "#7c1010",
        timer: 1500,
        showConfirmButton: false,
      });
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.message,
        confirmButtonColor: "#7c1010",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: MapelItem) => {
    const result = await Swal.fire({
      title: `Hapus Mapel ${m.nama}?`,
      text: `Mata pelajaran kelas ${m.kelas?.nama} akan dihapus/dinonaktifkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/master/mapel/${m.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        Swal.fire({
          icon: "success",
          title: "Selesai",
          text: data.message || "Mata pelajaran berhasil dihapus.",
          confirmButtonColor: "#7c1010",
        });
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.message, "error");
      }
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case "syariah":
        return (
          <span
            style={{
              background: "#dcfce7",
              color: "#15803d",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Ilmu Syari'ah
          </span>
        );
      case "bahasa":
        return (
          <span
            style={{
              background: "#fef3c7",
              color: "#b45309",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Bahasa Arab
          </span>
        );
      default:
        return (
          <span
            style={{
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Ilmu Umum
          </span>
        );
    }
  };

  const filteredMapel = useMemo(() => {
    return mapel.filter((m) => {
      if (filterKelasId && m.kelas_id !== filterKelasId) return false;
      if (filterKategori && m.kategori !== filterKategori) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNama = m.nama.toLowerCase().includes(q);
        const matchArab = m.nama_arab?.toLowerCase().includes(q);
        if (!matchNama && !matchArab) return false;
      }
      return true;
    });
  }, [mapel, filterKelasId, filterKategori, searchQuery]);

  return (
    <div style={{ padding: "24px 28px" }} className="space-y-6">
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #b45309, #78350f)",
          color: "white",
          padding: "28px 32px",
          borderRadius: 20,
          boxShadow: "0 12px 30px rgba(180, 83, 9, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BookOpen size={28} color="#fde68a" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "white" }}>
              Master Mata Pelajaran (Mapel)
            </h1>
          </div>
          <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
            Kelola kurikulum, pengelompokan mapel (Syariah, Bahasa, Umum), nama cetak rapor Arab, dan distribusi kelas.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
          }}
          className="btn"
          style={{
            background: "white",
            color: "#78350f",
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? "Tutup Form" : "Tambah Mapel Baru"}
        </button>
      </div>

      {/* Form Tambah Mapel */}
      {isAdding && (
        <div
          className="card"
          style={{
            padding: "24px 28px",
            borderRadius: 16,
            border: "2px solid #fde68a",
            background: "#fffdf5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Sparkles size={20} color="#b45309" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#78350f" }}>
              Pendaftaran Mata Pelajaran Baru (Admin Super)
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Nama Mata Pelajaran *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: Fiqh, Nahwu, Matematika"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Nama Arab (Untuk Cetak Rapor)
              </label>
              <input
                type="text"
                className="form-control font-arabic text-lg"
                dir="rtl"
                placeholder="الفقه"
                value={form.nama_arab}
                onChange={(e) => setForm({ ...form, nama_arab: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Kelompok / Kategori *
              </label>
              <select
                className="form-control"
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                <option value="syariah">Ilmu Syari'ah</option>
                <option value="bahasa">Ilmu Bahasa Arab</option>
                <option value="umum">Ilmu Pengetahuan Umum</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Tingkat Kelas Pengampu *
              </label>
              <select
                className="form-control"
                value={form.kelas_id}
                onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn btn-ghost"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="btn"
              style={{
                background: "#b45309",
                color: "white",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={16} />
              {submitting ? "Menyimpan..." : "Simpan Mata Pelajaran"}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-end",
          padding: "16px 20px",
        }}
      >
        <div className="form-group" style={{ marginBottom: 0, minWidth: 200, flex: 1 }}>
          <label className="form-label">Cari Nama Mapel</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ketik nama mapel / Arab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="form-label">Filter Kelas</label>
          <select
            className="form-control"
            value={filterKelasId}
            onChange={(e) => setFilterKelasId(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="form-label">Filter Kategori</label>
          <select
            className="form-control"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="syariah">Ilmu Syari'ah</option>
            <option value="bahasa">Ilmu Bahasa Arab</option>
            <option value="umum">Ilmu Pengetahuan Umum</option>
          </select>
        </div>

        {(searchQuery || filterKelasId || filterKategori) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 0 }}
            onClick={() => {
              setSearchQuery("");
              setFilterKelasId("");
              setFilterKategori("");
            }}
          >
            Reset Filter
          </button>
        )}

        <div
          style={{
            marginLeft: "auto",
            fontSize: 13,
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {filteredMapel.length} mata pelajaran ditampilkan
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Memuat data mata pelajaran...
          </div>
        ) : filteredMapel.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Tidak ada data mata pelajaran yang sesuai filter.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: "center" }}>No</th>
                  <th>Mata Pelajaran</th>
                  <th style={{ textAlign: "right" }}>Nama Arab (Rapor)</th>
                  <th style={{ textAlign: "center" }}>Kelompok / Kategori</th>
                  <th style={{ textAlign: "center" }}>Tingkat Kelas</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMapel.map((m, idx) => {
                  const isEditing = editingId === m.id;

                  return (
                    <tr key={m.id} style={{ background: isEditing ? "#fffbf0" : undefined }}>
                      <td style={{ textAlign: "center", fontWeight: 600, color: "var(--text-muted)" }}>
                        {idx + 1}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.nama}
                            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 14 }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>
                            {m.nama}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            dir="rtl"
                            className="form-control font-arabic"
                            value={editForm.nama_arab}
                            onChange={(e) => setEditForm({ ...editForm, nama_arab: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 15 }}
                          />
                        ) : (
                          <span className="font-arabic" style={{ fontSize: 16, color: "#92400e", fontWeight: 600 }}>
                            {m.nama_arab || "-"}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {isEditing ? (
                          <select
                            className="form-control"
                            value={editForm.kategori}
                            onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          >
                            <option value="syariah">Ilmu Syari'ah</option>
                            <option value="bahasa">Ilmu Bahasa Arab</option>
                            <option value="umum">Ilmu Pengetahuan Umum</option>
                          </select>
                        ) : (
                          getKategoriBadge(m.kategori)
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {isEditing ? (
                          <select
                            className="form-control"
                            value={editForm.kelas_id}
                            onChange={(e) => setEditForm({ ...editForm, kelas_id: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          >
                            {kelasList.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.nama}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            style={{
                              background: "rgba(124, 16, 16, 0.08)",
                              color: "var(--primary-dark)",
                              padding: "3px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {m.kelas?.nama || "-"}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              onClick={() => handleSaveEdit(m.id)}
                              disabled={submitting}
                              className="btn btn-primary btn-sm"
                              style={{ padding: "6px 12px" }}
                            >
                              <Save size={14} /> Simpan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "6px 10px" }}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              onClick={() => handleStartEdit(m)}
                              className="btn btn-ghost btn-sm"
                              title="Edit Mata Pelajaran"
                              style={{ padding: "6px 10px" }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="btn btn-ghost btn-sm"
                              title="Hapus Mata Pelajaran"
                              style={{ padding: "6px 10px", color: "#dc2626" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
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
