/**
 * Standarisasi Format & Generator Username Profesional
 * Format standar: namadepan.namabelakang (huruf kecil, tanpa spasi, tanpa gelar)
 * Contoh: "Imron Abdillah, S.Pd." -> "imron.abdillah"
 */

export interface UsernameValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

const PREFIX_TITLES = new Set([
  "ust",
  "ustadz",
  "ustadzah",
  "usth",
  "ustd",
  "h",
  "hj",
  "kh",
  "dr",
  "drs",
  "dra",
  "ir",
  "prof",
  "buya",
  "tgk",
  "abuya",
  "habib",
  "syekh",
  "syaikh",
  "bpk",
  "bapak",
  "ibu",
]);

const SUFFIX_TITLES = new Set([
  "spd",
  "spdi",
  "skom",
  "ssi",
  "sag",
  "se",
  "sh",
  "ssos",
  "spsi",
  "st",
  "sip",
  "shum",
  "sthi",
  "skm",
  "skep",
  "sfarm",
  "si",
  "sp",
  "mpd",
  "mpdi",
  "mag",
  "mkom",
  "msi",
  "mm",
  "ma",
  "mh",
  "mba",
  "mth",
  "mpsi",
  "mt",
  "lc",
  "phd",
  "amd",
  "gr",
  "apt",
  "ns",
  "alhafizh",
  "alhafizhah",
  "hafizh",
  "hafizhah",
]);

/**
 * Membersihkan input username (lowercase, trim, spasi jadi titik, rapikan simbol berlebih).
 * Digunakan untuk input otomatis/normalisasi ringan.
 */
export function normalizeUsernameInput(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/[._]{2,}/g, ".");
}

/**
 * Menghasilkan saran username profesional dari Nama Lengkap (menghapus gelar depan/belakang).
 * Contoh:
 * - "Imron Abdillah, S.Pd." -> "imron.abdillah"
 * - "Ust. H. Agus Cahyono, Lc., M.Pd." -> "agus.cahyono"
 * - "Ersana, S.Pd." -> "ersana"
 */
export function generateProfessionalUsername(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "";

  // Ambil bagian sebelum koma pertama untuk membuang gelar belakang standar (misal ", S.Pd., M.Pd.")
  const beforeComma = fullName.split(",")[0] || fullName;

  // Normalisasi aksen & tanda kutip (misal "Ma'ruf" -> "Maruf", "Al-Faruq" -> "Al Faruq")
  const cleaned = beforeComma
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-zA-Z0-9\s.-]/g, " ");

  const rawTokens = cleaned
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Filter gelar depan & gelar belakang yang mungkin ditulis tanpa koma
  const tokens: string[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const compact = rawTokens[i].toLowerCase().replace(/\./g, "");
    if (!compact || !/[a-z0-9]/.test(compact)) continue;

    // Buang gelar depan jika masih di awal sebelum nama inti ditemukan
    if (tokens.length === 0 && PREFIX_TITLES.has(compact)) {
      continue;
    }

    // Buang gelar belakang jika sudah ada minimal 1 kata nama
    if (tokens.length > 0 && SUFFIX_TITLES.has(compact)) {
      continue;
    }

    tokens.push(compact);
  }

  // Fallback jika semua token terfilter
  const finalTokens =
    tokens.length > 0
      ? tokens
      : cleaned
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean);

  if (finalTokens.length === 0) return "";

  let candidate = "";
  if (finalTokens.length === 1) {
    candidate = finalTokens[0];
  } else {
    const first = finalTokens[0];
    const last = finalTokens[finalTokens.length - 1];
    candidate = `${first}.${last}`;
  }

  // Batasi maksimal 30 karakter dan pastikan tidak diakhiri titik/underscore
  if (candidate.length > 30) {
    candidate = candidate.slice(0, 30).replace(/[._]+$/g, "");
  }

  return candidate;
}

/**
 * Validasi format username standar profesional.
 * - Opsional (jika kosong -> valid)
 * - 4 hingga 30 karakter
 * - Hanya huruf kecil (a-z), angka (0-9), titik (.), atau underscore (_)
 * - Harus diawali dan diakhiri huruf atau angka
 * - Tidak boleh mengandung titik/underscore ganda berurutan (.., __, ._, _.)
 */
export function validateUsernameFormat(raw?: string | null): UsernameValidationResult {
  if (!raw || !raw.trim()) {
    return { isValid: true, normalized: "" };
  }

  const normalized = raw.trim().toLowerCase();

  if (/\s/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: "Username tidak boleh mengandung spasi. Gunakan titik (.) sebagai pemisah, contoh: nama.belakang",
    };
  }

  if (normalized.length < 4 || normalized.length > 30) {
    return {
      isValid: false,
      normalized,
      error: "Username harus berjumlah 4 hingga 30 karakter.",
    };
  }

  if (!/^[a-z0-9._]+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: "Username hanya boleh berisi huruf kecil (a-z), angka (0-9), titik (.), atau underscore (_).",
    };
  }

  if (!/^[a-z0-9]/.test(normalized) || !/[a-z0-9]$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: "Username harus diawali dan diakhiri dengan huruf atau angka.",
    };
  }

  if (/[._]{2,}/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: "Username tidak boleh mengandung tanda titik atau underscore berurutan.",
    };
  }

  return { isValid: true, normalized };
}
