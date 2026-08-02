import { PrismaClient } from "@prisma/client";
import { KURIKULUM_7_MTS, KURIKULUM_IL } from "../src/lib/kurikulum";

const prisma = new PrismaClient();

async function run() {
  console.log("=== CLEANUP & SYNC MAPEL KURIKULUM AL-IMAM ===");

  // 1. Konsolidasi nama 'I'dad Lughowy' menjadi 'IL'
  await prisma.kelas.updateMany({
    where: { nama: "I'dad Lughowy" },
    data: { nama: "IL", jenjang: "Islamiyah", is_active: true },
  });

  // 2. Pastikan kelas '7 MTs' dan 'IL' ada dan aktif
  const kelas7 = await prisma.kelas.upsert({
    where: { nama: "7 MTs" },
    update: { jenjang: "MTs", is_active: true },
    create: { nama: "7 MTs", jenjang: "MTs", is_active: true },
  });

  const kelasIL = await prisma.kelas.upsert({
    where: { nama: "IL" },
    update: { jenjang: "Islamiyah", is_active: true },
    create: { nama: "IL", jenjang: "Islamiyah", is_active: true },
  });

  console.log(`Kelas 7 MTs ID: ${kelas7.id}`);
  console.log(`Kelas IL ID: ${kelasIL.id}`);

  // 3. Sinkronisasi Mapel 7 MTs
  for (const m of KURIKULUM_7_MTS) {
    const existing = await prisma.mataPelajaran.findFirst({
      where: { nama: m.nama, kelas_id: kelas7.id },
    });
    if (!existing) {
      await prisma.mataPelajaran.create({
        data: {
          nama: m.nama,
          nama_arab: m.nama_arab || null,
          kategori: m.kategori,
          kelas_id: kelas7.id,
          is_active: true,
        },
      });
      console.log(`+ Mapel 7 MTs ditambahkan: ${m.nama}`);
    } else {
      await prisma.mataPelajaran.update({
        where: { id: existing.id },
        data: { is_active: true, kategori: m.kategori, nama_arab: m.nama_arab || existing.nama_arab },
      });
    }
  }

  // 4. Sinkronisasi Mapel IL
  for (const m of KURIKULUM_IL) {
    const existing = await prisma.mataPelajaran.findFirst({
      where: { nama: m.nama, kelas_id: kelasIL.id },
    });
    if (!existing) {
      await prisma.mataPelajaran.create({
        data: {
          nama: m.nama,
          nama_arab: m.nama_arab || null,
          kategori: m.kategori,
          kelas_id: kelasIL.id,
          is_active: true,
        },
      });
      console.log(`+ Mapel IL ditambahkan: ${m.nama}`);
    } else {
      await prisma.mataPelajaran.update({
        where: { id: existing.id },
        data: { is_active: true, kategori: m.kategori, nama_arab: m.nama_arab || existing.nama_arab },
      });
    }
  }

  // 5. Bersihkan / nonaktifkan kelas yang belum aktif
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

  const mapel7 = await prisma.mataPelajaran.findMany({ where: { kelas_id: kelas7.id, is_active: true } });
  const mapelIL = await prisma.mataPelajaran.findMany({ where: { kelas_id: kelasIL.id, is_active: true } });

  console.log(`\nTotal Mapel 7 MTs Aktif: ${mapel7.length}`);
  console.log(`Total Mapel IL Aktif: ${mapelIL.length}`);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
