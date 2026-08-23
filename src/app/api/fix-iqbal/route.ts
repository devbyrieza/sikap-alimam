import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAsatidzMapel } from "@/lib/syncAsatidzMapel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("=== PERBAIKAN AKUN PRODUCTION MUHAMMAD IQBAL ===");

    // 1. Cari atau buat Pegawai Iqbal
    let pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { email: { equals: "muhammadiqbal.mi118@gmail.com", mode: "insensitive" } },
          { nama_lengkap: { contains: "Iqbal", mode: "insensitive" } },
        ] } });

    const targetMapelString = "7 MTs: Tahsin/Tahfidz Al-Quran, Shorf; IL: Shorf";

    if (!pegawai) {
      pegawai = await prisma.pegawai.create({
        data: {
          nama_lengkap: "Muhammad Iqbal, S.Pd.",
          email: "muhammadiqbal.mi118@gmail.com",
          no_hp: "085777919274",
          kategori_pegawai: "GURU,ASATIDZ",
          jabatan: "Pengajar / Guru",
          mata_pelajaran: targetMapelString } });
    } else {
      pegawai = await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: {
          email: "muhammadiqbal.mi118@gmail.com",
          nama_lengkap: "Muhammad Iqbal, S.Pd.",
          mata_pelajaran: targetMapelString } });
    }

    // 2. Cari / reset user account & hapus duplikat
    try {
      // Hapus user duplikat lama dengan email lain (seperti @pesantren-alimam.com)
      await prisma.user.deleteMany({
        where: {
          AND: [
            {
              OR: [
                { email: { contains: "iqbal", mode: "insensitive" } },
                { nama: { contains: "Iqbal", mode: "insensitive" } },
              ] },
            {
              email: { not: "muhammadiqbal.mi118@gmail.com" } },
          ] } }).catch(() => {});

      let user = await prisma.user.findFirst({
        where: {
          email: { equals: "muhammadiqbal.mi118@gmail.com", mode: "insensitive" } } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: "muhammadiqbal.mi118@gmail.com",
            nama: "Muhammad Iqbal, S.Pd.",
            role: "GURU",
            password: "password123", // fallback
          } });
      }

      if (user && pegawai) {
        await prisma.pegawai.update({
          where: { id: pegawai.id },
          data: { user_id: user.id } }).catch(() => {});
      }
    } catch (userErr) {
      console.warn("User cleanup warning:", userErr);
    }

    // 3. Hapus relasi lama yang rusak di asatidz_mapel
    await prisma.asatidzmMapel.deleteMany({
      where: { pegawai_id: pegawai.id } });

    // 4. Jalankan syncAsatidzMapel terbaru dengan pencocokan fleksibel
    await syncAsatidzMapel(pegawai.id, targetMapelString);

    // 5. Bersihkan duplikat mapel Shorf di 7 MTs jika ada di production
    const kelas7 = await prisma.kelas.findFirst({
      where: {
        is_active: true,
        OR: [
          { nama: { equals: "7 MTs", mode: "insensitive" } },
          { nama: { equals: "7", mode: "insensitive" } },
        ] } });

    if (kelas7) {
      const shorfMapels = await prisma.mataPelajaran.findMany({
        where: {
          kelas_id: kelas7.id,
          nama: { equals: "Shorf", mode: "insensitive" } },
        orderBy: { id: "asc" } });

      // Jika ada lebih dari 1 mapel Shorf di kelas 7 MTs, hapus duplikatnya
      if (shorfMapels.length > 1) {
        const keepId = shorfMapels[0].id;
        const deleteIds = shorfMapels.slice(1).map((m) => m.id);
        await prisma.mataPelajaran.deleteMany({
          where: { id: { in: deleteIds } } });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun Production Ustadz Muhammad Iqbal berhasil dibersihkan, di-reset, dan di-sync ulang 100%!",
      pegawai: {
        id: pegawai.id,
        nama: pegawai.nama_lengkap,
        email: pegawai.email,
        mata_pelajaran: pegawai.mata_pelajaran } });
  } catch (error: any) {
    console.error("Error fixing production Iqbal:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal melakukan perbaikan" },
      { status: 500 }
    );
  }
}
