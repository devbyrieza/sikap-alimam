import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDemo() {
  try {
    console.log("Mulai membuat data Kelas Demo...");

    // 1. Buat Kelas Demo
    let kelasDemo = await prisma.kelas.findFirst({ where: { nama: 'Kelas Demo' } });
    if (!kelasDemo) {
      kelasDemo = await prisma.kelas.create({
        data: {
          nama: 'Kelas Demo',
          jenjang: 'DEMO',
        }
      });
    }
    console.log(`✅ Kelas berhasil disiapkan: ${kelasDemo.nama}`);

    // 2. Buat Mapel Demo
    let mapelDemo = await prisma.mataPelajaran.findFirst({ where: { nama: 'Training SIKAP' } });
    if (!mapelDemo) {
      mapelDemo = await prisma.mataPelajaran.create({
        data: {
          nama: 'Training SIKAP',
          kategori: 'UMUM',
          kelas_id: kelasDemo.id,
        }
      });
    }
    console.log(`✅ Mata Pelajaran berhasil disiapkan: ${mapelDemo.nama}`);

    // 3. Buat Santri Dummy
    const santriNames = ['Fulan bin Fulan (Demo)', 'Abdullah (Demo)', 'Zaid (Demo)'];
    let count = 0;
    for (const name of santriNames) {
      const existing = await prisma.santriAktif.findFirst({
        where: { nama_lengkap: name, kelas_id: kelasDemo.id }
      });
      
      if (!existing) {
        await prisma.santriAktif.create({
          data: {
            nama_lengkap: name,
            kelas_id: kelasDemo.id,
            is_active: true,
          }
        });
        count++;
      }
    }
    console.log(`✅ ${count} Santri Demo berhasil dimasukkan ke ${kelasDemo.nama}`);
    
    console.log("\n🚀 SELESAI! Anda sekarang bisa mendemokan aplikasi dengan aman menggunakan:");
    console.log("- Kelas: 'Kelas Demo'");
    console.log("- Mata Pelajaran: 'Training SIKAP'");

  } catch (error) {
    console.error("Gagal membuat data demo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDemo();
