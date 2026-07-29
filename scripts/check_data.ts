import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const totalUsers = await prisma.user.count();
    const totalPegawai = await prisma.pegawai.count();
    const totalKelas = await prisma.kelas.count();
    const totalMapel = await prisma.mataPelajaran.count();
    const totalSantri = await prisma.santriAktif.count();
    
    console.log("=== LAPORAN KESIAPAN DATA SIKAP ===");
    console.log(`Jumlah Akun Pengguna (User)  : ${totalUsers}`);
    console.log(`Jumlah Data Guru (Pegawai)   : ${totalPegawai}`);
    console.log(`Jumlah Data Kelas            : ${totalKelas}`);
    console.log(`Jumlah Mata Pelajaran        : ${totalMapel}`);
    console.log(`Jumlah Santri Aktif          : ${totalSantri}`);
    
    if (totalUsers > 0 && totalPegawai > 0 && totalKelas > 0 && totalMapel > 0 && totalSantri > 0) {
        console.log("\nSTATUS: Data Master sudah TERISI.");
    } else {
        console.log("\nSTATUS: Terdapat Data Master yang KOSONG. Harap lengkapi terlebih dahulu.");
    }
  } catch (error) {
    console.error("Gagal mengecek data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
