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
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── Al-Imam Platinum Hero Banner ── */}
      <div className="hero-banner">
        {/* Decorative Elements */}
        <div style={{ position:"absolute", top:0, right:0, width:256, height:256, background:"rgba(221, 193, 146, 0.15)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(30%, -50%)", pointerEvents:"none" }}></div>
        <div style={{ position:"absolute", bottom:0, left:0, width:192, height:192, background:"rgba(221, 193, 146, 0.1)", borderRadius:"50%", filter:"blur(40px)", transform:"translate(-25%, 50%)", pointerEvents:"none" }}></div>

        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(221, 193, 146, 0.18)", padding:"5px 12px", borderRadius:20, border:"1px solid rgba(221, 193, 146, 0.4)", width:"fit-content", marginBottom:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ddc192", boxShadow:"0 0 6px rgba(221, 193, 146, 0.9)" }}></div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.5px", color:"#fdf8f0", textTransform:"uppercase" }}>Presensi Santri</span>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
            <ClipboardCheck size={26} color="#ddc192" /> Input Presensi Santri
          </h1>
          <p style={{ marginTop: "6px", color: "rgba(253, 248, 240, 0.9)", fontSize: "14px", margin: "6px 0 0 0" }}>
            Pencatatan absensi & kehadiran harian santri per kelas secara cepat
          </p>
        </div>
      </div>

      <ModuleTabs
        tabs={[
          { label: "Input Presensi", href: "/presensi/santri", exact: true, icon: <ClipboardCheck size={16} /> },
          { label: "Lihat Rekap", href: "/presensi/santri/rekap", exact: true, icon: <BarChart3 size={16} /> },
          { label: "Riwayat per Santri", href: "/presensi/santri/riwayat", exact: true, icon: <UserCheck size={16} /> },
        ]}
      />

      {/* Step 1: Pilih Kelas & Tanggal */}
      <div
        className="w-full flex flex-col gap-4 box-border"
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "clamp(16px, 3.5vw, 24px)",
          boxShadow: "0 2px 12px rgba(85,0,0,0.03)",
          border: "1px solid #ebdcc3",
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} color="#ddc192" />
          Pilih Kelas &amp; Tanggal Presensi
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-end">
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Jenjang</label>
            {loadingMaster ? (
              <div
                className="w-full box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}
              >
                <Loader2 size={16} className="animate-spin text-amber-700" />
                Memuat...
              </div>
            ) : (
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
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

          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas</label>
            {loadingMaster ? (
              <div
                className="w-full box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}
              >
                <Loader2 size={16} className="animate-spin text-amber-700" />
                Memuat...
              </div>
            ) : (
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
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

          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tanggal</label>
            <input
              type="date"
              className="w-full min-w-0 box-border"
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>

          <div className="w-full min-w-0">
            <button
              className="w-full box-border flex items-center justify-center gap-2"
              style={{ background: "#550000", color: "white", padding: "11px 20px", borderRadius: "12px", border: "1px solid #550000", fontWeight: 700, cursor: "pointer", height: "44px", boxShadow: "0 2px 8px rgba(85,0,0,0.2)" }}
              onClick={loadPresensi}
              disabled={!selectedKelas || !tanggal || loadingSantri}
            >
              {loadingSantri ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <ClipboardCheck size={18} color="#ddc192" />
                  Tampilkan Santri
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Daftar Santri */}
      {santri.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Progress & Summary Indicator */}
          <div
            style={{ background: "white", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 2px 12px rgba(85,0,0,0.03)", border: "1px solid #ebdcc3", display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#550000", display: "flex", alignItems: "center", gap: 6 }}>
                <BarChart3 size={18} color="#ddc192" />
                <span>Kelas {kelasNama}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>• ({sudahDiabsen} dari {santri.length} santri)</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  Hadir: {summary.hadir}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: "#fefce8", color: "#a16207", border: "1px solid #fef08a" }}>
                  Sakit: {summary.sakit}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                  Izin: {summary.izin}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                  Alpha: {summary.alpha}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: "#fdf8f0", border: "1px solid #ebdcc3", borderRadius: 99, height: 10, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #550000, #ddc192)",
                  borderRadius: 99,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Bulk Action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={hadirSemua}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: "12px", background: "#fdf8f0", border: "1px solid #ebdcc3", color: "#550000", fontWeight: 800, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ebdcc3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fdf8f0"; }}
            >
              <CheckSquare size={16} color="#550000" />
              Tandai Hadir Semua
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Status default adalah <strong>Hadir</strong>. Ubah santri yang tidak hadir di bawah ini.
            </span>
          </div>

          {/* Card list santri */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {santri.map((s, idx) => {
              const currentStatus = statusMap[s.id] || "hadir";
              const needsKet = currentStatus !== "hadir";

              return (
                <div
                  key={s.id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 8px rgba(85,0,0,0.02)",
                    padding: "16px 20px",
                    border: "1px solid #ebdcc3",
                    borderLeft: `5px solid ${
                      currentStatus === "hadir"
                        ? "#15803d"
                        : currentStatus === "sakit"
                        ? "#d97706"
                        : currentStatus === "izin"
                        ? "#0284c7"
                        : currentStatus === "alpha"
                        ? "#b91c1c"
                        : "#ebdcc3"
                    }`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {/* Baris Atas: Nomor, Nama, NIS, Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fdf8f0", border: "1px solid #ebdcc3", color: "#550000", fontWeight: 800, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#1a1a1a",
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
                            fontSize: 12,
                            color: "#64748b",
                            margin: "2px 0 0 0",
                          }}
                        >
                          NIS: {s.nis || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Badge status saat ini */}
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: STATUS_BG[currentStatus],
                        color: STATUS_COLOR[currentStatus],
                        border: `1px solid ${STATUS_COLOR[currentStatus]}33`
                      }}
                    >
                      {STATUS_LABEL[currentStatus]}
                    </span>
                  </div>

                  {/* Tombol Status 4 Pilihan */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 8,
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
                            borderRadius: 10,
                            border: isSelected
                              ? `2px solid ${STATUS_COLOR[st]}`
                              : "1px solid #ebdcc3",
                            background: isSelected
                              ? STATUS_BG[st]
                              : "#fdf8f0",
                            color: isSelected
                              ? STATUS_COLOR[st]
                              : "#550000",
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            minHeight: 42,
                          }}
                        >
                          {STATUS_LABEL[st]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Keterangan field — muncul jika bukan hadir */}
                  {needsKet && (
                    <div style={{ marginTop: 2 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: STATUS_COLOR[currentStatus],
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Keterangan {STATUS_LABEL[currentStatus]} (opsional):
                      </label>
                      <input
                        type="text"
                        style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "13px", width: "100%", outline: "none" }}
                        placeholder={
                          currentStatus === "sakit"
                            ? "Contoh: Demam, istirahat di asrama/klinik..."
                            : currentStatus === "izin"
                            ? "Contoh: Pulang acara keluarga..."
                            : "Contoh: Tidak ada keterangan..."
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

          {/* Bottom Action Footer */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center", marginTop: 12, background: "white", padding: "16px 20px", borderRadius: "16px", border: "1px solid #ebdcc3" }}>
            <Link
              href="/dashboard"
              style={{ padding: "10px 18px", borderRadius: "12px", color: "#64748b", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}
            >
              Batal
            </Link>
            <button
              type="button"
              style={{ background: "#550000", color: "white", padding: "11px 24px", borderRadius: "12px", border: "none", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", boxShadow: "0 4px 14px rgba(85,0,0,0.2)" }}
              onClick={handleSimpan}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} color="#ddc192" />
                  Simpan Presensi Santri
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingSantri && (
        <div
          style={{ background: "white", borderRadius: "20px", padding: "48px 24px", border: "1px solid #ebdcc3", textAlign: "center", color: "#64748b" }}
        >
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px", display: "block", color: "#550000" }} />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Memuat data santri...</p>
        </div>
      )}

      {/* Empty state */}
      {!loadingSantri && selectedKelas && tanggal && santri.length === 0 && !loadingMaster && (
        <div
          style={{ background: "white", borderRadius: "20px", padding: "48px 24px", border: "1px dashed #ebdcc3", textAlign: "center", color: "#64748b" }}
        >
          <Users size={40} style={{ opacity: 0.3, color: "#ddc192", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
            Belum ada santri terdaftar di kelas ini.
          </p>
        </div>
      )}
    </div>
  );
}
