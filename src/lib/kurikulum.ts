/**
 * Standar Kurikulum Resmi Pesantren Al-Imam Al-Islami (Revisi 31 Juli 2026 - Ustadz Aziz)
 * Pemisahan Mata Pelajaran Kelas 7 MTs vs Kelas IL (I'dad Lughowy)
 */

export interface MapelKurikulumItem {
  nama: string;
  nama_arab?: string;
  kategori: "syariah" | "bahasa" | "umum";
}

export const KURIKULUM_7_MTS: MapelKurikulumItem[] = [
  // 1. Syariah & Diniyah
  { nama: "Akidah", nama_arab: "العقيدة", kategori: "syariah" },
  { nama: "Hadis", nama_arab: "الحديث", kategori: "syariah" },
  { nama: "Fiqh", nama_arab: "الفقه", kategori: "syariah" },
  { nama: "Siroh Nabi", nama_arab: "السيرة النبوية", kategori: "syariah" },
  { nama: "Tahsin Al-Quran", nama_arab: "تحسين القرآن", kategori: "syariah" },
  { nama: "Tahfidz Al-Quran", nama_arab: "حفظ القرآن", kategori: "syariah" },
  { nama: "Adab & Akhlak", nama_arab: "الآداب والأخلاق", kategori: "syariah" },
  { nama: "Khitobah", nama_arab: "الخطابة", kategori: "syariah" },

  // 2. Bahasa & Lughoh
  { nama: "Bahasa Arab", nama_arab: "اللغة العربية", kategori: "bahasa" },
  { nama: "Kitabah", nama_arab: "الكتابة", kategori: "bahasa" },
  { nama: "Shorf", nama_arab: "الصرف", kategori: "bahasa" },

  // 3. Umum & Keterampilan
  { nama: "Bahasa Indonesia", kategori: "umum" },
  { nama: "Bahasa Inggris", kategori: "umum" },
  { nama: "Matematika", kategori: "umum" },
  { nama: "IPA Terpadu", kategori: "umum" },
  { nama: "Entrepreneurship", kategori: "umum" },
];

export const KURIKULUM_IL: MapelKurikulumItem[] = [
  // 1. Bahasa Arab Intensif & Lughoh
  { nama: "Bahasa Arab", nama_arab: "اللغة العربية المكثفة", kategori: "bahasa" },
  { nama: "Nahwu", nama_arab: "النحو", kategori: "bahasa" },
  { nama: "Shorf", nama_arab: "الصرف", kategori: "bahasa" },
  { nama: "Kitabah", nama_arab: "الكتابة", kategori: "bahasa" },
  { nama: "Tadribat Alal Anmath", nama_arab: "تدريبات على الأنماط", kategori: "bahasa" },

  // 2. Syariah & Diniyah
  { nama: "Akidah", nama_arab: "العقيدة", kategori: "syariah" },
  { nama: "Hadis", nama_arab: "الحديث", kategori: "syariah" },
  { nama: "Fiqh", nama_arab: "الفقه", kategori: "syariah" },
  { nama: "Siroh Nabi", nama_arab: "السيرة النبوية", kategori: "syariah" },
  { nama: "Tahsin Al-Quran", nama_arab: "تحسين القرآن", kategori: "syariah" },
  { nama: "Tahfidz Al-Quran", nama_arab: "حفظ القرآن", kategori: "syariah" },
  { nama: "Adab & Akhlak", nama_arab: "الآداب والأخلاق", kategori: "syariah" },
  { nama: "Khitobah", nama_arab: "الخطابة", kategori: "syariah" },

  // 3. Keterampilan
  { nama: "Entrepreneurship", kategori: "umum" },
];
