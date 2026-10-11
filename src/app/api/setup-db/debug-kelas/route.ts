import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const kelas = await prisma.kelas.findMany({
    include: {
      santri: { select: { id: true } }
    }
  });
  return NextResponse.json({ 
    kelas: kelas.map(k => ({ id: k.id, nama: k.nama, jenjang: k.jenjang, is_active: k.is_active, santri_count: k.santri.length })) 
  });
}
