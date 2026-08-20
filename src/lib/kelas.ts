/**
 * Utility helper untuk pengurutan, pembobotan, dan pengelompokan jenjang Kelas di Pesantren Al-Imam.
 * 
 * Jenjang Utama:
 * 1. MTs (Kelas 7, 8, 9)
 * 2. IL / I'dad Lughowy (Kelas Persiapan Bahasa)
 * 3. MA (Kelas 10, 11, 12)
 */

export type JenjangType = "MTs" | "IL" | "MA";

export function getJenjangFromKelas(nama: string, jenjangDb?: string | null): JenjangType {
  const upperName = (nama || "").toUpperCase().trim();
  const upperJenjang = (jenjangDb || "").toUpperCase().trim();

  // Cek MA
  if (
    upperJenjang === "MA" || 
    upperJenjang.includes("ALIYAH") || 
    upperName.includes("MA") || 
    upperName.includes("ALIYAH") ||
    /^(10|11|12)/.test(upperName)
  ) {
    return "MA";
  }

  // Cek IL / I'dad Lughowy / Islamiyah
  if (
    upperJenjang.includes("ISLAM") || 
    upperJenjang === "IL" || 
    upperName === "IL" ||
    upperName.startsWith("IL ") ||
    upperName.includes("I'DAD") || 
    upperName.includes("IDAD") || 
    upperName.includes("LUGHOWY")
  ) {
    return "IL";
  }

  // Default ke MTs (7, 8, 9 MTs)
  return "MTs";
}

export function getKelasWeight(nama: string): number {
  if (!nama) return 999;
  const lower = nama.toLowerCase().trim();

  // MTs Kelas 7
  if (lower.startsWith("7") || lower.includes("7 mts") || lower.includes("kelas 7")) {
    return 10;
  }
  // MTs Kelas 8
  if (lower.startsWith("8") || lower.includes("8 mts") || lower.includes("kelas 8")) {
    return 20;
  }
  // MTs Kelas 9
  if (lower.startsWith("9") || lower.includes("9 mts") || lower.includes("kelas 9")) {
    return 30;
  }

  // I'dad Lughowy (IL)
  if (lower.includes("il") || lower.includes("i'dad") || lower.includes("idad") || lower.includes("lughowy")) {
    return 40;
  }

  // MA Kelas 10
  if (lower.startsWith("10") || lower.includes("10 ma") || lower.includes("kelas 10") || lower.includes("10 ali")) {
    return 50;
  }
  // MA Kelas 11
  if (lower.startsWith("11") || lower.includes("11 ma") || lower.includes("kelas 11") || lower.includes("11 ali")) {
    return 60;
  }
  // MA Kelas 12
  if (lower.startsWith("12") || lower.includes("12 ma") || lower.includes("kelas 12") || lower.includes("12 ali")) {
    return 70;
  }

  // Cek angka awalan umum
  const match = lower.match(/^(\d+)/);
  if (match) {
    return 100 + parseInt(match[1], 10);
  }

  return 200;
}

export function sortKelas<T extends { nama: string }>(kelasList: T[]): T[] {
  return [...kelasList].sort((a, b) => {
    const wA = getKelasWeight(a.nama);
    const wB = getKelasWeight(b.nama);
    if (wA !== wB) return wA - wB;
    return a.nama.localeCompare(b.nama, "id", { numeric: true, sensitivity: "base" });
  });
}

export function sortKelasNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const wA = getKelasWeight(a);
    const wB = getKelasWeight(b);
    if (wA !== wB) return wA - wB;
    return a.localeCompare(b, "id", { numeric: true, sensitivity: "base" });
  });
}

