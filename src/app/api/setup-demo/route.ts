import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Cari kelas sembarang yang aktif
    const kelas = await prisma.kelas.findFirst({ where: { is_active: true } });
    if (!kelas) return NextResponse.json({ error: "Tidak ada kelas aktif" });

    const nisDemo = "DEMO999";

    // 2. Cek apakah santri demo sudah ada
    let santri = await prisma.santriAktif.findUnique({ where: { nis: nisDemo } });
    
    if (!santri) {
      // 3. Buat Santri Demo
      santri = await prisma.santriAktif.create({
        data: {
          nis: nisDemo,
          nama_lengkap: "Ananda Demo SIKAP",
          kelas_id: kelas.id,
          jenis_kelamin: "L",
          status_kesiswaan: "aktif",
          is_active: true
        }
      });
    }

    // 4. Pastikan SPP Lunas
    const bulan = new Date().getMonth() + 1;
    const tahun = new Date().getFullYear();
    const spp = await prisma.pembayaranSPP.findFirst({
      where: { santri_id: santri.id, bulan, tahun }
    });

    if (!spp) {
      await prisma.pembayaranSPP.create({
        data: {
          santri_id: santri.id,
          bulan,
          tahun,
          status: "lunas",
          tanggal_bayar: new Date(),
          nominal: 500000,
          catatan: "Lunas otomatis untuk akun demo"
        }
      });
    } else if (spp.status !== "lunas") {
      await prisma.pembayaranSPP.update({
        where: { id: spp.id },
        data: { status: "lunas" }
      });
    }

    // 5. Masukkan Nilai PTS dummy jika belum ada
    const mapel = await prisma.mataPelajaran.findFirst({ where: { kelas_id: kelas.id } });
    if (mapel) {
      const nilai = await prisma.nilaiSantri.findFirst({
        where: { santri_id: santri.id, mapel_id: mapel.id, jenis: "pts" }
      });
      if (!nilai) {
        await prisma.nilaiSantri.create({
          data: {
            santri_id: santri.id,
            mapel_id: mapel.id,
            kelas_id: kelas.id,
            semester: "1",
            tahun_ajaran: "2025/2026",
            jenis: "pts",
            nilai: 95
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun demo berhasil disiapkan!",
      login_info: {
        url: "https://sikap.pesantren-alimam.com/login",
        tab: "WALI SANTRI",
        username_nis: nisDemo,
        password: "Paas2026!"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
