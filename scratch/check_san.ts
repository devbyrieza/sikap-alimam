import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sanSantri = await prisma.santriAktif.findMany({
    where: {
      nis: {
        startsWith: "SAN"
      }
    },
    include: {
      kelas: true
    }
  });

  console.log(`Found ${sanSantri.length} santri with NIS starting with SAN`);
  for (const s of sanSantri) {
    console.log(`- ID: ${s.id} | ${s.nama_lengkap} (NIS: ${s.nis}) -> Kelas: ${s.kelas?.nama} (${s.kelas?.jenjang})`);
  }
}

main().finally(() => prisma.$disconnect());
