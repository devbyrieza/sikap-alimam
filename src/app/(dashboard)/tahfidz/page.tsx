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
    
    // Jangan reset inputData jika ada draft. Tapi kalau tidak ada draft, baru reset.
    // Untuk amannya, kita fetch data dari server, lalu gabungkan dengan draft jika perlu.
    
    try {
      const res = await fetch(
        `/api/tahfidz?kelas_id=${selectedKelas}&tanggal=${tanggal}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const data: SantriTahfidz[] = json.data || [];
      setSantri(data);

      // Cek apakah ada draft yang relevan
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
        // Jika belum ada di draft, load dari database
        if (!map[s.id] && s.capaian && s.capaian.length > 0) {
          const c = s.capaian[0]; // Ambil setoran pertama
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
          // Initialize empty
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

    // Filter santri yang form-nya minimal terisi Surat dan Jenisnya
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
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Simpan Jurnal Tahfidz?",
      text: `Menyimpan setoran tahfidz untuk ${validDataToSave.length} santri pada tanggal ${tanggal}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--primary)",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      // NOTE: asatidz_id harusnya diambil dari session JWT login (User). 
      // Karena ini demo/MVP, kita sementara pakai UUID dummy atau mock.
      // Di sistem utuh, API route mengambil dari headers/session.
      
      const res = await fetch("/api/tahfidz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asatidz_id: "00000000-0000-0000-0000-000000000000", // TODO: Replace with real user.asatidz_id
          tanggal,
          data: validDataToSave,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan");

      // CLEAR AUTOSAVE on success!
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
      
      // Reload from DB to get the new IDs
      loadTahfidz();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setSaving(false);
    }
  };

  const sudahSetor = Object.values(inputData).filter((d) => d.jenis && d.surat.trim() !== "").length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><BookOpen size={16} className="inline mr-1" /> Jurnal Tahfidz</h1>
          <p>Input capaian harian, ziyadah, dan ujian hafalan santri</p>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Step 1: Pilih Kelas & Tanggal */}
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="card-title">
            <Users size={16} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
            Pilih Kelas &amp; Tanggal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Kelas</label>
              {loadingMaster ? (
                <div
                  className="form-control"
                  style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Memuat...
                </div>
              ) : (
                <select
                  className="form-control"
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={loadTahfidz}
              disabled={!selectedKelas || !tanggal || loadingSantri}
            >
              {loadingSantri ? (
                <>
                  <span className="spinner" />
                  Memuat...
                </>
              ) : (
                <>
                  <ClipboardCheck size={16} />
                  Tampilkan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Tabel Input Tahfidz */}
        {santri.length > 0 && (
          <>
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                <CheckCircle size={15} className="inline mr-1" style={{ color: "var(--primary)" }} />
                <span style={{ color: "var(--primary)" }}>{sudahSetor}</span>
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> dari {santri.length} santri sudah disetor</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", background: "#f8fafc", padding: "4px 10px", borderRadius: 99 }}>
                💡 Autosave Aktif
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-body)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 220 }}>Nama Santri</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 180 }}>Jenis Setoran</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 140 }}>Surat</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 100 }}>Hal/Ayat</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 90 }}>Nilai</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Ket</th>
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
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: isFilled ? "rgba(21,128,61,0.02)" : "transparent",
                            transition: "background 0.2s",
                          }}
                        >
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                              {s.nama_lengkap}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              NIS: {s.nis || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <select
                              className="form-control"
                              style={{ fontSize: 13, padding: "8px" }}
                              value={data.jenis || ""}
                              onChange={(e) => handleInputChange(s.id, "jenis", e.target.value)}
                            >
                              {JENIS_SETORAN.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: 13, padding: "8px" }}
                              placeholder="Al-Baqarah"
                              value={data.surat || ""}
                              onChange={(e) => handleInputChange(s.id, "surat", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <input
                                type="text"
                                className="form-control"
                                style={{ fontSize: 13, padding: "8px", width: "50%" }}
                                placeholder="Hal"
                                value={data.halaman || ""}
                                onChange={(e) => handleInputChange(s.id, "halaman", e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-control"
                                style={{ fontSize: 13, padding: "8px", width: "50%" }}
                                placeholder="Ayat"
                                value={data.ayat || ""}
                                onChange={(e) => handleInputChange(s.id, "ayat", e.target.value)}
                              />
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{
                                fontSize: 13,
                                padding: "8px",
                                opacity: isUjian ? 1 : 0.3,
                                pointerEvents: isUjian ? "auto" : "none",
                                background: isUjian ? "#fff" : "#f1f5f9"
                              }}
                              placeholder={isUjian ? "Nilai" : "-"}
                              value={data.nilai || ""}
                              onChange={(e) => handleInputChange(s.id, "nilai", e.target.value)}
                              disabled={!isUjian}
                            />
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: 13, padding: "8px" }}
                              placeholder="..."
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
                className="btn btn-secondary"
                onClick={handleSimpan}
                disabled={saving}
                style={{ minWidth: 160 }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ borderTopColor: "var(--primary-dark)" }} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
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
            className="card"
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "var(--text-muted)",
            }}
          >
            <BookOpen size={40} style={{ opacity: 0.2, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>
              Belum ada santri terdaftar di kelas ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
