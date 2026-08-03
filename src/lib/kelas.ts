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
  const map = new Map<string, T>();
  
  for (const k of kelasList) {
    let rawName = k.nama || "";
    let jenjang = getJenjangFromKelas(rawName, k.jenjang);
    
    // Normalize nama: remove "(MTs)", "(MA)", "(Islamiyah)", etc if present
    let cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();
    // Strip redundant " MTs", " MA" at the end of the class name
    cleanName = cleanName.replace(/\s*(MTs|MA|IL)$/i, "").trim();

    // Specific normalize for IL
    if (jenjang === "IL" || cleanName.toUpperCase().includes("I'DAD") || cleanName.toUpperCase().includes("IDAD")) {
      cleanName = "IL";
      jenjang = "IL";
    }

    const key = `${jenjang}-${cleanName}`.toLowerCase();
    
    if (map.has(key)) {
      const existing = map.get(key)!;
      // Prefer the one with more santri
      const existCount = existing._count?.santri || 0;
      const newCount = k._count?.santri || 0;
      if (newCount > existCount) {
        map.set(key, { ...k, nama: cleanName, jenjang });
      }
    } else {
      map.set(key, { ...k, nama: cleanName, jenjang });
    }
  }

  return sortKelas(Array.from(map.values()));
}
