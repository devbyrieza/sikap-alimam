"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

interface JadwalRow {
  id: string;
  hari: string;
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
  kelas_id: string;
  pegawai_id: string;
  mapel_id: string;
  tipe_pekan: string;
  kelas: { id: string; nama: string; jenjang: string | null } | null;
  pegawai: { id: string; nama_lengkap: string; jabatan: string | null } | null;
  mapel: { id: string; nama: string; kategori: string | null } | null;
}

interface MasterData {
  kelas: { id: string; nama: string; jenjang: string | null }[];
  asatidz: { id: string; nama_lengkap: string; jabatan: string | null }[];
  mapel: Record<string, { id: string; nama: string; kategori: string }[]>;
}

interface SesiRow {
  jam_ke: number;
  waktu_mulai: string;
  waktu_selesai: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DRAFT_ADD_JADWAL = "sikap_kurikulum_add_jadwal_draft";

export default function KurikulumJadwalPage() {
  const [jadwalList, setJadwalList] = useState<JadwalRow[]>([]);
  const [master, setMaster] = useState<MasterData | null>(null);
  const [sesiList, setSesiList] = useState<SesiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [canManage, setCanManage] = useState(false);

  // Filter states
  const [tipePekan, setTipePekan] = useState<"semua" | "ganjil" | "genap">("semua");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [hariFilter, setHariFilter] = useState("all");
  const [guruFilter, setGuruFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({
    hari: "Senin",
    jam_ke: "3",
    kelas_id: "",
    mapel_id: "",
    pegawai_id: "",
    tipe_pekan: "semua",
  });

  // Kunci scroll body saat modal tambah jadwal terbuka (aturan wajib UX)
  useEffect(() => {
    if (!showAddModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev || "unset";
      window.removeEventListener("keydown", onKey);
    };
  }, [showAddModal]);

  // Pulihkan & autosave draf form tambah jadwal
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_ADD_JADWAL);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.hari) {
          setNewForm({
            hari: String(parsed.hari || "Senin"),
            jam_ke: String(parsed.jam_ke || "3"),
            kelas_id: String(parsed.kelas_id || ""),
            mapel_id: String(parsed.mapel_id || ""),
            pegawai_id: String(parsed.pegawai_id || ""),
            tipe_pekan: String(parsed.tipe_pekan || "semua"),
          });
        }
      }
    } catch {
      // Abaikan draf tidak valid
    }
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    try {
      localStorage.setItem(DRAFT_ADD_JADWAL, JSON.stringify(newForm));
    } catch {
      // Abaikan error penyimpanan
    }
  }, [newForm, showAddModal]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const qs =
        tipePekan === "semua" ? "" : `?tipe_pekan=${encodeURIComponent(tipePekan)}`;
      const [jadRes, masterRes, sesiRes, profRes] = await Promise.all([
        fetch(`/api/kurikulum/jadwal${qs}`, { cache: "no-store" }),
        fetch("/api/master", { cache: "no-store" }),
        fetch("/api/master/sesi", { cache: "no-store" }),
        fetch("/api/profile", { cache: "no-store" }),
      ]);

      const [jadJson, masterJson, sesiJson, profJson] = await Promise.all([
        jadRes.json(),
        masterRes.json(),
        sesiRes.json(),
        profRes.json(),
      ]);

      if (Array.isArray(jadJson)) setJadwalList(jadJson);
      if (masterJson && masterJson.kelas) setMaster(masterJson);
      if (Array.isArray(sesiJson)) setSesiList(sesiJson);

      const roleStr = String(profJson?.user?.role || "").toLowerCase();
      const namaStr = String(
        profJson?.pegawai?.nama_lengkap || profJson?.user?.nama || "",
      ).toLowerCase();
      const allowed =
        roleStr.includes("admin_super") ||
        roleStr.includes("mudir") ||
        roleStr.includes("kepala_sekolah") ||
        roleStr.includes("kepala_kurikulum") ||
        roleStr.includes("kadiv_kurikulum") ||
        namaStr.includes("imron");
      setCanManage(allowed);
    } catch (err) {
      console.error("Gagal memuat jadwal kurikulum:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Jadwal",
        text: "Tidak dapat mengambil data jadwal pelajaran dari server.",
        confirmButtonColor: "#550000",
      });
    } finally {
      setLoading(false);
    }
  }, [tipePekan]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const kelasOptions = useMemo(() => {
    const map = new Map<string, { id: string; nama: string }>();
    for (const j of jadwalList) {
      if (j.kelas?.id && !map.has(j.kelas.id)) {
        map.set(j.kelas.id, { id: j.kelas.id, nama: j.kelas.nama });
      }
    }
    for (const k of master?.kelas || []) {
      if (!map.has(k.id)) {
        const display =
          k.jenjang === "MTs" && /^\d+$/.test(k.nama.trim())
            ? `${k.nama.trim()} MTs`
            : k.jenjang === "MA" && /^\d+$/.test(k.nama.trim())
              ? `${k.nama.trim()} MA`
              : k.nama;
        map.set(k.id, { id: k.id, nama: display });
      }
    }
    return Array.from(map.values());
  }, [jadwalList, master]);

  const guruOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of master?.asatidz || []) {
      map.set(a.id, a.nama_lengkap);
    }
    for (const j of jadwalList) {
      if (j.pegawai?.id && !map.has(j.pegawai.id)) {
        map.set(j.pegawai.id, j.pegawai.nama_lengkap);
      }
    }
    return Array.from(map.entries())
      .map(([id, nama]) => ({ id, nama }))
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }, [jadwalList, master]);

  const mapelsForSelectedKelas = useMemo(() => {
    if (!newForm.kelas_id || !master?.mapel) return [];
    const direct = master.mapel[newForm.kelas_id] || [];
    if (direct.length > 0) return direct;
    return Object.values(master.mapel).flat();
  }, [newForm.kelas_id, master]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jadwalList.filter((j) => {
      if (kelasFilter !== "all" && j.kelas_id !== kelasFilter) return false;
      if (
        hariFilter !== "all" &&
        j.hari.toLowerCase() !== hariFilter.toLowerCase()
      ) {
        return false;
      }
      if (guruFilter !== "all" && j.pegawai_id !== guruFilter) return false;
      if (q) {
        const hay = [
          j.hari,
          j.kelas?.nama || "",
          j.mapel?.nama || "",
          j.pegawai?.nama_lengkap || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jadwalList, kelasFilter, hariFilter, guruFilter, search]);

  const uniqueTeachersCount = useMemo(
    () => new Set(filtered.map((f) => f.pegawai_id)).size,
    [filtered],
  );

  const alternatingCount = useMemo(
    () => filtered.filter((f) => f.tipe_pekan !== "semua").length,
    [filtered],
  );

  const handleSyncResmi = async () => {
    const conf = await Swal.fire({
      title: "Sinkron Ulang Jadwal Resmi?",
      text: "Jadwal akan disinkronkan ulang ke acuan Jadwal Resmi Revisi 2 Pesantren Al-Imam.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#550000",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Sinkronkan",
      cancelButtonText: "Batal",
    });
    if (!conf.isConfirmed) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-schedule", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal melakukan sinkronisasi jadwal");
      }
      await fetchAll();
      Swal.fire({
        icon: "success",
        title: "Sinkronisasi Berhasil",
        text: json?.message || "Jadwal resmi berhasil diperbarui.",
        confirmButtonColor: "#550000",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Sinkronisasi",
        text: msg,
        confirmButtonColor: "#550000",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newForm.hari ||
      !newForm.jam_ke ||
      !newForm.kelas_id ||
      !newForm.mapel_id ||
      !newForm.pegawai_id
    ) {
      Swal.fire({
        icon: "warning",
        title: "Form Belum Lengkap",
        text: "Hari, jam ke-, kelas, mata pelajaran, dan guru pengampu wajib dipilih.",
        confirmButtonColor: "#550000",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/kurikulum/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Gagal menambahkan jadwal");
      }
      localStorage.removeItem(DRAFT_ADD_JADWAL);
      setShowAddModal(false);
      setNewForm({
        hari: "Senin",
        jam_ke: "3",
        kelas_id: "",
        mapel_id: "",
        pegawai_id: "",
        tipe_pekan: "semua",
      });
      await fetchAll();
      Swal.fire({
        icon: "success",
        title: "Jadwal Ditambahkan",
        text: "Slot jadwal baru berhasil tersimpan dan langsung terhubung ke monitoring jurnal.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Tidak Dapat Menyimpan",
        text: msg,
        confirmButtonColor: "#550000",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = (row: JadwalRow) => {
    Swal.fire({
      title: "Hapus Slot Jadwal?",
      text: `${row.hari} Jam ke-${row.jam_ke} · ${row.mapel?.nama || "-"} (${row.kelas?.nama || "-"})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(async (resSwal) => {
      if (!resSwal.isConfirmed) return;
      try {
        const res = await fetch(
          `/api/kurikulum/jadwal?id=${encodeURIComponent(row.id)}`,
          { method: "DELETE" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Gagal menghapus jadwal");
        await fetchAll();
        Swal.fire({
          icon: "success",
          title: "Slot Dihapus",
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: msg,
          confirmButtonColor: "#550000",
        });
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e7e2da] bg-white p-5 shadow-xs">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-[#fcfaf8] px-2.5 py-1 text-xs font-semibold text-[#44403c] transition-colors duration-150 hover:bg-[#f6f1e8]"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <Link
              href="/jurnal/monitoring"
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-[#fdf5f5] px-2.5 py-1 text-xs font-semibold text-[#550000] transition-colors duration-150 hover:bg-[#f6e8e8]"
            >
              <ClipboardList size={14} /> Pantau Kepatuhan Jurnal
            </Link>
            <Link
              href="/master/sesi"
              className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7e2da] bg-[#faf6ee] px-2.5 py-1 text-xs font-semibold text-[#44403c] transition-colors duration-150 hover:bg-[#f6f1e8]"
            >
              <Clock size={14} /> Master Sesi Waktu
            </Link>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-[#550000]">
            <Calendar size={24} className="text-[#550000]" /> Pusat Jadwal Pelajaran KBM
          </h1>
          <p className="mt-1 text-sm text-[#44403c]">
            Acuan jadwal resmi mingguan Pesantren Al-Imam Al-Islami (sistem pekan ganjil &amp; genap) yang terintegrasi dengan monitoring jurnal guru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                type="button"
                onClick={handleSyncResmi}
                disabled={syncing}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e7e2da] bg-white px-3.5 py-2 text-xs font-semibold text-[#1a1a1a] transition-colors duration-150 hover:bg-[#f6f1e8] disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                Sinkron Jadwal Resmi
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#380000] active:scale-[0.98]"
              >
                <Plus size={15} /> Tambah Slot Jadwal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ringkasan Angka */}
      <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
        <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#44403c]">
            Total Slot Jadwal (Hasil Filter)
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-[#1a1a1a]">
            {filtered.length}
          </div>
          <div className="mt-0.5 text-xs text-[#44403c]">
            {alternatingCount} slot khusus pekan ganjil/genap
          </div>
        </div>
        <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#44403c]">
            Guru Terjadwal Aktif
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-[#550000]">
            {uniqueTeachersCount}
          </div>
          <div className="mt-0.5 text-xs text-[#44403c]">
            Terhubung ke monitoring kepatuhan jurnal
          </div>
        </div>
        <div className="rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#44403c]">
            Tipe Pekan Ditampilkan
          </div>
          <div className="mt-1 text-lg font-bold text-[#1a1a1a]">
            {tipePekan === "semua"
              ? "Semua Pekan (Rutin & Bergiliran)"
              : tipePekan === "ganjil"
                ? "Pekan 1 & 3 (Ganjil)"
                : "Pekan 2 & 4 (Genap)"}
          </div>
          <div className="mt-0.5 text-xs text-[#44403c]">
            Hari KBM: Senin s.d. Sabtu
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid gap-3 rounded-[12px] border border-[#e7e2da] bg-white p-4 shadow-xs md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-[#44403c]">
            Cari Mapel / Guru / Hari
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78716c]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama mapel atau asatidz..."
              className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] py-2 pl-9 pr-3 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#44403c]">
            Kelas
          </label>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          >
            <option value="all">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#44403c]">
            Hari
          </label>
          <select
            value={hariFilter}
            onChange={(e) => setHariFilter(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          >
            <option value="all">Semua Hari</option>
            {DAYS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#44403c]">
            Guru Pengampu
          </label>
          <select
            value={guruFilter}
            onChange={(e) => setGuruFilter(e.target.value)}
            className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#550000] focus:bg-white"
          >
            <option value="all">Semua Guru</option>
            {guruOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Pekan */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f0ece4] pt-3 lg:col-span-5">
          <span className="text-xs font-semibold text-[#44403c]">
            Filter Pekan:
          </span>
          {[
            { key: "semua" as const, label: "Semua Pekan" },
            { key: "ganjil" as const, label: "Pekan 1 & 3 (Ganjil)" },
            { key: "genap" as const, label: "Pekan 2 & 4 (Genap)" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTipePekan(opt.key)}
              className={`cursor-pointer rounded-[10px] px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                tipePekan === opt.key
                  ? "bg-[#550000] text-white"
                  : "border border-[#e7e2da] bg-white text-[#44403c] hover:bg-[#f6f1e8]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Jadwal */}
      <div className="overflow-hidden rounded-[12px] border border-[#e7e2da] bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-[#f0ece4] px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#1a1a1a]">
            <BookOpen size={17} className="text-[#550000]" />
            Matriks Jadwal Pelajaran
          </h2>
          <span className="text-xs font-medium tabular-nums text-[#44403c]">
            Menampilkan {filtered.length} entri
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-14 text-sm text-[#44403c]">
            <Loader2 size={18} className="animate-spin text-[#550000]" />
            Memuat jadwal pelajaran...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-[#44403c]">
            Belum ada slot jadwal yang sesuai dengan filter.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e7e2da] bg-[#faf6ee] text-[#1a1a1a]">
                  <th className="px-4 py-2.5 font-semibold">Hari</th>
                  <th className="px-4 py-2.5 font-semibold">Jam Ke</th>
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold">Kelas</th>
                  <th className="px-4 py-2.5 font-semibold">Mata Pelajaran</th>
                  <th className="px-4 py-2.5 font-semibold">Guru Pengampu</th>
                  <th className="px-4 py-2.5 font-semibold">Pekan</th>
                  {canManage && (
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr
                    key={j.id}
                    className="border-b border-[#f0ece4] transition-colors duration-150 hover:bg-[#faf6ee]"
                  >
                    <td className="px-4 py-2.5 font-semibold text-[#1a1a1a]">
                      {j.hari}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-[#1a1a1a]">
                        Jam {j.jam_ke}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-[#44403c]">
                      {j.waktu_mulai} – {j.waktu_selesai}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="inline-flex rounded-[8px] bg-[#fdf5f5] px-2.5 py-0.5 text-xs font-semibold text-[#550000]">
                        {j.kelas?.nama || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-[#1a1a1a]">
                        {j.mapel?.nama || "-"}
                      </div>
                      {j.mapel?.kategori && (
                        <div className="text-[11px] text-[#78716c]">
                          {j.mapel.kategori}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                        <Users size={14} className="shrink-0 text-[#78716c]" />
                        <span>{j.pegawai?.nama_lengkap || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          j.tipe_pekan === "ganjil"
                            ? "bg-amber-100 text-amber-800"
                            : j.tipe_pekan === "genap"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {j.tipe_pekan === "ganjil"
                          ? "Pekan 1/3"
                          : j.tipe_pekan === "genap"
                            ? "Pekan 2/4"
                            : "Semua Pekan"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(j)}
                          title="Hapus slot jadwal"
                          className="cursor-pointer rounded-[8px] p-1.5 text-rose-700 transition-colors duration-150 hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Slot Jadwal */}
      {showAddModal && canManage && (
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overscroll-contain"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="custom-scrollbar flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-[16px] border border-[#e7e2da] bg-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f0ece4] px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">
                  Tambah Slot Jadwal Pelajaran
                </h3>
                <p className="text-xs text-[#44403c]">
                  Jam belajar mengikuti pengaturan Master Sesi Waktu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup modal"
                className="cursor-pointer rounded-[8px] p-1.5 text-[#44403c] hover:bg-[#f6f1e8]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                    Hari
                  </label>
                  <select
                    value={newForm.hari}
                    onChange={(e) =>
                      setNewForm({ ...newForm, hari: e.target.value })
                    }
                    className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a]"
                  >
                    {DAYS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                    Jam Ke-
                  </label>
                  <select
                    value={newForm.jam_ke}
                    onChange={(e) =>
                      setNewForm({ ...newForm, jam_ke: e.target.value })
                    }
                    className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm tabular-nums text-[#1a1a1a]"
                  >
                    {(sesiList.length > 0
                      ? sesiList
                      : [
                          { jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40" },
                          { jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20" },
                          { jam_ke: 5, waktu_mulai: "08:20", waktu_selesai: "09:00" },
                          { jam_ke: 6, waktu_mulai: "09:00", waktu_selesai: "09:40" },
                          { jam_ke: 7, waktu_mulai: "10:00", waktu_selesai: "10:40" },
                          { jam_ke: 8, waktu_mulai: "10:40", waktu_selesai: "11:20" },
                          { jam_ke: 9, waktu_mulai: "11:20", waktu_selesai: "12:00" },
                        ]
                    ).map((s) => (
                      <option key={s.jam_ke} value={String(s.jam_ke)}>
                        Jam ke-{s.jam_ke} ({s.waktu_mulai}–{s.waktu_selesai})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                  Kelas
                </label>
                <select
                  value={newForm.kelas_id}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      kelas_id: e.target.value,
                      mapel_id: "",
                    })
                  }
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a]"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                  Mata Pelajaran
                </label>
                <select
                  value={newForm.mapel_id}
                  onChange={(e) =>
                    setNewForm({ ...newForm, mapel_id: e.target.value })
                  }
                  disabled={!newForm.kelas_id}
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a] disabled:opacity-60"
                >
                  <option value="">
                    {newForm.kelas_id
                      ? "-- Pilih Mata Pelajaran --"
                      : "-- Pilih kelas terlebih dahulu --"}
                  </option>
                  {mapelsForSelectedKelas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                  Guru Pengampu
                </label>
                <select
                  value={newForm.pegawai_id}
                  onChange={(e) =>
                    setNewForm({ ...newForm, pegawai_id: e.target.value })
                  }
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a]"
                >
                  <option value="">-- Pilih Guru --</option>
                  {guruOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#44403c]">
                  Ketentuan Pekan
                </label>
                <select
                  value={newForm.tipe_pekan}
                  onChange={(e) =>
                    setNewForm({ ...newForm, tipe_pekan: e.target.value })
                  }
                  className="w-full rounded-[10px] border border-[#e7e2da] bg-[#fcfaf8] px-3 py-2 text-sm text-[#1a1a1a]"
                >
                  <option value="semua">Semua Pekan (Rutin Tiap Pekan)</option>
                  <option value="ganjil">Pekan 1 &amp; 3 (Ganjil)</option>
                  <option value="genap">Pekan 2 &amp; 4 (Genap)</option>
                </select>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-[#f0ece4] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer rounded-[10px] border border-[#e7e2da] bg-white px-4 py-2 text-xs font-semibold text-[#44403c] hover:bg-[#f6f1e8]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#550000] px-4 py-2 text-xs font-semibold text-white hover:bg-[#380000] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Simpan Slot Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
