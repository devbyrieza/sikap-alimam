"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  ClipboardCheck,
  Loader2,
  Save,
  Users,
  CheckCircle,
  BookOpen,
  Lightbulb,
} from "lucide-react";

type Kelas = { id: string; nama: string; jenjang: string | null };

type Capaian = {
  id?: string;
  jenis: string;
  surat: string;
  halaman: string;
  ayat: string;
  nilai: string;
  keterangan: string;
};

type SantriTahfidz = {
  id: string;
  nama_lengkap: string;
  nis: string | null;
  capaian: any[];
};

const JENIS_SETORAN = [
  { value: "", label: "— Pilih Setoran —" },
  { value: "ziyadah", label: "Ziyadah" },
  { value: "murojaah_harian", label: "Murojaah Harian" },
  { value: "murojaah_pekanan", label: "Murojaah Pekanan" },
  { value: "ujian_pekanan", label: "Ujian Pekanan" },
  { value: "ujian_juz", label: "Ujian Juz" },
];

export default function TahfidzPage() {
  const today = new Date().toISOString().split("T")[0];

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const [selectedKelas, setSelectedKelas] = useState("");
  const [tanggal, setTanggal] = useState(today);

  const [santri, setSantri] = useState<SantriTahfidz[]>([]);
  
  // State Input per Santri (Map)
  const [inputData, setInputData] = useState<Record<string, Capaian>>({});
  
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load kelas list from master
  useEffect(() => {
    fetch("/api/master")
      .then((r) => r.json())
      .then((data) => {
        setKelasList(data.kelas || []);
        setLoadingMaster(false);
      })
      .catch(() => {
        setLoadingMaster(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data master kelas.",
          confirmButtonColor: "var(--primary)",
        });
      });
  }, []);

  // AUTOSAVE: Load Draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("tahfidz_form_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.kelas === selectedKelas && parsed.tanggal === tanggal) {
          setInputData(parsed.data);
        }
      }
    } catch (e) {
      console.error("Gagal parse draft", e);
    }
  }, [selectedKelas, tanggal]);

  // AUTOSAVE: Save to localStorage whenever inputData changes
  useEffect(() => {
    if (Object.keys(inputData).length > 0) {
      localStorage.setItem(
        "tahfidz_form_draft",
        JSON.stringify({
          kelas: selectedKelas,
          tanggal: tanggal,
          data: inputData,
        })
      );
    }
  }, [inputData, selectedKelas, tanggal]);

  // Load santri + existing tahfidz
  const loadTahfidz = useCallback(async () => {
    if (!selectedKelas || !tanggal) return;

    setLoadingSantri(true);
    setSantri([]);
    
    try {
      const res = await fetch(
        `/api/tahfidz?kelas_id=${selectedKelas}&tanggal=${tanggal}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const data: SantriTahfidz[] = json.data || [];
      setSantri(data);

      const draftStr = localStorage.getItem("tahfidz_form_draft");
      let draftData: Record<string, Capaian> = {};
      if (draftStr) {
        try {
          const parsed = JSON.parse(draftStr);
          if (parsed.kelas === selectedKelas && parsed.tanggal === tanggal) {
            draftData = parsed.data;
          }
        } catch (e) {}
      }

      const map: Record<string, Capaian> = { ...draftData };
      
      data.forEach((s) => {
        if (!map[s.id] && s.capaian && s.capaian.length > 0) {
          const c = s.capaian[0];
          map[s.id] = {
            id: c.id,
            jenis: c.jenis,
            surat: c.surat,
            halaman: c.halaman || "",
            ayat: c.ayat || "",
            nilai: c.nilai ? String(c.nilai) : "",
            keterangan: c.keterangan || "",
          };
        } else if (!map[s.id]) {
          map[s.id] = {
            jenis: "",
            surat: "",
            halaman: "",
            ayat: "",
            nilai: "",
            keterangan: "",
          };
        }
      });
      setInputData(map);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setLoadingSantri(false);
    }
  }, [selectedKelas, tanggal]);

  useEffect(() => {
    if (selectedKelas && tanggal) {
      loadTahfidz();
    }
  }, [selectedKelas, tanggal, loadTahfidz]);

  const handleInputChange = (santriId: string, field: keyof Capaian, value: string) => {
    setInputData((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: value,
      },
    }));
  };

  const handleSimpan = async () => {
    if (!selectedKelas || !tanggal || santri.length === 0) return;

    const validDataToSave = Object.entries(inputData)
      .filter(([_, data]) => data.jenis && data.surat.trim() !== "")
      .map(([santriId, data]) => ({
        santri_id: santriId,
        ...data,
      }));

    if (validDataToSave.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Belum ada data",
        text: "Silakan isi minimal 'Jenis Setoran' dan 'Nama Surat' untuk beberapa santri sebelum menyimpan.",
        confirmButtonColor: "#0f172a",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Simpan Jurnal Tahfidz?",
      text: `Menyimpan setoran tahfidz untuk ${validDataToSave.length} santri pada tanggal ${tanggal}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f172a",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch("/api/tahfidz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asatidz_id: "00000000-0000-0000-0000-000000000000",
          tanggal,
          data: validDataToSave,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan");

      localStorage.removeItem("tahfidz_form_draft");

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "success",
        title: "Capaian tahfidz berhasil disimpan!",
      });
      
      loadTahfidz();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setSaving(false);
    }
  };

  const sudahSetor = Object.values(inputData).filter((d) => d.jenis && d.surat.trim() !== "").length;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Premium Hero Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        color: "white",
        boxShadow: "0 10px 30px rgba(85, 0, 0, 0.35)"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={28} /> Jurnal Tahfidz
          </h1>
          <p style={{ marginTop: "8px", opacity: 0.9, fontSize: "16px" }}>Input capaian harian, ziyadah, dan ujian hafalan santri</p>
        </div>
      </div>

      {/* Step 1: Pilih Kelas & Tanggal */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "18px", color: "#1e293b" }}>
          <Users size={20} style={{ color: "#f59e0b" }} />
          Pilih Kelas &amp; Tanggal
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 items-end">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px", color: "#475569" }}>Kelas</label>
            {loadingMaster ? (
              <div style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 8, padding: "10px" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Memuat...
              </div>
            ) : (
              <select
                style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%" }}
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
              >
                <option value="">— Pilih Kelas / Halaqah —</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}{k.jenjang ? ` (${k.jenjang})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px", color: "#475569" }}>Tanggal</label>
            <input
              type="date"
              style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", width: "100%" }}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>

          <button
            style={{
              background: (!selectedKelas || !tanggal || loadingSantri) ? "#94a3b8" : "#550000",
              color: "white",
              padding: "12px 24px",
              borderRadius: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              cursor: (!selectedKelas || !tanggal || loadingSantri) ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
            onClick={loadTahfidz}
            disabled={!selectedKelas || !tanggal || loadingSantri}
          >
            {loadingSantri ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Memuat...
              </>
            ) : (
              <>
                <ClipboardCheck size={18} />
                Tampilkan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Tabel Input Tahfidz */}
      {santri.length > 0 && (
        <>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "16px 24px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} style={{ color: "#10b981" }} />
              <span style={{ color: "#10b981" }}>{sudahSetor}</span>
              <span style={{ color: "#64748b", fontWeight: 500 }}> dari {santri.length} santri sudah disetor</span>
            </div>
            <div style={{ fontSize: 13, color: "#f59e0b", background: "#fef3c7", padding: "6px 12px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <Lightbulb size={14} /> Autosave Aktif
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "16px", padding: 0, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: 14, color: "#475569" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 40, fontWeight: 600 }}>#</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 220, fontWeight: 600 }}>Nama Santri</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 180, fontWeight: 600 }}>Jenis Setoran</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 140, fontWeight: 600 }}>Surat</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 120, fontWeight: 600 }}>Hal/Ayat</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", width: 90, fontWeight: 600 }}>Nilai</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600 }}>Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {santri.map((s, idx) => {
                    const data = inputData[s.id] || {};
                    const isUjian = data.jenis?.includes("ujian");
                    const isFilled = data.jenis && data.surat;
                    
                    return (
                      <tr
                        key={s.id}
                        onMouseEnter={(e) => {
                          if (!isFilled) e.currentTarget.style.background = "#f0fdf4";
                        }}
                        onMouseLeave={(e) => {
                          if (!isFilled) e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa";
                        }}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isFilled ? "rgba(16, 185, 129, 0.05)" : (idx % 2 === 0 ? "white" : "#fafafa"),
                          transition: "background 0.2s ease-in-out",
                        }}
                      >
                        <td style={{ padding: "16px 20px", fontSize: 14, color: "#64748b" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                            {s.nama_lengkap}
                          </div>
                          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                            NIS: {s.nis || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <select
                            style={{ fontSize: 14, padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "100%", outline: "none", backgroundColor: "white" }}
                            value={data.jenis || ""}
                            onChange={(e) => handleInputChange(s.id, "jenis", e.target.value)}
                          >
                            {JENIS_SETORAN.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <input
                            type="text"
                            style={{ fontSize: 14, padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "100%", outline: "none" }}
                            placeholder="Al-Baqarah"
                            value={data.surat || ""}
                            onChange={(e) => handleInputChange(s.id, "surat", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              style={{ fontSize: 14, padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "50%", outline: "none" }}
                              placeholder="Hal"
                              value={data.halaman || ""}
                              onChange={(e) => handleInputChange(s.id, "halaman", e.target.value)}
                            />
                            <input
                              type="text"
                              style={{ fontSize: 14, padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "50%", outline: "none" }}
                              placeholder="Ayat"
                              value={data.ayat || ""}
                              onChange={(e) => handleInputChange(s.id, "ayat", e.target.value)}
                            />
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <input
                            type="number"
                            style={{
                              fontSize: 14,
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                              width: "100%",
                              outline: "none",
                              opacity: isUjian ? 1 : 0.4,
                              pointerEvents: isUjian ? "auto" : "none",
                              background: isUjian ? "#fff" : "#f1f5f9"
                            }}
                            placeholder={isUjian ? "Nilai" : "-"}
                            value={data.nilai || ""}
                            onChange={(e) => handleInputChange(s.id, "nilai", e.target.value)}
                            disabled={!isUjian}
                          />
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <input
                            type="text"
                            style={{ fontSize: 14, padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "100%", outline: "none" }}
                            placeholder="Catatan..."
                            value={data.keterangan || ""}
                            onChange={(e) => handleInputChange(s.id, "keterangan", e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={{
                background: "#550000",
                color: "white",
                padding: "14px 28px",
                borderRadius: "14px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                fontSize: "16px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
              onClick={handleSimpan}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Simpan Jurnal Tahfidz
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loadingSantri && selectedKelas && tanggal && santri.length === 0 && !loadingMaster && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            textAlign: "center",
            padding: "60px 24px",
            color: "#64748b",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        >
          <BookOpen size={48} style={{ opacity: 0.2, margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: 16, fontWeight: 500 }}>
            Belum ada santri terdaftar di kelas ini.
          </p>
        </div>
      )}
    </div>
  );
}
