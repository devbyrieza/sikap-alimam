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

export async function GET() {
  const results = [];
  
  for (const t of data) {
    const p = await prisma.pegawai.findFirst({ 
      where: { nama_lengkap: { contains: t.nama, mode: 'insensitive' } } 
    });
    
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
