import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const ilClass = await prisma.kelas.findFirst({
    where: {
      OR: [
        { nama: "IL" },
        { jenjang: "IL" },
        { nama: { contains: "I'dad", mode: "insensitive" } }
      ]
    }
  });

  if (!ilClass) return NextResponse.json({ error: "IL not found" });

  const santriList = await prisma.santriAktif.findMany({
    where: { kelas_id: ilClass.id, is_active: true },
    select: { id: true, nama_lengkap: true }
  });

  const allNilai = await prisma.nilaiSantri.findMany({
    where: {
      santri: { kelas_id: ilClass.id },
      semester: "1",
      tahun_ajaran: "2026/2027"
    },
    include: { mapel: true }
  });

  // 1. REKAP CALCULATION LOGIC:
  // Mapel unik
  const mapelMap = new Map<string, any>();
  allNilai.forEach(n => {
    if (!mapelMap.has(n.mapel.id)) mapelMap.set(n.mapel.id, n.mapel);
  });
  const mapelList = Array.from(mapelMap.values());

  const getRekapVal = (santri_id: string, mId: string) => {
    const vals = allNilai.filter(n => n.santri_id === santri_id && n.mapel_id === mId);
    if (vals.length === 0) return null;
    const pts = vals.find(v => v.jenis === "pts");
    if (pts) return Number(pts.nilai);
    const ujian = vals.find(v => v.jenis === "ujian");
    if (ujian) return Number(ujian.nilai);
    return null;
  };

  const rekapTotals = santriList.map(s => {
    let total = 0;
    let count = 0;
    mapelList.forEach(m => {
      const val = getRekapVal(s.id, m.id);
      if (val !== null) {
        total += val;
        count++;
      }
    });
    return {
      id: s.id,
      nama: s.nama_lengkap,
      total,
      average: count > 0 ? Math.round((total / count) * 10) / 10 : 0
    };
  }).sort((a, b) => b.total - a.total);

  rekapTotals.forEach((s: any, idx) => {
    s.rank = idx + 1;
  });

  // 2. RAPOR CETAK CURRENT CALCULATION LOGIC:
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

  const raporTotals = santriList.map(s => {
    const total = raporTotalsMap.get(s.id) || 0;
    return {
      id: s.id,
      nama: s.nama_lengkap,
      total
    };
  }).sort((a, b) => b.total - a.total);

  raporTotals.forEach((s: any, idx) => {
    s.rank = idx + 1;
  });

  // Detail Rifqi Arsyad
  const rifqi = santriList.find(s => s.nama_lengkap.toLowerCase().includes("rifqi arsyad"));
  const rifqiNilai = rifqi ? allNilai.filter(n => n.santri_id === rifqi.id).map(n => ({
    mapel: n.mapel.nama,
    jenis: n.jenis,
    nilai: n.nilai
  })) : [];

  return NextResponse.json({
    rekapTop5: rekapTotals.slice(0, 5),
    raporTop5: raporTotals.slice(0, 5),
    rifqiDetail: {
      rekap: rekapTotals.find(s => s.id === rifqi?.id),
      rapor: raporTotals.find(s => s.id === rifqi?.id),
      nilai: rifqiNilai
    }
  });
}
