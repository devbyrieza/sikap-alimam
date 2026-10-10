const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// 1. Add sortConfig state
file = file.replace(
  'const [searchQuery, setSearchQuery] = useState("");',
  'const [searchQuery, setSearchQuery] = useState("");\n  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);'
);

// 2. Add sortedSantriList logic right before rankMap
const sortLogic = `
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedSantriList = React.useMemo(() => {
    let sortableItems = [...santriList];
    
    // First, filter by searchQuery
    if (searchQuery) {
      sortableItems = sortableItems.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;
        
        if (sortConfig.key === 'nama') {
          valA = a.nama_lengkap.toLowerCase();
          valB = b.nama_lengkap.toLowerCase();
        } else if (sortConfig.key === 'nis') {
          valA = a.nis || "";
          valB = b.nis || "";
        } else if (sortConfig.key === 'total') {
          valA = rankMap.get(a.id)?.total || 0;
          valB = rankMap.get(b.id)?.total || 0;
        } else if (sortConfig.key === 'rata-rata') {
          valA = rankMap.get(a.id)?.average || 0;
          valB = rankMap.get(b.id)?.average || 0;
        } else if (sortConfig.key === 'peringkat') {
          valA = rankMap.get(a.id)?.rank || 9999;
          valB = rankMap.get(b.id)?.rank || 9999;
        } else {
          // Mapel
          const avgA = rankMap.get(a.id)?.mapelAvg?.get(sortConfig.key);
          const avgB = rankMap.get(b.id)?.mapelAvg?.get(sortConfig.key);
          valA = avgA !== undefined && avgA !== null ? avgA : -1;
          valB = avgB !== undefined && avgB !== null ? avgB : -1;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [santriList, rankMap, sortConfig, searchQuery]);

  return (
`;
file = file.replace('  return (\n    <div', sortLogic.trim() + '\n    <div');

// 3. Replace <th> tags with onClick
const thNamaOld = '<th className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 20, background: "#fdf8f0", minWidth: 170, maxWidth: 220, borderBottom: "1px solid #ebdcc3", borderRight: "1px solid #ebdcc3", padding: "14px 18px", textAlign: "left", color: "#550000", fontWeight: 800 }}>Nama Santri</th>';
const thNamaNew = '<th className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 20, background: "#fdf8f0", minWidth: 170, maxWidth: 220, borderBottom: "1px solid #ebdcc3", borderRight: "1px solid #ebdcc3", padding: "14px 18px", textAlign: "left", color: "#550000", fontWeight: 800, cursor: "pointer" }} onClick={() => requestSort("nama")}>Nama Santri {sortConfig?.key === "nama" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</th>';
file = file.replace(thNamaOld, thNamaNew);

const thNisOld = '<th style={{ width: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", textAlign: "left", color: "#550000", fontWeight: 800 }}>NIS</th>';
const thNisNew = '<th style={{ width: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", textAlign: "left", color: "#550000", fontWeight: 800, cursor: "pointer" }} onClick={() => requestSort("nis")}>NIS {sortConfig?.key === "nis" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</th>';
file = file.replace(thNisOld, thNisNew);

const thMapelOld = `<th key={m.id} style={{ textAlign: "center", minWidth: 120, borderBottom: "1px solid #ebdcc3", padding: "14px", color: "#550000", fontWeight: 800 }} title={m.nama}>
                            {m.nama.length > 25 ? m.nama.substring(0, 25) + "…" : m.nama}
                          </th>`;
const thMapelNew = `<th key={m.id} style={{ textAlign: "center", minWidth: 120, borderBottom: "1px solid #ebdcc3", padding: "14px", color: "#550000", fontWeight: 800, cursor: "pointer" }} title={m.nama} onClick={() => requestSort(m.id)}>
                            {m.nama.length > 25 ? m.nama.substring(0, 25) + "…" : m.nama} {sortConfig?.key === m.id ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                          </th>`;
file = file.replace(thMapelOld, thMapelNew);

const thTotalOld = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Total Nilai</th>';
const thTotalNew = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800, cursor: "pointer" }} onClick={() => requestSort("total")}>Total Nilai {sortConfig?.key === "total" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</th>';
file = file.replace(thTotalOld, thTotalNew);

const thAvgOld = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Rata-rata</th>';
const thAvgNew = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800, cursor: "pointer" }} onClick={() => requestSort("rata-rata")}>Rata-rata {sortConfig?.key === "rata-rata" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</th>';
file = file.replace(thAvgOld, thAvgNew);

const thRankOld = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Peringkat</th>';
const thRankNew = '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800, cursor: "pointer" }} onClick={() => requestSort("peringkat")}>Peringkat {sortConfig?.key === "peringkat" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}</th>\n                          <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>';
file = file.replace(thRankOld, thRankNew);

// 4. Map sortedSantriList instead of santriList in tbody
const mapOld = 'santriList.map((santri, i) => {';
const mapNew = 'sortedSantriList.map((santri, i) => {';
file = file.replace(mapOld, mapNew);

// 5. Replace \`santriList.length === 0\` check
const lenOld = '{santriList.length === 0 ? (';
const lenNew = '{sortedSantriList.length === 0 ? (';
file = file.replace(lenOld, lenNew);

// 6. Fix "filter(s =>" logic in original render block
file = file.replace(
  'const filteredSantriList = santriList.filter((s) => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));',
  '// const filteredSantriList = ... replaced by sortedSantriList'
);

file = file.replace(
  'filteredSantriList.length === 0',
  'sortedSantriList.length === 0'
);

file = file.replace(
  'filteredSantriList.map((santri, i) => {',
  'sortedSantriList.map((santri, i) => {'
);

// 7. Add TD for Aksi
const tdRank = '<div style={{ display: "inline-block", background: rankMap.get(santri.id)?.rank === 1 ? "#fef08a" : rankMap.get(santri.id)?.rank === 2 ? "#e2e8f0" : rankMap.get(santri.id)?.rank === 3 ? "#fed7aa" : "#fdf8f0", padding: "4px 12px", borderRadius: "100px", border: "1px solid #ebdcc3" }}>\n                                    #{rankMap.get(santri.id)?.rank || "-"}\n                                  </div>\n                                </td>';
const tdAksi = tdRank + '\n                                <td style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>\n                                  <a href={`/rapor/print/${santri.id}?semester=${semester}&tahun_ajaran=${tahun_ajaran}`} target="_blank" style={{ display: "inline-block", padding: "6px 12px", background: "#550000", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>Cetak Rapor</a>\n                                </td>';
file = file.replace(tdRank, tdAksi);

file = file.replace('colSpan={6 + mapelList.length}', 'colSpan={7 + mapelList.length}');

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
