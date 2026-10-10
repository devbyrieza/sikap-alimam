import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    const kelas11 = await prisma.kelas.findFirst({ where: { nama: '11 MA' } });
    const kelas12 = await prisma.kelas.findFirst({ where: { nama: '12 MA' } });
    
    if (!kelas11 || !kelas12) {
      return NextResponse.json({ success: false, logs: ["Kelas MA tidak ditemukan"] });
    }
    
    const mapelsToInsert = [
      { nama: 'Matematika', kkm: 75 },
      { nama: 'Bahasa Inggris', kkm: 75 }
    ];
    
    for (const kelas of [kelas11, kelas12]) {
      for (const mapel of mapelsToInsert) {
        const exists = await prisma.mataPelajaran.findFirst({
          where: { nama: mapel.nama, kelas_id: kelas.id }
        });
        if (!exists) {
          await prisma.mataPelajaran.create({
            data: {
              nama: mapel.nama,
              kelas_id: kelas.id,
              is_active: true
            }
          });
          logs.push(`Added ${mapel.nama} to ${kelas.nama}`);
        } else {
          logs.push(`${mapel.nama} already exists in ${kelas.nama}`);
        }
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
