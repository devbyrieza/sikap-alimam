import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const santri = await prisma.santriAktif.findMany({
      select: {
        id: true,
        nis: true,
        nama_lengkap: true,
        tanggal_lahir: true,
        kelas: { select: { nama: true } }
      },
      orderBy: [
        { kelas: { nama: 'asc' } },
        { nama_lengkap: 'asc' }
      ]
    });
    return NextResponse.json(santri);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, nis, tanggal_lahir } = await req.json();
    
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    let tglLahirVal = null;
    if (tanggal_lahir) {
      tglLahirVal = new Date(tanggal_lahir);
      tglLahirVal.setHours(12, 0, 0, 0); // avoid timezone issues
    }

    const updated = await prisma.santriAktif.update({
      where: { id },
      data: {
        nis: nis || null,
        tanggal_lahir: tglLahirVal
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "NIS sudah dipakai oleh santri lain." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
