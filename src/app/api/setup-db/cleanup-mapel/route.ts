import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const results: string[] = [];
    const allMapels = await prisma.mataPelajaran.findMany();
    
    // First, let's clean up and standardize all names in memory
    const updates = [];
    for (const m of allMapels) {
      let newName = m.nama;
      
      // 1. Remove bracketed prefixes like "[7 MTs] " or "[11 MA]"
      newName = newName.replace(/^\[.*?\]\s*/, '').trim();
      
      // 2. Standardize names based on user rules
      if (newName === "Siroh Nabi") newName = "Siroh";
      if (newName === "Ushul Fiqh") newName = "Fiqh";
      
      // Standardize Tahsin variations
      if (newName.toLowerCase().includes("tahsin") || newName.toLowerCase().includes("tahfiz")) {
        newName = "Tahsin Al-Qur'an";
      }

      if (newName !== m.nama) {
        updates.push({ id: m.id, oldName: m.nama, newName, kelas_id: m.kelas_id });
      }
    }

    results.push(`Ditemukan ${updates.length} mapel yang perlu dibersihkan/distandardisasi namanya.`);

    // Process the updates (with Merge Logic if duplicate occurs)
    let renamed = 0;
    let merged = 0;

    for (const u of updates) {
      // Check if the target correct name already exists in this same class
      const existingCorrect = await prisma.mataPelajaran.findFirst({
        where: { nama: u.newName, kelas_id: u.kelas_id, id: { not: u.id } }
      });

      if (!existingCorrect) {
        // Safe to just rename
        await prisma.mataPelajaran.update({ where: { id: u.id }, data: { nama: u.newName } });
        renamed++;
      } else {
        // Target already exists, we must MERGE this wrong mapel into the existing correct one
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