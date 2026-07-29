"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { BookOpen, ChevronLeft, Loader2, FileText, Zap, Clock, Save } from "lucide-react";
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

const TEMPLATE_MATERI = [
  { label: "📖 Review Materi Lalu", value: "Review dan pembahasan materi pertemuan sebelumnya" },
  { label: "📝 Ulangan Harian", value: "Ulangan harian / evaluasi pemahaman materi" },
  { label: "💬 Diskusi Kelompok", value: "Diskusi kelompok dan presentasi hasil diskusi" },
  { label: "🔬 Praktik / Demonstrasi", value: "Praktik langsung / demonstrasi materi" },
  { label: "📚 Materi Baru", value: "Penyampaian materi baru sesuai silabus" },
  { label: "✍️ Latihan Soal", value: "Pengerjaan latihan soal dan pembahasan" },
];

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
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [asatidId, setAsatidId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [jamKe, setJamKe] = useState("");
  const [materi, setMateri] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [catatan, setCatatan] = useState("");

  // Load draft dari localStorage
  useEffect(() => {
    const draft = localStorage.getItem("siakad_jurnal_draft");
    if (draft) {
      try {
        const p = JSON.parse(draft);
        if (p.kelasId) setKelasId(p.kelasId);
        if (p.mapelId) setMapelId(p.mapelId);
        if (p.asatidId) setAsatidId(p.asatidId);
        if (p.tanggal) setTanggal(p.tanggal);
        if (p.jamKe) setJamKe(p.jamKe);
        if (p.materi) setMateri(p.materi);
        if (p.kegiatan) setKegiatan(p.kegiatan);
        if (p.catatan) setCatatan(p.catatan);
        setLastSaved(p._savedAt || null);
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Autosave draft ke localStorage
  useEffect(() => {
    const savedAt = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const p = { kelasId, mapelId, asatidId, tanggal, jamKe, materi, kegiatan, catatan, _savedAt: savedAt };
    localStorage.setItem("siakad_jurnal_draft", JSON.stringify(p));
    // Tampilkan info autosave hanya kalau ada perubahan bermakna
    if (kelasId || materi || kegiatan) {
      setLastSaved(savedAt);
    }
  }, [kelasId, mapelId, asatidId, tanggal, jamKe, materi, kegiatan, catatan]);

  // Load master data
  useEffect(() => {
    fetch("/api/master")
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

  const mapelList = (kelasId && master?.mapel?.[kelasId]) || [];

  // Template materi: append ke materi (bukan replace)
  const applyTemplate = (val: string) => {
    setMateri((prev) => {
      if (!prev) return val;
      return prev.trimEnd() + "\n" + val;
    });
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
          asatidz_id: asatidId,
          mapel_id: mapelId,
          kelas_id: kelasId,
          tanggal,
          jam_ke: jamKe || null,
          materi,
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
            <h1>📋 Tambah Jurnal Mengajar</h1>
            <p>Catat kegiatan belajar mengajar hari ini</p>
          </div>
        </div>
        {/* Autosave indicator */}
        {lastSaved && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <Save size={12} style={{ color: "var(--success, #15803d)" }} />
            <span>Draft disimpan {lastSaved}</span>
          </div>
        )}
      </div>

      <div style={{ padding: "28px", maxWidth: 720, margin: "0 auto" }}>
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
                    📅 {formatTanggalIndo(tanggal)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-0">
                {/* Asatidz */}
                <div className="form-group">
                  <label className="form-label">
                    Asatidz <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={asatidId}
                    onChange={(e) => setAsatidId(e.target.value)}
                    required
                  >
                    <option value="">— Pilih Asatidz —</option>
                    {master?.asatidz.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama_lengkap}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jam ke- */}
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} />
                    Jam ke-
                  </label>
                  <select
                    className="form-control"
                    value={jamKe}
                    onChange={(e) => setJamKe(e.target.value)}
                  >
                    <option value="">— Pilih Jam —</option>
                    {JAM_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j === "Khusus" ? "Khusus (luar jadwal)" : `Jam ke-${j}`}
                      </option>
                    ))}
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
                  >
                    <option value="">— Pilih Kelas —</option>
                    {master?.kelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}{k.jenjang ? ` (${k.jenjang})` : ""}
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

              {/* Materi Pelajaran */}
              <div className="form-group">
                <label className="form-label">
                  Materi Pelajaran <span style={{ color: "var(--danger)" }}>*</span>
                </label>

                {/* Template chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={12} /> Template cepat:
                  </span>
                  {TEMPLATE_MATERI.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => applyTemplate(t.value)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 99,
                        border: "1.5px solid var(--border)",
                        background: "var(--surface)",
                        fontSize: 12,
                        color: "var(--text)",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.borderColor = "var(--primary)";
                        (e.target as HTMLButtonElement).style.color = "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                        (e.target as HTMLButtonElement).style.color = "var(--text)";
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Tuliskan materi yang diajarkan hari ini..."
                  value={materi}
                  onChange={(e) => setMateri(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Kegiatan Pembelajaran <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Deskripsikan kegiatan pembelajaran yang dilakukan (metode, aktivitas, dll)..."
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Catatan (Opsional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Catatan tambahan, kendala, atau evaluasi..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
              {lastSaved && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  💾 Draft tersimpan pukul {lastSaved}
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
