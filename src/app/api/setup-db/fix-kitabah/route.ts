import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Temukan Ust. Agus Cahyono
    const agus = await prisma.pegawai.findFirst({
      where: {
        nama_lengkap: { contains: "Agus Cahyono", mode: "insensitive" }
      }
    });

    if (agus) {
      const oldStr = agus.mata_pelajaran || "";
      const newStr = oldStr.replace(/khitobah/gi, "Kitabah");

      await prisma.pegawai.update({
        where: { id: agus.id },
        data: { mata_pelajaran: newStr }
      });
      logs.push(`Updated Ust. Agus Cahyono mata_pelajaran: "${oldStr}" -> "${newStr}"`);

      // Relink asatidz_mapel via syncAsatidzMapel
      await syncAsatidzMapel(agus.id, newStr);
      logs.push(`Synced asatidz mapel for Ust. Agus Cahyono.`);
    } else {
      logs.push(`Ust. Agus Cahyono not found!`);
    }

    // 2. Bersihkan mapel "Khitobah" yang kosong (0 nilai, 0 jurnal, 0 jadwal)
    const khitobahList = await prisma.mataPelajaran.findMany({
      where: {
        nama: { equals: "Khitobah", mode: "insensitive" }
      },
      include: {
        kelas: true,
        _count: {
          select: { nilai: true, jurnal: true, jadwal: true }
        }
      }
    });

    let deletedKhitobahCount = 0;
    for (const kh of khitobahList) {
      if (kh._count.nilai === 0 && kh._count.jurnal === 0) {
        // Hapus penugasan asatidz terkait jika ada
        await prisma.asatidzmMapel.deleteMany({
          where: { mapel_id: kh.id }
        });
        // Hapus mapel Khitobah kosong
        await prisma.mataPelajaran.delete({
          where: { id: kh.id }
        });
        logs.push(`Deleted empty Khitobah from kelas ${kh.kelas?.nama || kh.kelas_id}`);
        deletedKhitobahCount++;
      } else {
        logs.push(`Khitobah in kelas ${kh.kelas?.nama} has ${kh._count.nilai} nilai, not deleted.`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedKhitobahCount,
      logs
    });
  } catch (error: any) {
    console.error("Fix kitabah error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
