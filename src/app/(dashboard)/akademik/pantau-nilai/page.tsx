"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, BookOpen, Search, Loader2, User, Filter, AlertCircle, BarChart3, LineChart } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface Kelas { id: string; nama: string; }
interface Mapel { id: string; nama: string; }
interface Santri { id: string; nama_lengkap: string; nis?: string; }
interface NilaiEntry {
  id: string;
  santri: { id: string; nama_lengkap: string; nis?: string };
  mapel: { id: string; nama: string };
  nilai: number;
  jenis: string;
}

const SEMESTER_LIST = ["Ganjil", "Genap"];
const TAHUN_AJARAN_LIST = ["2026/2027", "2027/2028"];

export default function PantauNilaiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);
  
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [santriId, setSantriId] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [searchSantri, setSearchSantri] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [nilaiData, setNilaiData] = useState<NilaiEntry[]>([]);

  const [allSantri, setAllSantri] = useState<Santri[]>([]);

  // 1. Initial Load Kelas & Semua Santri (Global Search)
  useEffect(() => {
    Promise.all([
      fetch("/api/master/kelas").then(r => r.json()),
      fetch("/api/master/santri").then(r => r.json())
    ]).then(([kelasRes, santriRes]) => {
      setKelasList(kelasRes.kelas || []);
      setAllSantri(santriRes.data || santriRes.santri || []);
    }).catch(() => {})
      .finally(() => setLoadingInitial(false));
  }, []);

  // 2. Fetch Mapel & Filter Santri
  useEffect(() => {
    if (!kelasId) {
      setMapelList([]);
      setSantriList(allSantri);
      setMapelId("");
      return;
    }

    setSantriList(allSantri); // Walaupun ada kelas, list bisa menampung semua atau biarkan backend memfilter nanti, tapi krn di frontend kita punya allSantri, biarkan saja.
    // Tapi user minta bisa filter:
    fetch(`/api/master/mapel?kelas_id=${kelasId}`)
      .then(r => r.json())
      .then(d => {
        setMapelList(d.mapel || []);
        setMapelId("");
      }).catch(() => {});
  }, [kelasId, allSantri]);

  // 3. Fetch Nilai
  const fetchData = useCallback(async () => {
    // Boleh fetch asal ada Kelas ATAU ada Santri yang dipilih
    if (!kelasId && !santriId) return;
    setLoadingData(true);
    
    let url = `/api/nilai?semester=${semester}&tahun_ajaran=${encodeURIComponent(tahunAjaran)}`;
    if (kelasId) url += `&kelas_id=${kelasId}`;
    if (mapelId) url += `&mapel_id=${mapelId}`;
    if (santriId) url += `&santri_id=${santriId}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      // Jika mode pencarian santri tanpa kelas, mungkin list mapel kosong. Kita ambil mapel unik dari data nilai
      if (!kelasId && santriId) {
         const uniqueMapels = Array.from(new Map(data.nilai.map((n: any) => [n.mapel.id, n.mapel])).values()) as Mapel[];
         setMapelList(uniqueMapels);
      }

      setNilaiData(data.nilai || []);
    } catch {
      Swal.fire("Gagal", "Gagal memuat data nilai.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [kelasId, mapelId, santriId, semester, tahunAjaran]);

  // Auto fetch whenever filters change and valid
  useEffect(() => {
    if (kelasId && (mapelId || santriId || (!mapelId && !santriId))) {
      fetchData();
    }
  }, [fetchData, kelasId, mapelId, santriId, semester, tahunAjaran]);

  // --- CALCULATION HELPERS ---
  const getNilaiAkhir = (vals: NilaiEntry[]) => {
    const getVal = (jenis: string) => {
      const entry = vals.find(v => v.jenis === jenis);
      return entry ? Number(entry.nilai) : 0;
    };
    const hasPeriode = (suffix: string, ujianKey: string) => {
      return vals.some(v => v.jenis === `harian${suffix}` || v.jenis === `kompetensi${suffix}` || v.jenis === `sikap${suffix}` || v.jenis === ujianKey);
    };
    const calcFormula = (suffix: string, ujianKey: string) => {
      // MURNI PTS / UJIAN MODE: Nilai Akhir adalah nilai ujian murni
      return getVal(ujianKey);
    };

    if (hasPeriode("_pas", "pas")) {
      return Math.round(calcFormula("_pas", "pas") * 10) / 10;
    } else if (hasPeriode("_pts", "pts")) {
      return Math.round(calcFormula("_pts", "pts") * 10) / 10;
    }
    
    // MURNI UJIAN MODE (for Al-Imam recent rule, let's just fallback to calcFormula without suffix)
    if (vals.some(v => v.jenis === "ujian")) {
       return Math.round(calcFormula("", "ujian") * 10) / 10;
    }

    return null;
  };

  const filteredSantriList = santriList.filter(s => 
    searchSantri === "" || 
    s.nama_lengkap.toLowerCase().includes(searchSantri.toLowerCase()) || 
    (s.nis && s.nis.toLowerCase().includes(searchSantri.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#550000] to-[#7a0000] rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-primary/30 mb-8">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full border border-white/10" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full border border-white/10" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <LineChart size={18} />
              <span className="text-xs font-bold tracking-widest uppercase">Akademik & Evaluasi</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3">
              Pantau Nilai Santri
            </h1>
            <p className="text-white/80 max-w-xl text-sm leading-relaxed">
              Pantau seluruh capaian nilai santri secara terpusat. Anda bisa memfilter berdasarkan kelas, melihat seluruh nilai satu santri (Rapor View), atau melihat nilai seluruh kelas pada satu mata pelajaran tertentu.
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-slate-200/60 p-5 md:p-6 sticky top-4 z-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kelas</label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 appearance-none shadow-sm cursor-pointer"
                value={kelasId}
                onChange={e => setKelasId(e.target.value)}
                disabled={loadingInitial}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
          </div>

          {/* Mode View: Mapel OR Santri */}
          <div>
             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mata Pelajaran (Opsional)</label>
             <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 appearance-none shadow-sm cursor-pointer"
                value={mapelId}
                onChange={e => { setMapelId(e.target.value); if(e.target.value) setSantriId(""); }}
                disabled={!kelasId || mapelList.length === 0}
              >
                <option value="">Semua Mata Pelajaran</option>
                {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Santri (Opsional)</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Cari..." 
                 className="w-1/3 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary px-3 shadow-sm"
                 value={searchSantri}
                 onChange={e => setSearchSantri(e.target.value)}
               />
               <select
                  className="w-2/3 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 appearance-none shadow-sm cursor-pointer"
                  value={santriId}
                  onChange={e => { setSantriId(e.target.value); if(e.target.value) setMapelId(""); }}
                  disabled={santriList.length === 0}
                >
                  <option value="">Semua Santri</option>
                  {filteredSantriList.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 shadow-sm cursor-pointer"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            >
              {SEMESTER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tahun Ajaran</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 shadow-sm cursor-pointer"
              value={tahunAjaran}
              onChange={e => setTahunAjaran(e.target.value)}
            >
              {TAHUN_AJARAN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DATA VIEW */}
      {(kelasId || santriId) && !loadingInitial ? (
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          {loadingData ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-500">
               <Loader2 className="animate-spin mb-4 text-primary" size={40} />
               <p className="font-bold text-lg">Memuat data nilai...</p>
            </div>
          ) : (
            <div className="p-6">
              
              {/* MODE 1: SINGLE SANTRI, ALL MAPEL (RAPOR VIEW) */}
              {santriId && (
                <div>
                   <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                     <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                       {santriList.find(s => s.id === santriId)?.nama_lengkap.charAt(0) || "S"}
                     </div>
                     <div>
                       <h2 className="text-xl font-black text-slate-800">{santriList.find(s => s.id === santriId)?.nama_lengkap}</h2>
                       <p className="text-sm text-slate-500 font-medium">Rekapitulasi Seluruh Mata Pelajaran</p>
                     </div>
                   </div>

                   {mapelList.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Tidak ada mata pelajaran untuk santri ini.</div>
                   ) : (
                     <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                              <tr>
                                 <th className="px-6 py-4">Mata Pelajaran</th>
                                 <th className="px-6 py-4 text-center">Nilai Akhir</th>
                                 <th className="px-6 py-4">Keterangan</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {mapelList.map(m => {
                                 const vals = nilaiData.filter(n => n.mapel.id === m.id);
                                 const na = getNilaiAkhir(vals);
                                 return (
                                   <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-bold text-slate-800">{m.nama}</td>
                                      <td className="px-6 py-4 text-center">
                                         {na !== null ? (
                                           <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black ${na >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                             {na}
                                           </span>
                                         ) : <span className="text-slate-400">-</span>}
                                      </td>
                                      <td className="px-6 py-4">
                                        {na !== null ? (
                                          na >= 80 ? <span className="text-emerald-600 font-bold text-xs">Tuntas</span> : <span className="text-red-600 font-bold text-xs">Belum Tuntas</span>
                                        ) : <span className="text-slate-400">-</span>}
                                      </td>
                                   </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
              )}

              {/* MODE 2: SINGLE MAPEL, ALL SANTRI (LEGER VIEW) */}
              {mapelId && !santriId && (
                <div>
                   <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                     <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                       <BookOpen size={24} />
                     </div>
                     <div>
                       <h2 className="text-xl font-black text-slate-800">{mapelList.find(m => m.id === mapelId)?.nama}</h2>
                       <p className="text-sm text-slate-500 font-medium">Daftar Nilai Seluruh Santri</p>
                     </div>
                   </div>

                   {santriList.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Tidak ada santri di kelas ini.</div>
                   ) : (
                     <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                              <tr>
                                 <th className="px-6 py-4">Nama Santri</th>
                                 <th className="px-6 py-4 text-center">Nilai Akhir</th>
                                 <th className="px-6 py-4">Keterangan</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {santriList.map(s => {
                                 const vals = nilaiData.filter(n => n.santri.id === s.id);
                                 const na = getNilaiAkhir(vals);
                                 return (
                                   <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-bold text-slate-800">{s.nama_lengkap}</td>
                                      <td className="px-6 py-4 text-center">
                                         {na !== null ? (
                                           <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-black ${na >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                             {na}
                                           </span>
                                         ) : <span className="text-slate-400">-</span>}
                                      </td>
                                      <td className="px-6 py-4">
                                        {na !== null ? (
                                          na >= 80 ? <span className="text-emerald-600 font-bold text-xs">Tuntas</span> : <span className="text-red-600 font-bold text-xs">Belum Tuntas</span>
                                        ) : <span className="text-slate-400">-</span>}
                                      </td>
                                   </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
              )}

              {/* MODE 3: OVERVIEW (BELUM PILIH MAPEL/SANTRI) */}
              {!mapelId && !santriId && (
                 <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <Filter className="text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-black text-slate-700 mb-2">Pilih Filter Tampilan</h3>
                    <p className="text-slate-500 max-w-sm text-sm">
                      Silakan pilih <b>Mata Pelajaran</b> untuk melihat nilai seluruh santri di kelas ini, atau pilih <b>Nama Santri</b> untuk melihat seluruh nilainya.
                    </p>
                 </div>
              )}

            </div>
          )}
        </div>
      ) : (!kelasId && !santriId) ? (
         <div className="flex flex-col items-center justify-center p-20 text-center bg-white/50 backdrop-blur rounded-2xl border border-slate-200 border-dashed">
            <BookOpen className="text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-black text-slate-700 mb-2">Pilih Kelas Atau Cari Santri</h3>
            <p className="text-slate-500 text-sm">Anda bisa memilih kelas terlebih dahulu, atau langsung mencari nama santri di kotak filter untuk memantau nilai akademik.</p>
         </div>
      ) : null}

    </div>
  );
}
