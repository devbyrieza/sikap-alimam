import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kls = await prisma.kelas.findFirst({ where: { jenjang: 'IL' } });
    if (!kls) return NextResponse.json({ error: "Kelas IL not found" });

    const santri = await prisma.santriAktif.findMany({ where: { kelas_id: kls.id } });
    
    // Group by status
    const stats = {
      total: santri.length,
      is_active_true: santri.filter(s => s.is_active).length,
      is_active_false: santri.filter(s => !s.is_active).length,
      status_aktif: santri.filter(s => s.status_kesiswaan === 'aktif').length,
      status_keluar: santri.filter(s => s.status_kesiswaan !== 'aktif').length,
    };

    return NextResponse.json({ 
      kelas: kls.nama,
      stats,
      sample: santri.slice(0, 5)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
