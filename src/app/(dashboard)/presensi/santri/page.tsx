"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import ModuleTabs from "@/components/ModuleTabs";
import {
  ClipboardCheck,
  Loader2,
  Save,
  Users,
  CheckCircle,
  BarChart3,
  CheckSquare,
  UserCheck,
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
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

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

      Swal.fire({
        icon: "success",
        title: "Presensi Berhasil Disimpan!",
        text: `Data presensi ${json.count} santri telah berhasil tersimpan ke sistem.`,
        confirmButtonColor: "var(--primary)",
        confirmButtonText: "Selesai",
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
  const progressPct = santri.length > 0 ? Math.round((sudahDiabsen / santri.length) * 100) : 0;

  return (
    <div className="w-full">
      <div className="p-3.5 sm:p-6 md:p-7 max-w-6xl mx-auto w-full pb-28 sm:pb-12">
        <ModuleTabs
          tabs={[
            { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
            { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
            { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
          ]}
        />
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
                  <option value="">— Semua Jenjang —</option>
                  <option value="MTs">MTs</option>
                  <option value="IL">IL</option>
                  <option value="MA">MA</option>
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
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
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
            {/* Progress Indicator */}
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  <BarChart3 size={15} className="inline mr-1" style={{ color: "var(--primary)" }} />
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

            {/* Card list santri */}
            <div className="space-y-3 pb-28 sm:pb-4">
              {santri.map((s, idx) => {
                const currentStatus = statusMap[s.id] || "hadir";
                const needsKet = currentStatus !== "hadir";

                return (
                  <div
                    key={s.id}
                    className="card santri-attendance-card"
                    style={{
                      padding: "14px 16px",
                      borderLeft: `4px solid ${
                        currentStatus === "hadir"
                          ? "#15803d"
                          : currentStatus === "sakit"
                          ? "#d97706"
                          : currentStatus === "izin"
                          ? "#0284c7"
                          : currentStatus === "alpha"
                          ? "#b91c1c"
                          : "#e2e8f0"
                      }`,
                    }}
                  >
                    {/* Baris Atas: Nomor, Nama, NIS, Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--primary-dark)",
                              margin: 0,
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.nama_lengkap}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              margin: 0,
                            }}
                          >
                            NIS: {s.nis || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Badge status saat ini */}
                      <span
                        className={`badge badge-${currentStatus}`}
                        style={{ flexShrink: 0, fontSize: 11, padding: "3px 10px" }}
                      >
                        {STATUS_LABEL[currentStatus]}
                      </span>
                    </div>

                    {/* Tombol Status 4 Pilihan */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 6,
                      }}
                    >
                      {STATUS_LIST.map((st) => {
                        const isSelected = currentStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatus(s.id, st)}
                            style={{
                              padding: "9px 4px",
                              borderRadius: 8,
                              border: isSelected
                                ? `2px solid ${STATUS_COLOR[st]}`
                                : "1px solid var(--border)",
                              background: isSelected
                                ? STATUS_BG[st]
                                : "var(--surface)",
                              color: isSelected
                                ? STATUS_COLOR[st]
                                : "var(--text-muted)",
                              fontWeight: isSelected ? 700 : 500,
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

            {/* Actions (Standard: Batal & Simpan Presensi matching Jurnal page) */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", marginTop: 20 }}>
              <Link href="/dashboard" className="btn btn-ghost">
                Batal
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSimpan}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner" />
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
