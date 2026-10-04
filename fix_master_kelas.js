const fs = require('fs');

// 1. Modify api/master/route.ts to include _count
let apiCode = fs.readFileSync('src/app/api/master/route.ts', 'utf8');
apiCode = apiCode.replace(
  'select: { id: true, nama: true, jenjang: true }',
  'select: { id: true, nama: true, jenjang: true, _count: { select: { santri: true } } }'
);
fs.writeFileSync('src/app/api/master/route.ts', apiCode);

// 2. Modify lib/kelas.ts normalizeMasterData
let libCode = fs.readFileSync('src/lib/kelas.ts', 'utf8');
libCode = libCode.replace(
  'TKelas extends { id: string; nama: string; jenjang?: string | null }',
  'TKelas extends { id: string; nama: string; jenjang?: string | null, _count?: { santri: number } }'
);

libCode = libCode.replace(
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
    }`,
  `    if (!seenKeys.has(key)) {
      seenKeys.set(key, k.id);
      canonicalIdMap.set(k.id, k.id);
      resultKelas.push({ ...k, nama: cleanName, jenjang });
    } else {
      const existingIdx = resultKelas.findIndex(r => r.jenjang === jenjang && r.nama.toUpperCase() === cleanName.toUpperCase());
      if (existingIdx !== -1) {
        const existing = resultKelas[existingIdx];
        const currentSantriCount = k._count?.santri || 0;
        const existingSantriCount = existing._count?.santri || 0;
        
        if (currentSantriCount > existingSantriCount) {
          // Ganti canonical ID lama dengan yang baru karena ini punya lebih banyak santri
          const oldId = existing.id;
          seenKeys.set(key, k.id);
          canonicalIdMap.set(k.id, k.id);
          canonicalIdMap.set(oldId, k.id); // Arahkan ID lama ke ID baru
          
          // Ganti di array hasil
          resultKelas[existingIdx] = { ...k, nama: cleanName, jenjang };
        } else {
          // K yang sekarang lebih sedikit santrinya, jadi biarkan ID lama tetap canonical
          const canonicalId = seenKeys.get(key)!;
          canonicalIdMap.set(k.id, canonicalId);
        }
      } else {
        const canonicalId = seenKeys.get(key)!;
        canonicalIdMap.set(k.id, canonicalId);
      }
    }`
);
fs.writeFileSync('src/lib/kelas.ts', libCode);
