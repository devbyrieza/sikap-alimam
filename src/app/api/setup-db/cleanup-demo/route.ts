import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const email = "pribadi.guru@pesantren-alimam.com";

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email } });

    if (!user) {
      return NextResponse.json({ message: "Akun demo tidak ditemukan." });
    }

    const userId = user.id;

    // 2. Jalankan transaksi penghapusan
    await prisma.$transaction(async (tx) => {
      // A. Hapus token reset password jika ada
      await tx.passwordResetToken.deleteMany({
        where: { user_id: userId }
      });

      // B. Cari Pegawai yang terhubung dengan user ini
      const pegawai = await tx.pegawai.findFirst({
        where: { user_id: userId }
      });

      if (pegawai) {
        const pegawaiId = pegawai.id;

        // C. Hapus Jurnal Mengajar
        await tx.jurnalMengajar.deleteMany({
          where: { pegawai_id: pegawaiId }
        });

        // D. Hapus Presensi Asatidz
        await tx.presensiAsatidz.deleteMany({
          where: { pegawai_id: pegawaiId }
        });

        // E. Hapus Relasi AsatidzmMapel
        await tx.asatidzmMapel.deleteMany({
          where: { pegawai_id: pegawaiId }
        });

        // F. Hapus Capaian Tahfidz (Mutabaah)
        await tx.capaianTahfidz.deleteMany({
          where: { pegawai_id: pegawaiId }
        });

        // G. Hapus IbadahAdabSantri
        await tx.ibadahAdabSantri.deleteMany({
          where: { pegawai_id: pegawaiId }
        });
        
        // H. Hapus JadwalPelajaran
        await tx.jadwalPelajaran.deleteMany({
          where: { pegawai_id: pegawaiId }
        });

        // I. Hapus Data Pegawai
        await tx.pegawai.delete({
          where: { id: pegawaiId }
        });
      }

      // J. Hapus Data User
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ message: "Data akun demo berhasil dihapus dari database." });
  } catch (error: any) {
    return NextResponse.json({ message: "Gagal menghapus akun demo.", error: error.message }, { status: 500 });
  }
}
