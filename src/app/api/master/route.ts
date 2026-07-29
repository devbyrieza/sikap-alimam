import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [kelas, asatidz, allMapel] = await Promise.all([
      prisma.kelas.findMany({ 
        where: { is_active: true },
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

    // Custom sort for Kelas: 7, 8, 9, IL, 10, 11, 12
    const kelasWeight = (nama: string) => {
      const lower = nama.toLowerCase();
      if (lower.includes("7")) return 1;
      if (lower.includes("8")) return 2;
      if (lower.includes("9")) return 3;
      if (lower.includes("il") || lower.includes("i'dad")) return 4;
      if (lower.includes("10")) return 5;
      if (lower.includes("11")) return 6;
      if (lower.includes("12")) return 7;
      return 99; // others
    };

    kelas.sort((a, b) => kelasWeight(a.nama) - kelasWeight(b.nama));

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
