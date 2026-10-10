import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    const allKelas = await prisma.kelas.findMany({
      where: { is_active: true }
    });
    
    const kelas11 = allKelas.find(k => k.nama.includes('11') && (k.nama.includes('MA') || k.jenjang?.includes('MA')));
    const kelas12 = allKelas.find(k => k.nama.includes('12') && (k.nama.includes('MA') || k.jenjang?.includes('MA')));
    
    if (!kelas11 || !kelas12) {
      return NextResponse.json({ 
        success: false, 
        logs: ["Kelas MA tidak ditemukan"], 
        available_classes: allKelas.map(k => ({ id: k.id, nama: k.nama, jenjang: k.jenjang }))
      });
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
