import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    // Cari semua kelas kosong
    const allKelas = await prisma.kelas.findMany({
      include: { santri: { select: { id: true } } }
    });

    for (const k of allKelas) {
      if (k.santri.length === 0) {
        // Hanya hapus jika namanya adalah hasil duplikasi salah
        if (["11 MA", "12 MA", "I'dad Lughowy", "IL (I'dad Lughowy)"].includes(k.nama)) {
          await prisma.kelas.delete({ where: { id: k.id } });
          logs.push(`🗑️ Kelas duplikat kosong dihapus: ${k.nama} (ID: ${k.id})`);
        }
      }
    }

    if (logs.length === 0) {
      logs.push("Tidak ada kelas duplikat kosong yang perlu dihapus.");
    }

    return NextResponse.json({ success: true, message: "Pembersihan Kelas Duplikat Berhasil", logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
