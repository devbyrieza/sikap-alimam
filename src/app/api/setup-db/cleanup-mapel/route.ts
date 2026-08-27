import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const results: string[] = [];
    const allMapels = await prisma.mataPelajaran.findMany();
    
    // Find exact names in DB
    const nabi = allMapels.filter(m => m.nama.includes("Nabi") || m.nama.includes("Siroh"));
    const fiqh = allMapels.filter(m => m.nama.includes("Fiqh"));
    const tahsin = allMapels.filter(m => m.nama.toLowerCase().includes("tahsin"));

    results.push(`MAPEL DITEMUKAN DI DB:`);
    results.push(`- SIROH VARIANTS: ${nabi.map(n => "'" + n.nama + "'").join(', ')}`);
    results.push(`- FIQH VARIANTS: ${fiqh.map(n => "'" + n.nama + "'").join(', ')}`);
    results.push(`- TAHSIN VARIANTS: ${tahsin.map(n => "'" + n.nama + "'").join(', ')}`);

    const mergeMapel = async (wrongName: string, correctName: string) => {
      const wrongList = await prisma.mataPelajaran.findMany({ where: { nama: wrongName } });
      let merged = 0;
      let deleted = 0;
      
      for (const wrong of wrongList) {
        let correct = await prisma.mataPelajaran.findFirst({
          where: { nama: correctName, kelas_id: wrong.kelas_id }
        });
        
        if (!correct) {
          await prisma.mataPelajaran.update({ where: { id: wrong.id }, data: { nama: correctName } });
          merged++;
        } else {
          // Merge
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

    // Trim all mapels first!
    let trimmedCount = 0;
    for (const m of allMapels) {
      if (m.nama !== m.nama.trim()) {
        await prisma.mataPelajaran.update({ where: { id: m.id }, data: { nama: m.nama.trim() } });
        trimmedCount++;
      }
    }
    results.push(`Berhasil me-trim spasi kosong pada ${trimmedCount} mapel`);

    const sirohRes = await mergeMapel("Siroh Nabi", "Siroh");
    results.push(`Siroh Nabi: Direname ${sirohRes.merged}, Dihapus(Merge) ${sirohRes.deleted}`);
    const ushulRes = await mergeMapel("Ushul Fiqh", "Fiqh");
    results.push(`Ushul Fiqh: Direname ${ushulRes.merged}, Dihapus(Merge) ${ushulRes.deleted}`);
    const tahsinRes = await mergeMapel("Tahsin Al-Quran", "Tahsin Al-Qur'an");
    results.push(`Tahsin Al-Quran: Direname ${tahsinRes.merged}, Dihapus(Merge) ${tahsinRes.deleted}`);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}