"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Save, AlertCircle, FileText } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QURAN_SURAH } from "@/lib/quran";
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
        Swal.fire({ title: "Berhasil", text: "Catatan Tahfidz berhasil disimpan.", icon: "success", confirmButtonColor: "#0f172a" });
      } else {
        Swal.fire({ title: "Gagal", text: data.error || "Gagal menyimpan.", icon: "error", confirmButtonColor: "#0f172a" });
      }
    } catch (err) {
      Swal.fire({ title: "Gagal", text: "Terjadi kesalahan koneksi.", icon: "error", confirmButtonColor: "#0f172a" });
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Back & Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button 
          onClick={() => router.push("/tahfidz/mutabaah")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            color: "#475569",
            height: "44px",
            width: "44px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tahfidz</span>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", margin: 0, lineHeight: 1.2 }}>Detail Perkembangan Santri</h2>
        </div>
      </div>

      {/* Student Profile Card (Premium Hero Banner) */}
      {studentInfo && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #f59e0b 100%)",
          borderRadius: "24px",
          padding: "32px 36px",
          color: "white",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
        }}>
          <div>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#fcd34d", fontWeight: 600, marginBottom: "4px" }}>Nama Santri</div>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{studentInfo.nama_lengkap}</h1>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "15px", color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
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
            style={{
              background: "white",
              color: "#0f172a",
              padding: "14px 24px",
              borderRadius: "14px",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              transition: "transform 0.2s"
            }}
          >
            <Plus size={20} /> Tambah Setoran
          </button>
        </div>
      )}

      {/* History Log */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: "bold", color: "#1e293b", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <FileText color="#f59e0b" size={24} /> Riwayat Mutabaah Tahfidz
          </h3>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: "10px" }}>
            Total Rekaman: {records.length}
          </span>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <AlertCircle style={{ margin: "0 auto 16px", color: "#cbd5e1" }} size={48} />
            <h4 style={{ fontWeight: "bold", color: "#334155", fontSize: "18px", margin: 0 }}>Belum ada riwayat setoran</h4>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>Silakan klik tombol Tambah Setoran untuk mencatat hafalan baru.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textIndent: 0, borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "13px", fontWeight: "bold" }}>
                <tr>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Tanggal</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Kategori</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Batas Setoran</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Hal</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Nilai</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Catatan / Keterangan</th>
                  <th style={{ padding: "16px 20px", textAlign: "left" }}>Musyrif</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr 
                    key={r.id} 
                    style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafafa", transition: "background 0.2s ease-in-out" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"} 
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa"}
                  >
                    <td style={{ padding: "16px 20px", fontWeight: 500, color: "#475569" }}>
                      {new Date(r.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ 
                        padding: "6px 12px", 
                        borderRadius: "12px", 
                        fontSize: "13px", 
                        fontWeight: "bold", 
                        border: "1px solid",
                        textTransform: "capitalize",
                        ...(r.jenis === "ziyadah" 
                          ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#dbeafe" }
                          : r.jenis === "murojaah"
                          ? { background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }
                          : { background: "#ecfdf5", color: "#047857", borderColor: "#d1fae5" }
                        )
                      }}>
                        {r.jenis}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "#1e293b" }}>
                      {r.surat_dari} (Ayat {r.ayat_dari}) 
                      {r.surat_ke && ` s.d ${r.surat_ke} (Ayat ${r.ayat_ke})`}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "#334155" }}>{r.halaman || "-"}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "#0f172a" }}>{r.nilai || "-"}</td>
                    <td style={{ padding: "16px 20px", color: "#64748b", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.keterangan || "-"}</td>
                    <td style={{ padding: "16px 20px", color: "#475569", fontWeight: 500 }}>{r.pegawai?.nama_lengkap || "Sistem"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #f1f5f9", width: "100%", maxWidth: "500px", overflow: "hidden" }}>
            {/* Modal Header */}
            <div style={{ background: "#0f172a", color: "white", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontWeight: "bold", fontSize: "18px", margin: 0 }}>Catat Mutabaah Tahfidz</h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>Input perkembangan Al-Quran santri</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "8px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Kategori</label>
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", textTransform: "capitalize", backgroundColor: "white" }}
                  >
                    <option value="ziyadah">Ziyadah</option>
                    <option value="murojaah">Murojaah</option>
                    <option value="tilawah">Tilawah</option>
                  </select>
                </div>
              </div>

              {/* Start Range */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <div style={{ gridColumn: "span 2", fontSize: "12px", fontWeight: "bold", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>Batas Mulai (Dari)</div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Surat</label>
                  <select
                    value={form.surat_dari}
                    onChange={(e) => setForm({ ...form, surat_dari: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", backgroundColor: "white" }}
                  >
                    {QURAN_SURAH.map((s) => (
                      <option key={s.number} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Ayat</label>
                  <select
                    value={form.ayat_dari}
                    onChange={(e) => setForm({ ...form, ayat_dari: parseInt(e.target.value) })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", backgroundColor: "white" }}
                  >
                    {Array.from({ length: suratDariVerses }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Range (Optional) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f0fdf4", padding: "16px", borderRadius: "16px", border: "1px solid #dcfce7" }}>
                <div style={{ gridColumn: "span 2", fontSize: "12px", fontWeight: "bold", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>Batas Akhir (Sampai - Opsional)</div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Surat</label>
                  <select
                    value={form.surat_ke}
                    onChange={(e) => setForm({ ...form, surat_ke: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", backgroundColor: "white" }}
                  >
                    <option value="">Pilih Surat...</option>
                    {QURAN_SURAH.map((s) => (
                      <option key={s.number} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Ayat</label>
                  <select
                    disabled={!form.surat_ke}
                    value={String(form.ayat_ke)}
                    onChange={(e) => setForm({ ...form, ayat_ke: e.target.value ? parseInt(e.target.value) : "" })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", backgroundColor: form.surat_ke ? "white" : "#f1f5f9", color: form.surat_ke ? "#0f172a" : "#94a3b8" }}
                  >
                    <option value="">Pilih Ayat...</option>
                    {Array.from({ length: suratKeVerses }, (_, i) => i + 1).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Halaman & Nilai */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Jumlah Halaman</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 2"
                    value={form.halaman}
                    onChange={(e) => setForm({ ...form, halaman: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Nilai</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Contoh: 85.5"
                    value={form.nilai}
                    onChange={(e) => setForm({ ...form, nilai: e.target.value })}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Catatan / Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Ketik catatan di sini..."
                  rows={2}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: "#f1f5f9", color: "#475569", padding: "12px 20px", borderRadius: "12px", fontWeight: 600, border: "none", cursor: "pointer", fontSize: "14px" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                >
                  <Save size={18} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
