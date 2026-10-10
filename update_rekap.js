const fs = require('fs');

let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// 1. Add ranking logic before `return (`
const rankLogic = `
  // --- RANKING LOGIC ---
  const rankMap = new Map<string, { total: number; rank: number }>();
  if (santriList.length > 0 && mapelList.length > 0) {
    const santriTotals = santriList.map(santri => {
       let total = 0;
       mapelList.forEach(m => {
          const val = getAvg(santri.id, m.id);
          if (val !== null) total += val;
       });
       return { id: santri.id, total: Math.round(total * 10) / 10 };
    });
    
    const rankedSantri = [...santriTotals].sort((a, b) => b.total - a.total);
    let prevTotal = -1;
    let prevRank = 1;
    rankedSantri.forEach((s, index) => {
      if (prevTotal === s.total) {
         rankMap.set(s.id, { total: s.total, rank: prevRank });
      } else {
         rankMap.set(s.id, { total: s.total, rank: index + 1 });
         prevRank = index + 1;
         prevTotal = s.total;
      }
    });
  }
  // ---------------------

  return (`;
file = file.replace('  return (', rankLogic);

// 2. Add columns to thead
const ths = `
                        {mapelList.map((m) => (
                          <th key={m.id} style={{ textAlign: "center", minWidth: 120, borderBottom: "1px solid #ebdcc3", padding: "14px", color: "#550000", fontWeight: 800 }} title={m.nama}>
                            {m.nama.length > 25 ? m.nama.substring(0, 25) + "…" : m.nama}
                          </th>
                        ))}
                        <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Total Nilai</th>
                        <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Peringkat</th>
`;
file = file.replace(/\{mapelList\.map\(\(m\) => \([\s\S]*?<\/th>\s*\)\)\}/, ths.trim());

// 3. Add columns to tbody
const tds = `
                                  </td>
                                );
                              })}
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#1a1a1a", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.total || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "900", color: "#550000", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                <div style={{ display: "inline-block", background: rankMap.get(santri.id)?.rank === 1 ? "#fef08a" : rankMap.get(santri.id)?.rank === 2 ? "#e2e8f0" : rankMap.get(santri.id)?.rank === 3 ? "#fed7aa" : "#fdf8f0", padding: "4px 12px", borderRadius: "100px", border: "1px solid #ebdcc3" }}>
                                  #{rankMap.get(santri.id)?.rank || "-"}
                                </div>
                              </td>
`;
file = file.replace(/<\/td>\s*\);\s*\}\)\}/, tds.trim());

// 4. Update colSpan in empty state
file = file.replace(/colSpan=\{3 \+ mapelList\.length\}/, 'colSpan={5 + mapelList.length}');

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
