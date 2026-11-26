export interface NilaiStatusRow {
  jenis: string;
  nilai: number | null;
}

/**
 * Menentukan apakah nilai akhir semester (PAS) sudah tersedia.
 * Aturan bisnis:
 * - Jika PAS belum ada -> Rapor Tengah Semester aktif, Rapor Akhir Semester nonaktif.
 * - Jika PAS sudah ada -> Rapor Akhir Semester aktif, Rapor Tengah Semester NONAKTIF.
 */
export function hasNilaiAkhirSemester(nilaiRows: NilaiStatusRow[]): boolean {
  return nilaiRows.some(
    (n) =>
      (n.jenis === "pas" || n.jenis === "ujian_akhir") &&
      n.nilai !== null &&
      n.nilai !== undefined &&
      !Number.isNaN(Number(n.nilai))
  );
}

export function getRaporButtonState(nilaiRows: NilaiStatusRow[]) {
  const pasAvailable = hasNilaiAkhirSemester(nilaiRows);
  return {
    hasNilaiAkhirSemester: pasAvailable,
    ptsEnabled: !pasAvailable,
    pasEnabled: pasAvailable,
  };
}
