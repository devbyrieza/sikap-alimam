import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    // Find Demo and Zakaria
    const santri = await prisma.santriAktif.findMany({
      where: { 
        OR: [
          { nama_lengkap: { contains: 'Zakaria', mode: 'insensitive' } },
          { nama_lengkap: { contains: 'Demo', mode: 'insensitive' } }
        ]
      }
    });

    if (santri.length === 0) {
      return NextResponse.json({ success: true, logs: ["Tidak ditemukan santri bernama Zakaria atau Demo."] });
    }

    const ids = santri.map(s => s.id);
    logs.push(`Ditemukan ${ids.length} santri: ` + santri.map(s => s.nama_lengkap).join(", "));

    const deletes = [
      prisma.halaqohAnggota.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.nilaiSantri.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.presensiSiswa.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.ujianTahfidz.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.catatanHalaqoh.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.capaianTahfidz.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.orangTuaSantri.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.ibadahAdabSantri.deleteMany({ where: { santri_id: { in: ids } } }),
      prisma.pembayaranSPP.deleteMany({ where: { santri_id: { in: ids } } })
    ];

    const results = await Promise.allSettled(deletes);
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && (r.value as any)?.count > 0) {
        logs.push(`Hapus ${(r.value as any).count} dari tabel urutan ke-${i}`);
      }
    });

    // Finally delete santri
    const dAll = await prisma.santriAktif.deleteMany({ where: { id: { in: ids } } });
    logs.push(`Hapus ${dAll.count} SantriAktif`);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
