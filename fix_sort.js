const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

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

file = file.replace(/return \(\s*<div className="page-container">/, sortLogic + '    <div className="page-container">');

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
