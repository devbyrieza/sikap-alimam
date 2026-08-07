import { prisma } from "@/lib/prisma";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

export const DISTRIBUSI_GURU_DATA = [
  {
    namaMatch: ["Abdil Aziz", "Abdil"],
    namaResmi: "Abdil Aziz, B.A.",
    mapelString: "IL: Bahasa Arab",
  },
  {
    namaMatch: ["Ade Supiana", "Ade Supyana"],
    namaResmi: "Ade Supiana, S.Pd.I",
    mapelString: "7 MTs: Bahasa Indonesia",
  },
  {
    namaMatch: ["Agus Cahyono"],
    namaResmi: "Agus Cahyono",
    mapelString: "7 MTs: Kitabah; IL: Kitabah, Tadribat Alal Anmath",
  },
  {
    namaMatch: ["Arifin Syaifullah", "Arifin Saefullah"],
    namaResmi: "Arifin Syaifullah, Lc., M.M., M.Pd.",
    mapelString: "7 MTs: Akidah; IL: Akidah",
  },
  {
    namaMatch: ["Imran Abdillah", "Imron Abdillah"],
    namaResmi: "Imran Abdillah, Lc.",
    mapelString: "IL: Nahwu, Tahsin Al-Quran",
  },
  {
    namaMatch: ["Hardiansyah"],
    namaResmi: "Hardiansyah, S.Pd.",
    mapelString: "7 MTs: IPA Terpadu",
  },
  {
    namaMatch: ["Muhammad Ikbal", "Muhammad Iqbal", "Ikbal", "Iqbal"],
    namaResmi: "Muhammad Ikbal, S.Pd.",
    mapelString: "7 MTs: Shorf, Tahsin Al-Quran; IL: Shorf",
  },
  {
    namaMatch: ["Muhammad Thoriq", "Thoriq"],
    namaResmi: "Muhammad Thoriq, Lc., M.Ag.",
    mapelString: "7 MTs: Siroh Nabi, Hadis; IL: Siroh Nabi, Hadis",
  },
  {
    namaMatch: ["Rieza"],
    namaResmi: "Rieza Eka Tomara, S.Kom",
    mapelString: "7 MTs: Matematika",
  },
  {
    namaMatch: ["Teguh Hudaya", "Teguh"],
    namaResmi: "Teguh Hudaya, Lc., M.M.",
    mapelString: "7 MTs: Entrepreneurship; IL: Entrepreneurship",
  },
  {
    namaMatch: ["Wahab Rajasam", "Wahab"],
    namaResmi: "Wahab Rajasam, M.Pd.",
    mapelString: "7 MTs: Fiqh; IL: Fiqh",
  },
  {
    namaMatch: ["Wahyudi Pranata", "Wahyudi"],
    namaResmi: "Wahyudi Pranata, B.A.",
    mapelString: "7 MTs: Bahasa Arab",
  },
  {
    namaMatch: ["Muhammad Maulana Rizki", "Maulana Rizki"],
    namaResmi: "Muhammad Maulana Rizki",
    mapelString: "7 MTs: Bahasa Inggris",
  },
];

export async function seedAllDistribusiGuru() {
  console.log("=== MEMULAI SINKRONISASI DISTRIBUSI GURU (REVISI 31 JULI 2026) ===");

  for (const item of DISTRIBUSI_GURU_DATA) {
    const OR_names = item.namaMatch.map((n) => ({
      nama_lengkap: { contains: n, mode: "insensitive" as const },
    }));

    let pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: OR_names,
      },
    });

    if (!pegawai) {
      // If teacher record doesn't exist yet, create it
      pegawai = await prisma.pegawai.create({
        data: {
          nama_lengkap: item.namaResmi,
          kategori_pegawai: "GURU,ASATIDZ",
          jabatan: "Pengajar / Guru",
          mata_pelajaran: item.mapelString,
          no_hp: "08123456789",
        },
      });
      console.log(`[CREATED] Guru Baru: ${pegawai.nama_lengkap}`);
    } else {
      console.log(`[FOUND] Guru: ${pegawai.nama_lengkap} -> Update mapel: "${item.mapelString}"`);
      pegawai = await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { mata_pelajaran: item.mapelString },
      });
    }

    if (pegawai?.id) {
      await syncAsatidzMapel(pegawai.id, item.mapelString);
      console.log(`[SYNCED] ${pegawai.nama_lengkap} berhasil disinkronkan ke relasi asatidz_mapel.`);
    }
  }

  console.log("=== SINKRONISASI DISTRIBUSI GURU SELESAI ===");
}
