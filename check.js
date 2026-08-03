const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ 
  datasources: { 
    db: { url: 'postgresql://postgres:nhzYTBmfqk8RUhOoYHmvkbzoN2OhN@127.0.0.1:5433/ppdb_alimam' } 
  } 
});

async function main() {
  const asatidz = await prisma.pegawai.findMany({
    where: {
      OR: [
        { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
        { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
        { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
        { jabatan: { contains: "Guru", mode: "insensitive" } },
        { jabatan: { contains: "Pengajar", mode: "insensitive" } },
        { jabatan: { contains: "Asatidz", mode: "insensitive" } },
        { jabatan: { contains: "Ustadz", mode: "insensitive" } },
        { mata_pelajaran: { not: null, not: "" } }, // FIXED THIS LINE
      ],
    },
    orderBy: { nama_lengkap: "asc" },
    select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true, kategori_pegawai: true },
  });
  console.log(`Found ${asatidz.length} asatidz using FIXED logic.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
