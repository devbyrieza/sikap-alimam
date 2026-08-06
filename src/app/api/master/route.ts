import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas, normalizeKelasList } from "@/lib/kelas";

export const dynamic = "force-dynamic";

const formatName = (str: string) => {
  if (!str) return "-";
  return str.split(' ').map(word => {
    if (word.includes('.')) return word; 
    if (word === word.toUpperCase() || word === word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  }).join(' ');
};

const normalizeMapelName = (name: string) => {
  let normalized = name.replace(/^\[.*?\]\s*/, ""); // Hapus awalan seperti "[7 MTs] "
  if (normalized === "Tahsin/Tahfidz Al-Quran") {
    normalized = "Tahsin Al-Qur'an";
  }
  return normalized;
};

export async function GET() {
  try {
    const [rawKelas, rawAsatidz, allMapel, rawAsatidzmMapel] = await Promise.all([
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
      prisma.asatidzmMapel.findMany({
        select: { pegawai_id: true, mapel_id: true, kelas_id: true },
      }),
    ]);

    const normalizedKelas = normalizeKelasList(rawKelas);

    // Fallback jika belum terfilter spesifik, ambil semua pegawai
    let asatidz = rawAsatidz;
    if (asatidz.length === 0) {
      asatidz = await prisma.pegawai.findMany({
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true },
      });
    }

    const formattedAsatidz = asatidz.map(a => ({
      ...a,
      nama_lengkap: formatName(a.nama_lengkap)
    }));

    const kelas = sortKelas(normalizedKelas);

    // Group mapel by kelas_id
    const mapelByKelas: Record<string, { id: string; nama: string; kategori: string }[]> = {};
    for (const m of allMapel) {
      if (!mapelByKelas[m.kelas_id]) {
        mapelByKelas[m.kelas_id] = [];
      }
      mapelByKelas[m.kelas_id].push({ 
        id: m.id, 
        nama: normalizeMapelName(m.nama), 
        kategori: m.kategori 
      });
    }

    return NextResponse.json({ 
      kelas, 
      asatidz: formattedAsatidz, 
      mapel: mapelByKelas,
      asatidzmMapel: rawAsatidzmMapel 
    });
  } catch (err) {
    console.error("[GET /api/master]", err);
    return NextResponse.json({ error: "Gagal mengambil data master" }, { status: 500 });
  }
}
