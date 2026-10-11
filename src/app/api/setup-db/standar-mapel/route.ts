import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allMapel = await prisma.mataPelajaran.findMany({
      include: { kelas: true }
    });

    const updates: any[] = [];

    for (const m of allMapel) {
      const nama = m.nama.toLowerCase().trim();
      const isMA = m.kelas && (
        m.kelas.jenjang === "MA" || 
        m.kelas.nama.toUpperCase().includes("MA") || 
        m.kelas.nama.startsWith("11") || 
        m.kelas.nama.startsWith("12")
      );

      let newNama = m.nama;
      let newKategori = m.kategori || "umum";
      let newNamaArab = m.nama_arab;

      // 1. SYARI'AH
      if (nama.includes("ushul")) {
        newNama = "Ushul Fikih";
        newKategori = "syariah";
        newNamaArab = "أصول الفقه";
      } else if (nama.includes("fiqh") || nama.includes("fiqih") || nama.includes("fikih")) {
        // Di MA (11 & 12 MA), mapel fiqih adalah Ushul Fikih
        if (isMA) {
          newNama = "Ushul Fikih";
          newKategori = "syariah";
          newNamaArab = "أصول الفقه";
        } else {
          newNama = "Fikih";
          newKategori = "syariah";
          newNamaArab = "الفقه";
        }
      } else if (nama.includes("akidah") || nama.includes("aqidah")) {
        newNama = "Akidah";
        newKategori = "syariah";
        newNamaArab = "العقيدة";
      } else if (nama.includes("tauhid")) {
        newNama = "Tauhid";
        newKategori = "syariah";
        newNamaArab = "التوحيد";
      } else if (nama.includes("hadis") || nama.includes("hadits")) {
        newNama = "Hadis";
        newKategori = "syariah";
        newNamaArab = "الحديث";
      } else if (nama.includes("tafsir")) {
        newNama = "Tafsir";
        newKategori = "syariah";
        newNamaArab = "التفسير";
      } else if (nama.includes("siroh") || nama.includes("sirah")) {
        newNama = "Sirah";
        newKategori = "syariah";
        newNamaArab = "السيرة";
      } else if (nama.includes("adab")) {
        newNama = "Adab";
        newKategori = "syariah";
        newNamaArab = "الأدب";
      } else if (nama.includes("akhlaq") || nama.includes("akhlak")) {
        newNama = "Akhlak";
        newKategori = "syariah";
        newNamaArab = "الأخلاق";
      } else if (nama.includes("tahsin")) {
        newNama = "Tahsin Al-Qur'an";
        newKategori = "syariah";
        newNamaArab = "التحسين";
      } else if (nama.includes("tajwid")) {
        newNama = "Tajwid";
        newKategori = "syariah";
        newNamaArab = "التجويد";
      } else if (nama.includes("mahfudzot") || nama.includes("mahfudot")) {
        newNama = "Mahfudzot";
        newKategori = "syariah";
        newNamaArab = "المحفوظات";
      } else if (nama.includes("quran") || nama.includes("qur'an") || nama.includes("tahfidz") || nama.includes("tahfiz")) {
        newNama = "Tahfidz Al-Qur'an";
        newKategori = "syariah";
        newNamaArab = "التحفيظ";
      }

      // 2. BAHASA
      else if (nama.includes("bahasa arab") || nama === "b. arab" || nama === "b.arab" || nama === "arab") {
        newNama = "Bahasa Arab";
        newKategori = "bahasa";
        newNamaArab = "اللغة العربية";
      } else if (nama.includes("bahasa indonesia") || nama === "b. indonesia" || nama === "b.indonesia" || nama === "indonesia") {
        newNama = "Bahasa Indonesia";
        newKategori = "bahasa";
        newNamaArab = "اللغة الإندونيسية";
      } else if (nama.includes("bahasa inggris") || nama === "b. inggris" || nama === "b.inggris" || nama.includes("english") || nama === "inggris") {
        newNama = "Bahasa Inggris";
        newKategori = "bahasa";
        newNamaArab = "اللغة الإنجليزية";
      } else if (nama.includes("nahwu")) {
        newNama = "Nahwu";
        newKategori = "bahasa";
        newNamaArab = "النحو";
      } else if (nama.includes("shorf") || nama.includes("shorof") || nama.includes("sharaf")) {
        newNama = "Shorf";
        newKategori = "bahasa";
        newNamaArab = "الصرف";
      } else if (nama.includes("kitabah")) {
        newNama = "Kitabah";
        newKategori = "bahasa";
        newNamaArab = "الكتابة";
      } else if (nama.includes("muthola") || nama.includes("mutola")) {
        newNama = "Muthola'ah";
        newKategori = "bahasa";
        newNamaArab = "المطالعة";
      } else if (nama.includes("imla")) {
        newNama = "Imla'";
        newKategori = "bahasa";
        newNamaArab = "الإملاء";
      } else if (nama.includes("khot") || nama.includes("khat")) {
        newNama = "Khot";
        newKategori = "bahasa";
        newNamaArab = "الخط";
      } else if (nama.includes("insya")) {
        newNama = "Insya'";
        newKategori = "bahasa";
        newNamaArab = "الإنشاء";
      } else if (nama.includes("muhadatsah") || nama.includes("hiwar")) {
        newNama = "Muhadatsah";
        newKategori = "bahasa";
        newNamaArab = "المحادثة";
      } else if (nama.includes("tadribat")) {
        newNama = "Tadribat 'alal Anmath";
        newKategori = "bahasa";
        newNamaArab = "تدريبات على الأنماط";
      }

      // 3. UMUM
      else if (nama.includes("matematika") || nama === "mtk") {
        newNama = "Matematika";
        newKategori = "umum";
        newNamaArab = "الرياضيات";
      } else if (nama === "ipa" || nama.includes("ipa terpadu") || nama.includes("ilmu pengetahuan alam")) {
        newNama = "IPA Terpadu";
        newKategori = "umum";
        newNamaArab = "العلوم";
      } else if (nama === "ips" || nama.includes("ips terpadu") || nama.includes("ilmu pengetahuan sosial")) {
        newNama = "IPS Terpadu";
        newKategori = "umum";
        newNamaArab = "العلوم الاجتماعية";
      } else if (nama.includes("pkn") || nama.includes("kewarganegaraan") || nama.includes("ppkn")) {
        newNama = "Pendidikan Pancasila dan Kewarganegaraan (PPKn)";
        newKategori = "umum";
        newNamaArab = "التربية الوطنية";
      } else if (nama.includes("tik") || nama.includes("komputer") || nama.includes("informatika")) {
        newNama = "Informatika & TIK";
        newKategori = "umum";
        newNamaArab = "تكنولوجيا المعلومات";
      } else if (nama.includes("entrepreneur") || nama.includes("kewirausahaan")) {
        newNama = "Entrepreneurship";
        newKategori = "umum";
        newNamaArab = "ريادة الأعمال";
      } else if (nama.includes("pjok") || nama.includes("olahraga")) {
        newNama = "PJOK";
        newKategori = "umum";
        newNamaArab = "التربية البدنية";
      }

      if (m.nama !== newNama || m.kategori !== newKategori || m.nama_arab !== newNamaArab) {
        updates.push(prisma.mataPelajaran.update({
          where: { id: m.id },
          data: { nama: newNama, kategori: newKategori, nama_arab: newNamaArab }
        }));
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menstandarisasi ${updates.length} mata pelajaran ke bahasa baku resmi.`,
      total_mapel: allMapel.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
