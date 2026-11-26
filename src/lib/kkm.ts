const UMUM_KEYWORDS = [
  "matematika",
  "mtk",
  "ipa",
  "ips",
  "indonesia",
  "inggris",
  "pjok",
  "penjas",
  "seni",
  "pkn",
  "ppkn",
  "informatika",
  "prakarya",
  "kewirausahaan",
  "entrepreneurship",
  "fisika",
  "kimia",
  "biologi",
  "sejarah",
  "geografi",
  "ekonomi",
  "sosiologi",
];

export function isMapelUmum(mapelNama: string): boolean {
  const low = (mapelNama || "").toLowerCase();
  return UMUM_KEYWORDS.some((kw) => low.includes(kw));
}

/**
 * KKM standar:
 * - Mapel Diniyyah (Syariah, Bahasa Arab, Tahfidz, dll): 85
 * - Mapel Pelajaran Umum: 80
 */
export function getMapelKkm(mapelNama: string): number {
  return isMapelUmum(mapelNama) ? 80 : 85;
}

export type ScoreTier = "atas" | "pas" | "bawah" | "kosong";

export function getScoreTier(nilai: number | null | undefined, mapelNama: string): ScoreTier {
  if (nilai === null || nilai === undefined || Number.isNaN(Number(nilai))) {
    return "kosong";
  }
  const num = Number(nilai);
  const kkm = getMapelKkm(mapelNama);
  if (num > kkm) return "atas";
  if (Math.abs(num - kkm) < 0.01) return "pas";
  return "bawah";
}
