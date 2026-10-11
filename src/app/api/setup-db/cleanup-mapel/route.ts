import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const results: string[] = [];
    const allMapels = await prisma.mataPelajaran.findMany({
      include: { kelas: true }
    });
    
    // Standardize all names in memory
    const updates = [];
    for (const m of allMapels) {
      let newName = m.nama;
      const isMA = m.kelas && (
        m.kelas.jenjang === "MA" || 
        m.kelas.nama.toUpperCase().includes("MA") || 
        m.kelas.nama.startsWith("11") || 
        m.kelas.nama.startsWith("12")
      );
      
      // 1. Remove bracketed prefixes like "[7 MTs] " or "[11 MA]"
      newName = newName.replace(/^\[.*?\]\s*/, '').trim();
      
      // 2. Standardize abbreviations to official full terms
      if (newName === "B. Indonesia" || newName === "b.indonesia") newName = "Bahasa Indonesia";
      if (newName === "B. Arab" || newName === "b.arab") newName = "Bahasa Arab";
      if (newName === "B. Inggris" || newName === "b.inggris") newName = "Bahasa Inggris";
      if (newName === "MTK" || newName === "mtk") newName = "Matematika";
      
      // 3. Standardize Islamic terms to official KBBI/Kemenag terms
      if (newName.toLowerCase() === "aqidah") newName = "Akidah";
      if (newName.toLowerCase() === "hadits") newName = "Hadis";
      if (newName.toLowerCase() === "siroh" || newName.toLowerCase() === "siroh nabi") newName = "Sirah";
      if (newName.toLowerCase() === "akhlaq") newName = "Akhlak";

      // 4. Fikih & Ushul Fikih
      if (isMA) {
        if (["fiqh", "fiqih", "fikih", "ushul fiqh", "ushul fiqih"].includes(newName.toLowerCase())) {
          newName = "Ushul Fikih";
        }
      } else {
        if (["fiqh", "fiqih"].includes(newName.toLowerCase())) {
          newName = "Fikih";
        }
      }
      
      // 5. Standardize Tahsin & Tahfidz
      if (newName.toLowerCase().includes("tahsin")) {
        newName = "Tahsin";
      } else if (newName.toLowerCase().includes("tahfidz") || newName.toLowerCase().includes("tahfiz")) {
        newName = "Tahfidz";
      }

      if (newName !== m.nama) {
        updates.push({ id: m.id, oldName: m.nama, newName, kelas_id: m.kelas_id });
      }
    }

    results.push(`Ditemukan ${updates.length} mapel yang perlu dibersihkan/distandardisasi ke bahasa baku.`);

    // Process updates with merge logic
    let renamed = 0;
    let merged = 0;

    for (const u of updates) {
      const existingCorrect = await prisma.mataPelajaran.findFirst({
        where: { nama: u.newName, kelas_id: u.kelas_id, id: { not: u.id } }
      });

      if (!existingCorrect) {
        await prisma.mataPelajaran.update({ where: { id: u.id }, data: { nama: u.newName } });
        renamed++;
      } else {
        const wrongId = u.id;
        const correctId = existingCorrect.id;

        const asatidz = await prisma.asatidzmMapel.findMany({ where: { mapel_id: wrongId } });
        for (const a of asatidz) {
          await prisma.asatidzmMapel.upsert({
            where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: a.pegawai_id, mapel_id: correctId, kelas_id: a.kelas_id } },
            update: {},
            create: { pegawai_id: a.pegawai_id, mapel_id: correctId, kelas_id: a.kelas_id }
          });
        }
        await prisma.asatidzmMapel.deleteMany({ where: { mapel_id: wrongId } });
        await prisma.jurnalMengajar.updateMany({ where: { mapel_id: wrongId }, data: { mapel_id: correctId } });
        await prisma.nilaiSantri.updateMany({ where: { mapel_id: wrongId }, data: { mapel_id: correctId } });
        await prisma.jadwalPelajaran.updateMany({ where: { mapel_id: wrongId }, data: { mapel_id: correctId } });
        await prisma.presensiSiswa.updateMany({ where: { mapel_id: wrongId }, data: { mapel_id: correctId } });
        
        await prisma.mataPelajaran.delete({ where: { id: wrongId } });
        merged++;
      }
    }

    results.push(`✅ BERHASIL DI-RENAME: ${renamed} mapel`);
    results.push(`✅ BERHASIL DI-MERGE & DIHAPUS: ${merged} mapel duplikat`);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}