export function normalizeKelasList<T extends { id: string, nama: string, jenjang?: string | null, _count?: { santri: number } }>(kelasList: T[]): T[] {
  const result: T[] = [];
  const seenKeys = new Set<string>();
  
  for (const k of kelasList) {
    let rawName = (k.nama || "").trim();
    let jenjang = getJenjangFromKelas(rawName, k.jenjang);
    
    let cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();

    // Normalisasi khusus untuk IL: Sesuai instruksi user, nama hanya "IL"
    if (
      jenjang === "IL" ||
      cleanName.toUpperCase().includes("I'DAD") ||
      cleanName.toUpperCase().includes("IDAD") ||
      cleanName.toUpperCase().includes("LUGHOWY") ||
      cleanName.toUpperCase() === "IL"
    ) {
      jenjang = "IL";
      cleanName = "IL";
    } else {
      // Hapus akhiran redundant "(MTs)" / "(MA)" hanya jika nama tidak menjadi kosong
      const stripped = cleanName.replace(/\s*(MTs|MA)$/i, "").trim();
      if (stripped && stripped.length > 0) {
        cleanName = stripped;
      }
    }

    if (!cleanName) {
      cleanName = rawName || "IL";
    }

    const key = `${jenjang}_${cleanName.toUpperCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({ ...k, nama: cleanName, jenjang });
    }
  }

  return sortKelas(result);
}

export function normalizeMasterData<
  TKelas extends { id: string; nama: string; jenjang?: string | null },
  TAsatidzmMapel extends { pegawai_id: string; mapel_id: string; kelas_id: string },
  TMapel extends { id: string; nama: string; kelas_id: string; kategori: string }
>(
  rawKelas: TKelas[],
  rawAsatidzmMapel: TAsatidzmMapel[],
  allMapel: TMapel[],
  normalizeMapelNameFn: (name: string) => string
) {
  const canonicalIdMap = new Map<string, string>();
  const seenKeys = new Map<string, string>();
  const resultKelas: TKelas[] = [];

  for (const k of rawKelas) {
    let rawName = (k.nama || "").trim();
    let jenjang = getJenjangFromKelas(rawName, k.jenjang);
    let cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();

    if (
      jenjang === "IL" ||
      cleanName.toUpperCase().includes("I'DAD") ||
      cleanName.toUpperCase().includes("IDAD") ||
      cleanName.toUpperCase().includes("LUGHOWY") ||
      cleanName.toUpperCase() === "IL"
    ) {
      jenjang = "IL";
      cleanName = "IL";
    } else {
      const stripped = cleanName.replace(/\s*(MTs|MA)$/i, "").trim();
      if (stripped && stripped.length > 0) {
        cleanName = stripped;
      }
    }

    if (!cleanName) cleanName = rawName || "IL";

    const key = `${jenjang}_${cleanName.toUpperCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.set(key, k.id);
      canonicalIdMap.set(k.id, k.id);
      resultKelas.push({ ...k, nama: cleanName, jenjang });
    } else {
      const canonicalId = seenKeys.get(key)!;
      canonicalIdMap.set(k.id, canonicalId);
    }
  }

  const kelas = sortKelas(resultKelas);

  // Map all asatidzmMapel.kelas_id to canonical_id
  const asatidzmMapel = rawAsatidzmMapel.map(am => ({
    ...am,
    kelas_id: canonicalIdMap.get(am.kelas_id) || am.kelas_id
  }));

  // Group mapel by canonical_id
  const mapelByKelas: Record<string, { id: string; nama: string; kategori: string }[]> = {};
  for (const m of allMapel) {
    const canonicalKelasId = canonicalIdMap.get(m.kelas_id) || m.kelas_id;
    if (!mapelByKelas[canonicalKelasId]) {
      mapelByKelas[canonicalKelasId] = [];
    }
    const cleanMapelName = normalizeMapelNameFn(m.nama);
    if (!mapelByKelas[canonicalKelasId].some(e => e.id === m.id || e.nama === cleanMapelName)) {
      mapelByKelas[canonicalKelasId].push({ 
        id: m.id, 
        nama: cleanMapelName, 
        kategori: m.kategori 
      });
    }
  }

  return { kelas, asatidzmMapel, mapelByKelas };
}

