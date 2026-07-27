"use client";

import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";

type JurnalRow = {
  id: string;
  tanggal: string;
  asatidz: string;
  mapel: string;
  kelas: string;
  jam_ke: string;
  materi: string;
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
  asatidzList = []
}: { 
  data: JurnalRow[];
  kelasList?: string[];
  asatidzList?: string[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterAsatidz, setFilterAsatidz] = useState("");

  // Jika server memberikan props, gunakan itu. Jika tidak, fallback ke deriving dari data
  const finalKelasList = kelasList.length > 0 ? kelasList : useMemo(() => {
    const set = new Set(data.map((j) => j.kelas));
    return Array.from(set).sort();
  }, [data]);

  const finalAsatidzList = asatidzList.length > 0 ? asatidzList : useMemo(() => {
    const set = new Set(data.map((j) => j.asatidz));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((j) => {
      if (filterTanggal && j.tanggal !== filterTanggal) return false;
      if (filterKelas && j.kelas !== filterKelas) return false;
      if (filterAsatidz && j.asatidz !== filterAsatidz) return false;
      return true;
    });
  }, [data, filterTanggal, filterKelas, filterAsatidz]);

  return (
    <div>
      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-end",
          padding: "16px 20px",
        }}
      >
        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="form-label">Filter Tanggal</label>
          <input
            type="date"
            className="form-control"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label">Filter Kelas</label>
          <select
            className="form-control"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {finalKelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
          <label className="form-label">Filter Asatidz</label>
          <select
            className="form-control"
            value={filterAsatidz}
            onChange={(e) => setFilterAsatidz(e.target.value)}
          >
            <option value="">Semua Asatidz</option>
            {finalAsatidzList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {(filterTanggal || filterKelas || filterAsatidz) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 0 }}
            onClick={() => {
              setFilterTanggal("");
              setFilterKelas("");
              setFilterAsatidz("");
            }}
          >
            Reset Filter
          </button>
        )}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 13,
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {filtered.length} jurnal ditemukan
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Asatidz</th>
              <th>Mata Pelajaran</th>
              <th>Kelas</th>
              <th>Jam ke-</th>
              <th>Materi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "var(--text-muted)",
                  }}
                >
                  <BookOpen
                    size={32}
                    style={{ marginBottom: 8, opacity: 0.3, display: "block", margin: "0 auto 8px" }}
                  />
                  Belum ada jurnal yang ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((j) => (
                <tr key={j.id}>
                  <td>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--primary)",
                      }}
                    >
                      {formatTanggal(j.tanggal)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{j.asatidz}</td>
                  <td>{j.mapel}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: "var(--secondary-pale)",
                        color: "var(--primary)",
                        border: "1px solid var(--secondary)",
                      }}
                    >
                      {j.kelas}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {j.jam_ke !== "-" ? (
                      <span
                        style={{
                          background: "#f3f4f6",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {j.jam_ke}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {j.materi}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
