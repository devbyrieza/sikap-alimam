import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const changes: string[] = [];
  const errors: string[] = [];

  // Helper to find santri
  const findSantri = async (name: string) => {
    const s = await prisma.santriAktif.findFirst({
      where: { nama_lengkap: { contains: name, mode: 'insensitive' } }
    });
    if (!s) {
      // Try fallback with split name just in case
      const parts = name.split(" ");
      const fallback = await prisma.santriAktif.findFirst({
        where: { nama_lengkap: { contains: parts[parts.length - 1], mode: 'insensitive' } }
      });
      if (fallback) return fallback;
      throw new Error(`Santri not found: ${name}`);
    }
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

  const processMapping = async (santriName: string, fromPegawai: string | null, toPegawai: string) => {
    try {
      const s = await findSantri(santriName);
      const kTo = await findKelompok(toPegawai);

      if (fromPegawai) {
        const kFrom = await findKelompok(fromPegawai);
        await prisma.halaqohAnggota.deleteMany({
          where: { santri_id: s.id, kelompok_id: kFrom.id }
        });
      }

      await prisma.halaqohAnggota.upsert({
        where: { kelompok_id_santri_id: { kelompok_id: kTo.id, santri_id: s.id } },
        create: { kelompok_id: kTo.id, santri_id: s.id },
        update: {}
      });
      
      changes.push(`Sukses: ${s.nama_lengkap} -> ${toPegawai}`);
    } catch (e: any) {
      errors.push(`Gagal memproses ${santriName}: ${e.message}`);
    }
  };

  try {
    await processMapping("Lalu Muhamad Rizky Ananda", "Zeidhan", "Azzam Aghnia Ilman");
    await processMapping("Muhammad Rizky", null, "Zeidhan");
    await processMapping("Abdurrahim Pati Raja", "Muhammad Iqbal", "Wahyudi Pranata");
    await processMapping("Muhammad Hafidz Abdurrahman", "Muhammad Iqbal", "Agus Cahyono");
    // For Abdul Rahman and Abdul Rohim, try using partial names if full name fails
    await processMapping("Abdul Rahman", null, "Muhammad Iqbal");
    await processMapping("Abdul Rohim", null, "Muhammad Iqbal");

    return NextResponse.json({ 
      success: true, 
      message: "Proses sinkronisasi selesai", 
      berhasil: changes,
      gagal: errors 
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
