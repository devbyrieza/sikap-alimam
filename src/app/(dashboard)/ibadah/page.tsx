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
        data };

      const res = await fetch("/api/ibadah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) });

      if (res.ok) {
        // Hapus draft karena sudah tersimpan di server
        localStorage.removeItem(draftKey);
        setDraftLoaded(false);

        Swal.fire({
          title: "Berhasil!",
          text: "Ceklist Ibadah Harian berhasil disimpan.",
          icon: "success",
          confirmButtonColor: "#3085d6" });
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error!",
        text: "Gagal menyimpan data ke server.",
        icon: "error" });
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
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Banner - PPDB Platinum Standard */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "linear-gradient(135deg, #550000 0%, #7a0000 100%)",
        borderRadius: "24px",
        padding: "32px 36px",
        boxShadow: "0 10px 30px rgba(85, 0, 0, 0.35)",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, right: 0, padding: "48px", opacity: 0.1 }}>
          <Check size={120} />
        </div>
        <div style={{ position: "relative", zIndex: 10 }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Bina Pribadi Islami (BPI)
          </h1>
          <p style={{ color: "#cbd5e1", margin: 0 }}>
            Ceklist ibadah harian dan adab santri.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>
            Tanggal
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", background: "white", outline: "none" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "4px" }}>
            Kelas / Halaqah
          </label>
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            style={{ width: "100%", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "10px 14px", background: "white", outline: "none" }}
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
        <div style={{ background: "#fffbeb", color: "#92400e", padding: "16px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #fde68a" }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: "14px" }}>
            Menampilkan data <strong>draft yang belum tersimpan</strong> ke server.
            Klik Simpan untuk memperbarui database.
          </span>
        </div>
      )}

      {/* Data Table - Dense layout from Siakad Standard wrapped in Platinum Design */}
      {kelasId && !loading && (
        <div style={{ background: "white", borderRadius: "24px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th
                    rowSpan={2}
                    style={{ padding: "16px 20px", fontWeight: 600, color: "#475569", borderBottom: "2px solid #10b981" }}
                  >
                    Nama Santri
                  </th>
                  <th
                    colSpan={5}
                    style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#475569", background: "#ecfdf5" }}
                  >
                    Sholat Wajib
                  </th>
                  <th
                    colSpan={4}
                    style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#475569", background: "#f0fdfa" }}
                  >
                    Amalan Sunnah
                  </th>
                </tr>
                <tr>
                  {/* Wajib */}
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdf4" }}>Subuh</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdf4" }}>Dzuhur</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdf4" }}>Ashar</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdf4" }}>Maghrib</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdf4" }}>Isya</th>
                  {/* Sunnah */}
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdfa" }}>Tahajjud</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdfa" }}>Dhuha</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdfa" }}>Shaum</th>
                  <th style={{ padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#64748b", background: "#f0fdfa" }}>Matsurat</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.santri_id} className="hover:bg-[#f0fdf4] transition-colors" style={{ backgroundColor: index % 2 === 0 ? "white" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", whiteSpace: "nowrap", fontWeight: 500, color: "#1e293b" }}>
                      {item.nama_lengkap}
                    </td>
                    {/* Wajib Selects */}
                    {["shubuh", "dzuhur", "ashar", "maghrib", "isya"].map((waktu) => (
                      <td key={waktu} style={{ padding: "8px", textAlign: "center" }}>
                        <select
                          value={item[waktu as keyof SantriIbadah] as string}
                          onChange={(e) => handleChange(index, waktu as keyof SantriIbadah, e.target.value)}
                          style={{
                            fontSize: "12px",
                            borderRadius: "8px",
                            padding: "6px 8px",
                            border: "1px solid #cbd5e1",
                            background: item[waktu as keyof SantriIbadah] === "Berjamaah" ? "#ecfdf5" : item[waktu as keyof SantriIbadah] === "Bolong" ? "#fef2f2" : "#fffbeb",
                            color: item[waktu as keyof SantriIbadah] === "Berjamaah" ? "#047857" : item[waktu as keyof SantriIbadah] === "Bolong" ? "#b91c1c" : "#b45309",
                            outline: "none"
                          }}
                        >
                          {sholatOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                    {/* Sunnah Checkboxes */}
                    {["tahajjud", "dhuha", "shaum", "almatsurat"].map((sunnah) => (
                      <td key={sunnah} style={{ padding: "8px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={item[sunnah as keyof SantriIbadah] as boolean}
                          onChange={(e) => handleChange(index, sunnah as keyof SantriIbadah, e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                      Tidak ada data santri ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSave}
              disabled={saving || data.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: saving || data.length === 0 ? "#94a3b8" : "#550000",
                color: "white",
                padding: "10px 18px",
                borderRadius: "14px",
                fontWeight: "bold",
                border: "none",
                cursor: saving || data.length === 0 ? "not-allowed" : "pointer",
                boxShadow: saving || data.length === 0 ? "none" : "0 4px 6px -1px rgba(85, 0, 0, 0.4)",
                transition: "all 0.2s"
              }}
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan Ceklist
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      )}
    </div>
  );
}
