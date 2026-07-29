import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MAPEL_7MTS = [
  "Akidah", "Hadis", "Fiqh", "Siroh Nabi", "Kitabah", "Shorf", "Bahasa Arab",
  "Entrepreneurship", "Bahasa Indonesia", "Bahasa Inggris", "Matematika", "IPA Terpadu", "Tahsin/Tahfidz Al-Quran"
];

const MAPEL_IL = [
  "Akidah", "Hadis", "Fiqh", "Siroh Nabi", "Kitabah", "Tadribat Alal Anmath",
  "Nahwu", "Shorf", "Bahasa Arab", "Entrepreneurship", "Tahsin/Tahfiz Al Quran"
];

const SANTRI_MTS = [
  { nis: "2601070001", nama: "Atqanul Ummah Ahmad", jk: "L" },
  { nis: "2601070002", nama: "Abdul Aziz Ali", jk: "L" },
  { nis: "2601070003", nama: "Abdul Hakim", jk: "L" },
  { nis: "2601070004", nama: "Ahmad Farros Al Barqy", jk: "L" },
];

export async function GET() {
  try {
    let kelas7 = await prisma.kelas.findFirst({ where: { nama_kelas: "7 MTs" }});
    if (!kelas7) {
      kelas7 = await prisma.kelas.create({ data: { tingkat: "7", nama_kelas: "7 MTs", jenjang: "MTS", wali_kelas_id: null }});
    }

    let kelasIL = await prisma.kelas.findFirst({ where: { nama_kelas: "I'dad Lughowy" }});
    if (!kelasIL) {
      kelasIL = await prisma.kelas.create({ data: { tingkat: "10", nama_kelas: "I'dad Lughowy", jenjang: "MA", wali_kelas_id: null }});
    }

    for (const m of MAPEL_7MTS) {
      await prisma.mataPelajaran.create({
        data: { nama: m, kelas_id: kelas7.id, kategori: "umum" }
      });
    }
    
    for (const m of MAPEL_IL) {
      await prisma.mataPelajaran.create({
        data: { nama: m, kelas_id: kelasIL.id, kategori: "umum" }
      });
    }

    for (const s of SANTRI_MTS) {
      await prisma.santriAktif.create({
        data: {
          nis: s.nis || null,
          nama_lengkap: s.nama,
          kelas_id: kelas7.id,
          jenis_kelamin: s.jk,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Mapel, Kelas, and Santri seeded!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
