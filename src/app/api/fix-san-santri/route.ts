import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sanSantri = await prisma.santriAktif.findMany({
      where: { nis: { startsWith: "SAN" } },
      include: { kelas: true }
    });

    const allRealSantri = await prisma.santriAktif.findMany({
      where: { nis: { not: { startsWith: "SAN" } } }
    });

    const deletedNames = [];
    const remappedNames = [];
    let deletedCount = 0;

    for (const fake of sanSantri) {
      // Find the real santri
      // Hardcoded known mismatches
      let realSantri = null;
      if (fake.nama_lengkap.includes("Lalu Muhammad Rizky Ananda")) {
        realSantri = allRealSantri.find(s => s.nama_lengkap.includes("Lalu Muhamad"));
      } else if (fake.nama_lengkap.includes("Mizan Alghofary")) {
        realSantri = allRealSantri.find(s => s.nama_lengkap.includes("Miizan Alghifary"));
      } else if (fake.nama_lengkap.includes("Naufal Alfaniri")) {
        realSantri = allRealSantri.find(s => s.nama_lengkap.includes("Naufal"));
      } else if (fake.nama_lengkap.includes("Rifqi Arsyadi")) {
        realSantri = allRealSantri.find(s => s.nama_lengkap.includes("Rifqi"));
      }

      // Fallback fuzzy search: first 2 words match
      if (!realSantri) {
        const parts = fake.nama_lengkap.split(" ").filter(p => p.length > 2);
        if (parts.length >= 2) {
          realSantri = allRealSantri.find(s => {
            const sn = s.nama_lengkap.toLowerCase();
            return sn.includes(parts[0].toLowerCase()) && sn.includes(parts[1].toLowerCase());
          });
        }
      }

      if (realSantri) {
        // Remap HalaqohAnggota
        const halaqohs = await prisma.halaqohAnggota.findMany({ where: { santri_id: fake.id } });
        for (const h of halaqohs) {
          // Check if real santri is already in this halaqoh
          const exists = await prisma.halaqohAnggota.findFirst({
            where: { kelompok_id: h.kelompok_id, santri_id: realSantri.id }
          });
          if (!exists) {
            await prisma.halaqohAnggota.update({
              where: { id: h.id },
              data: { santri_id: realSantri.id }
            });
            remappedNames.push(`${fake.nama_lengkap} -> ${realSantri.nama_lengkap} (Halaqoh)`);
          } else {
            await prisma.halaqohAnggota.delete({ where: { id: h.id } });
          }
        }

        // Remap UjianTahfidz
        const ujian = await prisma.ujianTahfidz.findMany({ where: { santri_id: fake.id } });
        for (const u of ujian) {
          try { await prisma.ujianTahfidz.update({ where: { id: u.id }, data: { santri_id: realSantri.id } }); } 
          catch { await prisma.ujianTahfidz.delete({ where: { id: u.id } }); }
        }

        // Remap PresensiSiswa
        const presensi = await prisma.presensiSiswa.findMany({ where: { santri_id: fake.id } });
        for (const p of presensi) {
          try { await prisma.presensiSiswa.update({ where: { id: p.id }, data: { santri_id: realSantri.id } }); } 
          catch { await prisma.presensiSiswa.delete({ where: { id: p.id } }); }
        }

        // Remap CatatanHalaqoh
        const catatan = await prisma.catatanHalaqoh.findMany({ where: { santri_id: fake.id } });
        for (const c of catatan) {
           const exists = await prisma.catatanHalaqoh.findFirst({
             where: { kelompok_id: c.kelompok_id, tanggal: c.tanggal, sesi: c.sesi, santri_id: realSantri.id }
           });
           if (!exists) {
             await prisma.catatanHalaqoh.update({
               where: { id: c.id },
               data: { santri_id: realSantri.id }
             });
           } else {
             await prisma.catatanHalaqoh.delete({ where: { id: c.id } });
           }
        }

        // Remap NilaiSantri
        const nilai = await prisma.nilaiSantri.findMany({ where: { santri_id: fake.id } });
        for (const n of nilai) {
          try { await prisma.nilaiSantri.update({ where: { id: n.id }, data: { santri_id: realSantri.id } }); } 
          catch { await prisma.nilaiSantri.delete({ where: { id: n.id } }); }
        }

      } else {
        // No real santri found, just delete its relation
        await prisma.halaqohAnggota.deleteMany({ where: { santri_id: fake.id } });
        await prisma.ujianTahfidz.deleteMany({ where: { santri_id: fake.id } });
        await prisma.presensiSiswa.deleteMany({ where: { santri_id: fake.id } });
        await prisma.catatanHalaqoh.deleteMany({ where: { santri_id: fake.id } });
        await prisma.nilaiSantri.deleteMany({ where: { santri_id: fake.id } });
      }

      // Finally delete the fake santri
      await prisma.santriAktif.delete({ where: { id: fake.id } });
      deletedCount++;
      deletedNames.push(fake.nama_lengkap);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedCount} santri duplikat (SAN-).`,
      remappedNames,
      deletedNames
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
