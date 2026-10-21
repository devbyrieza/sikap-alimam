import { JenjangType, getJenjangFromKelas } from "./kelas";

export interface UserProfileAuth {
  user?: {
    id?: string;
    nama?: string;
    email?: string;
    role?: string;
  } | null;
  pegawai?: {
    id?: string;
    nama_lengkap?: string;
    jabatan?: string;
    kategori_pegawai?: string;
  } | null;
}

export interface LaporanNilaiAccess {
  canAccess: boolean;
  isAdminSuper: boolean;
  isKepalaKurikulum: boolean;
  isWaliKelas: boolean;
  isWaliMTs: boolean;
  isWaliIL: boolean;
  isWaliMA: boolean;
  allowedJenjang: JenjangType[] | "ALL";
  userTitle: string;
}

/**
 * Validasi hak akses Laporan & Rekap Nilai:
 * Hanya boleh diakses oleh:
 * 1. Admin Super (ADMIN_SUPER, MUDIR, KEPALA_SEKOLAH, ADMIN_RAPOR)
 * 2. Kepala Kurikulum (Imron Abdillah, S.Pd.)
 * 3. Wali Kelas:
 *    - MTs: Agus Cahyono (Kelas 7, 8, 9)
 *    - IL: Imron Abdillah, S.Pd. (Kelas IL)
 *    - MA: Muhammad Thoriq Ibn Ziyad, Lc., M.Ag. (Kelas 10, 11, 12)
 */
export function getLaporanNilaiAccess(profile: UserProfileAuth): LaporanNilaiAccess {
  const user = profile?.user;
  const pegawai = profile?.pegawai;

  const roleStr = (user?.role || "").toLowerCase();
  const namaStr = (pegawai?.nama_lengkap || user?.nama || "").toLowerCase();
  const jabatanStr = (pegawai?.jabatan || "").toLowerCase();

  // 1. Admin Super / Mudir / Kepala Sekolah / Admin Rapor
  const isAdminSuper = [
    "admin_super",
    "mudir",
    "kepala_sekolah",
    "admin_rapor",
    "super_admin"
  ].some((r) => roleStr.includes(r));

  // 2. Kepala Kurikulum (Imron Abdillah, S.Pd.)
  const isKepalaKurikulum =
    roleStr.includes("kadiv_kurikulum") ||
    roleStr.includes("kepala_kurikulum") ||
    jabatanStr.includes("kurikulum") ||
    namaStr.includes("imron");

  // 3. Wali Kelas Spesifik:
  // - Agus Cahyono (Wali Kelas MTs)
  // - Imron Abdillah, S.Pd. (Wali Kelas IL)
  // - Muhammad Thoriq Ibn Ziyad, Lc., M.Ag. (Wali Kelas MA)
  const isWaliMTs =
    namaStr.includes("agus cahyono") ||
    (roleStr.includes("wali_kelas") && (jabatanStr.includes("mts") || jabatanStr.includes("7") || jabatanStr.includes("8") || jabatanStr.includes("9")));

  const isWaliIL =
    namaStr.includes("imron") ||
    (roleStr.includes("wali_kelas") && (jabatanStr.includes("il") || jabatanStr.includes("idad") || jabatanStr.includes("lugho")));

  const isWaliMA =
    namaStr.includes("thoriq") ||
    (roleStr.includes("wali_kelas") && (jabatanStr.includes("ma") || jabatanStr.includes("aliyah") || jabatanStr.includes("10") || jabatanStr.includes("11") || jabatanStr.includes("12")));

  const isGenericWali = roleStr.includes("wali_kelas") || jabatanStr.includes("wali kelas");
  const isWaliKelas = isWaliMTs || isWaliIL || isWaliMA || isGenericWali;

  const canAccess = isAdminSuper || isKepalaKurikulum || isWaliKelas;

  // Filter jenjang yang diizinkan untuk dilihat di Laporan Nilai:
  let allowedJenjang: JenjangType[] | "ALL" = "ALL";
  let userTitle = "Pengguna";

  if (roleStr.includes("mudir")) {
    userTitle = "Mudir Pesantren";
    allowedJenjang = "ALL";
  } else if (roleStr.includes("kepala_sekolah")) {
    userTitle = "Kepala Sekolah";
    allowedJenjang = "ALL";
  } else if (isAdminSuper) {
    userTitle = "Admin Super";
    allowedJenjang = "ALL";
  } else if (isKepalaKurikulum) {
    userTitle = "Kepala Kurikulum";
    allowedJenjang = "ALL"; // Kepala Kurikulum berhak memantau semua jenjang
  } else if (isWaliMTs) {
    userTitle = "Wali Kelas MTs (Agus Cahyono)";
    allowedJenjang = ["MTs"];
  } else if (isWaliMA) {
    userTitle = "Wali Kelas MA (Muhammad Thoriq Ibn Ziyad, Lc., M.Ag.)";
    allowedJenjang = ["MA"];
  } else if (isWaliIL) {
    userTitle = "Wali Kelas IL (Imron Abdillah, S.Pd.)";
    allowedJenjang = ["IL"];
  } else if (isGenericWali) {
    userTitle = "Wali Kelas";
    allowedJenjang = "ALL";
  }

  return {
    canAccess,
    isAdminSuper,
    isKepalaKurikulum,
    isWaliKelas,
    isWaliMTs,
    isWaliIL,
    isWaliMA,
    allowedJenjang,
    userTitle
  };
}
