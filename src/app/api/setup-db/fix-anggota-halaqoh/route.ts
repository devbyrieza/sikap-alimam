import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const changes: string[] = [];

    // Helper to find santri
    const findSantri = async (name: string) => {
      const s = await prisma.santriAktif.findFirst({
        where: { nama_lengkap: { contains: name, mode: 'insensitive' } }
      });
      if (!s) throw new Error(`Santri not found: ${name}`);
      return s;
    };

    // Helper to find kelompok
    const findKelompok = async (pegawaiName: string) => {
      const p = await prisma.pegawai.findFirst({
        where: { nama_lengkap: { contains: pegawaiName, mode: 'insensitive' } }
      });
      if (!p) throw new Error(`Pegawai not found: ${pegawaiName}`);
      
      const k = await prisma.halaqohKelompok.findFirst({
        where: { pegawai_id: p.id, is_active: true }
      });
      if (!k) throw new Error(`Kelompok not found for: ${pegawaiName}`);
      return k;
    };

    // 1. Lalu Muhamad Rizky Ananda
    const s1 = await findSantri("Lalu Muhamad Rizky Ananda");
    const kZeidhan = await findKelompok("Zeidhan");
    const kAzzam = await findKelompok("Azzam Aghnia Ilman");
    await prisma.halaqohAnggota.deleteMany({
      where: { santri_id: s1.id, kelompok_id: kZeidhan.id }
    });
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kAzzam.id, santri_id: s1.id } },
      create: { kelompok_id: kAzzam.id, santri_id: s1.id },
      update: {}
    });
    changes.push(`Moved ${s1.nama_lengkap} from Zeidhan to Azzam`);

    // 2. Muhammad Rizky
    const s2 = await findSantri("Muhammad Rizky");
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kZeidhan.id, santri_id: s2.id } },
      create: { kelompok_id: kZeidhan.id, santri_id: s2.id },
      update: {}
    });
    changes.push(`Added ${s2.nama_lengkap} to Zeidhan`);

    // 3. Abdurrahim Pati Raja
    const s3 = await findSantri("Abdurrahim Pati Raja");
    const kIqbal = await findKelompok("Muhammad Iqbal");
    const kWahyudi = await findKelompok("Wahyudi Pranata");
    await prisma.halaqohAnggota.deleteMany({
      where: { santri_id: s3.id, kelompok_id: kIqbal.id }
    });
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kWahyudi.id, santri_id: s3.id } },
      create: { kelompok_id: kWahyudi.id, santri_id: s3.id },
      update: {}
    });
    changes.push(`Moved ${s3.nama_lengkap} from Iqbal to Wahyudi`);

    // 4. Muhammad Hafidz Abdurrahman
    const s4 = await findSantri("Muhammad Hafidz Abdurrahman");
    const kAgus = await findKelompok("Agus Cahyono");
    await prisma.halaqohAnggota.deleteMany({
      where: { santri_id: s4.id, kelompok_id: kIqbal.id }
    });
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kAgus.id, santri_id: s4.id } },
      create: { kelompok_id: kAgus.id, santri_id: s4.id },
      update: {}
    });
    changes.push(`Moved ${s4.nama_lengkap} from Iqbal to Agus`);

    // 5. Muhammad Abdul Rahman
    const s5 = await findSantri("Muhammad Abdul Rahman");
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kIqbal.id, santri_id: s5.id } },
      create: { kelompok_id: kIqbal.id, santri_id: s5.id },
      update: {}
    });
    changes.push(`Added ${s5.nama_lengkap} to Iqbal`);

    // 6. Muhammad Abdul Rohim
    const s6 = await findSantri("Muhammad Abdul Rohim");
    await prisma.halaqohAnggota.upsert({
      where: { kelompok_id_santri_id: { kelompok_id: kIqbal.id, santri_id: s6.id } },
      create: { kelompok_id: kIqbal.id, santri_id: s6.id },
      update: {}
    });
    changes.push(`Added ${s6.nama_lengkap} to Iqbal`);

    return NextResponse.json({ success: true, message: "Database Halaqoh Anggota berhasil diperbaiki", changes });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
