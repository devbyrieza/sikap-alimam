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
  Lightbulb
} from "lucide-react";

interface Kelas {
  id: string;
  nama: string;
  jenjang?: string;
}

interface MapelItem {
  id: string;
  nama: string;
}

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
}

// 1 Santri akan punya 1 object ini
interface CapaianNilai {
  harian: string;
  kompetensi: string;
  sikap: string;
  pts: string;
  pas: string;
}

const SEMESTER_LIST = ["1", "2"];
const TAHUN_AJARAN_LIST = ["2026/2027", "2027/2028"];

export default function InputNilaiPage() {
  const [step, setStep] = useState(1);
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelas_id, setKelasId] = useState("");
  const [mapel_id, setMapelId] = useState("");
  const [semester, setSemester] = useState("1");
  const [tahun_ajaran, setTahunAjaran] = useState("2026/2027");

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredKelasList, setFilteredKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MapelItem[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  
  // State Input per Santri (Map)
  const [inputData, setInputData] = useState<Record<string, CapaianNilai>>({});

  const [loadingKelas, setLoadingKelas] = useState(true);
  const [loadingMapel, setLoadingMapel] = useState(false);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch kelas
  useEffect(() => {
    fetch("/api/master/kelas")
      .then((r) => r.json())
      .then((d) => {
        setKelasList(d.kelas || []);
        setFilteredKelasList(d.kelas || []);
      })
      .catch(() => {})
      .finally(() => setLoadingKelas(false));
  }, []);

  // Filter kelas when jenjang changes
  useEffect(() => {
    if (!jenjangFilter) {
      setFilteredKelasList(kelasList);
    } else {
      setFilteredKelasList(kelasList.filter(k => k.jenjang === jenjangFilter));
    }
    // Auto reset kelas_id if it's no longer in the list
    if (kelas_id) {
      const exists = kelasList.find(k => k.id === kelas_id && (!jenjangFilter || k.jenjang === jenjangFilter));
      if (!exists) setKelasId("");
    }
  }, [jenjangFilter, kelasList]);

  // Fetch mapel saat kelas berubah
  useEffect(() => {
    if (!kelas_id) {
      setMapelList([]);
      return;
    }
    setLoadingMapel(true);
    setMapelId("");
    fetch(`/api/master/mapel?kelas_id=${kelas_id}`)
      .then((r) => r.json())
      .then((d) => setMapelList(d.mapel || []))
      .catch(() => {})
      .finally(() => setLoadingMapel(false));
  }, [kelas_id]);

  // AUTOSAVE: Load Draft from localStorage on mount (for Step 2)
  useEffect(() => {
    if (step === 2) {
      try {
        const draft = localStorage.getItem("nilai_form_draft");
        if (draft) {
          const parsed = JSON.parse(draft);
          if (
            parsed.kelas === kelas_id &&
            parsed.mapel === mapel_id &&
            parsed.semester === semester &&
            parsed.tahun === tahun_ajaran
          ) {
            setInputData(parsed.data);
          }
        }
      } catch (e) {
        console.error("Gagal parse draft nilai", e);
      }
    }
  }, [step, kelas_id, mapel_id, semester, tahun_ajaran]);

  // AUTOSAVE: Save to localStorage whenever inputData changes
  useEffect(() => {
    if (step === 2 && Object.keys(inputData).length > 0) {
      localStorage.setItem(
        "nilai_form_draft",
        JSON.stringify({
          kelas: kelas_id,
          mapel: mapel_id,
          semester: semester,
          tahun: tahun_ajaran,
          data: inputData,
        })
      );
    }
  }, [inputData, step, kelas_id, mapel_id, semester, tahun_ajaran]);

  // Fetch santri + nilai existing saat step 2
  const fetchStep2 = useCallback(async () => {
    if (!kelas_id || !mapel_id || !semester || !tahun_ajaran) return;
    setLoadingSantri(true);
    try {
      const [santriRes, nilaiRes] = await Promise.all([
        fetch(`/api/master/santri?kelas_id=${kelas_id}`),
        fetch(
          `/api/nilai?mapel_id=${mapel_id}&kelas_id=${kelas_id}&semester=${semester}&tahun_ajaran=${encodeURIComponent(
            tahun_ajaran
          )}`
        ),
      ]);
      const santriData = await santriRes.json();
      const nilaiData = await nilaiRes.json();

      const santri: Santri[] = santriData.santri || [];
      setSantriList(santri);

      // Cek Draft
      const draftStr = localStorage.getItem("nilai_form_draft");
      let draftData: Record<string, CapaianNilai> = {};
      if (draftStr) {
        try {
          const parsed = JSON.parse(draftStr);
          if (
            parsed.kelas === kelas_id &&
            parsed.mapel === mapel_id &&
            parsed.semester === semester &&
            parsed.tahun === tahun_ajaran
          ) {
            draftData = parsed.data;
          }
        } catch (e) {}
      }

      const map: Record<string, CapaianNilai> = { ...draftData };

      // Map existing nilai from DB
      // Format db: [{santri_id, jenis, nilai}]
      // We group them by santri_id
      const dbMap: Record<string, Record<string, string>> = {};
      (nilaiData.nilai || []).forEach((n: any) => {
        if (!dbMap[n.santri.id]) dbMap[n.santri.id] = {};
        dbMap[n.santri.id][n.jenis] = String(n.nilai);
      });

      santri.forEach((s) => {
        if (!map[s.id]) {
          const sDb = dbMap[s.id] || {};
          map[s.id] = {
            harian: sDb.harian || "",
            kompetensi: sDb.kompetensi || "",
            sikap: sDb.sikap || "",
            pts: sDb.pts || "",
            pas: sDb.pas || "",
          };
        }
      });
      setInputData(map);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data";
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setLoadingSantri(false);
    }
  }, [kelas_id, mapel_id, semester, tahun_ajaran]);

  useEffect(() => {
    if (step === 2) fetchStep2();
  }, [step, fetchStep2]);

  const handleInputChange = (
    santriId: string,
    field: keyof CapaianNilai,
    value: string
  ) => {
    // Hanya izinkan angka dan kosong
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setInputData((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: String(num),
      },
    }));
  };

  const hitungNilaiAkhir = (data: CapaianNilai) => {
    const h = Number(data.harian) || 0;
    const k = Number(data.kompetensi) || 0;
    const s = Number(data.sikap) || 0;
    const p = Number(data.pas) || Number(data.pts) || 0; // Prioritas PAS, kalau kosong pakai PTS
    
    // Jika semua kosong, return null
    if (!data.harian && !data.kompetensi && !data.sikap && !data.pts && !data.pas) return null;

    return (0.3 * h + 0.2 * k + 0.1 * s + 0.4 * p).toFixed(1);
  };

  const handleSimpan = async () => {
    // Siapkan data untuk bulk upsert
    const dataToSave = santriList.map((s) => ({
      santri_id: s.id,
      nilai: inputData[s.id],
    })).filter(item => 
      // Filter hanya jika minimal 1 kolom terisi
      item.nilai.harian || item.nilai.kompetensi || item.nilai.sikap || item.nilai.pts || item.nilai.pas
    );

    if (dataToSave.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Nilai",
        text: "Isi minimal satu nilai terlebih dahulu sebelum menyimpan.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Simpan Semua Nilai?",
      html: `Menyimpan data nilai untuk <b>${dataToSave.length}</b> santri.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "var(--primary)",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch("/api/nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataToSave,
          mapel_id,
          kelas_id,
          semester,
          tahun_ajaran,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Clear draft on success
      localStorage.removeItem("nilai_form_draft");

      Swal.fire({
        icon: "success",
        title: "Nilai Tersimpan!",
        html: `<b>${data.count}</b> sel nilai berhasil disimpan/diperbarui.`,
        confirmButtonColor: "var(--primary)",
      });
      fetchStep2();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedKelasNama = kelasList.find((k) => k.id === kelas_id)?.nama || "";
  const selectedMapelNama = mapelList.find((m) => m.id === mapel_id)?.nama || "";

  return (
    <>
      <div className="page-header">
        <div>
          <h1><BookOpen size={16} className="inline mr-1" /> Input Nilai Santri</h1>
          <p>
            {step === 1
              ? "Buku nilai kepadatan tinggi (High-Density Gradebook)"
              : `${selectedMapelNama} · Kelas ${selectedKelasNama} · Semester ${semester} · ${tahun_ajaran}`}
          </p>
        </div>
        {step === 2 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
            Kembali
          </button>
        )}
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── STEP 1: Pilih Parameter ─────────────────────────────────── */}
        {step === 1 && (
          <div className="card" style={{ maxWidth: 640 }}>
            <p className="card-title">
              <Users size={16} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
              Parameter Penilaian
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Jenjang</label>
                <select
                  className="form-control"
                  value={jenjangFilter}
                  onChange={(e) => setJenjangFilter(e.target.value)}
                  disabled={loadingKelas}
                >
                  <option value="">— Semua Jenjang —</option>
                  <option value="MTs">MTs</option>
                  <option value="IL">IL</option>
                  <option value="MA">MA</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kelas / Halaqah</label>
                <select
                  className="form-control"
                  value={kelas_id}
                  onChange={(e) => setKelasId(e.target.value)}
                  disabled={loadingKelas || (jenjangFilter !== "" && filteredKelasList.length === 0)}
                >
                  <option value="">— Pilih Kelas —</option>
                  {filteredKelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-group">
                <label className="form-label">Mata Pelajaran</label>
                <select
                  className="form-control"
                  value={mapel_id}
                  onChange={(e) => setMapelId(e.target.value)}
                  disabled={!kelas_id || loadingMapel}
                >
                  <option value="">— Pilih Mapel —</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
                {loadingMapel && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    Memuat mata pelajaran...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Semester</label>
                <select
                  className="form-control"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {SEMESTER_LIST.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tahun Ajaran</label>
                <select
                  className="form-control"
                  value={tahun_ajaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                >
                  {TAHUN_AJARAN_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                disabled={!kelas_id || !mapel_id}
                onClick={() => setStep(2)}
              >
                Lanjut ke Lembar Nilai
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ marginLeft: 6 }}>
                  <path stroke="white" strokeWidth="2" strokeLinecap="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Input Nilai High Density ────────────────────────── */}
        {step === 2 && (
          <>
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
            >
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(124,16,16,0.06)", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                  {selectedMapelNama}
                </div>
                <div style={{ background: "var(--bg-body)", padding: "4px 10px", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  Kelas {selectedKelasNama}
                </div>
              </div>
              
              <div style={{ fontSize: 12, color: "var(--text-muted)", background: "#f8fafc", padding: "4px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
                <Lightbulb size={12} style={{ color: "var(--warning)" }} /> Draft Autosave Aktif
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-body)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", minWidth: 200 }}>Nama Santri</th>
                      <th style={{ padding: "12px 8px", textAlign: "center", width: 90 }}>
                        <div style={{ marginBottom: 2 }}>Harian</div>
                        <div style={{ fontSize: 10, color: "var(--primary)", opacity: 0.8 }}>(30%)</div>
                      </th>
                      <th style={{ padding: "12px 8px", textAlign: "center", width: 90 }}>
                         <div style={{ marginBottom: 2 }}>Komp.</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", opacity: 0.8 }}>(20%)</div>
                      </th>
                      <th style={{ padding: "12px 8px", textAlign: "center", width: 90 }}>
                         <div style={{ marginBottom: 2 }}>Sikap</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", opacity: 0.8 }}>(10%)</div>
                      </th>
                      <th style={{ padding: "12px 8px", textAlign: "center", width: 90 }}>
                         <div style={{ marginBottom: 2 }}>PTS</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", opacity: 0.8 }}>(40%)</div>
                      </th>
                      <th style={{ padding: "12px 8px", textAlign: "center", width: 90 }}>
                         <div style={{ marginBottom: 2 }}>PAS</div>
                         <div style={{ fontSize: 10, color: "var(--primary)", opacity: 0.8 }}>(40%)</div>
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "center", width: 100, borderLeft: "2px dashed var(--border)" }}>
                         <div style={{ marginBottom: 2 }}>Nilai Akhir</div>
                         <div style={{ fontSize: 10, color: "#16a34a" }}>Otomatis</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSantri ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", color: "var(--primary)" }} />
                          Memuat lembar nilai...
                        </td>
                      </tr>
                    ) : santriList.length === 0 ? (
                       <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                          Tidak ada santri di kelas ini
                        </td>
                      </tr>
                    ) : (
                      santriList.map((s, idx) => {
                        const data = inputData[s.id] || { harian: "", kompetensi: "", sikap: "", pts: "", pas: "" };
                        const nilaiAkhir = hitungNilaiAkhir(data);
                        const isLulus = nilaiAkhir ? Number(nilaiAkhir) >= 80 : true; // Asumsi KKM 80

                        return (
                          <tr
                            key={s.id}
                            style={{
                              borderBottom: "1px solid var(--border)",
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
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600 }}
                                placeholder="-"
                                value={data.harian}
                                onChange={(e) => handleInputChange(s.id, "harian", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600 }}
                                placeholder="-"
                                value={data.kompetensi}
                                onChange={(e) => handleInputChange(s.id, "kompetensi", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600 }}
                                placeholder="-"
                                value={data.sikap}
                                onChange={(e) => handleInputChange(s.id, "sikap", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, background: "#f8fafc" }}
                                placeholder="-"
                                value={data.pts}
                                onChange={(e) => handleInputChange(s.id, "pts", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "12px 8px", textAlign: "center" }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ fontSize: 14, padding: "8px 4px", textAlign: "center", fontWeight: 600, background: "#f8fafc" }}
                                placeholder="-"
                                value={data.pas}
                                onChange={(e) => handleInputChange(s.id, "pas", e.target.value)}
                              />
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center", borderLeft: "2px dashed var(--border)" }}>
                              <div style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: nilaiAkhir === null ? "var(--border)" : isLulus ? "#16a34a" : "#dc2626"
                              }}>
                                {nilaiAkhir === null ? "-" : nilaiAkhir}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                onClick={handleSimpan}
                disabled={saving || loadingSantri}
                style={{ minWidth: 160 }}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Semua Nilai
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
