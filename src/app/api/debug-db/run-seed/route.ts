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
    const KELAS_LIST = [
      { nama: "7 MTs", jenjang: "MTS" },
      { nama: "8 MTs", jenjang: "MTS" },
      { nama: "9 MTs", jenjang: "MTS" },
      { nama: "IL", jenjang: "IL" },
      { nama: "10 MA", jenjang: "MA" },
      { nama: "11 MA", jenjang: "MA" },
      { nama: "12 MA", jenjang: "MA" },
    ];

    // FIX EXISTING DATA
    await prisma.kelas.updateMany({
      where: { nama: "I'dad Lughowy" },
      data: { nama: "IL", jenjang: "IL" }
    });

    for (const k of KELAS_LIST) {
      const existing = await prisma.kelas.findFirst({ where: { nama: k.nama }});
      if (!existing) {
        await prisma.kelas.create({ data: k });
      }
    }

    const kelas7 = await prisma.kelas.findFirst({ where: { nama: "7 MTs" }});
    const kelasIL = await prisma.kelas.findFirst({ where: { nama: "IL" }});

    const mapel7Data = MAPEL_7MTS.map(m => ({ nama: m, kelas_id: kelas7!.id, kategori: "umum" }));
    const mapelILData = MAPEL_IL.map(m => ({ nama: m, kelas_id: kelasIL!.id, kategori: "umum" }));
    
    await prisma.mataPelajaran.createMany({
      data: [...mapel7Data, ...mapelILData],
      skipDuplicates: true,
    });

    const santriData = SANTRI_MTS.map(s => ({
      nis: s.nis || null,
      nama_lengkap: s.nama,
      kelas_id: kelas7!.id,
      jenis_kelamin: s.jk,
    }));

    await prisma.santriAktif.createMany({
      data: santriData,
      skipDuplicates: true,
    });

    const ASATIDZ = [
      "Agus Cahyono", "Wahyudi Pranata, Lc.", "Imron Abdillah", "Ramdan",
      "Abdil Aziz, S.Pd., B.A.", "Rieza Eka Tomara, S.Kom", "Muhammad Iqbal, S. Pd"
    ];

    for (const asatidz of ASATIDZ) {
      const slug = asatidz.toLowerCase().replace(/[^a-z0-9]+/g, ".");
      const email = `${slug}@pesantren-alimam.com`;
      const pass = "$2a$10$Xm5b7... (use default hash)"; // Not needed for bypass, but wait, bcrypt is needed!
      // Better to use a hardcoded hash for 'alimam123'
      const hashedPass = "$2a$12$7kP/c53iLWe06yE50/Vn/uTj822B.aXkF3.tJbM0RThqU1kQo50sC";
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            email,
            password: hashedPass,
            nama: asatidz,
            role: "GURU",
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Mapel, Kelas, Santri, and Asatidz seeded!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
