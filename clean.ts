import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mergeMapel = async (wrongName: string, correctName: string) => {
    const wrongList = await prisma.mataPelajaran.findMany({ where: { nama: wrongName } });
    let merged = 0;
    let deleted = 0;
    
    for (const wrong of wrongList) {
      let correct = await prisma.mataPelajaran.findFirst({
        where: { nama: correctName, kelas_id: wrong.kelas_id }
      });
      
      if (!correct) {
        await prisma.mataPelajaran.update({
          where: { id: wrong.id },
          data: { nama: correctName }
        });
        merged++;
      } else {
        const asatidz = await prisma.asatidzmMapel.findMany({ where: { mapel_id: wrong.id } });
        for (const a of asatidz) {
          await prisma.asatidzmMapel.upsert({
            where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: a.pegawai_id, mapel_id: correct.id, kelas_id: a.kelas_id } },
            update: {},
            create: { pegawai_id: a.pegawai_id, mapel_id: correct.id, kelas_id: a.kelas_id }
          });
        }
        await prisma.asatidzmMapel.deleteMany({ where: { mapel_id: wrong.id } });
        await prisma.jurnalMengajar.updateMany({ where: { mapel_id: wrong.id }, data: { mapel_id: correct.id } });
        await prisma.nilaiSantri.updateMany({ where: { mapel_id: wrong.id }, data: { mapel_id: correct.id } });
        await prisma.jadwalPelajaran.updateMany({ where: { mapel_id: wrong.id }, data: { mapel_id: correct.id } });
        await prisma.presensiSiswa.updateMany({ where: { mapel_id: wrong.id }, data: { mapel_id: correct.id } });
        
        await prisma.mataPelajaran.delete({ where: { id: wrong.id } });
        deleted++;
      }
    }
    console.log(`${wrongName} -> ${correctName}: Renamed ${merged}, Merged ${deleted}`);
  };

  await mergeMapel("Siroh Nabi", "Siroh");
  await mergeMapel("Ushul Fiqh", "Fiqh");
  await mergeMapel("Tahsin Al-Quran", "Tahsin Al-Qur'an");
  
  console.log("Cleanup Complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());