"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { ClipboardCheck, Loader2, Save, Users, CheckCircle, BarChart } from "lucide-react";

type Kelas = { id: string; nama: string; jenjang: string | null };
type SantriPresensi = {
  id: string;
  nama_lengkap: string;
  nis: string | null;
  status: string;
  keterangan: string | null;
  presensi_id: string | null;
};

type StatusType = "hadir" | "sakit" | "izin" | "alpha";

const STATUS_LIST: StatusType[] = ["hadir", "sakit", "izin", "alpha"];
const STATUS_LABEL: Record<StatusType, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpha: "Alpha",
};

export default function PresensiSantriPage() {
  const today = new Date().toISOString().split("T")[0];

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const [selectedKelas, setSelectedKelas] = useState("");
  const [tanggal, setTanggal] = useState(today);

  const [santri, setSantri] = useState<SantriPresensi[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>({});
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
          text: "Tidak dapat mengambil data master.",
          confirmButtonColor: "var(--primary)",
        });
      });
  }, []);

  // Load santri + status presensi when kelas and tanggal are set
  const loadPresensi = useCallback(async () => {
    if (!selectedKelas || !tanggal) return;

    setLoadingSantri(true);
    setSantri([]);
    setStatusMap({});

    try {
      const res = await fetch(
        `/api/presensi/santri?kelas_id=${selectedKelas}&tanggal=${tanggal}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const data: SantriPresensi[] = json.data || [];
      setSantri(data);

      const map: Record<string, StatusType> = {};
      data.forEach((s) => {
        map[s.id] = (s.status as StatusType) || "hadir";
      });
      setStatusMap(map);
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
      loadPresensi();
    }
  }, [selectedKelas, tanggal, loadPresensi]);

  const setStatus = (santriId: string, status: StatusType) => {
    setStatusMap((prev) => ({ ...prev, [santriId]: status }));
  };

  // Ringkasan realtime
  const summary = santri.reduce(
    (acc, s) => {
      const st = statusMap[s.id] || "hadir";
      acc[st as StatusType] = (acc[st as StatusType] || 0) + 1;
      return acc;
    },
    { hadir: 0, sakit: 0, izin: 0, alpha: 0 } as Record<StatusType, number>
  );

  const handleSimpan = async () => {
    if (!selectedKelas || !tanggal || santri.length === 0) return;

    const confirm = await Swal.fire({
      title: "Simpan Presensi?",
      html: `
        <div style="font-size:14px; color:#6b7280; margin-bottom: 12px">
          Tanggal: <strong>${tanggal}</strong><br/>
          Kelas: <strong>${kelasList.find((k) => k.id === selectedKelas)?.nama}</strong>
        </div>
        <div style="display:flex; justify-content:center; gap:16px; font-weight:700; font-size:15px">
          <span style="color:#15803d">H: ${summary.hadir}</span>
          <span style="color:#a16207">S: ${summary.sakit}</span>
          <span style="color:#1d4ed8">I: ${summary.izin}</span>
          <span style="color:#b91c1c">A: ${summary.alpha}</span>
        </div>
      `,
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
      const presensiPayload = santri.map((s) => ({
        santri_id: s.id,
        status: statusMap[s.id] || "hadir",
        keterangan: null,
      }));

      const res = await fetch("/api/presensi/santri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas_id: selectedKelas,
          tanggal,
          presensi: presensiPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: "success",
        title: `Presensi ${json.count} santri berhasil disimpan!`,
      });
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

  const kelasNama = kelasList.find((k) => k.id === selectedKelas)?.nama;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1><CheckCircle size={16} className="inline mr-1" /> Presensi Santri</h1>
          <p>Input kehadiran santri per kelas per tanggal</p>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Step 1: Pilih Kelas & Tanggal */}
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="card-title">
            <Users size={16} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
            Pilih Kelas & Tanggal
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 16,
              alignItems: "flex-end",
            }}
          >
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
                  <option value="">— Pilih Kelas —</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                      {k.jenjang ? ` (${k.jenjang})` : ""}
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
              onClick={loadPresensi}
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

        {/* Step 2: Daftar Santri */}
        {santri.length > 0 && (
          <>
            {/* Summary Bar */}
            <div
              className="card"
              style={{
                marginBottom: 16,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                <BarChart size={16} className="inline mr-1" /> Ringkasan — Kelas {kelasNama}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span className="badge badge-hadir">Hadir: {summary.hadir}</span>
                <span className="badge badge-sakit">Sakit: {summary.sakit}</span>
                <span className="badge badge-izin">Izin: {summary.izin}</span>
                <span className="badge badge-alpha">Alpha: {summary.alpha}</span>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                Total: {santri.length} santri
              </div>
            </div>

            {/* Table */}
            <div className="table-wrap" style={{ marginBottom: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>No</th>
                    <th>Nama Santri</th>
                    <th style={{ width: 120 }}>NIS</th>
                    <th>Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {santri.map((s, idx) => {
                    const currentStatus = statusMap[s.id] || "hadir";
                    return (
                      <tr key={s.id}>
                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{s.nama_lengkap}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          {s.nis || "—"}
                        </td>
                        <td>
                          <div className="status-toggle">
                            {STATUS_LIST.map((st) => (
                              <button
                                key={st}
                                type="button"
                                className={`status-btn${currentStatus === st ? " active" : ""}`}
                                data-status={st}
                                onClick={() => setStatus(s.id, st)}
                              >
                                {STATUS_LABEL[st]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    Simpan Presensi
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Empty state: kelas dipilih tapi santri kosong setelah load */}
        {!loadingSantri && selectedKelas && tanggal && santri.length === 0 && !loadingMaster && (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "var(--text-muted)",
            }}
          >
            <Users size={40} style={{ opacity: 0.2, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>
              Belum ada santri terdaftar di kelas ini, atau kelas belum dipilih.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
