import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = [
  { nama: 'Ade Supiana', mapel: ['[7 MTs] Bahasa Indonesia'] },
  { nama: 'Agus Cahyono', mapel: ['[7 MTs] Khitobah', '[IL] Khitobah', '[IL] Tadribat Alal Anmath'] },
  { nama: 'Arifin Syaifullah', mapel: ['[7 MTs] Aqidah', '[IL] Aqidah'] },
  { nama: 'Imron Abdillah', mapel: ['[IL] Bahasa Arab', '[IL] Nahwu'] },
  { nama: 'Hardiansyah', mapel: ['[7 MTs] IPA Terpadu'] },
  { nama: 'Muhammad Ikbal', mapel: ['[7 MTs] Shorof', '[IL] Shorof', '[7 MTs] Tahsin', '[IL] Tahsin'] },
  { nama: 'Muhammad Thoriq', mapel: ['[7 MTs] Siroh', '[IL] Siroh', '[7 MTs] Hadits', '[IL] Hadits'] },
  { nama: 'Rieza Eka Tomara', mapel: ['[7 MTs] Matematika'] },
  { nama: 'Teguh Hudaya', mapel: ['[7 MTs] Entrepreneurship', '[IL] Entrepreneurship'] },
  { nama: 'Wahab Rajasam', mapel: ['[7 MTs] Fiqih', '[IL] Fiqih'] },
  { nama: 'Wahyudi Pranata', mapel: ['[7 MTs] Bahasa Arab'] },
  { nama: 'Bachtiar', mapel: ['[7 MTs] Bahasa Inggris'] }
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug");
  
  if (debug === "true") {
    const all = await prisma.pegawai.findMany({ select: { nama_lengkap: true } });
    return NextResponse.json({ all: all.map(a => a.nama_lengkap) });
  }

  const results = [];
  const allPegawai = await prisma.pegawai.findMany();
  
  for (const t of data) {
    let p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes(t.nama.toLowerCase()));
    
    // Fallback manual matching
    if (!p) {
      if (t.nama === "Ade Supiana") p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("ade"));
      if (t.nama === "Arifin Syaifullah") p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("arifin"));
      if (t.nama === "Muhammad Ikbal") p = allPegawai.find(x => x.nama_lengkap.toLowerCase().includes("ikbal") || x.nama_lengkap.toLowerCase().includes("iqbal"));
    }
    
    if (!p) {
      results.push('Guru tidak ditemukan: ' + t.nama);
      continue;
    }
    
    const mapelString = t.mapel.join(', ');
    await prisma.pegawai.update({
      where: { id: p.id },
      data: { mata_pelajaran: mapelString }
    });
    
    results.push('Updated ' + p.nama_lengkap + ' -> ' + mapelString);
  }

  return NextResponse.json({ 
    success: true, 
    message: "Data mapel guru berhasil diupdate. Harap LAKUKAN SINKRONISASI ULANG dari halaman admin.",
    results
  });
}
