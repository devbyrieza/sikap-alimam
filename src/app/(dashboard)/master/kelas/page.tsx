"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash2, Edit2, Save, X, CheckCircle, AlertCircle, Sparkles, BookOpen, Users, Layers } from "lucide-react";
import Swal from "sweetalert2";

interface KelasItem {
  id: string;
  nama: string;
  jenjang: string | null;
  is_active: boolean;
  wali_kelas?: { id: string; nama_lengkap: string } | null;
  _count?: {
    santri: number;
    MataPelajaran: number;
  };
}

export default function MasterKelasPage() {
  const [kelas, setKelas] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [guruList, setGuruList] = useState<{id: string, nama_lengkap: string}[]>([]);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", jenjang: "MTs", is_active: true, wali_kelas_id: "" });
  const [editForm, setEditForm] = useState({ nama: "", jenjang: "MTs", is_active: true, wali_kelas_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchKelas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master/kelas?all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.kelas)) {
        setKelas(data.kelas);
      } else {
        console.error("Format data kelas tidak valid:", data);
      }
    } catch (err) {
      console.error("Gagal memuat data kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuruList = async () => {
    try {
      const res = await fetch("/api/master/guru");
      const data = await res.json();
      setGuruList(data);
    } catch (err) {
      console.error("Gagal memuat data guru:", err);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchGuruList();
  }, []);

  const handleAdd = async () => {
    if (!form.nama.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama kelas wajib diisi (misal: 7 MTs, 8 MTs, IL, 10 MA).",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/master/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan kelas");
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Kelas "${form.nama}" berhasil didaftarkan!`,
        confirmButtonColor: "#7c1010",
      });
      setForm({ nama: "", jenjang: "MTs", is_active: true, wali_kelas_id: "" });
      setIsAdding(false);
      fetchKelas();
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

  const handleStartEdit = (k: KelasItem) => {
    setEditingId(k.id);
    setEditForm({
      nama: k.nama,
      jenjang: k.jenjang || "MTs",
      is_active: k.is_active,
      wali_kelas_id: k.wali_kelas?.id || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.nama.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Nama kelas tidak boleh kosong.",
        confirmButtonColor: "#7c1010",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/master/kelas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui kelas");
      }

      Swal.fire({
        icon: "success",
        title: "Tersimpan",
        text: "Perubahan kelas berhasil disimpan.",
        confirmButtonColor: "#7c1010",
        timer: 1500,
        showConfirmButton: false,
      });
      setEditingId(null);
      fetchKelas();
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

  const handleToggleActive = async (k: KelasItem) => {
    try {
      const nextStatus = !k.is_active;
      const res = await fetch(`/api/master/kelas/${k.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchKelas();
    } catch (err: any) {
      Swal.fire("Gagal", err.message, "error");
    }
  };

  const handleDelete = async (k: KelasItem) => {
    const result = await Swal.fire({
      title: `Hapus Kelas ${k.nama}?`,
      text: "Jika kelas memiliki santri atau mata pelajaran terkait, statusnya akan dinonaktifkan demi keamanan data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus/Nonaktifkan",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/master/kelas/${k.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        Swal.fire({
          icon: "success",
          title: "Selesai",
          text: data.message || "Kelas berhasil diproses.",
          confirmButtonColor: "#7c1010",
        });
        fetchKelas();
      } catch (err: any) {
        Swal.fire("Gagal", err.message, "error");
      }
    }
  };

  const stats = {
    total: kelas.length,
    aktif: kelas.filter((k) => k.is_active).length,
    totalSantri: kelas.reduce((sum, k) => sum + (k._count?.santri || 0), 0),
    totalMapel: kelas.reduce((sum, k) => sum + (k._count?.MataPelajaran || 0), 0),
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          color: "white",
          padding: "28px 32px",
          borderRadius: 20,
          boxShadow: "0 12px 30px rgba(124, 16, 16, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <GraduationCap size={28} color="#fca5a5" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "white" }}>
              Master Data Kelas
            </h1>
          </div>
          <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
            Kelola tingkatan kelas aktif, penjenjangan (MTs, IL, MA), serta konfigurasi akademik santri.
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
            color: "var(--primary-dark)",
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
          {isAdding ? "Tutup Form" : "Tambah Kelas Baru"}
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Kelas
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>
            {stats.total} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Tingkat</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Kelas Aktif
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
            {stats.aktif} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Kelas</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Santri Aktif
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>
            {stats.totalSantri} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Santri</span>
          </div>
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Mapel Terdistribusi
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
            {stats.totalMapel} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Mapel</span>
          </div>
        </div>
      </div>

      {/* Form Tambah Kelas */}
      {isAdding && (
        <div
          className="card"
          style={{
            padding: "24px 28px",
            borderRadius: 16,
            border: "2px solid var(--secondary)",
            background: "#fffdf9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--primary-dark)" }}>
              Pendaftaran Kelas Baru (Admin Super)
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              alignItems: "flex-end",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Nama Kelas *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: 7 MTs, 8 MTs, IL, 10 MA"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Jenjang Pendidikan
              </label>
              <select
                className="form-control"
                value={form.jenjang}
                onChange={(e) => setForm({ ...form, jenjang: e.target.value })}
              >
                <option value="MTs">Madrasah Tsanawiyah (MTs)</option>
                <option value="Islamiyah">Islamiyah / I'dad Lughowy (IL)</option>
                <option value="MA">Madrasah Aliyah (MA)</option>
                <option value="Umum">Umum / Lainnya</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Status Langsung Aktif?
              </label>
              <select
                className="form-control"
                value={form.is_active ? "true" : "false"}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
              >
                <option value="true">Aktif (Dapat digunakan di Jurnal/Nilai)</option>
                <option value="false">Nonaktif (Draft / Arsip)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Wali Kelas (Opsional)
              </label>
              <select
                className="form-control"
                value={form.wali_kelas_id}
                onChange={(e) => setForm({ ...form, wali_kelas_id: e.target.value })}
              >
                <option value="">-- Pilih Wali Kelas --</option>
                {guruList.map(g => (
                  <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleAdd}
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Save size={16} />
                {submitting ? "Menyimpan..." : "Simpan Kelas"}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn btn-ghost"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
            Daftar Kelas Terdaftar ({kelas.length})
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Urutan otomatis: MTs (7,8,9) → IL → MA (10,11,12)
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Memuat daftar kelas...
          </div>
        ) : kelas.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Belum ada data kelas yang terdaftar.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: "center" }}>No</th>
                  <th>Nama Kelas</th>
                  <th>Jenjang</th>
                  <th>Wali Kelas</th>
                  <th style={{ textAlign: "center" }}>Jumlah Santri</th>
                  <th style={{ textAlign: "center" }}>Jumlah Mapel</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelas.map((k, idx) => {
                  const isEditing = editingId === k.id;

                  return (
                    <tr key={k.id} style={{ background: isEditing ? "#fff9f0" : undefined }}>
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
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: "rgba(124, 16, 16, 0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--primary)",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {k.nama.slice(0, 2)}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>
                              {k.nama}
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="form-control"
                            value={editForm.jenjang}
                            onChange={(e) => setEditForm({ ...editForm, jenjang: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          >
                            <option value="MTs">MTs</option>
                            <option value="Islamiyah">Islamiyah (IL)</option>
                            <option value="MA">MA</option>
                            <option value="Umum">Umum</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: "rgba(0,0,0,0.06)",
                              color: "var(--text-main)",
                            }}
                          >
                            {k.jenjang || "MTs"}
                          </span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            className="form-control"
                            value={editForm.wali_kelas_id}
                            onChange={(e) => setEditForm({ ...editForm, wali_kelas_id: e.target.value })}
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          >
                            <option value="">- Belum Ada -</option>
                            {guruList.map(g => (
                              <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ fontSize: 13, color: k.wali_kelas ? "var(--text-main)" : "var(--text-muted)", fontWeight: 500 }}>
                            {k.wali_kelas?.nama_lengkap || "- Belum Ada -"}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: "#2563eb" }}>
                          {k._count?.santri || 0} Santri
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: "#d97706" }}>
                          {k._count?.MataPelajaran || 0} Mapel
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {isEditing ? (
                          <select
                            className="form-control"
                            value={editForm.is_active ? "true" : "false"}
                            onChange={(e) =>
                              setEditForm({ ...editForm, is_active: e.target.value === "true" })
                            }
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          >
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(k)}
                            style={{
                              border: "none",
                              cursor: "pointer",
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: k.is_active ? "#dcfce7" : "#fee2e2",
                              color: k.is_active ? "#15803d" : "#b91c1c",
                              transition: "all 0.2s",
                            }}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {k.is_active ? "● Aktif" : "○ Nonaktif"}
                          </button>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              onClick={() => handleSaveEdit(k.id)}
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
                              onClick={() => handleStartEdit(k)}
                              className="btn btn-ghost btn-sm"
                              title="Edit Kelas"
                              style={{ padding: "6px 10px" }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(k)}
                              className="btn btn-ghost btn-sm"
                              title="Hapus atau Nonaktifkan Kelas"
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
