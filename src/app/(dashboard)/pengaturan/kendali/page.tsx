"use client";

import React, { useState, useEffect } from "react";
import { Settings, BookOpen, BarChart3, BookMarked, UserCheck, CheckCircle2, Lock, Unlock, Loader2 } from "lucide-react";

interface SysConfig {
  LOCK_INPUT_NILAI: boolean;
  LOCK_INPUT_JURNAL: boolean;
  LOCK_INPUT_HALAQOH: boolean;
  LOCK_INPUT_IBADAH: boolean;
}

const SETTINGS_INFO = [
  {
    key: "LOCK_INPUT_NILAI",
    title: "Penginputan Nilai Akademik (PTS/PAS)",
    desc: "Kunci akses menu 'Input Nilai' agar guru tidak bisa menambah, mengubah, atau menghapus nilai PTS/PAS.",
    icon: <BarChart3 size={24} className="text-blue-500" />
  },
  {
    key: "LOCK_INPUT_HALAQOH",
    title: "Penginputan Ujian Tahfidz / Halaqoh",
    desc: "Kunci akses menu Input Ujian Tahfidz agar musyrif/pengampu tidak bisa mengubah nilai ujian yang sudah berlalu.",
    icon: <BookOpen size={24} className="text-emerald-500" />
  },
  {
    key: "LOCK_INPUT_JURNAL",
    title: "Pengisian Jurnal Mutabaah & Kehadiran",
    desc: "Kunci akses pengisian jurnal kelas setelah minggu/bulan tertentu agar guru tidak bisa backdate (mengisi tanggal lalu).",
    icon: <BookMarked size={24} className="text-amber-500" />
  },
  {
    key: "LOCK_INPUT_IBADAH",
    title: "Pengisian Jurnal Ibadah & Adab",
    desc: "Kunci akses penilaian ibadah (shalat jamaah, adab) oleh musyrif asrama.",
    icon: <UserCheck size={24} className="text-purple-500" />
  }
];

export default function PusatKendaliSistem() {
  const [config, setConfig] = useState<SysConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [isAdminSuper, setIsAdminSuper] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/pengaturan/kendali");
      const data = await res.json();
      setConfig(data.config);
      setIsAdminSuper(data.isAdminSuper);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (key: keyof SysConfig, currentLocked: boolean) => {
    const actionText = currentLocked ? "Membuka akses" : "MENGUNCI akses";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} untuk pengaturan ini?`)) return;
    
    setLoadingKey(key);
    try {
      const res = await fetch("/api/pengaturan/kendali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, is_locked: !currentLocked })
      });
      if (res.ok) {
        setConfig((prev) => prev ? { ...prev, [key]: !currentLocked } : null);
      } else {
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-7">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
        <Settings size={180} className="pointer-events-none absolute -right-10 -top-10 opacity-5 text-slate-100" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md border border-white/10">
            <CheckCircle2 size={14} className="text-emerald-400" /> Modul Kurikulum & Admin
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl text-white">
            Pusat Kendali Akses
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Halaman ini digunakan oleh Kepala Divisi Kurikulum untuk menutup atau membuka gerbang penginputan data secara terpusat (Lock System).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SETTINGS_INFO.map((item) => {
          const isLocked = config ? config[item.key as keyof SysConfig] : false;
          const isLoading = loadingKey === item.key;

          return (
            <div key={item.key} className="flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:border-slate-300 transition-colors">
              {/* Decorative background glow if locked */}
              {isLocked && <div className="absolute inset-0 bg-rose-50/30 pointer-events-none" />}
              
              <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${isLocked ? 'bg-rose-100' : 'bg-slate-100'}`}>
                  {item.icon}
                </div>
                <div>
                  <button
                    onClick={() => toggleLock(item.key as keyof SysConfig, isLocked)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      isLocked 
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200'
                    } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isLocked ? (
                      <><Lock size={16} /> Dikunci</>
                    ) : (
                      <><Unlock size={16} /> Terbuka</>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="relative z-10 flex-1">
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>

              {isLocked && (
                <div className="relative z-10 mt-5 text-[11px] font-bold text-rose-600 bg-rose-50 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-rose-100">
                  <Lock size={12} /> Status saat ini: Guru tidak dapat menyimpan data.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
