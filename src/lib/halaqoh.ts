// ─── NILAI INDIKATOR KONVERSI ──────────────────────────────────────────────
// Sistem penilaian Halaqoh menggunakan 5 indikator yang dikonversi ke skala 1-100

export const NILAI_INDIKATOR = [
  { label: "Sangat Baik", nilai: 95, warna: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { label: "Baik",        nilai: 82, warna: "#0284c7", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "Cukup",       nilai: 70, warna: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { label: "Kurang",      nilai: 55, warna: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { label: "Buruk",       nilai: 40, warna: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
] as const;

export type IndikatorNilai = (typeof NILAI_INDIKATOR)[number]["label"];

export function indikatorToNilai(indikator: IndikatorNilai): number {
  return NILAI_INDIKATOR.find(i => i.label === indikator)?.nilai ?? 68;
}

export function nilaiToIndikator(nilai: number): IndikatorNilai {
  if (nilai >= 90) return "Sangat Baik";
  if (nilai >= 75) return "Baik";
  if (nilai >= 62) return "Cukup";
  if (nilai >= 47) return "Kurang";
  return "Buruk";
}

export function hitungNilaiAkhir(nilaiSikap: number, nilaiBacaan: number): number {
  return Math.round((nilaiSikap + nilaiBacaan) / 2);
}

// ─── JADWAL HALAQOH TETAP ──────────────────────────────────────────────────

export type SesiHalaqoh = "subuh" | "maghrib" | "dhuha";

export interface JadwalSesiInfo {
  sesi: SesiHalaqoh;
  label: string;
  waktu: string;
  hari: string[];
  jenjang?: "MTs" | "IL" | "semua"; // untuk dhuha
}

// Hari dalam bahasa Indonesia (sesuai format yang dipakai)
const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const JADWAL_HALAQOH: JadwalSesiInfo[] = [
  {
    sesi: "subuh",
    label: "Halaqoh Subuh",
    waktu: "04.50 – 06.10",
    // Subuh: Senin, Rabu, Kamis, Jumat, Sabtu (Selasa = Kajian)
    hari: ["Senin", "Rabu", "Kamis", "Jumat", "Sabtu"],
    jenjang: "semua" },
  {
    sesi: "maghrib",
    label: "Halaqoh Ba'da Maghrib",
    waktu: "Ba'da Maghrib",
    hari: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    jenjang: "semua" },
  {
    sesi: "dhuha",
    label: "Halaqoh Dhuha (MTs)",
    waktu: "07.00 – 08.20",
    hari: ["Rabu", "Sabtu"],
    jenjang: "MTs" },
  {
    sesi: "dhuha",
    label: "Halaqoh Dhuha (IL)",
    waktu: "07.00 – 08.20",
    hari: ["Sabtu"],
    jenjang: "IL" },
];

/** Ambil sesi halaqoh yang berlaku hari ini */
export function getSesiHariIni(tanggal: Date = new Date()): JadwalSesiInfo[] {
  const hariIdx = tanggal.getDay(); // 0=Ahad, 1=Senin, ..., 6=Sabtu
  const hariNama = HARI[hariIdx];
  
  if (hariNama === "Ahad") return []; // Tidak ada halaqoh hari Ahad
  
  return JADWAL_HALAQOH.filter(j => j.hari.includes(hariNama));
}

export function getLabelHari(tanggal: Date = new Date()): string {
  return HARI[tanggal.getDay()];
}

export function isHariAktifHalaqoh(tanggal: Date = new Date()): boolean {
  return tanggal.getDay() !== 0; // bukan Ahad
}
