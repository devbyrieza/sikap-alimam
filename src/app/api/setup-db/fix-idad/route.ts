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

      // Lakukan pemusnahan mutlak berdasarkan kelas_id untuk semua tabel anak
      
      const p1 = await prisma.nilaiSantri.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p1.count} NilaiSantri sisa.`);

      const p2 = await prisma.presensiSiswa.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p2.count} PresensiSiswa sisa.`);

      const p3 = await prisma.jadwalPelajaran.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p3.count} JadwalPelajaran sisa.`);

      const p4 = await prisma.jurnalMengajar.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p4.count} JurnalMengajar sisa.`);

      const p5 = await prisma.asatidzmMapel.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p5.count} AsatidzmMapel sisa.`);

      const p6 = await prisma.mataPelajaran.deleteMany({ where: { kelas_id: classIdad.id } });
      logs.push(`Menghapus ${p6.count} MataPelajaran duplikat.`);

      // Hapus Kelas
      await prisma.kelas.delete({ where: { id: classIdad.id } });
      logs.push("🗑️ Kelas I'dad Lughowy berhasil dihapus sepenuhnya.");
    } else {
      logs.push("Kelas I'dad Lughowy sudah tidak ditemukan (mungkin sudah terhapus).");
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
