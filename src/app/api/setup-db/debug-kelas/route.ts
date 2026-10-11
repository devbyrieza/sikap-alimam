import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const kelas7 = await prisma.kelas.findFirst({
    where: { nama: "7 MTs" }
  });

  if (!kelas7) return NextResponse.json({ error: "7 MTs not found" });

  const santriList = await prisma.santriAktif.findMany({
    where: { kelas_id: kelas7.id, is_active: true },
    select: { id: true, nama_lengkap: true }
  });

  const allNilai = await prisma.nilaiSantri.findMany({
    where: {
      santri: { kelas_id: kelas7.id },
      tahun_ajaran: "2026/2027"
    },
    include: { mapel: true }
  });

  // Unique mapels
  const mapelMap = new Map<string, any>();
  allNilai.forEach(n => {
    if (!mapelMap.has(n.mapel_id)) mapelMap.set(n.mapel_id, n.mapel);
  });
  const mapels = Array.from(mapelMap.values());

  // MURNI PTS LOGIC (same as Rekap Nilai):
  const getPtsVal = (sId: string, mId: string) => {
    const vals = allNilai.filter(n => n.santri_id === sId && n.mapel_id === mId);
    if (vals.length === 0) return null;
    const pts = vals.find(v => v.jenis === "pts");
    if (pts) return Number(pts.nilai);
    const ujian = vals.find(v => v.jenis === "ujian");
    if (ujian) return Number(ujian.nilai);
    return null;
  };

  const ptsRankings = santriList.map(s => {
    let total = 0;
    let count = 0;
    mapels.forEach(m => {
      const v = getPtsVal(s.id, m.id);
      if (v !== null) {
        total += v;
        count++;
      }
    });
    return {
      id: s.id,
      nama: s.nama_lengkap,
      total,
      avg: count > 0 ? Math.round((total / count) * 10) / 10 : 0
    };
  }).sort((a, b) => b.total - a.total);

  ptsRankings.forEach((s: any, idx) => s.rank = idx + 1);

  // CURRENT RAPOR CETAK LOGIC:
  const deduplicatedNilai = new Map<string, any>();
  allNilai.forEach(n => {
    const key = `${n.santri_id}_${n.mapel_id}`;
    if (!deduplicatedNilai.has(key)) {
      deduplicatedNilai.set(key, { ...n, sum: n.nilai, count: 1 });
    } else {
      const existing = deduplicatedNilai.get(key);
      existing.sum += n.nilai;
      existing.count += 1;
      existing.nilai = Math.round(existing.sum / existing.count);
    }
  });

  const raporTotalsMap = new Map<string, number>();
  santriList.forEach(s => raporTotalsMap.set(s.id, 0));
  Array.from(deduplicatedNilai.values()).forEach(n => {
    if (raporTotalsMap.has(n.santri_id)) {
      raporTotalsMap.set(n.santri_id, raporTotalsMap.get(n.santri_id)! + n.nilai);
    }
  });

  const currentRaporRankings = santriList.map(s => ({
    id: s.id,
    nama: s.nama_lengkap,
    total: raporTotalsMap.get(s.id) || 0
  })).sort((a, b) => b.total - a.total);

  currentRaporRankings.forEach((s: any, idx) => s.rank = idx + 1);

  return NextResponse.json({
    ptsRankings: ptsRankings.slice(0, 10),
    currentRaporRankings: currentRaporRankings.slice(0, 10)
  });
}
