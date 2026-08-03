import { prisma } from "@/lib/prisma";

export interface StatusSPP {
  lunas: boolean;
  status: "lunas" | "tenggang" | "terkunci";
  pesan: string;
  nominal?: number;
  bulan: number;
  tahun: number;
  namaBulan: string;
  jatuhTempo: string;
  isGracePeriod: boolean; // true jika tgl 1-10 dan belum bayar
  tanggalBayar?: string | null;
  metodeBayar?: string | null;
}

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Aturan Bisnis Pembayaran SPP Pesantren Al-Imam:
 * 1. Masa pembayaran SPP bulanan adalah tanggal 1 s/d 10 setiap bulannya.
 * 2. Jika tanggal 1 - 10 belum bayar: Akun tetap BISA dibuka (Masa Tenggang), namun diberikan info pengingat jatuh tempo.
 * 3. Jika MELEWATI tanggal 10 dan BELUM lunas: Akun Wali Santri TERKUNCI otomatis, sampai Admin Keuangan memverifikasi pembayaran.
 * 4. Jika SUDAH lunas: Seluruh isi akun terbuka penuh (Rapor, Nilai Mapel, Presensi, Jurnal Guru, Tahfidz).
 */
export async function cekStatusSpp(
  santriId: string,
  bulan?: number,
  tahun?: number
): Promise<StatusSPP> {
  const now = new Date();
  const targetBulan = bulan || (now.getMonth() + 1);
  const targetTahun = tahun || now.getFullYear();
  const todayDate = now.getDate();
  const namaBulanStr = NAMA_BULAN[targetBulan - 1] || "Bulan Ini";
  const jatuhTempo = `10 ${namaBulanStr} ${targetTahun}`;

  try {
    // 1. Cek record pembayaran di database
    const pembayaran = await prisma.pembayaranSPP.findUnique({
      where: {
        santri_id_bulan_tahun: {
          santri_id: santriId,
          bulan: targetBulan,
          tahun: targetTahun,
        },
      },
    });

    if (pembayaran && pembayaran.status === "lunas") {
      return {
        lunas: true,
        status: "lunas",
        pesan: `Alhamdulillah, SPP bulan ${namaBulanStr} ${targetTahun} telah lunas terverifikasi.`,
        nominal: pembayaran.nominal,
        bulan: targetBulan,
        tahun: targetTahun,
        namaBulan: namaBulanStr,
        jatuhTempo,
        isGracePeriod: false,
        tanggalBayar: pembayaran.tanggal_bayar ? pembayaran.tanggal_bayar.toISOString().split("T")[0] : null,
        metodeBayar: pembayaran.metode_bayar,
      };
    }

    // 2. Jika belum lunas, terapkan aturan tanggal 1 - 10
    const isCurrentMonth = (targetBulan === (now.getMonth() + 1)) && (targetTahun === now.getFullYear());

    if (isCurrentMonth) {
      if (todayDate <= 10) {
        // Masih dalam periode tgl 1 - 10 (Masa Tenggang) -> Akses masih dibuka
        return {
          lunas: true,
          status: "tenggang",
          pesan: `Masa pembayaran SPP bulan ${namaBulanStr} adalah tanggal 1 s/d 10 ${namaBulanStr}. Akses akun tetap terbuka hingga batas akhir pembayaran.`,
          nominal: pembayaran?.nominal || 1500000,
          bulan: targetBulan,
          tahun: targetTahun,
          namaBulan: namaBulanStr,
          jatuhTempo,
          isGracePeriod: true,
        };
      } else {
        // Lewat tanggal 10 dan belum lunas -> Terkunci
        return {
          lunas: false,
          status: "terkunci",
          pesan: `Batas akhir pembayaran SPP bulan ${namaBulanStr} (${jatuhTempo}) telah terlewati. Akses akun terkunci sementara hingga pembayaran dikonfirmasi oleh Admin Keuangan.`,
          nominal: pembayaran?.nominal || 1500000,
          bulan: targetBulan,
          tahun: targetTahun,
          namaBulan: namaBulanStr,
          jatuhTempo,
          isGracePeriod: false,
        };
      }
    } else if (targetTahun < now.getFullYear() || (targetTahun === now.getFullYear() && targetBulan < (now.getMonth() + 1))) {
      // Bulan lampau dan belum lunas -> Terkunci
      return {
        lunas: false,
        status: "terkunci",
        pesan: `Terdapat tunggakan SPP bulan ${namaBulanStr} ${targetTahun}. Akses akun terkunci sementara hingga pembayaran diselesaikan.`,
        nominal: pembayaran?.nominal || 1500000,
        bulan: targetBulan,
        tahun: targetTahun,
        namaBulan: namaBulanStr,
        jatuhTempo,
        isGracePeriod: false,
      };
    } else {
      // Bulan mendatang
      return {
        lunas: true,
        status: "tenggang",
        pesan: `Tagihan SPP bulan ${namaBulanStr} ${targetTahun}.`,
        nominal: pembayaran?.nominal || 1500000,
        bulan: targetBulan,
        tahun: targetTahun,
        namaBulan: namaBulanStr,
        jatuhTempo,
        isGracePeriod: true,
      };
    }
  } catch (error) {
    console.error("Error cekStatusSpp:", error);
    return {
      lunas: true,
      status: "tenggang",
      pesan: "Status administrasi sedang diverifikasi.",
      bulan: targetBulan,
      tahun: targetTahun,
      namaBulan: namaBulanStr,
      jatuhTempo,
      isGracePeriod: false,
    };
  }
}
