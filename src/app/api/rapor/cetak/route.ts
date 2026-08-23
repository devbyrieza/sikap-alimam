import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const santri_id = searchParams.get("santri_id");
  const semester = searchParams.get("semester") || "1";
  const tahun_ajaran = searchParams.get("tahun_ajaran") || "2025/2026";

  if (!santri_id) {
    return NextResponse.json(
      { error: "santri_id is required" },
      { status: 400 }
    );
  }

  try {
    // 1. Ambil Data Santri
    const santri = await prisma.santriAktif.findUnique({
      where: { id: santri_id },
      include: {
        kelas: true } });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // 2. Ambil Nilai Akademik
    const nilai = await prisma.nilaiSantri.findMany({
      where: { 
        santri_id,
        semester,
        tahun_ajaran,
        jenis: "pas" // Anggap nilai akhir diambil dari PAS
      },
      include: {
        mapel: true }
    });

    // Kelompokkan Nilai Berdasarkan Kategori Mapel
    const syariah = nilai.filter(n => n.mapel.kategori === "syariah");
    const bahasa = nilai.filter(n => n.mapel.kategori === "bahasa");
    const umum = nilai.filter(n => n.mapel.kategori === "umum");

    // 3. Ambil Ketidakhadiran (Rekap per semester)
    const presensi = await prisma.presensiSiswa.findMany({
      where: { santri_id }, // Idealnya difilter berdasarkan rentang tanggal semester
    });

    const getDateString = (d: Date) => d.toISOString().split("T")[0];
    const datesSakit = new Set<string>();
    const datesIzin = new Set<string>();
    const datesAlpha = new Set<string>();

    presensi.forEach(p => {
      const d = getDateString(p.tanggal);
      if (p.status === "sakit") datesSakit.add(d);
      if (p.status === "izin") datesIzin.add(d);
      if (p.status === "alpha") datesAlpha.add(d);
    });

    const absen = {
      sakit: datesSakit.size,
      izin: datesIzin.size,
      alpha: datesAlpha.size };

    // 4. Ambil Nilai Kepribadian & Kedisiplinan (BPI)
    // Di real app, kita agregasi seluruh data ibadah menjadi nilai huruf.
    // Sementara kita mock nilainya.
    const kepribadian = {
      perilaku: "A",
      kedisiplinan: "B",
      kerajinan: "A",
      kebersihan: "A"
    };

    // 4b. Ambil Mutabaah Tahfidz
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 20, // 20 riwayat terakhir
    });

    // 5. Kalkulasi Total & Rata-rata
    const totalNilai = nilai.reduce((sum, n) => sum + n.nilai, 0);
    const rataRata = nilai.length > 0 ? (totalNilai / nilai.length).toFixed(1) : 0;
    
    // Mock Ranking & Jumlah Santri
    const ranking = 5; 
    const jumlahSantri = 32;

    return NextResponse.json({
      santri: {
        nama: santri.nama_lengkap,
        nis: santri.nis,
        kelas: santri.kelas.nama,
        semester,
        tahun_ajaran
      },
      nilai_akademik: {
        syariah: syariah.map(s => ({
          nama: s.mapel.nama,
          nama_arab: s.mapel.nama_arab || s.mapel.nama,
          kkm: 60, // Mock KKM
          nilai: s.nilai,
          rata_rata_kelas: 80 // Mock
        })),
        bahasa: bahasa.map(b => ({
          nama: b.mapel.nama,
          nama_arab: b.mapel.nama_arab || b.mapel.nama,
          kkm: 60,
          nilai: b.nilai,
          rata_rata_kelas: 82
        })),
        umum: umum.map(u => ({
          nama: u.mapel.nama,
          nama_arab: u.mapel.nama_arab || u.mapel.nama,
          kkm: 65,
          nilai: u.nilai,
          rata_rata_kelas: 85
        })) },
      kedisiplinan: {
        totalNilai,
        rataRata,
        ranking,
        jumlahSantri
      },
      kepribadian,
      absen,
      tahfidz
    });
  } catch (error) {
    console.error("Error fetching data rapor cetak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
