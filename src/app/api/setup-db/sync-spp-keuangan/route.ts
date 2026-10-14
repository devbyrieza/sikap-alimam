import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Data resmi dari Admin Keuangan Pesantren Islam Al-Imam
// Semester Ganjil TA 2026/2027 (Juli - Oktober 2026)
const DATA_SPP_EXCEL = [
  // --- KELAS 7A / 7 MTs ---
  { nama: "Atqanul Ummah Ahmad", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: false },
  { nama: "Abdul Aziz Ali", kelas: "7 MTs", nominal: 1000000, juli: false, agustus: false, september: false, oktober: false },
  { nama: "Abdul Hakim", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Ahmad Farros Al Barqy", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Andi Ibra Faeyza Hasan Alnasr", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Azka Panji Kusuma", kelas: "7 MTs", nominal: 500000, juli: false, agustus: false, september: false, oktober: false },
  { nama: "Fariq Malaibui", kelas: "7 MTs", nominal: 500000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Haidar Ayyubi", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Khalish", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Labibullah El Fatih", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "M Fazril Alkais", kelas: "7 MTs", nominal: 500000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "M Naufal Alfaniri", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Rifqi Hamid", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: false },
  { nama: "Muh Asrorin Da Silva", kelas: "7 MTs", nominal: 500000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Hafidz Reo Afelano", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: false },
  { nama: "Muhammad Yahya Ayyash", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Naufal Dzakiy Purnama", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Rifqi Arsyad Fadilah", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: false, september: false, oktober: false },
  { nama: "Muhammad Azzam Al Hafiz", kelas: "7 MTs", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },

  // --- KELAS IL / I'DAD LUGHOWI ---
  { nama: "Abdullah Rasyid", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: false, oktober: true },
  { nama: "Abdurrahim Pati Raja", kelas: "IL", nominal: 500000, juli: true, agustus: true, september: true, oktober: false },
  { nama: "Daffa Muammar Dzaki", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Farid", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Favian Radi", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: false },
  { nama: "Fanni Hariri Hamonangan", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: false, oktober: false },
  { nama: "Fiqri Ramdan Handoko", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Hibban Hibaturrahman", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Khubaib Abdul Aziz", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Ken Alfarezha Haryadi", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Lalu Muhamad Rizky Ananda", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Miizan Alghifary Dizlilar", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Hafidz Abdurrahman", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Khoirul Azzam", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Rasyid Ridho", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Muhammad Rizky", kelas: "IL", nominal: 500000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Nurcahya Eka Putra", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Panji Ahmad", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Syeh Al Bani Irsyad Amrulloh", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Wahyu Hidayat", kelas: "IL", nominal: 1000000, juli: true, agustus: true, september: true, oktober: true },
  { nama: "Iman Prayogo", kelas: "IL", nominal: 1000000, juli: false, agustus: true, september: true, oktober: true },
];

export async function GET() {
  try {
    const logs: any[] = [];

    // 1. Ambil semua santri aktif
    const allSantri = await prisma.santriAktif.findMany({
      include: { kelas: true }
    });

    // 2. Hubungkan Wali Kelas di tabel Kelas jika belum
    const ustadzAgus = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: "Agus Cahyono", mode: "insensitive" } }
    });
    const ustadzImron = await prisma.pegawai.findFirst({
      where: { nama_lengkap: { contains: "Imron", mode: "insensitive" } }
    });

    if (ustadzAgus) {
      await prisma.kelas.updateMany({
        where: {
          OR: [
            { nama: { contains: "7", mode: "insensitive" } },
            { jenjang: "MTs" }
          ]
        },
        data: { wali_kelas_id: ustadzAgus.id }
      });
      logs.push(`Wali Kelas 7 MTs ditautkan ke: ${ustadzAgus.nama_lengkap}`);
    }

    if (ustadzImron) {
      await prisma.kelas.updateMany({
        where: {
          OR: [
            { nama: "IL" },
            { jenjang: "IL" },
            { nama: { contains: "I'dad", mode: "insensitive" } }
          ]
        },
        data: { wali_kelas_id: ustadzImron.id }
      });
      logs.push(`Wali Kelas IL ditautkan ke: ${ustadzImron.nama_lengkap}`);
    }

    // 3. Sinkronkan pembayaran SPP untuk 4 bulan: Juli (7), Agustus (8), September (9), Oktober (10) 2026
    let recordsCreated = 0;
    let recordsUpdated = 0;

    for (const item of DATA_SPP_EXCEL) {
      const cleanTarget = item.nama.toLowerCase().replace(/[^a-z0-9]/g, "");
      const santri = allSantri.find(s => {
        const cleanDb = s.nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanDb === cleanTarget || cleanDb.includes(cleanTarget) || cleanTarget.includes(cleanDb);
      });

      if (!santri) {
        logs.push({ status: "SANTRI_NOT_FOUND", nama: item.nama });
        continue;
      }

      const bulanList = [
        { bulan: 7, lunas: item.juli, tgl: "2026-07-08T08:00:00.000Z" },
        { bulan: 8, lunas: item.agustus, tgl: "2026-08-07T08:00:00.000Z" },
        { bulan: 9, lunas: item.september, tgl: "2026-09-08T08:00:00.000Z" },
        { bulan: 10, lunas: item.oktober, tgl: "2026-10-06T08:00:00.000Z" },
      ];

      for (const b of bulanList) {
        const existing = await prisma.pembayaranSPP.findUnique({
          where: {
            santri_id_bulan_tahun: {
              santri_id: santri.id,
              bulan: b.bulan,
              tahun: 2026
            }
          }
        });

        const statusStr = b.lunas ? "lunas" : "belum_lunas";
        const tglBayar = b.lunas ? new Date(b.tgl) : null;

        if (existing) {
          await prisma.pembayaranSPP.update({
            where: { id: existing.id },
            data: {
              status: statusStr,
              nominal: item.nominal,
              tanggal_bayar: tglBayar,
              metode_bayar: b.lunas ? "transfer" : null,
              catatan: b.lunas ? "Terverifikasi Bagian Keuangan" : "Belum ada konfirmasi transfer"
            }
          });
          recordsUpdated++;
        } else {
          await prisma.pembayaranSPP.create({
            data: {
              santri_id: santri.id,
              bulan: b.bulan,
              tahun: 2026,
              status: statusStr,
              nominal: item.nominal,
              tanggal_bayar: tglBayar,
              metode_bayar: b.lunas ? "transfer" : null,
              catatan: b.lunas ? "Terverifikasi Bagian Keuangan" : "Belum ada konfirmasi transfer"
            }
          });
          recordsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil sinkronisasi SPP 40 santri (Juli-Oktober 2026) sesuai data Admin Keuangan.`,
      recordsCreated,
      recordsUpdated,
      totalExpectedRecords: DATA_SPP_EXCEL.length * 4,
      logs
    });
  } catch (error: any) {
    console.error("Error syncing SPP data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
