import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allMapel = await prisma.mataPelajaran.findMany();

    const updates: any[] = [];

    for (const m of allMapel) {
      const nama = m.nama.toLowerCase().trim();
      let newNama = m.nama;
      let newKategori = m.kategori || "umum";

      // 1. SYARI'AH
      if (nama.includes("ushul")) { newNama = "Ushul Fiqh"; newKategori = "syariah"; }
      else if (nama.includes("tauhid")) { newNama = "Tauhid"; newKategori = "syariah"; }
      else if (nama.includes("adab")) { newNama = "Adab"; newKategori = "syariah"; }
      else if (nama.includes("akidah") || nama.includes("aqidah")) { newNama = "Akidah"; newKategori = "syariah"; }
      else if (nama.includes("fiqh") || nama.includes("fiqih")) { newNama = "Fiqh"; newKategori = "syariah"; }
      else if (nama.includes("hadis") || nama.includes("hadits")) { newNama = "Hadits"; newKategori = "syariah"; }
      else if (nama.includes("tafsir")) { newNama = "Tafsir"; newKategori = "syariah"; }
      else if (nama.includes("siroh") || nama.includes("sirah")) { newNama = "Siroh"; newKategori = "syariah"; }
      else if (nama.includes("akhlaq") || nama.includes("akhlak")) { newNama = "Akhlaq"; newKategori = "syariah"; }
      else if (nama.includes("tahsin")) { newNama = "Tahsin"; newKategori = "syariah"; } // Formal
      else if (nama.includes("tajwid")) { newNama = "Tajwid"; newKategori = "syariah"; }
      else if (nama.includes("mahfudzot") || nama.includes("mahfudot")) { newNama = "Mahfudzot"; newKategori = "syariah"; }
      else if (nama.includes("quran") || nama.includes("qur'an") || nama.includes("tahfidz")) { newNama = "Tahfidz Al-Qur'an"; newKategori = "syariah"; }

      // 2. BAHASA
      else if (nama.includes("bahasa arab") || nama === "arab") { newNama = "Bahasa Arab"; newKategori = "bahasa"; }
      else if (nama.includes("nahwu")) { newNama = "Nahwu"; newKategori = "bahasa"; }
      else if (nama.includes("shorf") || nama.includes("shorof")) { newNama = "Shorf"; newKategori = "bahasa"; }
      else if (nama.includes("muthola") || nama.includes("mutola")) { newNama = "Muthola'ah"; newKategori = "bahasa"; }
      else if (nama.includes("imla")) { newNama = "Imla'"; newKategori = "bahasa"; }
      else if (nama.includes("khot") || nama.includes("khat")) { newNama = "Khot"; newKategori = "bahasa"; }
      else if (nama.includes("insya")) { newNama = "Insya'"; newKategori = "bahasa"; }
      else if (nama.includes("muhadatsah") || nama.includes("hiwar")) { newNama = "Muhadatsah"; newKategori = "bahasa"; }
      else if (nama.includes("bahasa indonesia") || nama === "indonesia") { newNama = "Bahasa Indonesia"; newKategori = "bahasa"; }
      else if (nama.includes("bahasa inggris") || nama.includes("english") || nama === "inggris") { newNama = "Bahasa Inggris"; newKategori = "bahasa"; }
      else if (nama.includes("kitabah")) { newNama = "Kitabah"; newKategori = "bahasa"; }

      // 3. UMUM
      else if (nama.includes("ipa")) { newNama = "IPA"; newKategori = "umum"; }
      else if (nama.includes("ips")) { newNama = "IPS"; newKategori = "umum"; }
      else if (nama.includes("matematika") || nama.includes("mtk")) { newNama = "Matematika"; newKategori = "umum"; }
      else if (nama.includes("pkn") || nama.includes("kewarganegaraan")) { newNama = "Pendidikan Kewarganegaraan (PKN)"; newKategori = "umum"; }
      else if (nama.includes("tik") || nama.includes("komputer")) { newNama = "Komputer & TIK"; newKategori = "umum"; }
      else if (nama.includes("entrepreneur") || nama.includes("kewirausahaan")) { newNama = "Entrepreneurship"; newKategori = "umum"; }
      else if (nama.includes("pjok") || nama.includes("olahraga")) { newNama = "PJOK"; newKategori = "umum"; }

      if (m.nama !== newNama || m.kategori !== newKategori) {
        updates.push(prisma.mataPelajaran.update({
          where: { id: m.id },
          data: { nama: newNama, kategori: newKategori }
        }));
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully standardized ${updates.length} mapel records.`,
      total_mapel: allMapel.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
