import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kls = await prisma.kelas.findMany({ where: { nama: { contains: 'IL' } } });
    const santri = await prisma.santriAktif.findMany({
      where: {
        OR: [
          { kelas: { nama: { contains: 'IL' } } },
          { kelas_id: { in: kls.map(k => k.id) } }
        ]
      },
      include: { kelas: true }
    });

    return NextResponse.json({ 
      kelas: kls,
      santriCount: santri.length,
      santri: santri.map(s => ({ id: s.id, nama: s.nama_lengkap, kelas_id: s.kelas_id, kelas_nama: s.kelas?.nama, is_active: s.is_active, status: s.status_kesiswaan }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
