const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// Fix React.useMemo
file = file.replace('import { useState, useEffect, useCallback } from "react";', 'import { useState, useEffect, useCallback, useMemo } from "react";');
file = file.replace('React.useMemo(', 'useMemo(');

// Add getAvg function back if missing
if (!file.includes('const getAvg = (santri_id: string, mapel_id: string)')) {
  file = file.replace('// Kalkulasi Nilai Akhir per santri per mapel', '// Kalkulasi Nilai Akhir per santri per mapel\n  const getAvg = (santri_id: string, mapel_id: string): number | null => {\n    const vals = nilaiData.filter((n) => n.santri.id === santri_id && n.mapel.id === mapel_id);\n    if (vals.length === 0) return null;\n    return vals.reduce((sum, n) => sum + n.nilai, 0) / vals.length;\n  };');
}

// Fix the mapelAvg logic in sorting
file = file.replace(
  'const avgA = rankMap.get(a.id)?.mapelAvg?.get(sortConfig.key);',
  'const avgA = getAvg(a.id, sortConfig.key);'
);
file = file.replace(
  'const avgB = rankMap.get(b.id)?.mapelAvg?.get(sortConfig.key);',
  'const avgB = getAvg(b.id, sortConfig.key);'
);

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
