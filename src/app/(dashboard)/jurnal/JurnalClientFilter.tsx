"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  RotateCcw,
  Eye,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "flex-end",
          padding: "20px 24px",
          borderRadius: 20,
          background: "#ffffff",
          border: "1px solid #ebdcc3",
          boxShadow: "0 2px 12px rgba(85,0,0,0.03)",
        }}
      >
        {/* 1. Filter Tanggal */}
        <div style={{ minWidth: 150, flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#550000" }}>
            <Calendar size={14} color="#550000" /> Filter Tanggal
          </label>
          <input
            type="date"
            className="form-control"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            style={{ borderRadius: 12, border: "1px solid #ebdcc3", padding: "9px 12px", background: "#fdf8f0", fontSize: 13, outline: "none" }}
          />
        </div>

        {/* 2. Filter Jenjang */}
        <div style={{ minWidth: 160, flex: "1 1 150px", display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#550000" }}>
            <GraduationCap size={14} color="#550000" /> Filter Jenjang
          </label>
          <select
            className="form-control"
            value={filterJenjang}
            onChange={(e) => handleJenjangChange(e.target.value)}
            style={{
              borderRadius: 12,
              border: "1px solid #ebdcc3",
              padding: "9px 12px",
              background: "#fdf8f0",
              fontSize: 13,
              fontWeight: filterJenjang ? 700 : 500,
              outline: "none",
            }}
          >
            <option value="">Semua Jenjang</option>
            <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
            <option value="IL">IL (I&apos;dad Lughowy)</option>
            <option value="MA">MA (Madrasah Aliyah)</option>
          </select>
        </div>

        {/* 3. Filter Kelas */}
        <div style={{ minWidth: 160, flex: "1 1 150px", display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#550000" }}>
            <BookOpen size={14} color="#550000" /> Filter Kelas
          </label>
          <select
            className="form-control"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            disabled={!filterJenjang || (availableClasses.length === 0 && filterJenjang === "MA")}
            style={{
              borderRadius: 12,
              border: "1px solid #ebdcc3",
              padding: "9px 12px",
              background: !filterJenjang ? "#faf8f5" : "#fdf8f0",
              cursor: !filterJenjang ? "not-allowed" : "pointer",
              color: !filterJenjang ? "#a8a29e" : "#1a1a1a",
              fontSize: 13,
              outline: "none",
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

        {/* 4. Filter Guru / Asatidz */}
        <div style={{ minWidth: 180, flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#550000" }}>
            <User size={14} color="#550000" /> Filter Guru
          </label>
          <select
            className="form-control"
            value={filterAsatidz}
            onChange={(e) => setFilterAsatidz(e.target.value)}
            style={{ borderRadius: 12, border: "1px solid #ebdcc3", padding: "9px 12px", background: "#fdf8f0", fontSize: 13, outline: "none" }}
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
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "9px 14px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}

        <div
          style={{
            marginLeft: "auto",
            fontSize: 13,
            fontWeight: 700,
            color: "#550000",
            background: "#fdf5f5",
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid #ebdcc3",
            alignSelf: "center",
          }}
        >
          {filtered.length} Jurnal
        </div>
      </div>

      {/* Control Bar: View Mode Switcher (Visible on mobile & desktop) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #ebdcc3",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#550000" }}>
          <Sparkles size={16} color="#ddc192" />
          <span>Tampilan Jurnal</span>
        </div>

        <div style={{ display: "flex", gap: 6, background: "#fdf8f0", padding: 4, borderRadius: 12, border: "1px solid #ebdcc3" }}>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: viewMode === "card" ? "#550000" : "transparent",
              color: viewMode === "card" ? "#ffffff" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            <LayoutGrid size={14} />
            <span>Kartu Modern</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: viewMode === "table" ? "#550000" : "transparent",
              color: viewMode === "table" ? "#ffffff" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            <TableIcon size={14} />
            <span>Tabel Lengkap</span>
          </button>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #ebdcc3",
            textAlign: "center",
            padding: "54px 20px",
          }}
        >
          <BookOpen
            size={44}
            style={{ margin: "0 auto 12px", color: "#ddc192" }}
          />
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>
            Belum ada jurnal yang sesuai dengan filter
          </div>
          <div style={{ fontSize: 13, marginTop: 4, color: "#64748b" }}>
            Coba ubah filter tanggal, jenjang, kelas, atau guru pengampu di atas.
          </div>
        </div>
      ) : viewMode === "card" ? (
        /* ── CARD VIEW (Ultra Responsive for Mobile & Desktop) ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((j) => {
            const jenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);

            return (
              <div
                key={j.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  border: "1px solid #ebdcc3",
                  padding: "18px 20px",
                  boxShadow: "0 4px 16px rgba(85,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Header Card: Tanggal, Jenjang & Kelas */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fdf5f5", color: "#550000", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "1px solid #fae4e4" }}>
                      <Calendar size={12} color="#550000" />
                      {formatTanggal(j.tanggal)}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: jenjang === "MTs" ? "#fdf5f5" : "#fdf8f0",
                        color: jenjang === "MTs" ? "#550000" : "#b89758",
                        border: "1px solid #ebdcc3",
                      }}
                    >
                      {jenjang}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: "#550000",
                        color: "#ffffff",
                      }}
                    >
                      {j.kelas}
                    </span>
                  </div>
                </div>

                {/* Mapel & Guru */}
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>
                    {j.mapel}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    <User size={14} color="#b89758" />
                    <span>{j.asatidz}</span>
                  </div>
                </div>

                {/* Materi Snippet */}
                <div
                  style={{
                    background: "#fdf8f0",
                    border: "1px solid #f6ecd9",
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#475569",
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#550000", marginBottom: 2 }}>Materi:</div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {j.materi}
                  </div>
                </div>

                {/* Footer Card: Jam & Detail Button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #f5ede1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#550000" }}>
                    <Clock size={14} color="#b89758" />
                    <span>{j.jam_ke !== "-" ? `Jam ke-${j.jam_ke}` : "Reguler"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedJurnal(j)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#550000",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(85,0,0,0.15)",
                    }}
                  >
                    <Eye size={13} color="#ddc192" />
                    <span>Lihat Detail</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW (Smooth Horizontally Scrollable) ── */
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #ebdcc3",
            boxShadow: "0 4px 16px rgba(85,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          {/* Touch-Friendly Table Wrapper */}
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x pan-y",
            }}
          >
            <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#fdf8f0", borderBottom: "1px solid #ebdcc3" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "left", width: 140 }}>
                    Tanggal
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "left", minWidth: 170 }}>
                    Guru Pengampu
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "left", minWidth: 160 }}>
                    Mata Pelajaran
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "center", minWidth: 130 }}>
                    Jenjang & Kelas
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "center", width: 110 }}>
                    Jam
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "left", minWidth: 200 }}>
                    Materi
                  </th>
                  <th style={{ padding: "14px 16px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: "#550000", textAlign: "center", width: 110 }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j, idx) => {
                  const jenjang = getJenjangFromKelas(j.kelas, j.kelas_jenjang);
                  const bgRow = idx % 2 === 0 ? "#ffffff" : "#fdfcf9";

                  return (
                    <tr
                      key={j.id}
                      style={{
                        background: bgRow,
                        borderBottom: "1px solid #f5ede1",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Tanggal */}
                      <td style={{ padding: "14px 18px", fontWeight: 800, color: "#550000", fontSize: 13 }}>
                        {formatTanggal(j.tanggal)}
                      </td>

                      {/* Guru Pengampu */}
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a1a", fontSize: 13 }}>
                        {j.asatidz}
                      </td>

                      {/* Mata Pelajaran */}
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1a1a1a" }}>
                        {j.mapel}
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
                              background: jenjang === "MTs" ? "#fdf5f5" : "#fdf8f0",
                              color: jenjang === "MTs" ? "#550000" : "#b89758",
                              border: "1px solid #ebdcc3",
                            }}
                          >
                            {jenjang}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: "#550000",
                              color: "#ffffff",
                            }}
                          >
                            {j.kelas}
                          </span>
                        </div>
                      </td>

                      {/* Jam */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#550000", background: "#fdf5f5", padding: "3px 8px", borderRadius: 6, border: "1px solid #ebdcc3" }}>
                          {j.jam_ke}
                        </span>
                      </td>

                      {/* Materi */}
                      <td
                        style={{
                          padding: "14px 16px",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#475569",
                          fontSize: 13,
                        }}
                        title={j.materi}
                      >
                        {j.materi}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedJurnal(j)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 10,
                            fontWeight: 800,
                            fontSize: 12,
                            background: "#550000",
                            color: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(85,0,0,0.12)",
                          }}
                        >
                          <Eye size={12} color="#ddc192" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ultra-Premium Jurnal Detail Modal */}
      <JurnalDetailModal
        jurnal={selectedJurnal}
        onClose={() => setSelectedJurnal(null)}
      />
    </div>
  );
}
