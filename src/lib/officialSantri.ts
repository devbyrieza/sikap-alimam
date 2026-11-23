export interface OfficialSantri {
  nis: string;
  nisn: string | null;
  nama: string;
  kelas: string;
  jk: "L" | "P";
}

export const OFFICIAL_SANTRI_LIST: OfficialSantri[] = [
  { nis: "2626006", nisn: "009876526007", nama: "Naufal Hakim", kelas: "10 SMA IT", jk: "L" },
  { nis: "2626014", nisn: "009876526015", nama: "Salman Al-Farisi", kelas: "10 SMA IT", jk: "L" },
  { nis: "2626019", nisn: "009876526020", nama: "Ruqayyah Bunga", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626021", nisn: "009876526022", nama: "Safiyyah Rahma", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626028", nisn: "009876526029", nama: "Sumayyah Ayu", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626037", nisn: "009876526038", nama: "Naufal Hakim", kelas: "10 SMA IT", jk: "L" },
  { nis: "2626045", nisn: "009876526046", nama: "Salman Al-Farisi", kelas: "10 SMA IT", jk: "L" },
  { nis: "2626050", nisn: "009876526051", nama: "Ruqayyah Bunga", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626052", nisn: "009876526053", nama: "Safiyyah Rahma", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626059", nisn: "009876526060", nama: "Sumayyah Ayu", kelas: "10 SMA IT", jk: "P" },
  { nis: "2626007", nisn: "009876526008", nama: "Umar Sayyid", kelas: "11 SMA IT", jk: "L" },
  { nis: "2626015", nisn: "009876526016", nama: "Utsman Basyari", kelas: "11 SMA IT", jk: "L" },
  { nis: "2626020", nisn: "009876526021", nama: "Ummu Kultsum", kelas: "11 SMA IT", jk: "P" },
  { nis: "2626031", nisn: "009876526032", nama: "Utsman Basyari", kelas: "11 SMA IT", jk: "L" },
  { nis: "2626038", nisn: "009876526039", nama: "Umar Sayyid", kelas: "11 SMA IT", jk: "L" },
  { nis: "2626051", nisn: "009876526052", nama: "Ummu Kultsum", kelas: "11 SMA IT", jk: "P" },
  { nis: "2626005", nisn: "009876526006", nama: "Zaidan Ibrahim", kelas: "12 SMA IT", jk: "L" },
  { nis: "2626011", nisn: "009876526012", nama: "Yusuf Habibi", kelas: "12 SMA IT", jk: "L" },
  { nis: "2626030", nisn: "009876526031", nama: "Zulfa Kamila", kelas: "12 SMA IT", jk: "P" },
  { nis: "2626036", nisn: "009876526037", nama: "Zaidan Ibrahim", kelas: "12 SMA IT", jk: "L" },
  { nis: "2626042", nisn: "009876526043", nama: "Yusuf Habibi", kelas: "12 SMA IT", jk: "L" },
  { nis: "2626046", nisn: "009876526047", nama: "Zulfa Kamila", kelas: "12 SMA IT", jk: "P" },
  { nis: "2626001", nisn: "009876526002", nama: "Ahmad Zaki", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626003", nisn: "009876526004", nama: "Abdul Aziz", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626008", nisn: "009876526009", nama: "Ali Murtadho", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626018", nisn: "009876526019", nama: "Asma Nadhira", kelas: "7 SMP IT", jk: "P" },
  { nis: "2626024", nisn: "009876526025", nama: "Aisyah Humaira", kelas: "7 SMP IT", jk: "P" },
  { nis: "2626032", nisn: "009876526033", nama: "Ahmad Zaki", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626034", nisn: "009876526035", nama: "Abdul Aziz", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626039", nisn: "009876526040", nama: "Ali Murtadho", kelas: "7 SMP IT", jk: "L" },
  { nis: "2626049", nisn: "009876526050", nama: "Asma Nadhira", kelas: "7 SMP IT", jk: "P" },
  { nis: "2626055", nisn: "009876526056", nama: "Aisyah Humaira", kelas: "7 SMP IT", jk: "P" },
  { nis: "2626004", nisn: "009876526005", nama: "Hafiz Maulana", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626009", nisn: "009876526010", nama: "Bilal Ramadhan", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626010", nisn: "009876526011", nama: "Farhan Akbar", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626025", nisn: "009876526026", nama: "Fatimah Az-Zahra", kelas: "8 SMP IT", jk: "P" },
  { nis: "2626029", nisn: "009876526030", nama: "Hafshah Nurjanah", kelas: "8 SMP IT", jk: "P" },
  { nis: "2626035", nisn: "009876526036", nama: "Hafiz Maulana", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626040", nisn: "009876526041", nama: "Bilal Ramadhan", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626041", nisn: "009876526042", nama: "Farhan Akbar", kelas: "8 SMP IT", jk: "L" },
  { nis: "2626056", nisn: "009876526057", nama: "Fatimah Az-Zahra", kelas: "8 SMP IT", jk: "P" },
  { nis: "2626060", nisn: "009876526061", nama: "Hafshah Nurjanah", kelas: "8 SMP IT", jk: "P" },
  { nis: "2626012", nisn: "009876526013", nama: "Ibrahim Khalil", kelas: "9 SMP IT", jk: "L" },
  { nis: "2626013", nisn: "009876526014", nama: "Hamzah Aditya", kelas: "9 SMP IT", jk: "L" },
  { nis: "2626017", nisn: "009876526018", nama: "Halimah Tyas", kelas: "9 SMP IT", jk: "P" },
  { nis: "2626023", nisn: "009876526024", nama: "Juwairiyah Putri", kelas: "9 SMP IT", jk: "P" },
  { nis: "2626043", nisn: "009876526044", nama: "Ibrahim Khalil", kelas: "9 SMP IT", jk: "L" },
  { nis: "2626044", nisn: "009876526045", nama: "Hamzah Aditya", kelas: "9 SMP IT", jk: "L" },
  { nis: "2626048", nisn: "009876526049", nama: "Halimah Tyas", kelas: "9 SMP IT", jk: "P" },
  { nis: "2626054", nisn: "009876526055", nama: "Juwairiyah Putri", kelas: "9 SMP IT", jk: "P" },
  { nis: "2626002", nisn: "009876526003", nama: "Muhammad Alfarizi", kelas: "IL", jk: "L" },
  { nis: "2626016", nisn: "009876526017", nama: "Nabila Zahra", kelas: "IL", jk: "P" },
  { nis: "2626022", nisn: "009876526023", nama: "Maimunah Ghaisani", kelas: "IL", jk: "P" },
  { nis: "2626026", nisn: "009876526027", nama: "Maryam Shalihah", kelas: "IL", jk: "P" },
  { nis: "2626027", nisn: "009876526028", nama: "Khadijah Aulia", kelas: "IL", jk: "P" },
  { nis: "2626033", nisn: "009876526034", nama: "Muhammad Alfarizi", kelas: "IL", jk: "L" },
  { nis: "2626047", nisn: "009876526048", nama: "Nabila Zahra", kelas: "IL", jk: "P" },
  { nis: "2626053", nisn: "009876526054", nama: "Maimunah Ghaisani", kelas: "IL", jk: "P" },
  { nis: "2626057", nisn: "009876526058", nama: "Maryam Shalihah", kelas: "IL", jk: "P" },
  { nis: "2626058", nisn: "009876526059", nama: "Khadijah Aulia", kelas: "IL", jk: "P" },
];

/**
 * Mencari NIS resmi berdasarkan nama lengkap santri
 */
export function getOfficialNis(namaLengkap: string): string | null {
  if (!namaLengkap) return null;
  const clean = namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sClean === clean) return s.nis;
  }
  
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sClean.includes(clean) || clean.includes(sClean)) return s.nis;
  }

  return null;
}

export function getOfficialNisn(namaLengkap: string): string | null {
  if (!namaLengkap) return null;
  const clean = namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sClean === clean) return s.nisn;
  }

  return null;
}

export const OFFICIAL_SANTRI = OFFICIAL_SANTRI_LIST;

/**
 * Sinkronisasi NIS resmi di database jika diperlukan
 */
export async function syncOfficialNisInDatabase(prismaClient?: any): Promise<void> {
  return;
}
