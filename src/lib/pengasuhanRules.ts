export const PENGASUHAN_SKALA = ["Sangat Baik", "Baik", "Kurang"] as const;
export type PengasuhanSkala = (typeof PENGASUHAN_SKALA)[number];

export const PENGASUHAN_ASPEK = [
  {
    key: "kebersihan_diri_kamar",
    label: "Kebersihan diri & kamar",
  },
  {
    key: "kerapian_diri_barang",
    label: "Kerapian diri & barang pribadi",
  },
  {
    key: "kemandirian",
    label: "Kemandirian",
  },
  {
    key: "kepatuhan_kedisiplinan",
    label: "Kepatuhan & kedisiplinan",
  },
  {
    key: "ibadah_akhlak",
    label: "Penerapan ibadah & akhlak dalam keseharian",
  },
  {
    key: "mentoring_mulahadzoh",
    label: "Kehadiran & keaktifan pada kegiatan Mentoring & Mulahadzoh",
  },
] as const;

export type PengasuhanAspekKey = (typeof PENGASUHAN_ASPEK)[number]["key"];

export const CATATAN_MUSYRIF_PREFIXES = [
  "Selalu terlihat ",
  "Terkadang ",
  "Sering terlihat tidak ",
] as const;

export function isValidPengasuhanSkala(val: unknown): val is PengasuhanSkala {
  return typeof val === "string" && (PENGASUHAN_SKALA as readonly string[]).includes(val);
}

export function validateCatatanMusyrif(catatan: string): {
  valid: boolean;
  error?: string;
  normalized?: string;
} {
  const trimmed = (catatan || "").trim();
  if (!trimmed) {
    return { valid: false, error: "Catatan tambahan musyrif/pengasuh wajib diisi." };
  }

  const matchedPrefix = CATATAN_MUSYRIF_PREFIXES.find((p) => trimmed.startsWith(p));
  if (!matchedPrefix) {
    return {
      valid: false,
      error:
        'Catatan wajib diawali salah satu dari: "Selalu terlihat ...", "Terkadang ...", atau "Sering terlihat tidak ...".',
    };
  }

  const rest = trimmed.slice(matchedPrefix.length).trim();
  if (!rest) {
    return { valid: false, error: "Lanjutan catatan setelah kata awalan tidak boleh kosong." };
  }

  return { valid: true, normalized: `${matchedPrefix}${rest}` };
}
