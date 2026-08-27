import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const results: string[] = [];

    // Helper function for merging
    const mergeMapel = async (wrongName: string, correctName: string) => {
      const wrongList = await prisma.mataPelajaran.findMany({ where: { nama: wrongName } });
      let merged = 0;
      let deleted = 0;
      
      for (const wrong of wrongList) {
        // Find if correct one exists in the same kelas
        let correct = await prisma.mataPelajaran.findFirst({
          where: { nama: correctName, kelas_id: wrong.kelas_id }
        });
        
        if (!correct) {
          // Just rename it if correct one doesn't exist
          await prisma.mataPelajaran.update({
            where: { id: wrong.id },
            data: { nama: correctName }
          });
          merged++;
        } else {
          // Correct one exists, move all relations
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
      return { merged, deleted };
    };

    // 1. Merge Siroh Nabi -> Siroh
    const sirohRes = await mergeMapel("Siroh Nabi", "Siroh");
    results.push(`Siroh Nabi: Direname ${sirohRes.merged}, Dihapus(Merge) ${sirohRes.deleted}`);

    // 2. Merge Ushul Fiqh -> Fiqh
    const ushulRes = await mergeMapel("Ushul Fiqh", "Fiqh");
    results.push(`Ushul Fiqh: Direname ${ushulRes.merged}, Dihapus(Merge) ${ushulRes.deleted}`);

    // 3. Merge Tahsin Al-Quran -> Tahsin Al-Qur'an (Standard Raport)
    const tahsinRes = await mergeMapel("Tahsin Al-Quran", "Tahsin Al-Qur'an");
    results.push(`Tahsin Al-Quran: Direname ${tahsinRes.merged}, Dihapus(Merge) ${tahsinRes.deleted}`);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}