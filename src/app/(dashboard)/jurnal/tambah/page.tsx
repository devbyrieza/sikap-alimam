"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { BookOpen, ChevronLeft, Loader2, FileText, Zap, Clock, Save, Calendar, MessageSquare, Microscope, BookMarked, Edit3, Check, Trash2, RotateCcw, AlertCircle } from "lucide-react";
import Link from "next/link";

type Kelas = { id: string; nama: string; jenjang: string | null };
type Asatidz = { id: string; nama_lengkap: string; jabatan: string | null };
type Mapel = { id: string; nama: string };
type MasterData = {
  kelas: Kelas[];
  asatidz: Asatidz[];
  mapel: Record<string, Mapel[]>;
};

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const JAM_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "Khusus"];



function formatTanggalIndo(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

export default function TambahJurnalPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [master, setMaster] = useState<MasterData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Form fields
  const [jenjangFilter, setJenjangFilter] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [asatidId, setAsatidId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [jamKe, setJamKe] = useState<string[]>([]);
  const [materi, setMateri] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Load draft dari localStorage
  useEffect(() => {
    const draft = localStorage.getItem("siakad_jurnal_draft");
    if (draft) {
      try {
        const p = JSON.parse(draft);
        const hasContent = p.materi || p.learningOutcome || p.kegiatan || p.catatan || p.kelasId;
        if (p.kelasId) setKelasId(p.kelasId);
        if (p.mapelId) setMapelId(p.mapelId);
        if (p.asatidId) setAsatidId(p.asatidId);
        if (p.tanggal) setTanggal(p.tanggal);
        if (p.jamKe) {
          if (Array.isArray(p.jamKe)) setJamKe(p.jamKe);
          else if (typeof p.jamKe === "string") setJamKe(p.jamKe.split(",").map((s: string) => s.trim()));
        }
        if (p.materi) setMateri(p.materi);
        if (p.learningOutcome) setLearningOutcome(p.learningOutcome);
        if (p.kegiatan) setKegiatan(p.kegiatan);
        if (p.catatan) setCatatan(p.catatan);
        setLastSaved(p._savedAt || null);
        if (hasContent) {
          setIsDraftRestored(true);
        }
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Reset Draft function
  const handleResetDraft = () => {
    Swal.fire({
      title: "Kosongkan Formulir?",
      text: "Semua tulisan draf yang tersimpan otomatis di perangkat ini akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Bersihkan",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("siakad_jurnal_draft");
        setKelasId("");
        setMapelId("");
        setAsatidId("");
        setTanggal(today);
        setJamKe([]);
        setMateri("");
        setLearningOutcome("");
        setKegiatan("");
        setCatatan("");
        setLastSaved(null);
        setIsDraftRestored(false);
        Swal.fire({
          icon: "success",
          title: "Draf Dibersihkan",
          text: "Formulir telah dikosongkan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Autosave draft ke localStorage
  useEffect(() => {
    // Hanya simpan jika ada isi
    if (kelasId || mapelId || asatidId || materi || learningOutcome || kegiatan || catatan) {
      const savedAt = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const p = { kelasId, mapelId, asatidId, tanggal, jamKe, materi, learningOutcome, kegiatan, catatan, _savedAt: savedAt };
      localStorage.setItem("siakad_jurnal_draft", JSON.stringify(p));
      setLastSaved(savedAt);
    }
  }, [kelasId, mapelId, asatidId, tanggal, jamKe, materi, learningOutcome, kegiatan, catatan]);

  // Load master data
  useEffect(() => {
    fetch("/api/master", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setMaster(data);
        setLoadingMaster(false);
      })
      .catch(() => {
        setLoadingMaster(false);
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Tidak dapat mengambil data master. Coba refresh halaman.",
        });
      });
  }, []);

  // Reset mapel when kelas changes
  useEffect(() => {
    setMapelId("");
  }, [kelasId]);

  // Filter kelas when jenjang changes
  const filteredKelasList = useMemo(() => {
    const list = master?.kelas || [];
    if (!jenjangFilter) return list;
    return list.filter((k) => k.jenjang === jenjangFilter);
  }, [jenjangFilter, master?.kelas]);

  // Auto reset kelasId if no longer valid
  useEffect(() => {
    if (kelasId) {
      const exists = filteredKelasList.find((k) => k.id === kelasId);
      if (!exists) setKelasId("");
    }
  }, [filteredKelasList, kelasId]);

  const mapelList = (kelasId && master?.mapel?.[kelasId]) || [];

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kelasId || !mapelId || !asatidId || !tanggal || !materi || !kegiatan) {
      Swal.fire({
        icon: "warning",
        title: "Form Tidak Lengkap",
        text: "Mohon lengkapi semua field yang wajib diisi.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pegawai_id: asatidId,
          mapel_id: mapelId,
          kelas_id: kelasId,
          tanggal,
          jam_ke: jamKe.length > 0 ? jamKe.sort((a, b) => {
            if (a === "Khusus") return 1;
            if (b === "Khusus") return -1;
            return parseInt(a) - parseInt(b);
          }).join(", ") : null,
          materi,
          learning_outcome: learningOutcome || null,
          kegiatan,
          catatan: catatan || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan jurnal");
      }

      await Swal.fire({
        icon: "success",
        title: "Jurnal Tersimpan!",
        text: "Jurnal mengajar berhasil ditambahkan.",
        confirmButtonColor: "var(--primary)",
        timer: 2000,
        timerProgressBar: true,
      });

      localStorage.removeItem("siakad_jurnal_draft");
      localStorage.removeItem("sikap_pending_jurnal_date");
      router.push("/jurnal");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: message,
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/jurnal"
            className="btn btn-ghost btn-sm"
            style={{ padding: "6px 10px" }}
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}><BookMarked size={20} /> Tambah Jurnal Mengajar</h1>
            <p>Catat kegiatan belajar mengajar hari ini</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Autosave indicator */}
          {lastSaved && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <Save size={12} style={{ color: "var(--success, #15803d)" }} />
              <span>Draf: {lastSaved}</span>
            </div>
          )}
          {(kelasId || materi || learningOutcome || kegiatan || catatan) && (
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Kosongkan form dan hapus draf"
            >
              <RotateCcw size={12} />
              <span>Reset Form</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5 sm:p-6 md:p-7 max-w-2xl mx-auto w-full pb-20 sm:pb-12">
        {/* Banner Draf Dipulihkan */}
        {isDraftRestored && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Draf Belum Tersimpan Dipulihkan</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Formulir ini otomatis memuat data ketikan terakhir dari perangkat Anda agar data tidak hilang jika halaman tertutup.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-xs"
            >
              Hapus Draf
            </button>
          </div>
        )}
        {loadingMaster ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              gap: 12,
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            <Loader2
              size={20}
              style={{
                animation: "spin 1s linear infinite",
                color: "var(--primary)",
              }}
            />
            Memuat data master...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Card 1: Informasi Mengajar */}
            <div className="card" style={{ marginBottom: 20 }}>
              <p className="card-title">
                <BookOpen
                  size={16}
                  style={{ display: "inline", marginRight: 6, color: "var(--primary)" }}
                />
                Informasi Mengajar
              </p>

              {/* Tanggal + nama hari */}
              <div className="form-group">
                <label className="form-label">
                  Tanggal <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  style={{ maxWidth: 240 }}
                />
                {tanggal && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Calendar size={14} /> {formatTanggalIndo(tanggal)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-0">
                {/* Asatidz */}
                <div className="form-group">
                  <label className="form-label">
                    Guru <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={asatidId}
                    onChange={(e) => setAsatidId(e.target.value)}
                    required
                  >
                    <option value="">— Pilih Guru —</option>
                    {master?.asatidz.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama_lengkap}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jam ke- */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                    <div>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5, margin: 0, marginBottom: "4px" }}>
                        <Clock size={13} />
                        Jam ke-
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium">Klik angka jam (bisa lebih dari satu)</p>
                    </div>
                    {jamKe.length > 0 && (
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full whitespace-nowrap">
                        Durasi: {jamKe.length} Jam
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {JAM_OPTIONS.map((j) => {
                      const isSelected = jamKe.includes(j);
                      const isSubuh = j === "1" || j === "2";
                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setJamKe(jamKe.filter(k => k !== j));
                            } else {
                              setJamKe([...jamKe, j]);
                            }
                          }}
                          className={`relative flex flex-col items-center justify-center transition-all ${
                            j === "Khusus" ? "px-4 py-2" : "w-11 h-11"
                          } font-bold rounded-xl border-2 ${
                            isSelected 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm" 
                              : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected && j !== "Khusus" && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm z-10">
                              <Check size={10} strokeWidth={4} />
                            </div>
                          )}
                          {isSelected && j === "Khusus" && (
                            <div className="flex items-center">
                              <Check size={14} strokeWidth={3} className="mr-1.5" />
                              <span className="text-sm">{j}</span>
                            </div>
                          )}
                          {!isSelected && j === "Khusus" && <span className="text-sm">{j}</span>}
                          
                          {/* For numbers, add small label if Subuh */}
                          {j !== "Khusus" && (
                            <>
                              <span className={isSubuh ? "text-[13px] leading-none mt-1" : "text-sm"}>{j}</span>
                              {isSubuh && <span className="text-[8px] font-normal text-slate-400 leading-tight">Subuh</span>}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jenjang */}
                <div className="form-group">
                  <label className="form-label">
                    Jenjang <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={jenjangFilter}
                    onChange={(e) => setJenjangFilter(e.target.value)}
                  >
                    <option value="">— Semua Jenjang —</option>
                    <option value="MTs">MTs</option>
                    <option value="IL">IL</option>
                    <option value="MA">MA</option>
                  </select>
                </div>

                {/* Kelas */}
                <div className="form-group">
                  <label className="form-label">
                    Kelas <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    required
                    disabled={jenjangFilter !== "" && filteredKelasList.length === 0}
                  >
                    <option value="">— Pilih Kelas —</option>
                    {filteredKelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div className="form-group">
                  <label className="form-label">
                    Mata Pelajaran <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={mapelId}
                    onChange={(e) => setMapelId(e.target.value)}
                    required
                    disabled={!kelasId}
                  >
                    <option value="">
                      {kelasId ? "— Pilih Mata Pelajaran —" : "— Pilih kelas terlebih dahulu —"}
                    </option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                  {kelasId && mapelList.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--warning)",
                        marginTop: 4,
                      }}
                    >
                      Belum ada mapel untuk kelas ini
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Isi Jurnal */}
            <div className="card" style={{ marginBottom: 20 }}>
              <p className="card-title"><FileText size={16} className="inline mr-1" /> Isi Jurnal</p>

              {/* Topik Jurnal */}
              <div className="form-group">
                <label className="form-label">
                  Topik Jurnal <span style={{ color: "var(--danger)" }}>*</span>
                </label>



                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tuliskan topik jurnal hari ini..."
                  value={materi}
                  onChange={(e) => {
                    setMateri(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px" }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Learning Objective (LO) / Tujuan Pembelajaran <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tuliskan learning objective atau tujuan pembelajaran yang ingin dicapai..."
                  value={learningOutcome}
                  onChange={(e) => {
                    setLearningOutcome(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px" }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Strategi Pembelajaran <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Deskripsikan strategi untuk mencapai target/tujuan pembelajaran..."
                  value={kegiatan}
                  onChange={(e) => {
                    setKegiatan(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "100px" }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Catatan Lainnya (Opsional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Catatan tambahan, kendala, atau evaluasi..."
                  value={catatan}
                  onChange={(e) => {
                    setCatatan(e.target.value);
                    handleTextareaResize(e);
                  }}
                  style={{ minHeight: "80px" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
              {lastSaved && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Save size={11} /> Draft tersimpan pukul {lastSaved}
                </span>
              )}
              <Link href="/jurnal" className="btn btn-ghost">
                Batal
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    Simpan Jurnal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
