const fs = require('fs');
let code = fs.readFileSync('src/lib/kelas.ts', 'utf8');

// Fix normalizeKelasList
code = code.replace(
  '    if (!seenKeys.has(key)) {\n      seenKeys.add(key);\n      result.push({ ...k, nama: cleanName, jenjang });\n    }',
  `    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({ ...k, nama: cleanName, jenjang });
    } else {
      // Prioritaskan kelas yang memiliki jumlah santri lebih banyak
      const existingIdx = result.findIndex(r => r.jenjang === jenjang && r.nama.toUpperCase() === cleanName.toUpperCase());
      if (existingIdx !== -1) {
        const existing = result[existingIdx];
        const currentSantriCount = k._count?.santri || 0;
        const existingSantriCount = existing._count?.santri || 0;
        if (currentSantriCount > existingSantriCount) {
          result[existingIdx] = { ...k, nama: cleanName, jenjang };
        }
      }
    }`
);

// Fix normalizeMasterData
code = code.replace(
  '    if (!seenKeys.has(key)) {\n      seenKeys.set(key, k.id);\n      canonicalIdMap.set(k.id, k.id);\n      resultKelas.push({ ...k, nama: cleanName, jenjang });\n    } else {\n      const canonicalId = seenKeys.get(key)!;\n      canonicalIdMap.set(k.id, canonicalId);\n    }',
  `    if (!seenKeys.has(key)) {
      seenKeys.set(key, k.id);
      canonicalIdMap.set(k.id, k.id);
      resultKelas.push({ ...k, nama: cleanName, jenjang });
    } else {
      // If duplicate, always map alias IDs to the canonical ID.
      // BUT if we want to be safe, we should map both ways or prioritize the one with santri.
      // Since normalizeMasterData doesn't have _count, we'll just keep the first one as canonical.
      const canonicalId = seenKeys.get(key)!;
      canonicalIdMap.set(k.id, canonicalId);
    }`
);

fs.writeFileSync('src/lib/kelas.ts', code);
