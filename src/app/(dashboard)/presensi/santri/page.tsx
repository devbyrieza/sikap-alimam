"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Clock,
  Check,
  Calendar,
  BookOpen,
  AlertCircle,
  AlertTriangle } from "lucide-react";


type Kelas = { id: string; nama: string; jenjang: string | null };
type Mapel = { id: string; nama: string };
type AsatidzmMapel = { id: string; pegawai_id: string; mapel_id: string; kelas_id: string };
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
  alpha: "Alpha" };
const STATUS_COLOR: Record<StatusType, string> = {
  hadir: "#15803d",
  sakit: "#1d4ed8",
  izin: "#d97706",
  alpha: "#b91c1c" };
const STATUS_BG: Record<StatusType, string> = {
  hadir: "rgba(21,128,61,0.10)",
  sakit: "rgba(29,78,216,0.10)",
  izin: "rgba(217,119,6,0.10)",
  alpha: "rgba(185,28,28,0.10)" };

const JAM_OPTIONS = ["3", "4", "5", "6", "7", "8", "9", "Khusus"];

function formatTanggalWithHari(dateStr: string) {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return "";
    const date = new Date(year, month - 1, day);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${day} ${months[month - 1]} ${year}`;
  } catch {
    return "";
  }
}

export default function PresensiSantriPage() {
  const router = useRouter();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit" }).format(new Date());

  const [master, setMaster] = useState<{
    kelas: Kelas[];
    mapel: Record<string, Mapel[]>;
    asatidzmMapel: AsatidzmMapel[];
  } | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const [asatidId, setAsatidId] = useState("");
  const [isAdminSuper, setIsAdminSuper] = useState(false);
  const [selectedJenjang, setSelectedJenjang] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [namaMapelCustom, setNamaMapelCustom] = useState("");

  const selectedKelasInfo = master?.kelas.find(k => k.id === selectedKelas);
  const isSpecialClass = selectedKelasInfo?.nama.toLowerCase().includes("11 ma") || selectedKelasInfo?.nama.toLowerCase().includes("12 ma");

  // Force asatidz to Thoriq Ziyad if special class
  useEffect(() => {
    if (isSpecialClass && master) {
      const thoriq = master.asatidzmMapel.find(am => {
        const asatid = master.asatidzmMapel.find(a => a.pegawai_id === am.pegawai_id);
        // Wait, asatidzmMapel doesn't have nama_lengkap, but the user profile might?
        // Actually, we can't easily find Thoriq here unless we have asatidz list. But the user said:
        // "pada pemilihan mapel maka Thoriq Ziyad menginput atau mengetik saja sendiri nama Mapel nya"
        // This means we just need the mapel input custom. AsatidId is set by profile fetch for normal users, or we can just leave it as is if it's already Thoriq Ziyad.
      });
    }
  }, [isSpecialClass, master]);
  const [jamKe, setJamKe] = useState<string[]>([]);
  const [jamKhususMulai, setJamKhususMulai] = useState("");
  const [jamKhususSelesai, setJamKhususSelesai] = useState("");
  const [tanggal, setTanggal] = useState(today);

  const [santri, setSantri] = useState<SantriPresensi[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>({});
  const [keteranganMap, setKeteranganMap] = useState<Record<string, string>>({});
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [saving, setSaving] = useState(false);

  // Default tanggal ke Hari Ini & bersihkan draf awal agar alur selalu bersih meminta pilih jenjang
  useEffect(() => {
    setTanggal(today);
    try {
      localStorage.removeItem("siakad_presensi_draft");
    } catch (e) {}
  }, [today]);

  // Fetch Profile to get asatidId & role
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profileData) => {
        const pegawaiObj = profileData?.pegawai;
        const userObj = profileData?.user;
        if (pegawaiObj?.id) {
          setAsatidId(pegawaiObj.id);
        }
        if (userObj?.role) {
          const role = (userObj.role || "").toLowerCase();
          setIsAdminSuper(role.includes("admin_super"));
        }
      })
      .catch(() => {});
  }, []);


  // Autosave draft ke localStorage
  useEffect(() => {
    if (selectedKelas || Object.keys(statusMap).length > 0 || Object.keys(keteranganMap).length > 0) {
      const p = { selectedJenjang, selectedKelas, mapelId, jamKe, tanggal, statusMap, keteranganMap };
      localStorage.setItem("siakad_presensi_draft", JSON.stringify(p));
    }
  }, [selectedJenjang, selectedKelas, mapelId, jamKe, tanggal, statusMap, keteranganMap]);

  // Load kelas list from master
  useEffect(() => {
    fetch("/api/master")
      .then((r) => r.json())
      .then((data) => {
        setMaster(data);
        setKelasList(data.kelas || []);
        setLoadingMaster(false);
      })
      .catch(() => {
        setLoadingMaster(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data master.",
          confirmButtonColor: "var(--primary)" });
      });
  }, []);

  // Available Jenjang Options berdasarkan guru yang dipilih / login
  const availableJenjangs = useMemo(() => {
    const defaultJenjangs = ["MTs", "IL", "MA"];
    if (isAdminSuper || !asatidId || !master?.asatidzmMapel || !master?.kelas) return defaultJenjangs;

    const teacherKelasIds = master.asatidzmMapel
      .filter((am) => am.pegawai_id === asatidId)
      .map((am) => am.kelas_id);

    if (teacherKelasIds.length === 0) return defaultJenjangs;

    const teacherJenjangs = master.kelas
      .filter((k) => teacherKelasIds.includes(k.id) && k.jenjang)
      .map((k) => k.jenjang as string);

    const uniqueJenjangs = Array.from(new Set(teacherJenjangs));
    return uniqueJenjangs.length > 0 ? uniqueJenjangs : defaultJenjangs;
  }, [asatidId, master, isAdminSuper]);

  // Auto-select Jenjang HANYA jika hanya ada 1 pilihan. Jika > 1, HARUS minta user memilih ("")
  useEffect(() => {
    if (availableJenjangs.length === 1) {
      setSelectedJenjang(availableJenjangs[0]);
    } else if (availableJenjangs.length > 1) {
      setSelectedJenjang("");
      setSelectedKelas("");
      setMapelId("");
      setJamKe([]);
      setSantri([]);
    }
  }, [availableJenjangs]);

  const filteredKelasList = useMemo(() => {
    if (!selectedJenjang) return [];
    let list = master?.kelas || [];
    list = list.filter((k) => k.jenjang === selectedJenjang);

    if (!isAdminSuper && asatidId && master?.asatidzmMapel) {
      const teacherKelasIds = master.asatidzmMapel
        .filter((am) => am.pegawai_id === asatidId)
        .map((am) => am.kelas_id);

      if (teacherKelasIds.length > 0) {
        list = list.filter((k) => teacherKelasIds.includes(k.id));
      }
    }

    return list;
  }, [selectedJenjang, asatidId, master, isAdminSuper]);

  // Auto-select Kelas jika hanya ada 1 kelas
  useEffect(() => {
    if (filteredKelasList.length === 1) {
      setSelectedKelas(filteredKelasList[0].id);
    } else if (selectedKelas) {
      const exists = filteredKelasList.find((k) => k.id === selectedKelas);
      if (!exists) setSelectedKelas("");
    }
  }, [filteredKelasList, selectedKelas]);


  const mapelList = useMemo(() => {
    let list = (selectedKelas && master?.mapel?.[selectedKelas]) || [];
    if (asatidId && master?.asatidzmMapel && list.length > 0) {
      const allowedMapelIds = new Set(
        master.asatidzmMapel
          .filter((am) => am.pegawai_id === asatidId)
          .map((am) => am.mapel_id)
      );

      const teacherMapelNames = new Set<string>();
      if (master?.mapel) {
        Object.values(master.mapel).flat().forEach((m: any) => {
          if (allowedMapelIds.has(m.id)) {
            teacherMapelNames.add(m.nama.trim().toLowerCase());
          }
        });
      }

      if (allowedMapelIds.size > 0 || teacherMapelNames.size > 0) {
        const filtered = list.filter(
          (m: any) => allowedMapelIds.has(m.id) || teacherMapelNames.has(m.nama.trim().toLowerCase())
        );
        if (filtered.length > 0) {
          list = filtered;
        }
      }
    }
    return list;
  }, [selectedKelas, asatidId, master]);


  // Auto-select Mapel jika hanya ada 1 mapel, atau reset jika kelas berganti
  useEffect(() => {
    if (mapelList.length === 1) {
      setMapelId(mapelList[0].id);
    } else if (mapelId && !mapelList.some((m) => m.id === mapelId)) {
      setMapelId("");
    }
  }, [mapelList]);


  const jamKeString = useMemo(() => {
    if (!Array.isArray(jamKe) || jamKe.length === 0) return "";
    return jamKe.slice().sort((a, b) => {
      if (a === "Khusus") return 1;
      if (b === "Khusus") return -1;
      return parseInt(a) - parseInt(b);
    }).map(j => {
      if (j === "Khusus" && jamKhususMulai && jamKhususSelesai) {
        return `Khusus (${jamKhususMulai}-${jamKhususSelesai})`;
      }
      return j;
    }).join(", ");
  }, [jamKe, jamKhususMulai, jamKhususSelesai]);

  // Load santri + status presensi when kelas, tanggal, mapel, and jamKe are set
  const loadPresensi = useCallback(async (isManualClick = false) => {
    if (!selectedKelas || !tanggal || (!mapelId && !namaMapelCustom) || !jamKeString) {
      if (isManualClick) {
        Swal.fire({
          icon: "warning",
          title: "Data Kurang Lengkap",
          text: "Pilih Kelas, Tanggal, Mata Pelajaran, dan Jam Ke- terlebih dahulu.",
          confirmButtonColor: "var(--primary)" });
      }
      return;
    }

    setLoadingSantri(true);
    setSantri([]);
    setStatusMap({});
    setKeteranganMap({});

    try {
      let urlFetch = `/api/presensi/santri?kelas_id=${selectedKelas}&tanggal=${tanggal}&jam_ke=${encodeURIComponent(jamKeString)}`;
      if (isSpecialClass) {
        urlFetch += `&nama_mapel_custom=${encodeURIComponent(namaMapelCustom)}`;
      } else {
        urlFetch += `&mapel_id=${mapelId}`;
      }
      
      const res = await fetch(urlFetch);
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
        confirmButtonColor: "var(--primary)" });
    } finally {
      setLoadingSantri(false);
    }
  }, [selectedKelas, tanggal, mapelId, namaMapelCustom, isSpecialClass, jamKeString]);

  // Otomatis muat daftar santri HANYA ketika seluruh filter (Kelas, Tanggal, Mapel, Jam Ke-) terisi lengkap
  useEffect(() => {
    if (selectedKelas && tanggal && (mapelId || namaMapelCustom) && jamKeString) {
      loadPresensi(false);
    } else {
      setSantri([]);
      setStatusMap({});
      setKeteranganMap({});
    }
  }, [selectedKelas, tanggal, mapelId, namaMapelCustom, jamKeString, loadPresensi]);

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
    if (!mapelId && !namaMapelCustom) {
      Swal.fire({
        icon: "warning",
        title: "Mata Pelajaran Belum Dipilih",
        text: "Silakan pilih Mata Pelajaran terlebih dahulu sebelum menyimpan presensi.",
        confirmButtonColor: "var(--primary)" });
      return;
    }

    if (!selectedKelas || !tanggal || !jamKe || santri.length === 0) return;


    // (Confirmation alert for missing attendance removed because default is now Hadir)

    const kelasNamaConfirm = kelasList.find((k) => k.id === selectedKelas)?.nama;
    const mapelNamaConfirm = isSpecialClass ? namaMapelCustom : mapelList.find((m) => m.id === mapelId)?.nama;

    const confirm = await Swal.fire({
      title: "Simpan Presensi?",
      html: `
        <div style="font-size:13px; color:#6b7280; margin-bottom: 14px; text-align:left; padding: 10px 12px; background: #f9fafb; border-radius: 8px;">
          Tanggal: <strong>${tanggal}</strong><br/>
          Kelas: <strong>${kelasNamaConfirm}</strong><br/>
          Mapel: <strong>${mapelNamaConfirm}</strong> (Jam ${jamKe})<br/>
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
      cancelButtonText: "Batal" });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const presensiPayload = santri.map((s) => ({
        santri_id: s.id,
        status: statusMap[s.id] || "hadir",
        keterangan: keteranganMap[s.id] || null }));
      
      const payload: any = {
        kelas_id: selectedKelas,
        tanggal,
        jam_ke: jamKe,
        presensi: presensiPayload };
      if (isSpecialClass) {
        payload.nama_mapel_custom = namaMapelCustom;
      } else {
        payload.mapel_id = mapelId;
      }

      const res = await fetch("/api/presensi/santri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");

      localStorage.removeItem("siakad_presensi_draft");

      Swal.fire({
        icon: "success",
        title: "Presensi Berhasil Disimpan!",
        text: `Data presensi ${json.count} santri telah berhasil tersimpan ke sistem.`,
        confirmButtonColor: "var(--primary)",
        confirmButtonText: "Selesai" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "var(--primary)" });
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
          border: "1px solid #ebdcc3" }}
      >
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#550000", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} color="#ddc192" />
          Pilih Kelas &amp; Tanggal Presensi
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", width: "100%", alignItems: "flex-end" }}>
          {/* Tanggal */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Tanggal <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="date"
              className="w-full min-w-0 box-border"
              style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
            {tanggal && (
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#047857", display: "flex", alignItems: "center", gap: "5px", background: "#ecfdf5", padding: "4px 10px", borderRadius: "8px", border: "1px solid #a7f3d0", width: "fit-content" }}>
                <Calendar size={13} color="#047857" />
                <span>{formatTanggalWithHari(tanggal)}</span>
              </div>
            )}
          </div>

          {/* Jenjang */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Jenjang <span style={{ color: "#ef4444" }}>*</span></label>
            {loadingMaster ? (
              <div
                className="w-full box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}
              >
                <Loader2 size={16} className="animate-spin text-amber-700" />
                ...
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
                {availableJenjangs.length > 1 && <option value="">— Pilih Jenjang —</option>}
                {availableJenjangs.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Kelas */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Kelas <span style={{ color: "#ef4444" }}>*</span></label>
            {loadingMaster ? (
              <div
                className="w-full box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", color: "#64748b", display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}
              >
                <Loader2 size={16} className="animate-spin text-amber-700" />
                ...
              </div>
            ) : (
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: !selectedJenjang ? "#f1f5f9" : "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setMapelId("");
                  setSantri([]);
                  setStatusMap({});
                  setKeteranganMap({});
                }}
                disabled={!selectedJenjang}
              >
                <option value="">{selectedJenjang ? "— Pilih Kelas —" : "— Pilih Jenjang Terlebih Dahulu —"}</option>
                {filteredKelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mata Pelajaran */}
          <div className="flex flex-col gap-1.5 min-w-0 w-full">
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Mata Pelajaran <span style={{ color: "#ef4444" }}>*</span></label>
            {isSpecialClass ? (
              <input
                type="text"
                placeholder="Ketik nama mata pelajaran..."
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
                value={namaMapelCustom}
                onChange={(e) => {
                  const val = e.target.value;
                  setNamaMapelCustom(val);
                  if (!val) {
                    setSantri([]);
                    setStatusMap({});
                    setKeteranganMap({});
                  }
                }}
              />
            ) : (
              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: !selectedKelas ? "#f1f5f9" : "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
                value={mapelId}
                onChange={(e) => {
                  const val = e.target.value;
                  setMapelId(val);
                  if (!val) {
                    setSantri([]);
                    setStatusMap({});
                    setKeteranganMap({});
                  }
                }}
                disabled={!selectedKelas}
              >
                <option value="">{selectedKelas ? "— Pilih Mata Pelajaran —" : "— Pilih Kelas Terlebih Dahulu —"}</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
            )}
          </div>


        </div>

        {/* Component Jam ke- (KBM Kelas) */}
        <div style={{ padding: "16px", background: "#fdf8f0", borderRadius: "16px", border: "1px solid #ebdcc3", marginTop: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px", flexWrap: "wrap", gap: 8 }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#550000", margin: 0, marginBottom: "4px" }}>
                <Clock size={16} color="#ddc192" />
                Jam ke- (KBM Kelas) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, margin: 0 }}>
                KBM Mulai jam ke-3 (07.00 WIB) · <span style={{ color: "#b45309", fontWeight: 600 }}>09.40–10.00: Waktu Istirahat</span>
              </p>
            </div>
            {jamKe.length > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: "99px", whiteSpace: "nowrap", border: "1px solid #a7f3d0" }}>
                Durasi: {jamKe.length} Jam
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {JAM_OPTIONS.map((j) => {
              const isSelected = jamKe.includes(j);
              const waktuMap: Record<string, string> = {
                "3": "07.00-07.40",
                "4": "07.40-08.20",
                "5": "08.20-09.00",
                "6": "09.00-09.40",
                "7": "10.00-10.40",
                "8": "10.40-11.20",
                "9": "11.20-12.00" };
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setJamKe(jamKe.filter((k) => k !== j));
                    } else {
                      setJamKe([...jamKe, j]);
                    }
                  }}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    fontWeight: "bold",
                    borderRadius: "12px",
                    border: "2px solid",
                    padding: "6px 12px",
                    minWidth: "68px",
                    height: "auto",
                    ...(isSelected
                      ? {
                          background: "#ecfdf5",
                          color: "#047857",
                          borderColor: "#10b981",
                          boxShadow: "0 1px 3px rgba(16,185,129,0.2)" }
                      : {
                          background: "white",
                          color: "#64748b",
                          borderColor: "#cbd5e1" }),
                    cursor: "pointer" }}
                >
                  {isSelected && j !== "Khusus" && (
                    <div style={{ position: "absolute", top: "-6px", right: "-6px", background: "#10b981", color: "white", borderRadius: "50%", padding: "2px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", zIndex: 10 }}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                  {isSelected && j === "Khusus" && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
                      <Check size={14} strokeWidth={3} style={{ marginRight: "4px" }} />
                      <span style={{ fontSize: "14px" }}>{j}</span>
                    </div>
                  )}
                  {!isSelected && j === "Khusus" && <span style={{ fontSize: "14px", marginBottom: "2px" }}>{j}</span>}
                  {j === "Khusus" && <span style={{ fontSize: "9px", fontWeight: 600, color: isSelected ? "#059669" : "#94a3b8" }}>Menyesuaikan</span>}

                  {j !== "Khusus" && (
                    <>
                      <span style={{ fontSize: "14px", lineHeight: 1, marginBottom: "4px" }}>{j}</span>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: isSelected ? "#059669" : "#94a3b8", lineHeight: 1 }}>{waktuMap[j]}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {jamKe.includes("Khusus") && (
            <div style={{ marginTop: "12px", padding: "12px", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Tentukan Waktu Khusus <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input type="time" value={jamKhususMulai} onChange={(e) => setJamKhususMulai(e.target.value)} required={jamKe.includes("Khusus")} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", background: "white", color: "#334155" }} />
                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "13px" }}>s.d</span>
                <input type="time" value={jamKhususSelesai} onChange={(e) => setJamKhususSelesai(e.target.value)} required={jamKe.includes("Khusus")} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", background: "white", color: "#334155" }} />
              </div>
            </div>
          )}
        </div>

        {/* Tombol Tampilkan Santri */}
        <div className="w-full min-w-0" style={{ marginTop: "4px" }}>
          <button
            className="w-full box-border flex items-center justify-center gap-2"
            style={{ background: "#550000", color: "white", padding: "12px 20px", borderRadius: "12px", border: "1px solid #550000", fontWeight: 700, cursor: "pointer", height: "46px", boxShadow: "0 2px 8px rgba(85,0,0,0.2)" }}
            onClick={() => loadPresensi(true)}

            disabled={!selectedKelas || !tanggal || !mapelId || jamKe.length === 0 || loadingSantri}
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

      {/* Step 2: Daftar Santri (Hanya tampil jika seluruh parameter terisi lengkap & santri termuat) */}
      {Boolean(selectedKelas && mapelId && jamKeString && santri.length > 0) && (

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
                  transition: "width 0.4s ease" }}
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
                      gap: 8 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0 }}
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
                            whiteSpace: "nowrap" }}
                        >
                          {s.nama_lengkap}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            margin: "2px 0 0 0" }}
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
                      gap: 8 }}
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
                            minHeight: 42 }}
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
                          display: "block" }}
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

      {/* Warning State jika Mapel atau filter belum terisi lengkap */}
      {!loadingSantri && (!mapelId || !selectedKelas || jamKe.length === 0) && (
        <div
          style={{ background: "#fffbeb", borderRadius: "20px", padding: "36px 24px", border: "1.5px solid #fef08a", textAlign: "center", color: "#92400e", boxShadow: "0 2px 10px rgba(217, 119, 6, 0.05)" }}
        >
          <div style={{ width: 48, height: 48, background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#d97706" }}>
            <BookOpen size={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>Isian Filter Belum Lengkap</div>
          <p style={{ fontSize: 13, color: "#b45309", margin: 0, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                {!mapelId ? "Mata Pelajaran belum dipilih. Silakan tentukan Mata Pelajaran terlebih dahulu." : "Silakan lengkapi pilihan Kelas dan Jam Ke- terlebih dahulu."} Daftar presensi santri tidak akan ditampilkan sebelum isian terisi lengkap.
              </span>
            </div>
          </p>
        </div>
      )}

      {/* Empty state ketika filter terisi lengkap namun tidak ada santri */}
      {!loadingSantri && selectedKelas && mapelId && jamKe.length > 0 && santri.length === 0 && !loadingMaster && (
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
