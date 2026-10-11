export interface OfficialSantri {
  nis: string;
  nisn: string | null;
  nama: string;
  kelas: string;
  jk: "L" | "P";
}

export const OFFICIAL_SANTRI_LIST: OfficialSantri[] = [
  // 7 MTs (19 Santri Resmi dari 03_Data_Santri_Fix.xlsx & Gelombang 2)
  { nis: "2601070001", nisn: "3138573879", nama: "Abdul Aziz Ali", kelas: "7 MTs", jk: "L" },
  { nis: "2601070002", nisn: "3126570385", nama: "Abdul Hakim", kelas: "7 MTs", jk: "L" },
  { nis: "2601070003", nisn: "0144707535", nama: "Ahmad Farros Al Barqy", kelas: "7 MTs", jk: "L" },
  { nis: "2601070004", nisn: "0144022242", nama: "Atqanul Ummah Ahmad", kelas: "7 MTs", jk: "L" },
  { nis: "2601070005", nisn: "0118124819", nama: "Azka Panji Kusuma", kelas: "7 MTs", jk: "L" },
  { nis: "2601070006", nisn: "0126357451", nama: "Fariq Malaibui", kelas: "7 MTs", jk: "L" },
  { nis: "2601070007", nisn: "3143565899", nama: "Haidar Ayyubi", kelas: "7 MTs", jk: "L" },
  { nis: "2601070008", nisn: "3130674854", nama: "Labibullah El Fatih", kelas: "7 MTs", jk: "L" },
  { nis: "2601070009", nisn: "0126621438", nama: "M Fazril Alkais", kelas: "7 MTs", jk: "L" },
  { nis: "2601070010", nisn: "3135552408", nama: "Muh Asrorin Da Silva", kelas: "7 MTs", jk: "L" },
  { nis: "2601070011", nisn: "3158988149", nama: "Muhammad Azzam Al Hafiz", kelas: "7 MTs", jk: "L" },
  { nis: "2601070012", nisn: "0131958288", nama: "Muhammad Hafidz Reo Afelano", kelas: "7 MTs", jk: "L" },
  { nis: "2601070013", nisn: "0134983164", nama: "Muhammad Rifqi Hamid", kelas: "7 MTs", jk: "L" },
  { nis: "2601070014", nisn: "0131678899", nama: "Muhammad Yahya Ayyash", kelas: "7 MTs", jk: "L" },
  { nis: "2601070015", nisn: "0131310620", nama: "Naufal Dzakiy Purnama", kelas: "7 MTs", jk: "L" },
  { nis: "2601070016", nisn: "3135317771", nama: "Andi Ibra Faeyza Hasan Alnasr", kelas: "7 MTs", jk: "L" },
  { nis: "2601070017", nisn: "3126750872", nama: "Khalish", kelas: "7 MTs", jk: "L" },
  { nis: "2601070018", nisn: "3133296809", nama: "M Naufal Alfaniri", kelas: "7 MTs", jk: "L" },
  { nis: "2601070019", nisn: "3137075549", nama: "Rifqi Arsyad Fadilah", kelas: "7 MTs", jk: "L" },

  // IL (I'dad Lughowi - 21 Santri Resmi dari 03_Data_Santri_Fix.xlsx & Gelombang 2)
  { nis: "2602070001", nisn: "0117964135", nama: "Abdurrahim Pati Raja", kelas: "IL", jk: "L" },
  { nis: "2602070002", nisn: "0103152091", nama: "Daffa Muammar Dzaki", kelas: "IL", jk: "L" },
  { nis: "2602070003", nisn: "0102931617", nama: "Fanni Hariri Hamonangan", kelas: "IL", jk: "L" },
  { nis: "2602070004", nisn: "0109644596", nama: "Farid", kelas: "IL", jk: "L" },
  { nis: "2602070005", nisn: "0104946253", nama: "Favian Radi", kelas: "IL", jk: "L" },
  { nis: "2602070006", nisn: "0105657546", nama: "Hibban Hibaturrahman", kelas: "IL", jk: "L" },
  { nis: "2602070007", nisn: "3112856760", nama: "Ken Alfarezha Haryadi", kelas: "IL", jk: "L" },
  { nis: "2602070008", nisn: "0113604423", nama: "Khubaib Abdul Aziz", kelas: "IL", jk: "L" },
  { nis: "2602070009", nisn: "3118872091", nama: "Lalu Muhamad Rizky Ananda", kelas: "IL", jk: "L" },
  { nis: "2602070010", nisn: "3114471015", nama: "Miizan Alghifary Dizlilar", kelas: "IL", jk: "L" },
  { nis: "2602070011", nisn: "3104160976", nama: "Muhammad Rasyid Ridho", kelas: "IL", jk: "L" },
  { nis: "2602070012", nisn: "2600014", nama: "Muhammad Rizky", kelas: "IL", jk: "L" },
  { nis: "2602070015", nisn: "3115058664", nama: "Abdullah Rasyid", kelas: "IL", jk: "L" },
  { nis: "2602070016", nisn: "0111915038", nama: "Fiqri Ramdan Handoko", kelas: "IL", jk: "L" },
  { nis: "2602070017", nisn: "0074350417", nama: "Nurcahya Eka Putra", kelas: "IL", jk: "L" },
  { nis: "2602070018", nisn: "0096483042", nama: "Panji Ahmad", kelas: "IL", jk: "L" },
  { nis: "2602070019", nisn: "0115034480", nama: "Wahyu Hidayat", kelas: "IL", jk: "L" },
  { nis: "2602070020", nisn: "0095639359", nama: "Muhammad Khoirul Azzam", kelas: "IL", jk: "L" },
  { nis: "2602070021", nisn: "3111212355", nama: "Muhammad Hafidz Abdurrahman", kelas: "IL", jk: "L" },
  { nis: "2602070022", nisn: "0099115008", nama: "Syeh Al Bani Irsyad Amrulloh", kelas: "IL", jk: "L" },
  { nis: "2602070023", nisn: "3121944600", nama: "Iman Prayogo", kelas: "IL", jk: "L" },

  // 11 MA (3 Santri)
  { nis: "121232020034222003", nisn: "3098424796", nama: "Pandi Rianto", kelas: "11 MA", jk: "L" },
  { nis: "121232020034221005", nisn: "0096255196", nama: "Salman Abdulrahim Uran", kelas: "11 MA", jk: "L" },
  { nis: "131232020011241007", nisn: "0085395171", nama: "Radil", kelas: "11 MA", jk: "L" },

  // 12 MA (5 Santri)
  { nis: "510032020813211029", nisn: "0081028016", nama: "Muhammad Abdul Rahman", kelas: "12 MA", jk: "L" },
  { nis: "510032020813211030", nisn: "0084152287", nama: "Muhammad Abdul Rahim", kelas: "12 MA", jk: "L" },
  { nis: "131232020011241006", nisn: "0082930118", nama: "Yasser Ali Nurdin", kelas: "12 MA", jk: "L" },
  { nis: "510032020813211031", nisn: "3091558088", nama: "Syafiq Karimalai", kelas: "12 MA", jk: "L" },
  { nis: "131232020011222010", nisn: "0076721285", nama: "Dicky Dwy AP", kelas: "12 MA", jk: "L" },
];

/**
 * Mencari NIS resmi berdasarkan nama lengkap santri
 */
export function getOfficialNis(namaLengkap: string): string | null {
  if (!namaLengkap) return null;
  const clean = namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // 1. Cek Exact Match terlebih dahulu
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean === sClean) {
      return s.nis;
    }
  }

  // 2. Cek Substring Match jika exact tidak ditemukan
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes(sClean) || sClean.includes(clean)) {
      return s.nis;
    }
  }
  return null;
}

/**
 * Mencari NISN resmi berdasarkan nama lengkap santri
 */
export function getOfficialNisn(namaLengkap: string): string | null {
  if (!namaLengkap) return null;
  const clean = namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // 1. Cek Exact Match terlebih dahulu
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean === sClean) {
      return s.nisn;
    }
  }

  // 2. Cek Substring Match jika exact tidak ditemukan
  for (const s of OFFICIAL_SANTRI_LIST) {
    const sClean = s.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes(sClean) || sClean.includes(clean)) {
      return s.nisn;
    }
  }
  return null;
}
