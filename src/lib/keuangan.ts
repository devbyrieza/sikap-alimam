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
  tunggakanCount?: number;
  tunggakanBulan?: string[];
  totalTunggakanNominal?: number;
}

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Aturan Bisnis Pembayaran SPP Pesantren Al-Imam (TA 2026/2027):
 * 1. Tahun Ajaran dimulai bulan Juli 2026 sampai Juni 2027.
 * 2. Nominal standar: Rp 1.000.000/bulan (santri beasiswa/subsidi Rp 500.000/bulan).
 * 3. Masa pembayaran SPP bulanan adalah tanggal 1 s/d 10 setiap bulannya.
 * 4. Jika tanggal 1 - 10 belum bayar: Akun berada di masa tenggang.
 * 5. Menghitung tunggakan dari Juli 2026 hingga bulan berjalan.
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
    // 1. Dapatkan nominal SPP resmi santri dari record yang ada
    const sampleRecord = await prisma.pembayaranSPP.findFirst({
      where: { santri_id: santriId },
      orderBy: { created_at: "desc" }
    });
    const defaultNominal = sampleRecord?.nominal || 1000000;

    // 2. Hitung riwayat bulan-bulan TA 2026/2027 yang belum lunas (mulai Juli 2026 s/d targetBulan)
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();
    const tunggakanBulanList: string[] = [];

    // Evaluasi bulan 7 (Juli) sampai bulan berjalan tahun 2026
    const maxBulanEvaluasi = (targetTahun === 2026) ? Math.min(targetBulan, currentMonthNum) : currentMonthNum;
    for (let m = 7; m <= maxBulanEvaluasi; m++) {
      const rec = await prisma.pembayaranSPP.findUnique({
        where: {
          santri_id_bulan_tahun: {
            santri_id: santriId,
            bulan: m,
            tahun: 2026
          }
        }
      });
      if (!rec || rec.status !== "lunas") {
        tunggakanBulanList.push(NAMA_BULAN[m - 1]);
      }
    }

    const tunggakanCount = tunggakanBulanList.length;
    const totalTunggakanNominal = tunggakanCount * defaultNominal;

    // 3. Cek record pembayaran bulan target secara spesifik
    const pembayaran = await prisma.pembayaranSPP.findUnique({
      where: {
        santri_id_bulan_tahun: {
          santri_id: santriId,
          bulan: targetBulan,
          tahun: targetTahun } } });

    // Jika target bulan ini lunas dan tidak ada tunggakan lampau
    if (pembayaran?.status === "lunas" && tunggakanCount === 0) {
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
        tunggakanCount: 0,
        tunggakanBulan: [],
        totalTunggakanNominal: 0
      };
    }

    // Jika ada tunggakan (baik bulan berjalan atau bulan sebelumnya)
    if (tunggakanCount > 0) {
      const isLewatJatuhTempo = todayDate > 10 || (targetTahun === currentYearNum && targetBulan < currentMonthNum);
      return {
        lunas: false,
        status: isLewatJatuhTempo ? "terkunci" : "tenggang",
        pesan: `Terdapat kewajiban SPP yang belum terselesaikan sebanyak ${tunggakanCount} bulan (${tunggakanBulanList.join(", ")}).`,
        nominal: pembayaran?.nominal || defaultNominal,
        bulan: targetBulan,
        tahun: targetTahun,
        namaBulan: namaBulanStr,
        jatuhTempo,
        isGracePeriod: !isLewatJatuhTempo,
        tunggakanCount,
        tunggakanBulan: tunggakanBulanList,
        totalTunggakanNominal
      };
    }

    // Fallback jika sudah lunas
    return {
      lunas: true,
      status: "lunas",
      pesan: `Alhamdulillah, SPP bulan ${namaBulanStr} ${targetTahun} lunas.`,
      nominal: defaultNominal,
      bulan: targetBulan,
      tahun: targetTahun,
      namaBulan: namaBulanStr,
      jatuhTempo,
      isGracePeriod: false,
      tunggakanCount: 0,
      tunggakanBulan: [],
      totalTunggakanNominal: 0
    };
  } catch (error) {
    console.error("Error cekStatusSpp:", error);
    return {
      lunas: true,
      status: "tenggang",
      pesan: "Status administrasi sedang diverifikasi.",
      nominal: 1000000,
      bulan: targetBulan,
      tahun: targetTahun,
      namaBulan: namaBulanStr,
      jatuhTempo,
      isGracePeriod: false,
      tunggakanCount: 0,
      tunggakanBulan: [],
      totalTunggakanNominal: 0
    };
  }
}
