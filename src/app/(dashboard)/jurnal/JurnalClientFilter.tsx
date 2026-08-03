"use client";

import { useState, useMemo } from "react";
import { BookOpen, Calendar, User, GraduationCap, RotateCcw, Eye, Clock, Target, FileText } from "lucide-react";
import { getJenjangFromKelas } from "@/lib/kelas";
import JurnalDetailModal from "@/components/JurnalDetailModal";

export type KelasObject = {
  id?: string;
  nama: string;
  jenjang?: string | null;
};

export type JurnalRow = {
  id: string;
  tanggal: string;
  asatidz: string;
  mapel: string;
  kelas: string;
  kelas_jenjang?: string | null;
  jam_ke: string;
  materi: string;
  learning_outcome?: string;
  kegiatan: string;
  catatan: string;
};

function formatTanggal(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function JurnalClientFilter({
  data,
  kelasList = [],
  asatidzList = [],
}: {
  data: JurnalRow[];
  kelasList?: (string | KelasObject)[];
  asatidzList?: string[];
}) {
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterJenjang, setFilterJenjang] = useState<string>("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterAsatidz, setFilterAsatidz] = useState("");

  // Modal State for viewing complete journal detail
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalRow | null>(null);

  // Normalisasi kelasList menjadi objek terstandar (hanya kelas aktif: 7 MTs dan IL)
  const normalizedKelasList = useMemo<KelasObject[]>(() => {
    const list: KelasObject[] = [];
    const seen = new Set<string>();

    if (kelasList.length > 0) {
      for (const k of kelasList) {
        let name = typeof k === "string" ? k.trim() : k.nama.trim();
        if (name === "I'dad Lughowy" || name === "I'dad" || name === "Idad Lughowy") {
          name = "IL";
        }
        // Jangan tampilkan placeholder yang belum berjalan
        if (["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"].includes(name)) {
          continue;
        }
        if (!seen.has(name)) {
          seen.add(name);
          list.push({
            id: typeof k === "string" ? name : k.id,
            nama: name,
            jenjang: typeof k === "string" ? getJenjangFromKelas(name) : (k.jenjang || getJenjangFromKelas(name, k.jenjang)),
          });
        }
      }
    } else {
      // Fallback dari data jika tidak ada props
      const set = new Set(data.map((j) => {
        let n = j.kelas.trim();
        if (n === "I'dad Lughowy" || n === "I'dad") n = "IL";
        return n;
      }));
      set.forEach((nama) => {
        if (!["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"].includes(nama)) {
          list.push({
            nama,
            jenjang: getJenjangFromKelas(nama),
          });
        }
      });
    }

    return list;
  }, [kelasList, data]);

  // Daftar Kelas yang disaring HANYA jika Jenjang sudah dipilih
  const availableClasses = useMemo(() => {
    if (!filterJenjang) {
      return [];
    }
    return normalizedKelasList.filter((k) => {
      const jenjang = getJenjangFromKelas(k.nama, k.jenjang);
      return jenjang === filterJenjang;
    });
  }, [normalizedKelasList, filterJenjang]);

  // Saat Jenjang berganti, reset pilihan kelas
  const handleJenjangChange = (newJenjang: string) => {
    setFilterJenjang(newJenjang);
    setFilterKelas("");
  };

  // Normalisasi Daftar Guru dari SIMPEG + Jurnal
  const finalAsatidzList = useMemo(() => {
    const set = new Set<string>();
    asatidzList.forEach((a) => {
      if (a && a.trim()) set.add(a.trim());
    });
    data.forEach((j) => {
      if (j.asatidz && j.asatidz.trim() && j.asatidz !== "-") {
        set.add(j.asatidz.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [asatidzList, data]);

  // Saring data jurnal
  const filtered = useMemo(() => {
    return data.filter((j) => {
      // 1. Filter Tanggal
      if (filterTanggal && j.tanggal !== filterTanggal) return false;

      // 2. Filter Jenjang
      if (filterJenjang) {
        const itemJenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);
        if (itemJenjang !== filterJenjang) return false;
      }

      // 3. Filter Kelas
      if (filterKelas && j.kelas !== filterKelas) return false;

      // 4. Filter Guru / Asatidz
      if (filterAsatidz && j.asatidz !== filterAsatidz) return false;

      return true;
    });
  }, [data, filterTanggal, filterJenjang, filterKelas, filterAsatidz]);

  const handleReset = () => {
    setFilterTanggal("");
    setFilterJenjang("");
    setFilterKelas("");
    setFilterAsatidz("");
  };

  const isFiltered = Boolean(filterTanggal || filterJenjang || filterKelas || filterAsatidz);

  return (
    <div>
      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "flex-end",
          padding: "18px 22px",
          borderRadius: 16,
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* 1. Filter Tanggal */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 160, flex: "1 1 150px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} color="var(--primary)" /> Filter Tanggal
          </label>
          <input
            type="date"
            className="form-control"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />
        </div>

        {/* 2. Filter Jenjang (Wajib dipilih sebelum filter kelas aktif) */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 170, flex: "1 1 160px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <GraduationCap size={14} color="var(--primary)" /> Filter Jenjang
          </label>
          <select
            className="form-control"
            value={filterJenjang}
            onChange={(e) => handleJenjangChange(e.target.value)}
            style={{
              fontWeight: filterJenjang ? 700 : 400,
              borderColor: filterJenjang ? "var(--primary)" : undefined,
            }}
          >
            <option value="">Semua Jenjang</option>
            <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
            <option value="IL">IL (I'dad Lughowy)</option>
            <option value="MA">MA (Madrasah Aliyah)</option>
          </select>
        </div>

        {/* 3. Filter Kelas (Hanya aktif jika Jenjang telah dipilih) */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 180, flex: "1 1 170px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={14} color="var(--primary)" /> Filter Kelas
          </label>
          <select
            className="form-control"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            disabled={!filterJenjang || (availableClasses.length === 0 && filterJenjang === "MA")}
            style={{
              background: !filterJenjang ? "#f9fafb" : "#ffffff",
              cursor: !filterJenjang ? "not-allowed" : "pointer",
              color: !filterJenjang ? "#9ca3af" : undefined,
            }}
          >
            {!filterJenjang ? (
              <option value="">— Pilih Jenjang Dahulu —</option>
            ) : availableClasses.length === 0 && filterJenjang === "MA" ? (
              <option value="">(Belum ada kelas aktif MA)</option>
            ) : (
              <>
                <option value="">Semua Kelas di {filterJenjang}</option>
                {availableClasses.map((k) => (
                  <option key={k.nama} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* 4. Filter Guru / Asatidz (SIMPEG) */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 200, flex: "1 1 200px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <User size={14} color="var(--primary)" /> Filter Guru
          </label>
          <select
            className="form-control"
            value={filterAsatidz}
            onChange={(e) => setFilterAsatidz(e.target.value)}
          >
            <option value="">Semua Guru</option>
            {finalAsatidzList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {isFiltered && (
          <button
            className="btn btn-ghost btn-sm"
            style={{
              marginBottom: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#dc2626",
            }}
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            Reset Filter
          </button>
        )}

        <div
          style={{
            marginLeft: "auto",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {filtered.length} jurnal ditemukan
        </div>
      </div>

      {/* Swipe Guidance Banner on Mobile */}
      <div className="sm:hidden mb-2.5 flex items-center justify-between gap-2 px-3 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[12px] font-medium text-amber-900 shadow-sm">
        <span className="flex items-center gap-1.5 truncate">
          <span>👉</span> Tanggal terkunci di kiri. Geser tabel ke kanan untuk melihat rincian & aksi.
        </span>
      </div>

      {/* Table Jurnal Mengajar with Horizontal Scroll & Sticky Frozen Columns */}
      <div
        className="card p-0 overflow-hidden shadow-sm border border-slate-100 rounded-2xl bg-white"
        style={{ marginBottom: 24 }}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 780 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {/* Frozen Column 1: Tanggal */}
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 20,
                    background: "#f8fafc",
                    padding: "14px 16px",
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--primary)",
                    boxShadow: "4px 0 8px -2px rgba(0,0,0,0.06)",
                    minWidth: 125,
                    maxWidth: 135,
                  }}
                >
                  Tanggal
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", minWidth: 170 }}>
                  Guru Pengampu
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", minWidth: 160 }}>
                  Mata Pelajaran
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", textAlign: "center", minWidth: 130 }}>
                  Jenjang & Kelas
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", textAlign: "center", width: 110 }}>
                  Durasi & Jam
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", minWidth: 220 }}>
                  Topik Jurnal & Materi
                </th>
                <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", textAlign: "center", minWidth: 120 }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "54px 16px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <BookOpen
                      size={40}
                      style={{ marginBottom: 12, opacity: 0.3, display: "block", margin: "0 auto 12px" }}
                    />
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#475569" }}>Belum ada jurnal yang sesuai dengan filter</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: "#94a3b8" }}>Coba ubah filter tanggal, jenjang, kelas, atau guru pengampu di atas.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((j) => {
                  const jenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);

                  return (
                    <tr
                      key={j.id}
                      className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0"
                    >
                      {/* Frozen Column: Tanggal */}
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                          background: "#ffffff",
                          padding: "14px 16px",
                          boxShadow: "4px 0 8px -2px rgba(0,0,0,0.06)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "var(--primary)",
                            display: "block",
                            lineHeight: 1.3,
                          }}
                        >
                          {formatTanggal(j.tanggal)}
                        </span>
                      </td>

                      {/* Guru Pengampu */}
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-main)", fontSize: 13 }}>
                        {j.asatidz}
                      </td>

                      {/* Mata Pelajaran */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{j.mapel}</span>
                      </td>

                      {/* Jenjang & Kelas */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: jenjang === "MTs" ? "#e0f2fe" : jenjang === "IL" ? "#fef3c7" : "#dcfce7",
                              color: jenjang === "MTs" ? "#0369a1" : jenjang === "IL" ? "#b45309" : "#15803d",
                            }}
                          >
                            {jenjang}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: "var(--secondary-pale)",
                              color: "var(--primary)",
                              border: "1px solid var(--secondary)",
                              fontWeight: 700,
                            }}
                          >
                            {j.kelas}
                          </span>
                        </div>
                      </td>

                      {/* Durasi & Jam */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {j.jam_ke !== "-" ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "var(--primary-pale)", padding: "2px 6px", borderRadius: 4 }}>
                              {j.jam_ke.split(",").length} Jam
                            </span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", justifyContent: "center" }}>
                              {j.jam_ke.split(",").map((jam, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: jam.trim() === "Khusus" ? "#fef2f2" : "#f1f5f9",
                                    border: jam.trim() === "Khusus" ? "1px solid #fecaca" : "1px solid #e2e8f0",
                                    padding: jam.trim() === "Khusus" ? "1px 5px" : "1px 6px",
                                    borderRadius: 5,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: jam.trim() === "Khusus" ? "#ef4444" : "#475569",
                                  }}
                                >
                                  {jam.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>

                      {/* Materi */}
                      <td
                        style={{
                          padding: "14px 16px",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#334155",
                          fontSize: 13,
                        }}
                        title={j.materi}
                      >
                        {j.materi}
                      </td>

                      {/* Aksi: Buka Detail Modal */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedJurnal(j)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200 shadow-sm hover:shadow"
                          title="Buka Detail Lengkap Jurnal"
                        >
                          <Eye size={13} className="text-primary" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ultra-Premium Jurnal Detail Modal */}
      <JurnalDetailModal
        jurnal={selectedJurnal}
        onClose={() => setSelectedJurnal(null)}
      />
    </div>
  );
}
