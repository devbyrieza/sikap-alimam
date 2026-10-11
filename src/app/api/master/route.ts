import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortKelas, normalizeMasterData } from "@/lib/kelas";

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
        select: { id: true, nama: true, jenjang: true, _count: { select: { santri: true } } } }),
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
          ] },
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true } }),
      prisma.mataPelajaran.findMany({ 
        where: { is_active: true },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, kelas_id: true, kategori: true } }),
      prisma.asatidzmMapel.findMany({
        select: { pegawai_id: true, mapel_id: true, kelas_id: true } }),
    ]);

    let finalAsatidzmMapel = rawAsatidzmMapel;
    let finalAllMapel = allMapel;

    // Auto-sync any teacher who has mata_pelajaran string but 0 asatidzmMapel records in the DB
    const teachersNeedingSync = rawAsatidz.filter(
      (a) => a.mata_pelajaran && a.mata_pelajaran.trim() && !rawAsatidzmMapel.some((am) => am.pegawai_id === a.id)
    );

    if (teachersNeedingSync.length > 0) {
      try {
        const { syncAsatidzMapel } = await import("@/lib/syncAsatidzMapel");
        await Promise.all(teachersNeedingSync.map((t) => syncAsatidzMapel(t.id, t.mata_pelajaran)));
        // Re-fetch updated asatidzmMapel and allMapel
        const [refetchedAm, refetchedMapel] = await Promise.all([
          prisma.asatidzmMapel.findMany({
            select: { pegawai_id: true, mapel_id: true, kelas_id: true }
          }),
          prisma.mataPelajaran.findMany({
            where: { is_active: true },
            orderBy: { nama: "asc" },
            select: { id: true, nama: true, kelas_id: true, kategori: true }
          })
        ]);
        finalAsatidzmMapel = refetchedAm;
        finalAllMapel = refetchedMapel;
      } catch (syncErr) {
        console.warn("Auto-sync missing teacher mapel in master route failed:", syncErr);
      }
    }

    const { kelas, asatidzmMapel, mapelByKelas } = normalizeMasterData(
      rawKelas,
      finalAsatidzmMapel,
      finalAllMapel,
      normalizeMapelName
    );

    // Fallback jika belum terfilter spesifik, ambil semua pegawai
    let asatidz = rawAsatidz;
    if (asatidz.length === 0) {
      asatidz = await prisma.pegawai.findMany({
        orderBy: { nama_lengkap: "asc" },
        select: { id: true, nama_lengkap: true, jabatan: true, mata_pelajaran: true } });
    }

    const formattedAsatidz = asatidz.map(a => ({
      ...a,
      nama_lengkap: formatName(a.nama_lengkap)
    }));

    return NextResponse.json({ 
      kelas, 
      asatidz: formattedAsatidz, 
      mapel: mapelByKelas,
      asatidzmMapel 
    });
  } catch (err) {
    console.error("[GET /api/master]", err);
    return NextResponse.json({ error: "Gagal mengambil data master" }, { status: 500 });
  }
}
