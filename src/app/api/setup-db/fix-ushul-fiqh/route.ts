import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs: string[] = [];

    // 1. Dapatkan semua kelas MA aktif
    const allKelas = await prisma.kelas.findMany({ where: { is_active: true } });
    const maKelasList = allKelas.filter(k => 
      k.jenjang === "MA" || 
      k.nama.toUpperCase().includes("MA") || 
      k.nama.startsWith("11") || 
      k.nama.startsWith("12")
    );

    if (maKelasList.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada kelas MA yang ditemukan di database." });
    }

    logs.push(`Ditemukan ${maKelasList.length} kelas MA: ${maKelasList.map(k => `${k.nama} (${k.id})`).join(", ")}`);

    // 2. Cari Ust. Muhammad Thoriq
    const ustThoriq = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { nama_lengkap: { contains: "Thoriq", mode: "insensitive" } },
          { nama_lengkap: { contains: "Toriq", mode: "insensitive" } },
        ]
      }
    });

    if (ustThoriq) {
      logs.push(`Ditemukan Pengajar: ${ustThoriq.nama_lengkap} (${ustThoriq.id})`);
    } else {
      logs.push(`⚠️ Pengajar Ust. Muhammad Thoriq tidak ditemukan.`);
    }

    for (const k of maKelasList) {
      const kelasTag = k.jenjang === "MA" ? `${k.nama} MA` : k.nama;

      // Cari Fiqh di kelas ini
      const fiqhList = await prisma.mataPelajaran.findMany({
        where: {
          kelas_id: k.id,
          OR: [
            { nama: { equals: "Fiqh", mode: "insensitive" } },
            { nama: { equals: "Fiqih", mode: "insensitive" } },
            { nama: { equals: "Ushul Fiqih", mode: "insensitive" } }
          ]
        }
      });

      // Cari atau buat Ushul Fikih
      let ushulMapel = await prisma.mataPelajaran.findFirst({
        where: {
          kelas_id: k.id,
          nama: { equals: "Ushul Fikih", mode: "insensitive" }
        }
      });

      for (const f of fiqhList) {
        if (!ushulMapel) {
          ushulMapel = await prisma.mataPelajaran.update({
            where: { id: f.id },
            data: {
              nama: "Ushul Fikih",
              nama_arab: "أصول الفقه",
              kategori: "syariah",
              is_active: true
            }
          });
          logs.push(`✅ [${kelasTag}] Mapel "${f.nama}" berhasil diubah menjadi "Ushul Fikih"`);
        } else if (ushulMapel.id !== f.id) {
          // Merge relasi dari f ke ushulMapel
          await prisma.asatidzmMapel.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.nilaiSantri.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.jurnalMengajar.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.jadwalPelajaran.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.presensiSiswa.updateMany({ where: { mapel_id: f.id }, data: { mapel_id: ushulMapel.id } });
          await prisma.mataPelajaran.delete({ where: { id: f.id } });
          logs.push(`🗑️ [${kelasTag}] Mapel duplikat "${f.nama}" dihapus & dimerge ke "Ushul Fikih"`);
        }
      }

      if (!ushulMapel) {
        ushulMapel = await prisma.mataPelajaran.create({
          data: {
            nama: "Ushul Fikih",
            nama_arab: "أصول الفقه",
            kategori: "syariah",
            is_active: true,
            kelas_id: k.id
          }
        });
        logs.push(`✨ [${kelasTag}] Mapel baru "Ushul Fikih" berhasil dibuat`);
      }

      // Pastikan Ust. Muhammad Thoriq di-assign ke Ushul Fikih di kelas ini
      if (ustThoriq && ushulMapel) {
        await prisma.asatidzmMapel.upsert({
          where: {
            pegawai_id_mapel_id_kelas_id: {
              pegawai_id: ustThoriq.id,
              mapel_id: ushulMapel.id,
              kelas_id: k.id
            }
          },
          update: {},
          create: {
            pegawai_id: ustThoriq.id,
            mapel_id: ushulMapel.id,
            kelas_id: k.id
          }
        });
        logs.push(`👨‍🏫 [${kelasTag}] Ust. Muhammad Thoriq di-assign ke "Ushul Fikih"`);
      }
    }

    // Update string mata_pelajaran Ust. Thoriq
    if (ustThoriq) {
      const currentTags = (ustThoriq.mata_pelajaran || "").split(",").map(s => s.trim()).filter(Boolean);
      // Hapus semua tag Fiqh MA
      let updatedTags = currentTags.filter(t => !t.toLowerCase().includes("ma] fiqh"));
      
      for (const k of maKelasList) {
        const kelasTag = k.jenjang === "MA" ? `${k.nama} MA` : k.nama;
        const ushulTag = `[${kelasTag}] Ushul Fikih`;
        if (!updatedTags.includes(ushulTag)) {
          updatedTags.push(ushulTag);
        }
      }

      await prisma.pegawai.update({
        where: { id: ustThoriq.id },
        data: { mata_pelajaran: updatedTags.join(", ") }
      });
      logs.push(`📋 String mata_pelajaran Ust. Thoriq diperbarui: "${updatedTags.join(", ")}"`);
    }

    return NextResponse.json({
      success: true,
      message: "Migrasi Ushul Fikih Kelas MA Berhasil!",
      logs
    });
  } catch (error: any) {
    console.error("[fix-ushul-fiqh error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
