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

    const mapping = [
      { mapel: "B. Arab", guru: "Agus Cahyono", arab: "اللغة العربية", kat: "bahasa" },
      { mapel: "Adab", guru: "Agus Cahyono", arab: "الأدب", kat: "syariah" },
      { mapel: "Tauhid", guru: "Agus Cahyono", arab: "التوحيد", kat: "syariah" },
      { mapel: "B. Indonesia", guru: "Ade Supiana", arab: "اللغة الإندونيسية", kat: "bahasa" },
      { mapel: "MTK", guru: "Adinda Aisyah", arab: "الرياضيات", kat: "umum" },
      { mapel: "B. Inggris", guru: "Adinda Aisyah", arab: "اللغة الإنجليزية", kat: "bahasa" },
      { mapel: "Tafsir", guru: "Azzam", arab: "التفسير", kat: "syariah" },
      { mapel: "Nahwu", guru: "Azzam", arab: "النحو", kat: "bahasa" },
      { mapel: "Hadis", guru: "Wahyudi Pranata", arab: "الحديث", kat: "syariah" },
      { mapel: "Siroh", guru: "Muhammad Thoriq", arab: "السيرة", kat: "syariah" },
      { mapel: "Ushul Fiqh", guru: "Muhammad Thoriq", arab: "أصول الفقه", kat: "syariah" },
      { mapel: "Tahfidz", guru: "Zeidan", arab: "التحفيظ", kat: "syariah" }
    ];

    const kelasList = [kelas11, kelas12];

    for (const k of kelasList) {
      const kelasTag = k.jenjang === "MA" ? `${k.nama} MA` : k.nama;

      // 1. Bersihkan / Ganti "Fiqh" -> "Ushul Fiqh" di kelas MA ini
      const fiqhRecords = await prisma.mataPelajaran.findMany({
        where: {
          kelas_id: k.id,
          OR: [
            { nama: { equals: "Fiqh", mode: "insensitive" } },
            { nama: { equals: "Fiqih", mode: "insensitive" } },
            { nama: { equals: "Ushul Fiqih", mode: "insensitive" } }
          ]
        }
      });

      let ushulMapel = await prisma.mataPelajaran.findFirst({
        where: { nama: { equals: "Ushul Fiqh", mode: "insensitive" }, kelas_id: k.id }
      });

      for (const f of fiqhRecords) {
        if (!ushulMapel) {
          ushulMapel = await prisma.mataPelajaran.update({
            where: { id: f.id },
            data: { nama: "Ushul Fiqh", nama_arab: "أصول الفقه", kategori: "syariah", is_active: true }
          });
          logs.push(`🔄 Diubah ${f.nama} -> Ushul Fiqh (Kelas ${k.nama})`);
        } else if (ushulMapel.id !== f.id) {
          // Relokasikan relasi lalu hapus Fiqh duplikat
          await prisma.asatidzmMapel.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.nilaiSantri.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.jurnalMengajar.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.jadwalPelajaran.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.presensiSiswa.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.mataPelajaran.delete({ where: { id: f.id } });
          logs.push(`🗑️ Dihapus duplikat ${f.nama} & dimerge ke Ushul Fiqh (Kelas ${k.nama})`);
        }
      }

      // 2. Loop setiap item jadwal
      for (const item of mapping) {
        // Cari Guru (dukung variasi Zeidan/Zeidhan dll)
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
          // Pastikan metadata terupdate
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

        // Update tag mata_pelajaran di pegawai (misal: "[11 MA] Ushul Fiqh")
        const currentTags = (guru.mata_pelajaran || "").split(",").map(s => s.trim()).filter(Boolean);
        // Hapus tag Fiqh MA jika ada
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

    return NextResponse.json({ success: true, message: "Sinkronisasi Distribusi Mapel MA Berhasil: Ushul Fiqh Menggantikan Fiqh", logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
