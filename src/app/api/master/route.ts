import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [kelas, asatidz, allMapel] = await Promise.all([
      prisma.kelas.findMany({ where: { is_active: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, jenjang: true },
      }),
      prisma.pegawai.findMany({
        where: { kategori_pegawai: { contains: "GURU" } },
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true },
      }),
      prisma.mataPelajaran.findMany({ where: { is_active: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, kelas_id: true },
      }),
    ]);

    // Group mapel by kelas_id
    const mapelByKelas: Record<string, { id: string; nama: string }[]> = {};
    for (const m of allMapel) {
      if (!mapelByKelas[m.kelas_id]) {
        mapelByKelas[m.kelas_id] = [];
      }
      mapelByKelas[m.kelas_id].push({ id: m.id, nama: m.nama });
    }

    return NextResponse.json({ kelas, asatidz, mapel: mapelByKelas });
  } catch (err) {
    console.error("[GET /api/master]", err);
    return NextResponse.json({ error: "Gagal mengambil data master" }, { status: 500 });
  }
}
