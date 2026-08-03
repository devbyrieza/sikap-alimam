import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas } from "@/lib/kelas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rawKelas, rawAsatidz, allMapel] = await Promise.all([
      prisma.kelas.findMany({ 
        where: { is_active: true },
        select: { id: true, nama: true, jenjang: true },
      }),
      prisma.pegawai.findMany({
        where: {
          OR: [
            { kategori_pegawai: { in: ["ASATIDZ", "GURU", "Guru", "asatidz", "guru", "PENGAJAR"] } },
            { kategori_pegawai: { contains: "ASATIDZ", mode: "insensitive" } },
            { kategori_pegawai: { contains: "GURU", mode: "insensitive" } },
            { jabatan: { contains: "Guru", mode: "insensitive" } },
            { jabatan: { contains: "Pengajar", mode: "insensitive" } },
            { jabatan: { contains: "Asatidz", mode: "insensitive" } },
            { jabatan: { contains: "Ustadz", mode: "insensitive" } },
            { mata_pelajaran: { not: null } },
          ],
        },
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true },
      }),
      prisma.mataPelajaran.findMany({ 
        where: { is_active: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, kelas_id: true, kategori: true },
      }),
    ]);

    // Normalisasi kelas (hanya 7 MTs dan IL yang aktif saat ini)
    const seenKelas = new Set<string>();
    const normalizedKelas: { id: string; nama: string; jenjang: string | null }[] = [];

    for (const k of rawKelas) {
      let name = k.nama.trim();
      if (name === "I'dad Lughowy" || name === "I'dad" || name === "Idad Lughowy") {
        name = "IL";
      }
      if (["8 MTs", "9 MTs", "10 MA", "11 MA", "12 MA"].includes(name)) {
        continue;
      }
      if (!seenKelas.has(name)) {
        seenKelas.add(name);
        normalizedKelas.push({ ...k, nama: name });
      }
    }

    if (!seenKelas.has("7 MTs")) {
      normalizedKelas.push({ id: "kelas-7-mts", nama: "7 MTs", jenjang: "MTs" });
    }
    if (!seenKelas.has("IL")) {
      normalizedKelas.push({ id: "kelas-il", nama: "IL", jenjang: "Islamiyah" });
    }

    // Fallback jika belum terfilter spesifik, ambil semua pegawai
    let asatidz = rawAsatidz;
    if (asatidz.length === 0) {
      asatidz = await prisma.pegawai.findMany({
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true },
      });
    }

    const kelas = sortKelas(normalizedKelas);

    // Group mapel by kelas_id
    const mapelByKelas: Record<string, { id: string; nama: string; kategori: string }[]> = {};
    for (const m of allMapel) {
      if (!mapelByKelas[m.kelas_id]) {
        mapelByKelas[m.kelas_id] = [];
      }
      mapelByKelas[m.kelas_id].push({ id: m.id, nama: m.nama, kategori: m.kategori });
    }

    return NextResponse.json({ kelas, asatidz, mapel: mapelByKelas });
  } catch (err) {
    console.error("[GET /api/master]", err);
    return NextResponse.json({ error: "Gagal mengambil data master" }, { status: 500 });
  }
}
