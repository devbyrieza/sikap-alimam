"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { BookOpen, ChevronLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";

type Kelas = { id: string; nama: string; jenjang: string | null };
type Asatidz = { id: string; nama_lengkap: string; jabatan: string | null };
type Mapel = { id: string; nama: string };
type MasterData = {
  kelas: Kelas[];
  asatidz: Asatidz[];
  mapel: Record<string, Mapel[]>;
};

export default function TambahJurnalPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [master, setMaster] = useState<MasterData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [asatidId, setAsatidId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [jamKe, setJamKe] = useState("");
  const [materi, setMateri] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [catatan, setCatatan] = useState("");

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
            <h1>️ Tambah Jurnal Mengajar</h1>
            <p>Catat kegiatan belajar mengajar hari ini</p>
          </div>
        </div>
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
            <div className="card" style={{ marginBottom: 20 }}>
              <p className="card-title">
                <BookOpen
                  size={16}
                  style={{ display: "inline", marginRight: 6, color: "var(--primary)" }}
                />
                Informasi Mengajar
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 20px",
                }}
              >
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

                {/* Tanggal */}
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
                  />
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
                        {k.nama}
                        {k.jenjang ? ` (${k.jenjang})` : ""}
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

                {/* Jam ke- */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Jam ke-</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder='Contoh: 1-2, 3, 4-5'
                    value={jamKe}
                    onChange={(e) => setJamKe(e.target.value)}
                    style={{ maxWidth: 200 }}
                  />
                </div>
              </div>
            </div>

            {/* Materi & Kegiatan */}
            <div className="card" style={{ marginBottom: 20 }}>
              <p className="card-title"><FileText size={16} className="inline mr-1" /> Isi Jurnal</p>

              <div className="form-group">
                <label className="form-label">
                  Materi Pelajaran <span style={{ color: "var(--danger)" }}>*</span>
                </label>
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
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
