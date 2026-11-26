"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  CreditCard,
  GraduationCap,
  Lock,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import ModalKonfirmasiSPP from "@/components/ModalKonfirmasiSPP";
import BiodataBlock from "@/components/wali/BiodataBlock";
import KeaktifanArabBlock from "@/components/wali/KeaktifanArabBlock";
import PelanggaranBlock from "@/components/wali/PelanggaranBlock";
import KbmPenugasanBlock from "@/components/wali/KbmPenugasanBlock";
import PengasuhanBlock from "@/components/wali/PengasuhanBlock";
import HalaqohBlock from "@/components/wali/HalaqohBlock";
import KesehatanBlock from "@/components/wali/KesehatanBlock";
import type { WaliDashboardData } from "@/components/wali/types";

interface ChildOption {
  id: string;
  nama: string;
  kelas: string;
}

export default function WaliDashboard() {
  const [childrenList, setChildrenList] = useState<ChildOption[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>("");
  const [semester, setSemester] = useState<string>("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState<string>("2026/2027");

  const [dashboard, setDashboard] = useState<WaliDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSppModal, setShowSppModal] = useState(false);

  const loadChildren = useCallback(async () => {
    try {
      const res = await fetch("/api/wali/anak");
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        const mapped = json.data.map((c: any) => ({
          id: c.id,
          nama: c.nama,
          kelas: c.kelas,
        }));
        setChildrenList(mapped);
        if (mapped.length > 0 && !selectedSantriId) {
          setSelectedSantriId(mapped[0].id);
        } else if (mapped.length === 0) {
          setDashboard(null);
          setLoading(false);
        }
        return mapped;
      }
      setLoading(false);
      return [];
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data ananda");
      setLoading(false);
      return [];
    }
  }, [selectedSantriId]);

  const loadDashboard = useCallback(
    async (santriId?: string) => {
      setLoading(true);
      setError(null);
      try {
        let targetId = santriId || selectedSantriId;
        if (!targetId) {
          const list = await loadChildren();
          targetId = list[0]?.id || "";
        }
        if (!targetId) {
          setDashboard(null);
          setLoading(false);
          return;
        }
        const res = await fetch(
          `/api/wali/dashboard?santri_id=${encodeURIComponent(
            targetId
          )}&semester=${encodeURIComponent(semester)}&tahun_ajaran=${encodeURIComponent(
            tahunAjaran
          )}`
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Gagal memuat data ananda");
        }
        setDashboard(json);
      } catch (err: any) {
        setError(err?.message || "Gagal memuat data ananda");
      } finally {
        setLoading(false);
      }
    },
    [selectedSantriId, semester, tahunAjaran, loadChildren]
  );

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedSantriId) {
      loadDashboard(selectedSantriId);
    }
  }, [selectedSantriId, semester, tahunAjaran, loadDashboard]);

  const namaSantri = dashboard?.biodata?.nama || "Ananda";
  const isLocked = Boolean(dashboard?.locked);
  const sppVerifying = dashboard?.spp?.status === "menunggu_verifikasi";
  const tunggakanMonths = dashboard?.spp?.tunggakanCount || 1;

  return (
    <div className="min-h-dvh bg-[#f8fafc] pb-14">
      {/* Header Utama dengan Nama Santri */}
      <header
        className="relative overflow-hidden rounded-b-[2rem] px-5 pb-20 pt-8 text-white shadow-lg sm:px-8 sm:pt-10"
        style={{ background: "linear-gradient(135deg, #550000 0%, #7a0000 55%, #450000 100%)" }}
      >
        <div className="pointer-events-none absolute right-4 top-4 opacity-10" aria-hidden="true">
          <GraduationCap className="h-32 w-32 text-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Portal Resmi Wali Santri</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-rose-100/90 font-medium">
                Assalamu&apos;alaikum Abu / Ummu, berikut perkembangan Ananda:
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                {loading && !dashboard ? "Memuat Data Ananda..." : namaSantri}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {childrenList.length > 1 && (
                <select
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-white outline-none backdrop-blur-sm"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.nama} ({c.kelas})
                    </option>
                  ))}
                </select>
              )}

              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-white outline-none backdrop-blur-sm"
              >
                <option value="Ganjil" className="text-slate-900">
                  Semester Ganjil
                </option>
                <option value="Genap" className="text-slate-900">
                  Semester Genap
                </option>
              </select>

              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-white outline-none backdrop-blur-sm"
              >
                <option value="2026/2027" className="text-slate-900">
                  2026/2027
                </option>
                <option value="2027/2028" className="text-slate-900">
                  2027/2028
                </option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Konten Dashboard 7 Blok */}
      <main className="relative z-10 mx-auto -mt-12 max-w-7xl space-y-5 px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-slate-200/80 bg-white p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm"
          >
            <AlertCircle size={32} className="mx-auto text-rose-600 mb-3" />
            <h2 className="text-base font-black text-slate-900">Data Ananda Belum Dapat Dimuat</h2>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#550000] px-4 py-2 text-xs font-bold text-white hover:bg-[#7a0000]"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        ) : !dashboard ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Users size={32} className="mx-auto text-slate-400 mb-3" />
            <h2 className="text-base font-black text-slate-800">
              Belum Ada Ananda yang Terhubung
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Mohon hubungi wali kelas atau staf tata usaha pesantren untuk menautkan akun Abu/Ummu dengan data Ananda.
            </p>
          </div>
        ) : (
          <>
            {/* Status Banner SPP */}
            {isLocked ? (
              <div className="rounded-3xl border border-rose-300 bg-rose-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-rose-950">
                      Akses Informasi Akademik & Pengasuhan Terkunci
                    </h2>
                    <p className="text-xs text-rose-800 mt-0.5">
                      Terdapat tunggakan SPP ({tunggakanMonths} bulan). Silakan selesaikan pembayaran atau kirim konfirmasi agar seluruh laporan Ananda terbuka kembali.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSppModal(true)}
                    className="rounded-xl bg-rose-700 hover:bg-rose-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm"
                  >
                    Konfirmasi Bayar SPP
                  </button>
                  <Link
                    href={`/wali/spp?santri_id=${dashboard.biodata.id}`}
                    className="rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100"
                  >
                    Riwayat SPP
                  </Link>
                </div>
              </div>
            ) : sppVerifying ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 flex items-center gap-2">
                <Clock size={15} /> Pembayaran SPP sedang diverifikasi oleh bagian keuangan. Akses sementara tetap terbuka.
              </div>
            ) : null}

            {isLocked ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <BiodataBlock biodata={dashboard.biodata} />
                <div className="lg:col-span-2 rounded-3xl border border-dashed border-rose-200 bg-white p-8 flex flex-col items-center justify-center text-center">
                  <CreditCard size={30} className="text-rose-500 mb-2" />
                  <p className="text-sm font-black text-slate-800">
                    Detail Laporan Terkunci Sementara
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Blok Keaktifan Berbahasa Arab, Riwayat Pelanggaran, KBM & Penugasan, Pengasuhan, Halaqoh, dan Riwayat Kesehatan akan tampil otomatis setelah status SPP terverifikasi.
                  </p>
                </div>
              </div>
            ) : (
              /* Layout Grid 7 Blok:
                 Mobile: stack 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
                 Desktop: Baris atas (1, 2, 3), Tengah/Kiri (4), Kanan (5, 6), Kiri bawah (7) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-4">
                  <BiodataBlock biodata={dashboard.biodata} />
                </div>
                <div className="lg:col-span-4">
                  <KeaktifanArabBlock data={dashboard.keaktifanArab} />
                </div>
                <div className="lg:col-span-4">
                  <PelanggaranBlock pelanggaran={dashboard.pelanggaran} />
                </div>

                <div className="lg:col-span-7 lg:row-start-2">
                  <KbmPenugasanBlock
                    santriId={dashboard.biodata.id}
                    semester={dashboard.semester || semester}
                    tahunAjaran={dashboard.tahunAjaran || tahunAjaran}
                    kbm={dashboard.kbm}
                  />
                </div>
                <div className="lg:col-span-5 lg:row-start-2">
                  <PengasuhanBlock pengasuhan={dashboard.pengasuhan} />
                </div>

                <div className="lg:col-span-5 lg:col-start-8 lg:row-start-3">
                  <HalaqohBlock halaqoh={dashboard.halaqoh} />
                </div>
                <div className="lg:col-span-7 lg:col-start-1 lg:row-start-3">
                  <KesehatanBlock kesehatan={dashboard.kesehatan} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showSppModal && dashboard && (
        <ModalKonfirmasiSPP
          isOpen={showSppModal}
          santriId={dashboard.biodata.id}
          santriNama={dashboard.biodata.nama}
          santriNis={dashboard.biodata.nis}
          santriKelas={dashboard.biodata.kelasAktif}
          totalNominalTunggakan={dashboard.spp?.nominalTunggakan || tunggakanMonths * 1500000}
          onClose={() => setShowSppModal(false)}
          onSuccess={() => {
            setShowSppModal(false);
            loadDashboard(dashboard.biodata.id);
          }}
        />
      )}
    </div>
  );
}
