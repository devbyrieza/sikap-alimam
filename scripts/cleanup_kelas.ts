import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== CLEANUP DATA KELAS AL-IMAM ===");

  // 1. Konsolidasi nama 'I'dad Lughowy' menjadi 'IL'
  await prisma.kelas.updateMany({
    where: { nama: "I'dad Lughowy" },
    data: { nama: "IL", jenjang: "Islamiyah", is_active: true },
  });

  // 2. Pastikan kelas '7 MTs' dan 'IL' ada dan aktif
  await prisma.kelas.upsert({
    where: { nama: "7 MTs" },
    update: { jenjang: "MTs", is_active: true },
    create: { nama: "7 MTs", jenjang: "MTs", is_active: true },
  });

  await prisma.kelas.upsert({
    where: { nama: "IL" },
    update: { jenjang: "Islamiyah", is_active: true },
    create: { nama: "IL", jenjang: "Islamiyah", is_active: true },
  });

  // 3. Bersihkan / nonaktifkan kelas yang belum aktif
  const unneededClasses = ["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"];
  for (const cName of unneededClasses) {
    const found = await prisma.kelas.findFirst({
      where: { nama: cName },
      include: { _count: { select: { santri: true, jurnal: true } } },
    });
    if (found) {
      if (found._count.santri === 0 && found._count.jurnal === 0) {
        await prisma.mataPelajaran.deleteMany({ where: { kelas_id: found.id } });
        await prisma.kelas.delete({ where: { id: found.id } });
        console.log(`- Menghapus placeholder kelas kosong: ${cName}`);
      } else {
        await prisma.kelas.update({
          where: { id: found.id },
          data: { is_active: false },
        });
        console.log(`- Menonaktifkan kelas: ${cName}`);
      }
    }
  }

  const all = await prisma.kelas.findMany({ select: { id: true, nama: true, jenjang: true, is_active: true } });
  console.log("Daftar Kelas sekarang:", all);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
