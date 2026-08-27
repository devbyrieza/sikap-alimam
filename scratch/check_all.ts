import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const allSantri = await prisma.santriAktif.findMany({
    include: {
      kelas: true
    }
  });

  console.log(`Total santri: ${allSantri.length}`);
  
  const sanSantri = allSantri.filter(s => (s.nis || "").toUpperCase().includes("SAN"));
  console.log(`Found ${sanSantri.length} santri with NIS containing SAN`);
  for (const s of sanSantri) {
    console.log(`- ID: ${s.id} | ${s.nama_lengkap} (NIS: ${s.nis}) -> Kelas: ${s.kelas?.nama} (${s.kelas?.jenjang})`);
  }
}

main().finally(() => prisma.$disconnect());
