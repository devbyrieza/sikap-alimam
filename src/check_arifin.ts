import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const arifin = await prisma.pegawai.findFirst({
    where: { nama_lengkap: { contains: "Arifin Saefullah", mode: "insensitive" } },
    include: {
      user: true,
      mengajar: {
        include: {
          mapel: true,
          kelas: true
        }
      }
    }
  });

  console.log("=== PEGAWAI ARIFIN SAEFULLAH ===");
  console.log("ID:", arifin?.id);
  console.log("Nama:", arifin?.nama_lengkap);
  console.log("User Role:", arifin?.user?.role);
  console.log("\n=== MENGAJAR (ASATIDZ MAPEL) ===");
  arifin?.mengajar.forEach((am, i) => {
    console.log(`${i + 1}. Mapel: ${am.mapel.nama} | Kelas: ${am.kelas.nama} (ID: ${am.kelas.id}) | Jenjang Kelas: "${am.kelas.jenjang}"`);
  });

  const allKelas = await prisma.kelas.findMany();
  console.log("\n=== ALL KELAS ===");
  allKelas.forEach(k => {
    console.log(`Kelas: ${k.nama} | Jenjang: "${k.jenjang}"`);
  });
}

main().finally(() => prisma.$disconnect());
