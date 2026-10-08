import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    // 1. Find both classes
    const classIL = await prisma.kelas.findFirst({ where: { nama: 'IL' } });
    const classIdad = await prisma.kelas.findFirst({ where: { nama: "I'dad Lughowy" } });

    if (!classIL) {
      return NextResponse.json({ success: false, error: "Kelas 'IL' tidak ditemukan" });
    }

    if (classIdad) {
      // Pindahkan Santri
      const updateSantri = await prisma.santriAktif.updateMany({
        where: { kelas_id: classIdad.id },
        data: { kelas_id: classIL.id }
      });
      logs.push(`Memindahkan ${updateSantri.count} santri ke IL.`);

      // Hapus dependensi
      const mapels = await prisma.mataPelajaran.findMany({ where: { kelas_id: classIdad.id } });
      const mapelIds = mapels.map(m => m.id);

      if (mapelIds.length > 0) {
        const delNilai = await prisma.nilaiSantri.deleteMany({ where: { mapel_id: { in: mapelIds } } });
        logs.push(`Menghapus ${delNilai.count} NilaiSantri duplikat.`);

        const delPresensi = await prisma.presensiSiswa.deleteMany({ where: { mapel_id: { in: mapelIds } } });
        logs.push(`Menghapus ${delPresensi.count} PresensiSiswa duplikat.`);

        const delJadwal = await prisma.jadwalPelajaran.deleteMany({ where: { mapel_id: { in: mapelIds } } });
        logs.push(`Menghapus ${delJadwal.count} JadwalPelajaran duplikat.`);

        const delJurnal = await prisma.jurnalMengajar.deleteMany({ where: { mapel_id: { in: mapelIds } } });
        logs.push(`Menghapus ${delJurnal.count} JurnalMengajar lintas kelas.`);

        const delMapelAssign = await prisma.asatidzmMapel.deleteMany({ where: { mapel_id: { in: mapelIds } } });
        logs.push(`Menghapus ${delMapelAssign.count} AsatidzmMapel lintas kelas.`);
      }

      const deleteJurnalSelf = await prisma.jurnalMengajar.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${deleteJurnalSelf.count} jurnal sisa.`);

      const deleteMapelAssignSelf = await prisma.asatidzmMapel.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${deleteMapelAssignSelf.count} mapping sisa.`);

      const deleteMataPelajaran = await prisma.mataPelajaran.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${deleteMataPelajaran.count} mata pelajaran duplikat.`);

      // Hapus Kelas
      await prisma.kelas.delete({ where: { id: classIdad.id } });
      logs.push("🗑️ Kelas I'dad Lughowy berhasil dihapus.");
    } else {
      logs.push("Kelas I'dad Lughowy sudah tidak ditemukan (mungkin sudah terhapus).");
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
