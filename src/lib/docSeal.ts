import { createHmac, timingSafeEqual } from "crypto";

/**
 * Segel digital dokumen (HMAC-SHA256).
 *
 * Segel mengikat satu dokumen: santri + jenis dokumen + periode. Dokumen cetak yang isinya dipalsukan
 * (mis. ID santri lain atau periode lain) tidak akan cocok dengan segelnya. Rahasia penandatangan
 * ada di env DOC_SEAL_SECRET dan hanya diketahui server (jangan diberi awalan NEXT_PUBLIC_).
 */

const getSecret = () => process.env.DOC_SEAL_SECRET || "";

export function isSealConfigured(): boolean {
  return getSecret().length >= 16;
}

function compute(santriId: string, jenis: string, periode: string): string {
  return createHmac("sha256", getSecret())
    .update(`${santriId}|${jenis}|${periode}`)
    .digest("base64url");
}

/** Buat segel untuk dicetak/dimasukkan ke QR. Mengembalikan null bila rahasia belum diatur. */
export function signDocument(santriId: string, jenis: string, periode: string): string | null {
  if (!isSealConfigured()) return null;
  return compute(santriId, jenis, periode);
}

/** Cocokkan segel dengan perbandingan waktu-tetap. */
export function verifyDocument(santriId: string, jenis: string, periode: string, sig: string): boolean {
  if (!isSealConfigured() || !sig) return false;
  const expected = Buffer.from(compute(santriId, jenis, periode));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}