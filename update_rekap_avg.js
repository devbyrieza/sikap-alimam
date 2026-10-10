const fs = require('fs');

let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

const oldLogic = `// --- RANKING LOGIC ---
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
  // ---------------------`;

const newLogic = `// --- RANKING LOGIC ---
  const rankMap = new Map<string, { total: number; average: number; rank: number }>();
  if (santriList.length > 0 && mapelList.length > 0) {
    const santriTotals = santriList.map(santri => {
       let total = 0;
       let count = 0;
       mapelList.forEach(m => {
          const val = getAvg(santri.id, m.id);
          if (val !== null) {
            total += val;
            count++;
          }
       });
       const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
       return { id: santri.id, total: Math.round(total * 10) / 10, average };
    });
    
    // Sort descending by total
    const rankedSantri = [...santriTotals].sort((a, b) => b.total - a.total);
    let prevTotal = -1;
    let prevRank = 1;
    rankedSantri.forEach((s, index) => {
      if (prevTotal === s.total) {
         rankMap.set(s.id, { total: s.total, average: s.average, rank: prevRank });
      } else {
         rankMap.set(s.id, { total: s.total, average: s.average, rank: index + 1 });
         prevRank = index + 1;
         prevTotal = s.total;
      }
    });
  }
  // ---------------------`;

file = file.replace(oldLogic, newLogic);

const oldThead = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Total Nilai</th>`;
const newThead = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Total Nilai</th>
                        <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Rata-rata</th>`;

file = file.replace(oldThead, newThead);

const oldTbody = `<td style={{ textAlign: "center", fontWeight: "800", color: "#1a1a1a", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.total || 0}
                              </td>`;
const newTbody = `<td style={{ textAlign: "center", fontWeight: "800", color: "#1a1a1a", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.total || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#0ea5e9", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.average || 0}
                              </td>`;

file = file.replace(oldTbody, newTbody);

file = file.replace(/colSpan=\{5 \+ mapelList\.length\}/, 'colSpan={6 + mapelList.length}');

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
