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

      // Hapus AsatidzMapel yang nyangkut di kelas duplikat
      const deleteMapel = await prisma.asatidzmMapel.deleteMany({
        where: { kelas_id: classIdad.id }
      });
      logs.push(`Menghapus ${deleteMapel.count} mapping guru duplikat di I'dad Lughowy.`);

      // Hapus Jurnal yang nyangkut di kelas duplikat
      const deleteJurnal = await prisma.jurnalMengajar.deleteMany({
        where: { kelas_id: classIdad.id }
      });
      logs.push(`Menghapus ${deleteJurnal.count} jurnal duplikat di I'dad Lughowy.`);

      // Hapus MataPelajaran yang nyangkut di kelas duplikat
      const deleteMataPelajaran = await prisma.mataPelajaran.deleteMany({
        where: { kelas_id: classIdad.id }
      });
      logs.push(`Menghapus ${deleteMataPelajaran.count} mata pelajaran duplikat di I'dad Lughowy.`);

      // Hapus Kelas
      await prisma.kelas.delete({ where: { id: classIdad.id } });
      logs.push("🗑️ Kelas I'dad Lughowy berhasil dihapus.");
    } else {
      logs.push("Kelas I'dad Lughowy tidak ditemukan di database.");
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
