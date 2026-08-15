"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, BookHeart, ArrowLeft, ChevronDown, ChevronUp, Search, Sun, Moon, Cloud, Edit2, Check, X } from "lucide-react";
import Link from "next/link";

const SESI_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  subuh:   { label: "Subuh",          icon: <Sun size={15} />,   color: "text-amber-600", bg: "bg-amber-50" },
  maghrib: { label: "Ba'da Maghrib",  icon: <Moon size={15} />,  color: "text-violet-600", bg: "bg-violet-50" },
  dhuha:   { label: "Dhuha",          icon: <Cloud size={15} />, color: "text-sky-600", bg: "bg-sky-50" },
};

interface Santri {
  id: string;
  nama_lengkap: string;
  nis?: string;
  kelas?: { nama: string };
}

interface Kelompok {
  id: string;
  nama_kelompok: string;
  sesi: string;
  kelas?: { nama: string } | null;
  pegawai?: { nama_lengkap: string };
  anggota: { id: string; santri: Santri; is_active: boolean }[];
}

export default function HalaqohKelompokPage() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [allSantri, setAllSantri] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddKelompok, setShowAddKelompok] = useState(false);
  const [addSantriFor, setAddSantriFor] = useState<string | null>(null);
  const [searchSantri, setSearchSantri] = useState("");
  const [saving, setSaving] = useState(false);

  const [formKelompok, setFormKelompok] = useState({
    nama_kelompok: "",
    sesi: "subuh",
    kelas_id: "",
  });

  const [profile, setProfile] = useState<any>(null);

  const canManage = () => {
    const role = (profile?.role || "").toLowerCase();
    return role.includes("admin_super") || role.includes("kabid_pengasuhan");
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, sRes, pRes] = await Promise.all([
        fetch("/api/halaqoh/kelompok"),
        fetch("/api/halaqoh/master"),
        fetch("/api/profile"),
      ]);
      const kData = await kRes.json();
      const sData = await sRes.json();
      const pData = await pRes.json();
      setKelompokList(Array.isArray(kData) ? kData : kData.kelompok || []);
      setAllSantri(sData.santri || []);
      setProfile(pData?.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddKelompok = async () => {
    if (!formKelompok.nama_kelompok || !formKelompok.sesi) return;
    setSaving(true);
    try {
      const res = await fetch("/api/halaqoh/kelompok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formKelompok),
      });
      if (res.ok) {
        setShowAddKelompok(false);
        setFormKelompok({ nama_kelompok: "", sesi: "subuh", kelas_id: "" });
        await fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnggota = async (kelompokId: string, santriId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santri_id: santriId }),
      });
      if (res.ok) {
        setAddSantriFor(null);
        setSearchSantri("");
        await fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAnggota = async (kelompokId: string, santriId: string) => {
    if (!confirm("Hapus santri dari kelompok ini?")) return;
    await fetch(`/api/halaqoh/kelompok/${kelompokId}/anggota?santri_id=${santriId}`, {
      method: "DELETE",
    });
    await fetchAll();
  };

  const filteredSantri = (kelompokId: string) => {
    const kelompok = kelompokList.find(k => k.id === kelompokId);
    const sudahAdaIds = new Set(kelompok?.anggota.map(a => a.santri.id) || []);
    return allSantri.filter(s =>
      !sudahAdaIds.has(s.id) &&
      (searchSantri === "" || s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()) ||
        (s.nis || "").toLowerCase().includes(searchSantri.toLowerCase()))
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/halaqoh" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors">
          <ArrowLeft size={16} /> Kembali ke Halaqoh
        </Link>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#550000] via-[#751414] to-[#3a0000] rounded-3xl p-6 sm:p-8 text-white shadow-[0_12px_40px_rgba(85,0,0,0.35)] border border-red-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-inner">
              <Users className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-200 mb-2">
                <span>Manajemen Halaqoh</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">Kelompok Halaqoh</h1>
              <p className="text-red-100 text-xs sm:text-sm font-medium mt-1 opacity-90">Kelola kelompok dan anggota halaqoh pengampu</p>
            </div>
          </div>
          <div className="flex gap-2.5 relative z-10 w-full md:w-auto">
            {canManage() && (
              <button
                onClick={() => setShowAddKelompok(!showAddKelompok)}
                className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 flex items-center justify-center gap-2.5 text-sm font-extrabold shadow-md shadow-amber-900/30 transition-all hover:shadow-lg w-full md:w-auto cursor-pointer"
              >
                <Plus size={18} /> Buat Kelompok Baru
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Tambah Kelompok */}
      {showAddKelompok && (
        <div className="bg-white/90 backdrop-blur border-[1.5px] border-slate-200 rounded-3xl p-6 mb-6 shadow-xl shadow-slate-200/50">
          <h3 className="m-0 mb-4 text-base font-bold text-slate-900">Buat Kelompok Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nama Kelompok *</label>
              <input
                type="text"
                value={formKelompok.nama_kelompok}
                onChange={e => setFormKelompok(f => ({ ...f, nama_kelompok: e.target.value }))}
                placeholder="Cth: Kelompok A Subuh MTs"
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-sm bg-white focus:outline-none focus:border-[#550000] focus:ring-2 focus:ring-[#550000]/10 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sesi *</label>
              <select
                value={formKelompok.sesi}
                onChange={e => setFormKelompok(f => ({ ...f, sesi: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-sm bg-white focus:outline-none focus:border-[#550000] focus:ring-2 focus:ring-[#550000]/10 transition-all"
              >
                <option value="subuh">Subuh (04.50–06.10)</option>
                <option value="maghrib">Ba'da Maghrib</option>
                <option value="dhuha">Dhuha (07.00–08.20)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => setShowAddKelompok(false)}
              className="px-4 py-2 rounded-xl border-[1.5px] border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddKelompok}
              disabled={saving || !formKelompok.nama_kelompok}
              className={`px-4 py-2 rounded-xl border-none bg-[#550000] text-white text-sm font-bold shadow-md shadow-[#550000]/20 transition-all ${
                saving || !formKelompok.nama_kelompok ? "opacity-70 cursor-wait" : "hover:bg-[#6a0000] hover:-translate-y-0.5 cursor-pointer"
              }`}
            >
              {saving ? "Menyimpan..." : "Buat Kelompok"}
            </button>
          </div>
        </div>
      )}

      {/* Daftar Kelompok */}
      {loading ? (
        <div className="text-center p-10 text-slate-400 font-medium">Memuat data kelompok...</div>
      ) : kelompokList.length === 0 ? (
        <div className="bg-white/90 backdrop-blur border-[1.5px] border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <BookHeart size={40} className="mb-3 opacity-40 mx-auto" />
          <div className="text-base font-semibold mb-1.5 text-slate-500">Belum ada kelompok halaqoh</div>
          <div className="text-sm">Klik "Buat Kelompok" untuk memulai</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {kelompokList.map(kelompok => {
            const sesiInfo = SESI_INFO[kelompok.sesi] || SESI_INFO.subuh;
            const isExpanded = expandedId === kelompok.id;
            const isAddingHere = addSantriFor === kelompok.id;

            return (
              <div key={kelompok.id} className="bg-white/90 backdrop-blur border-[1.5px] border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : kelompok.id)}
                  className="flex items-center p-4 md:px-5 md:py-4 cursor-pointer gap-3.5 group"
                >
                  <div className={`${sesiInfo.bg} ${sesiInfo.color} rounded-2xl p-2.5 flex items-center justify-center shrink-0`}>
                    {sesiInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate group-hover:text-[#550000] transition-colors">{kelompok.nama_kelompok}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      <span className={`${sesiInfo.bg} ${sesiInfo.color} px-2.5 py-0.5 rounded-full font-semibold`}>
                        {sesiInfo.label}
                      </span>
                      <span className="flex items-center whitespace-nowrap"><Users size={12} className="mr-1" />{kelompok.anggota?.length || 0} santri</span>
                      {kelompok.kelas && <span className="whitespace-nowrap">· {kelompok.kelas.nama}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />}
                  </div>
                </div>

                {/* Expanded: Daftar Anggota */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-slate-100 bg-slate-50/50">
                    <div className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Daftar Anggota
                      </span>
                      {canManage() && (
                        <button
                          onClick={() => { setAddSantriFor(isAddingHere ? null : kelompok.id); setSearchSantri(""); }}
                          className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors w-full md:w-auto shadow-sm"
                        >
                          {isAddingHere ? <X size={14} /> : <Plus size={14} />}
                          {isAddingHere ? "Batal" : "Tambah Santri"}
                        </button>
                      )}
                    </div>

                    {/* Search Santri */}
                    {isAddingHere && canManage() && (
                      <div className="mb-4">
                        <div className="relative mb-2">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            value={searchSantri}
                            onChange={e => setSearchSantri(e.target.value)}
                            placeholder="Cari nama atau NIS santri..."
                            className="w-full py-2.5 pr-3 pl-9 rounded-xl border-[1.5px] border-slate-200 text-sm focus:outline-none focus:border-[#550000] focus:ring-2 focus:ring-[#550000]/10 transition-all bg-white"
                          />
                        </div>
                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-white shadow-inner">
                          {filteredSantri(kelompok.id).slice(0, 30).map(santri => (
                            <div
                              key={santri.id}
                              onClick={() => handleAddAnggota(kelompok.id, santri.id)}
                              className="p-3 cursor-pointer text-sm flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                            >
                              <div>
                                <div className="font-semibold text-slate-900">{santri.nama_lengkap}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{santri.nis} · {santri.kelas?.nama}</div>
                              </div>
                              <div className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-[#550000]/10 transition-colors">
                                <Plus size={16} className="text-[#550000]" />
                              </div>
                            </div>
                          ))}
                          {filteredSantri(kelompok.id).length === 0 && (
                            <div className="p-6 text-center text-slate-400 text-sm">
                              {searchSantri ? "Tidak ditemukan" : "Semua santri sudah ditambahkan"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Anggota List */}
                    {kelompok.anggota.length === 0 ? (
                      <div className="text-sm text-slate-400 text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200">
                        Belum ada anggota. Tambahkan santri ke kelompok ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {kelompok.anggota.map(anggota => (
                          <div key={anggota.id} className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
                            <div className="min-w-0 pr-2">
                              <div className="text-sm font-semibold text-slate-900 truncate">{anggota.santri.nama_lengkap}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{anggota.santri.nis || "—"}</div>
                            </div>
                            {canManage() && (
                              <button
                                onClick={() => handleRemoveAnggota(kelompok.id, anggota.santri.id)}
                                className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Hapus dari kelompok"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
