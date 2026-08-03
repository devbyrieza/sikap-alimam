"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ClipboardCheck,
  Loader2,
  Save,
  Users,
  CheckCircle,
  BarChart,
  CheckSquare,
} from "lucide-react";

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
const STATUS_COLOR: Record<StatusType, string> = {
  hadir: "#15803d",
  sakit: "#a16207",
  izin: "#1d4ed8",
  alpha: "#b91c1c",
};
const STATUS_BG: Record<StatusType, string> = {
  hadir: "rgba(21,128,61,0.10)",
  sakit: "rgba(161,98,7,0.10)",
  izin: "rgba(29,78,216,0.10)",
  alpha: "rgba(185,28,28,0.10)",
};

export default function PresensiSantriPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [jurnalBlocker, setJurnalBlocker] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingDate = localStorage.getItem("sikap_pending_jurnal_date");
      if (pendingDate === today) {
        setJurnalBlocker(true);
      }
    }
  }, [today]);

  const [selectedJenjang, setSelectedJenjang] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [tanggal, setTanggal] = useState(today);

  const [santri, setSantri] = useState<SantriPresensi[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>({});
  const [keteranganMap, setKeteranganMap] = useState<Record<string, string>>({});
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
    setKeteranganMap({});

    try {
      const res = await fetch(
        `/api/presensi/santri?kelas_id=${selectedKelas}&tanggal=${tanggal}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const data: SantriPresensi[] = json.data || [];
      setSantri(data);

      const map: Record<string, StatusType> = {};
      const ketMap: Record<string, string> = {};
      data.forEach((s) => {
        if (s.status) {
          map[s.id] = s.status as StatusType;
        } else {
          map[s.id] = "hadir";
        }
        if (s.keterangan) {
          ketMap[s.id] = s.keterangan;
        }
      });
      setStatusMap(map);
      setKeteranganMap(ketMap);
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
    // Jika pilih hadir, hapus keterangan
    if (status === "hadir") {
      setKeteranganMap((prev) => ({ ...prev, [santriId]: "" }));
    }
  };

  const setKeterangan = (santriId: string, val: string) => {
    setKeteranganMap((prev) => ({ ...prev, [santriId]: val }));
  };

  // Bulk action: hadir semua
  const hadirSemua = () => {
    const newMap: Record<string, StatusType> = {};
    const newKetMap: Record<string, string> = {};
    santri.forEach((s) => {
      newMap[s.id] = "hadir";
      newKetMap[s.id] = "";
    });
    setStatusMap(newMap);
    setKeteranganMap(newKetMap);
  };

  // Ringkasan realtime
  const summary = santri.reduce(
    (acc, s) => {
      const st = statusMap[s.id];
      if (st) {
        acc[st as StatusType] = (acc[st as StatusType] || 0) + 1;
      }
      return acc;
    },
    { hadir: 0, sakit: 0, izin: 0, alpha: 0 } as Record<StatusType, number>
  );

  const sudahDiabsen = santri.filter(
    (s) => statusMap[s.id] !== undefined
  ).length;

  const handleSimpan = async () => {
    if (!selectedKelas || !tanggal || santri.length === 0) return;

    // (Confirmation alert for missing attendance removed because default is now Hadir)

    const kelasNamaConfirm = kelasList.find((k) => k.id === selectedKelas)?.nama;

    const confirm = await Swal.fire({
      title: "Simpan Presensi?",
      html: `
        <div style="font-size:13px; color:#6b7280; margin-bottom: 14px; text-align:left; padding: 10px 12px; background: #f9fafb; border-radius: 8px;">
          Tanggal: <strong>${tanggal}</strong><br/>
          Kelas: <strong>${kelasNamaConfirm}</strong><br/>
          Total Santri: <strong>${santri.length}</strong>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px">
          <div style="padding:10px; background:rgba(21,128,61,0.08); border-radius:8px; font-weight:700; color:#15803d">
            Hadir: ${summary.hadir}
          </div>
          <div style="padding:10px; background:rgba(161,98,7,0.08); border-radius:8px; font-weight:700; color:#a16207">
            Sakit: ${summary.sakit}
          </div>
          <div style="padding:10px; background:rgba(29,78,216,0.08); border-radius:8px; font-weight:700; color:#1d4ed8">
            Izin: ${summary.izin}
          </div>
          <div style="padding:10px; background:rgba(185,28,28,0.08); border-radius:8px; font-weight:700; color:#b91c1c">
            Alpha: ${summary.alpha}
          </div>
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
        keterangan: keteranganMap[s.id] || null,
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

      // 1. Set localStorage blocker
      localStorage.setItem("sikap_pending_jurnal_date", tanggal);

      // 2. Suggest to fill journal
      setTimeout(() => {
        Swal.fire({
          title: 'Presensi Selesai',
          text: 'Jangan lupa untuk segera mengisi Jurnal Mengajar Anda hari ini.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: "var(--primary)",
          confirmButtonText: 'Isi Jurnal Sekarang',
          cancelButtonText: 'Nanti'
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/jurnal");
          } else {
            // They chose later, so we lock them if they refresh
            setJurnalBlocker(true);
          }
        });
      }, 1000);
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
  const progressPct = santri.length > 0 ? Math.round((sudahDiabsen / santri.length) * 100) : 0;

  if (jurnalBlocker) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: 24, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckSquare size={40} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Akses Terkunci</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 450, marginBottom: 24, lineHeight: 1.6 }}>
          Anda baru saja mengambil absensi kelas, namun belum menyetorkan <b>Jurnal Mengajar</b>. 
          Harap lengkapi jurnal kelas sebelumnya agar bisa mengakses presensi kelas selanjutnya.
        </p>
        <button 
          onClick={() => router.push("/jurnal")}
          className="btn btn-primary"
          style={{ padding: "12px 24px", fontSize: 15, fontWeight: 700 }}
        >
          Menuju Halaman Jurnal
        </button>
      </div>
    );
  }

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
            Pilih Kelas &amp; Tanggal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Jenjang</label>
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
                  value={selectedJenjang}
                  onChange={(e) => {
                    setSelectedJenjang(e.target.value);
                    setSelectedKelas("");
                  }}
                >
                  <option value="">— Pilih Jenjang —</option>
                  {Array.from(new Set(kelasList.map(k => k.jenjang).filter(Boolean))).sort().map(j => {
                    const jenjangStr = j as string;
                    const label = jenjangStr === "Islamiyah" ? "IL" : jenjangStr;
                    return (
                      <option key={jenjangStr} value={jenjangStr}>{label}</option>
                    );
                  })}
                </select>
              )}
            </div>

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
                  disabled={!selectedJenjang}
                >
                  <option value="">— Pilih Kelas —</option>
                  {kelasList
                    .filter(k => k.jenjang === selectedJenjang)
                    .map((k) => {
                      // Remove jenjang text from class name if it exists (e.g. "7 MTs" -> "7")
                      const displayName = selectedJenjang
                        ? k.nama.replace(new RegExp(`\\s*${selectedJenjang}\\s*`, "i"), "").trim()
                        : k.nama;

                      return (
                        <option key={k.id} value={k.id}>
                          {displayName || k.nama}
                        </option>
                      );
                    })}
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
            {/* Progress Indicator */}
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  <BarChart size={15} className="inline mr-1" style={{ color: "var(--primary)" }} />
                  <span style={{ color: "var(--primary)" }}>{sudahDiabsen}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> dari {santri.length} santri sudah diabsen</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-hadir">Hadir: {summary.hadir}</span>
                  <span className="badge badge-sakit">Sakit: {summary.sakit}</span>
                  <span className="badge badge-izin">Izin: {summary.izin}</span>
                  <span className="badge badge-alpha">Alpha: {summary.alpha}</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ background: "var(--border)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, var(--primary), #c0392b)",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
                <span>Kelas {kelasNama}</span>
                <span>{progressPct}% selesai</span>
              </div>
            </div>

            {/* Bulk Action */}
            <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={hadirSemua}
                style={{ fontSize: 13 }}
              >
                <CheckSquare size={15} />
                Hadir Semua
              </button>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Klik untuk menandai semua santri sebagai Hadir
              </span>
            </div>

            {/* Daftar Kartu Santri (mobile-first) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {santri.map((s, idx) => {
                const currentStatus = statusMap[s.id];
                const needsKet = currentStatus && currentStatus !== "hadir";
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{
                      padding: "16px 20px",
                      borderLeft: `4px solid ${currentStatus ? STATUS_COLOR[currentStatus] : "#cbd5e1"}`,
                      transition: "border-color 0.2s",
                    }}
                  >
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      {/* Nomor urut */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      {/* Nama & NIS */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                          {s.nama_lengkap}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          NIS: {s.nis || "—"}
                        </div>
                      </div>
                      {/* Badge status saat ini */}
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 700,
                          background: currentStatus ? STATUS_BG[currentStatus] : "#f1f5f9",
                          color: currentStatus ? STATUS_COLOR[currentStatus] : "#64748b",
                        }}
                      >
                        {currentStatus ? STATUS_LABEL[currentStatus] : "Belum Diabsen"}
                      </div>
                    </div>

                    {/* Status Buttons — besar & mudah diklik di HP */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      {STATUS_LIST.map((st) => {
                        const isActive = currentStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(s.id, st)}
                            style={{
                              padding: "10px 4px",
                              borderRadius: 10,
                              border: `2px solid ${isActive ? STATUS_COLOR[st] : "var(--border)"}`,
                              background: isActive ? STATUS_BG[st] : "transparent",
                              color: isActive ? STATUS_COLOR[st] : "var(--text-muted)",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              minHeight: 44,
                            }}
                          >
                            {STATUS_LABEL[st]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Keterangan field — muncul jika bukan hadir */}
                    {needsKet && (
                      <div style={{ marginTop: 10 }}>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: STATUS_COLOR[currentStatus],
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Keterangan {STATUS_LABEL[currentStatus]} (opsional)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: 13 }}
                          placeholder={
                            currentStatus === "sakit"
                              ? "Contoh: demam, dirawat di RS..."
                              : currentStatus === "izin"
                              ? "Contoh: keperluan keluarga, acara pesantren..."
                              : "Contoh: tidak ada keterangan, kabur..."
                          }
                          value={keteranganMap[s.id] || ""}
                          onChange={(e) => setKeterangan(s.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* Loading state */}
        {loadingSantri && (
          <div
            className="card"
            style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}
          >
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block", color: "var(--primary)" }} />
            <p style={{ fontSize: 14 }}>Memuat data santri...</p>
          </div>
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
