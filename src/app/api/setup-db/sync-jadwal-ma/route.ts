import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];
    
    // 1. Dapatkan Kelas 11 MA dan 12 MA secara fleksibel
    const allKelas = await prisma.kelas.findMany({ where: { is_active: true } });
    const kelas11 = allKelas.find(k => k.nama === '11' || k.nama === '11 MA' || (k.nama.includes('11') && (k.jenjang === 'MA' || k.nama.includes('MA'))));
    const kelas12 = allKelas.find(k => k.nama === '12' || k.nama === '12 MA' || (k.nama.includes('12') && (k.jenjang === 'MA' || k.nama.includes('MA'))));
    
    if (!kelas11 || !kelas12) {
      throw new Error("Kelas 11 MA atau 12 MA tidak ditemukan di database!");
    }

    // 12 Mata Pelajaran Resmi Jenjang MA dengan Ejaan Bahasa Baku Resmi
    const mapping = [
      { mapel: "Bahasa Arab", guru: "Agus Cahyono", arab: "اللغة العربية", kat: "bahasa" },
      { mapel: "Adab", guru: "Agus Cahyono", arab: "الأدب", kat: "syariah" },
      { mapel: "Tauhid", guru: "Agus Cahyono", arab: "التوحيد", kat: "syariah" },
      { mapel: "Bahasa Indonesia", guru: "Ade Supiana", arab: "اللغة الإندونيسية", kat: "bahasa" },
      { mapel: "Matematika", guru: "Adinda Aisyah", arab: "الرياضيات", kat: "umum" },
      { mapel: "Bahasa Inggris", guru: "Adinda Aisyah", arab: "اللغة الإنجليزية", kat: "bahasa" },
      { mapel: "Tafsir", guru: "Azzam", arab: "التفسير", kat: "syariah" },
      { mapel: "Nahwu", guru: "Azzam", arab: "النحو", kat: "bahasa" },
      { mapel: "Hadis", guru: "Wahyudi Pranata", arab: "الحديث", kat: "syariah" },
      { mapel: "Sirah", guru: "Muhammad Thoriq", arab: "السيرة", kat: "syariah" },
      { mapel: "Ushul Fikih", guru: "Muhammad Thoriq", arab: "أصول الفقه", kat: "syariah" },
      { mapel: "Tahfidz Al-Qur'an", guru: "Zeidan", arab: "التحفيظ", kat: "syariah" }
    ];

    const kelasList = [kelas11, kelas12];

    for (const k of kelasList) {
      const kelasTag = k.jenjang === "MA" ? `${k.nama} MA` : k.nama;

      // 1. Bersihkan / Ganti variasi nama tidak baku -> nama baku di kelas MA ini
      const nonBakuRecords = await prisma.mataPelajaran.findMany({
        where: {
          kelas_id: k.id,
          OR: [
            { nama: { in: ["Fiqh", "Fiqih", "Fikih", "Ushul Fiqh", "Ushul Fiqih"], mode: "insensitive" } },
            { nama: { in: ["B. Arab", "Arab"], mode: "insensitive" } },
            { nama: { in: ["B. Indonesia", "Indonesia"], mode: "insensitive" } },
            { nama: { in: ["B. Inggris", "Inggris", "English"], mode: "insensitive" } },
            { nama: { in: ["MTK", "mtk"], mode: "insensitive" } },
            { nama: { in: ["Hadits", "hadits"], mode: "insensitive" } },
            { nama: { in: ["Siroh", "siroh", "Siroh Nabi"], mode: "insensitive" } },
            { nama: { in: ["Tahfidz", "tahfidz"], mode: "insensitive" } }
          ]
        }
      });

      for (const nb of nonBakuRecords) {
        let targetBaku = nb.nama;
        const low = nb.nama.toLowerCase();
        if (["fiqh", "fiqih", "fikih", "ushul fiqh", "ushul fiqih"].includes(low)) targetBaku = "Ushul Fikih";
        else if (["b. arab", "arab"].includes(low)) targetBaku = "Bahasa Arab";
        else if (["b. indonesia", "indonesia"].includes(low)) targetBaku = "Bahasa Indonesia";
        else if (["b. inggris", "inggris", "english"].includes(low)) targetBaku = "Bahasa Inggris";
        else if (low === "mtk") targetBaku = "Matematika";
        else if (low === "hadits") targetBaku = "Hadis";
        else if (["siroh", "siroh nabi"].includes(low)) targetBaku = "Sirah";
        else if (low === "tahfidz") targetBaku = "Tahfidz Al-Qur'an";

        if (targetBaku !== nb.nama) {
          const existing = await prisma.mataPelajaran.findFirst({
            where: { nama: targetBaku, kelas_id: k.id, id: { not: nb.id } }
          });
          if (!existing) {
            await prisma.mataPelajaran.update({
              where: { id: nb.id },
              data: { nama: targetBaku }
            });
            logs.push(`🔄 Diubah ${nb.nama} -> ${targetBaku} (Kelas ${k.nama})`);
          } else {
            await prisma.asatidzmMapel.updateMany({ where: { mapel_id: nb.id }, data: { mapel_id: existing.id } });
            await prisma.mataPelajaran.delete({ where: { id: nb.id } });
            logs.push(`🗑️ Dimerge & dihapus duplikat ${nb.nama} -> ${targetBaku} (Kelas ${k.nama})`);
          }
        }
      }

      // 2. Loop setiap item jadwal baku
      for (const item of mapping) {
        // Cari Guru
        const guru = await prisma.pegawai.findFirst({
          where: {
            OR: [
              { nama_lengkap: { contains: item.guru, mode: 'insensitive' } },
              { nama_lengkap: { contains: item.guru.replace("d", "dh"), mode: 'insensitive' } }
            ]
          }
        });

        if (!guru) {
          logs.push(`⚠️ GAGAL: Guru tidak ditemukan untuk pencarian "${item.guru}"`);
          continue;
        }

        // Cari atau buat Mapel di kelas ini
        let mapel = await prisma.mataPelajaran.findFirst({ 
          where: { nama: { equals: item.mapel, mode: 'insensitive' }, kelas_id: k.id } 
        });

        if (!mapel) {
          mapel = await prisma.mataPelajaran.create({
            data: { 
              nama: item.mapel, 
              nama_arab: item.arab,
              kategori: item.kat,
              is_active: true, 
              kelas_id: k.id 
            }
          });
          logs.push(`✨ Mata Pelajaran dibuat: ${item.mapel} (Kelas ${k.nama})`);
        } else {
          await prisma.mataPelajaran.update({
            where: { id: mapel.id },
            data: { nama: item.mapel, nama_arab: item.arab, kategori: item.kat, is_active: true }
          });
        }

        // Assign guru ke mapel di kelas ini
        await prisma.asatidzmMapel.upsert({
          where: { pegawai_id_mapel_id_kelas_id: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: k.id } },
          update: {},
          create: { pegawai_id: guru.id, mapel_id: mapel.id, kelas_id: k.id }
        });

        // Update tag mata_pelajaran di pegawai (misal: "[11 MA] Bahasa Arab")
        const currentTags = (guru.mata_pelajaran || "").split(",").map(s => s.trim()).filter(Boolean);
        const filteredTags = currentTags.filter(t => !t.toLowerCase().includes(`[${kelasTag.toLowerCase()}] fiqh`));
        const newTag = `[${kelasTag}] ${item.mapel}`;
        if (!filteredTags.includes(newTag)) {
          filteredTags.push(newTag);
        }
        await prisma.pegawai.update({
          where: { id: guru.id },
          data: { mata_pelajaran: filteredTags.join(", ") }
        });

        logs.push(`✅ Sukses: ${item.mapel} -> ${guru.nama_lengkap} (Kelas ${k.nama})`);
      }
    }

    return NextResponse.json({ success: true, message: "Sinkronisasi Distribusi Mapel MA Berhasil dengan Bahasa Baku Resmi", logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
