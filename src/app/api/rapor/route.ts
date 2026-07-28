import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const santri_id = searchParams.get("santri_id");

  if (!santri_id) {
    return NextResponse.json(
      { error: "santri_id is required" },
      { status: 400 }
    );
  }

  try {
    // 1. Get Data Santri
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: {
        kelas: true,
      },
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // 2. Get Presensi
    const presensi = await prisma.presensiSiswa.findMany({
      where: { santri_id },
    });
    const totalHari = presensi.length || 1; // avoid div 0
    const totalHadir = presensi.filter((p) => p.status === "hadir").length;
    const persentaseKehadiran = Math.round((totalHadir / totalHari) * 100);

    // 3. Get Tahfidz
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: 'desc' },
      take: 10,
    });

    // 4. Get Akademik (Nilai Santri)
    const akademik = await prisma.nilaiSantri.findMany({
      where: { santri_id },
      include: {
        mapel: true,
      }
    });

    // 5. Get Ibadah & Adab
    const ibadah = await prisma.ibadahAdabSantri.findMany({
      where: { santri_id },
      orderBy: { tanggal: 'desc' },
      take: 30, // Sebulan terakhir
    });

    // Aggregasi Ibadah
    let shubuhJamaah = 0;
    ibadah.forEach(i => {
      if (i.shubuh === "Berjamaah") shubuhJamaah++;
    });
    const persentaseShubuh = ibadah.length > 0 ? Math.round((shubuhJamaah / ibadah.length) * 100) : 0;

    return NextResponse.json({
      santri: {
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas.nama,
      },
      ringkasan: {
        persentaseKehadiran,
        persentaseShubuh,
      },
      detail: {
        tahfidz,
        akademik,
        ibadah,
      }
    });
  } catch (error) {
    console.error("Error generating rapor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
