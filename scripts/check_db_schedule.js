const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchedule() {
  console.log("=== CHECK PEGAWAI FOR ARIFIN SAEFULLAH ===");
  const arifin = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: "Arifin", mode: "insensitive" } }
  });
  console.log("Pegawai Arifin:", arifin);

  console.log("\n=== ALL JADWAL PELAJARAN IN DB ===");
  const allJadwal = await prisma.jadwalPelajaran.findMany({
    include: {
      pegawai: { select: { nama_lengkap: true } },
      kelas: { select: { nama: true } },
      mapel: { select: { nama: true } }
    }
  });
  console.log(`Total Jadwal in DB: ${allJadwal.length}`);
  console.log(allJadwal);
}

checkSchedule()
  .then(() => prisma.$disconnect())
  .catch(console.error);
