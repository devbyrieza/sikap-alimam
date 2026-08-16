import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("=== PERBAIKAN SANTRI HALAQOH UST. IKHWAN ===");

    // 1. Dapatkan referensi kelas 11 MA dan 12 MA
    const kelas11 = await prisma.kelas.findFirst({
      where: {
        is_active: true,
        OR: [{ nama: { equals: "11 MA", mode: "insensitive" } }],
      },
    });

    const kelas12 = await prisma.kelas.findFirst({
      where: {
        is_active: true,
        OR: [{ nama: { equals: "12 MA", mode: "insensitive" } }],
      },
    });

    if (!kelas11 || !kelas12) {
      return NextResponse.json({ error: "Kelas 11 MA atau 12 MA tidak ditemukan di database" }, { status: 400 });
    }

    const updates = [
      { search: "Radil", updateName: "Radil", classId: kelas11.id },
      { search: "Salman", updateName: "Salman Abdulrahim Uran", classId: kelas11.id },
      { search: "Rohman", updateName: "Muhammad Abdul Rahman", classId: kelas12.id },
      { search: "Rohim", updateName: "Muhammad Abdul Rohim", classId: kelas12.id },
      { search: "Yaser", updateName: "Yasser Ali Nurdin", classId: kelas12.id },
      { search: "Syafiq", updateName: "Syafiq Karimalai", classId: kelas12.id },
      { search: "Diki", updateName: "Dicky Dwy AP", classId: kelas12.id },
    ];

    let updateLogs = [];

    // 2. Cari santri di dalam halaqoh Ust Ikhwan dan update data mereka (ubah nama & kelas)
    // Tujuannya agar riwayat ziyadah/murojaah mereka tidak hilang.
    const ikhwanGroups = await prisma.halaqohKelompok.findMany({
      where: {
        pegawai: { nama_lengkap: { contains: "Ikhwan", mode: "insensitive" } }
      },
      include: {
        anggota: {
          include: { santri: true }
        }
      }
    });

    for (const group of ikhwanGroups) {
      for (const anggota of group.anggota) {
        if (!anggota.santri) continue;
        
        const santriName = anggota.santri.nama_lengkap;
        
        // Coba cocokan dengan target update
        for (const target of updates) {
          if (santriName.toLowerCase().includes(target.search.toLowerCase())) {
            // Update santri ini!
            await prisma.santriAktif.update({
              where: { id: anggota.santri.id },
              data: {
                nama_lengkap: target.updateName,
                kelas_id: target.classId,
              }
            });
            updateLogs.push(`Updated ${santriName} -> ${target.updateName} (Kelas: ${target.classId === kelas11.id ? '11 MA' : '12 MA'})`);
            break; // lanjut ke anggota berikutnya
          }
        }
      }
    }

    // 3. Tambahkan Pandi Rianto ke semua kelompok Ust Ikhwan (jika belum ada)
    let pandi = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: { contains: "Pandi Rianto", mode: "insensitive" } }
    });

    if (!pandi) {
      pandi = await prisma.santriAktif.create({
        data: {
          nama_lengkap: "Pandi Rianto",
          nis: "PR" + Math.floor(Math.random() * 1000000),
          kelas_id: kelas11.id,
          jenis_kelamin: "L",
          is_active: true
        }
      });
      updateLogs.push("Created Pandi Rianto");
    } else {
      // Pastikan kelasnya benar
      await prisma.santriAktif.update({
        where: { id: pandi.id },
        data: { kelas_id: kelas11.id }
      });
      updateLogs.push("Updated Pandi Rianto class to 11 MA");
    }

    // Masukkan Pandi ke dalam grup Ust Ikhwan
    for (const group of ikhwanGroups) {
      const isMember = group.anggota.some(a => a.santri_id === pandi!.id);
      if (!isMember) {
        await prisma.halaqohAnggota.create({
          data: {
            kelompok_id: group.id,
            santri_id: pandi.id,
          }
        });
        updateLogs.push(`Added Pandi Rianto to group: ${group.nama_kelompok}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data santri Halaqoh Ust Ikhwan berhasil diupdate di database production!",
      logs: updateLogs
    });

  } catch (error: any) {
    console.error("Error fixing ikhwan members:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal melakukan perbaikan" },
      { status: 500 }
    );
  }
}
