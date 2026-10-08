import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    // 1. Dapatkan Kelas 11 MA dan 12 MA
    const kelas11 = await prisma.kelas.findFirst({ where: { nama: '11', jenjang: 'MA' } });
    const kelas12 = await prisma.kelas.findFirst({ where: { nama: '12', jenjang: 'MA' } });
    
    if (!kelas11 || !kelas12) {
      throw new Error("Kelas 11 MA atau 12 MA tidak ditemukan di database!");
    }

    const mapping = [
      { mapel: "B. Arab", guru: "Agus Cahyono" },
      { mapel: "Adab", guru: "Agus Cahyono" },
      { mapel: "Tauhid", guru: "Agus Cahyono" },
      { mapel: "B. Indonesia", guru: "Ade Supiana" },
      { mapel: "MTK", guru: "Adinda Aisyah" },
      { mapel: "B. Inggris", guru: "Adinda Aisyah" },
      { mapel: "Tafsir", guru: "Azzam" },
      { mapel: "Nahwu", guru: "Azzam" },
      { mapel: "Hadis", guru: "Wahyudi Pranata" },
      { mapel: "Siroh", guru: "Muhammad Thoriq" },
      { mapel: "Ushul Fiqih", guru: "Muhammad Thoriq" },
      { mapel: "Tahfidz", guru: "Zeidhan" }
    ];

    for (const item of mapping) {
      // Find or create Mapel
      let mapel = await prisma.mataPelajaran.findFirst({ 
        where: { nama: { contains: item.mapel, mode: 'insensitive' } } 
      });
      if (!mapel) {
        mapel = await prisma.mataPelajaran.create({
          data: { nama: item.mapel, is_active: true }
        });
        logs.push(`Mata Pelajaran dibuat: ${item.mapel}`);
      }

      // Find Guru
      const guru = await prisma.pegawai.findFirst({
        where: { nama_lengkap: { contains: item.guru, mode: 'insensitive' } }
      });

      if (!guru) {
        logs.push(`⚠️ GAGAL: Guru tidak ditemukan untuk pencarian "${item.guru}"`);
        continue;
      }

      // Assign to Kelas 11
      await prisma.asatidzmMapel.upsert({
        where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: kelas11.id } },
        update: {},
        create: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: kelas11.id }
      });

      // Assign to Kelas 12
      await prisma.asatidzmMapel.upsert({
        where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: kelas12.id } },
        update: {},
        create: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: kelas12.id }
      });

      logs.push(`✅ Sukses: ${item.mapel} -> ${guru.nama_lengkap}`);
    }

    return NextResponse.json({ success: true, message: "Sinkronisasi Distribusi Mapel MA Berhasil", logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
