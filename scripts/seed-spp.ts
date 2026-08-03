import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedKeuanganSPP() {
  console.log("Memulai seeding data SPP & Akun Demo Multi-Role...");

  // 1. Ambil semua santri aktif
  const santriList = await prisma.santriAktif.findMany({
    where: { is_active: true },
    include: { kelas: true },
    orderBy: { nama_lengkap: "asc" },
  });

  console.log(`Ditemukan ${santriList.length} santri aktif.`);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 2. Beri status SPP bervariasi (beberapa lunas, beberapa belum lunas untuk menguji lock screen)
  for (let i = 0; i < santriList.length; i++) {
    const s = santriList[i];
    // Santri genap lunas, santri ganjil belum lunas untuk demo komprehensif
    const isLunas = i % 2 === 0;

    await prisma.pembayaranSPP.upsert({
      where: {
        santri_id_bulan_tahun: {
          santri_id: s.id,
          bulan: currentMonth,
          tahun: currentYear,
        },
      },
      create: {
        santri_id: s.id,
        bulan: currentMonth,
        tahun: currentYear,
        nominal: 1500000,
        status: isLunas ? "lunas" : "belum_lunas",
        tanggal_bayar: isLunas ? new Date(currentYear, currentMonth - 1, 5) : null,
        metode_bayar: isLunas ? "transfer" : null,
        catatan: isLunas ? "Lunas via transfer BSI" : "Menunggu pembayaran",
      },
      update: {
        status: isLunas ? "lunas" : "belum_lunas",
        nominal: 1500000,
        tanggal_bayar: isLunas ? new Date(currentYear, currentMonth - 1, 5) : null,
        metode_bayar: isLunas ? "transfer" : null,
      },
    });
  }

  console.log("Seeding SPP berhasil!");
}

seedKeuanganSPP()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
