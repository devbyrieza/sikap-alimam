export interface StatusSPP {
  lunas: boolean;
  pesan: string;
  tagihanTerakhir?: string; // e.g., "Juli 2026"
}

/**
 * Service untuk mengecek status SPP dari aplikasi Keuangan (PSP atau Internal nanti)
 * Saat ini di-mock untuk keperluan demonstrasi
 */
export async function cekStatusSpp(
  santriId: string,
  bulan: number,
  tahun: number
): Promise<StatusSPP> {
  // TODO: Integrasikan dengan API PSP atau API Internal Keuangan
  /*
  try {
    const res = await fetch(`https://api.keuangan.al-andalus.id/v1/spp/status?santri_id=${santriId}&bulan=${bulan}&tahun=${tahun}`);
    const data = await res.json();
    return {
      lunas: data.isPaid,
      pesan: data.isPaid ? "Lunas" : "Terdapat tunggakan",
    };
  } catch (e) {
    console.error("Gagal koneksi ke server keuangan", e);
    // Fail-safe: Asumsikan lunas jika server keuangan down, agar orang tua tidak marah? 
    // Atau asumsikan belum lunas? Kebijakan yayasan. Default ke true untuk fail-safe.
    return { lunas: true, pesan: "Server keuangan tidak dapat dijangkau." };
  }
  */

  // Mock implementation
  // Anggap saja santri dengan ID tertentu belum lunas untuk testing
  if (santriId === "santri-belum-lunas-123") {
    return {
      lunas: false,
      pesan: "Afwan, tagihan SPP bulan ini belum diselesaikan.",
      tagihanTerakhir: "Juli 2026",
    };
  }

  return {
    lunas: true,
    pesan: "Lunas",
  };
}
