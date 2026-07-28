import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan Seeder Kurikulum & Jadwal...');

  // 1. Seed Kelas
  const kelas7 = await prisma.kelas.upsert({
    where: { nama: '7 MTs' },
    update: {},
    create: { nama: '7 MTs', jenjang: 'MTs' },
  });
  
  const kelasIL = await prisma.kelas.upsert({
    where: { nama: 'I\'dad Lughowy' },
    update: {},
    create: { nama: 'I\'dad Lughowy', jenjang: 'Islamiyah' },
  });

  // 2. Data Guru (Sesuai PDF)
  const dataGuru = [
    { kode: 'A', nama: 'Abdil Aziz, B.A.' },
    { kode: 'B', nama: 'Ade Supiana' },
    { kode: 'C', nama: 'Agus Cahyono' },
    { kode: 'D', nama: 'Arifin Syaifullah, Lc., M.M., M.Pd.' },
    { kode: 'E', nama: 'Imran Abdillah, Lc.' },
    { kode: 'F', nama: 'Hardiansyah' },
    { kode: 'G', nama: 'Muhammad Ikbal, S.Pd.' },
    { kode: 'H', nama: 'Muhammad Thoriq, Lc.' },
    { kode: 'I', nama: 'Rieza' },
    { kode: 'J', parseInt: 'Teguh Hudaya, Lc., M.M.', nama: 'Teguh Hudaya, Lc., M.M.' },
    { kode: 'K', nama: 'Wahab Rajasam, M.Pd.' },
    { kode: 'L', nama: 'Wahyudi Pranata, B.A.' },
    { kode: 'M', nama: 'Muhammad Maulana Rizki' },
    { kode: 'N', nama: 'Ramdan' },
  ];

  const guruMap = new Map();
  for (const g of dataGuru) {
    // Generate UUID or use dummy NIK for upsert
    const nikDummy = `GURU-${g.kode}`;
    const pegawai = await prisma.pegawai.upsert({
      where: { nik: nikDummy },
      update: { nama_lengkap: g.nama },
      create: { 
        nik: nikDummy, 
        nama_lengkap: g.nama, 
        kategori_pegawai: 'ASATIDZ' 
      },
    });
    guruMap.set(g.kode, pegawai.id);
  }

  // 3. Data Mapel (Sesuai PDF)
  const dataMapel = [
    { id_mapel: '1', nama: 'Akidah', kategori: 'syariah' },
    { id_mapel: '2', nama: 'Hadis', kategori: 'syariah' },
    { id_mapel: '3', nama: 'Fiqh', kategori: 'syariah' },
    { id_mapel: '4', nama: 'Siroh Nabi', kategori: 'syariah' },
    { id_mapel: '5', nama: 'Kitabah', kategori: 'bahasa' },
    { id_mapel: '6', nama: 'Nahwu', kategori: 'bahasa' },
    { id_mapel: '7', nama: 'Shorf', kategori: 'bahasa' },
    { id_mapel: '8', nama: 'Bahasa Arab', kategori: 'bahasa' },
    { id_mapel: '9', nama: 'Entrepreneurship', kategori: 'umum' },
    { id_mapel: '10', nama: 'Bahasa Indonesia', kategori: 'umum' },
    { id_mapel: '11', nama: 'Bahasa Inggris', kategori: 'umum' },
    { id_mapel: '12', nama: 'Matematika', kategori: 'umum' },
    { id_mapel: '13', nama: 'IPA Terpadu', kategori: 'umum' },
    { id_mapel: '14', nama: 'Tadribat Alal Anmath', kategori: 'bahasa' },
    { id_mapel: 'TS', nama: 'Tahsin/Tahfizh Al-Quran', kategori: 'syariah' },
  ];

  const mapelMap = new Map();
  for (const m of dataMapel) {
    const mapel = await prisma.mataPelajaran.upsert({
      where: { 
        nama_kelas_id: { nama: m.nama, kelas_id: kelas7.id } 
      },
      update: { kategori: m.kategori },
      create: { 
        nama: m.nama, 
        kategori: m.kategori, 
        kelas_id: kelas7.id 
      },
    });
    mapelMap.set(m.id_mapel, mapel.id);
  }

  // 4. Sample Jadwal Pelajaran (Pekan 1 & 3 - Ganjil) - Hari Senin
  const jadwalGanjil = [
    // Senin Jam 3 (07:00-07:40) - TS (Tahsin)
    { hari: 'Senin', jam_ke: 3, waktu_mulai: '07:00', waktu_selesai: '07:40', kelas_id: kelas7.id, pegawai_id: guruMap.get('A'), mapel_id: mapelMap.get('TS'), tipe_pekan: 'ganjil' },
    // Senin Jam 4 (07:40-08:20) - B10 (Ade Supiana, B. Indo)
    { hari: 'Senin', jam_ke: 4, waktu_mulai: '07:40', waktu_selesai: '08:20', kelas_id: kelas7.id, pegawai_id: guruMap.get('B'), mapel_id: mapelMap.get('10'), tipe_pekan: 'ganjil' },
    // Senin Jam 5 (08:20-09:00) - B10 (Ade Supiana, B. Indo)
    { hari: 'Senin', jam_ke: 5, waktu_mulai: '08:20', waktu_selesai: '09:00', kelas_id: kelas7.id, pegawai_id: guruMap.get('B'), mapel_id: mapelMap.get('10'), tipe_pekan: 'ganjil' },
    // Senin Jam 6 (09:00-09:40) - L8 (Wahyudi, B. Arab)
    { hari: 'Senin', jam_ke: 6, waktu_mulai: '09:00', waktu_selesai: '09:40', kelas_id: kelas7.id, pegawai_id: guruMap.get('L'), mapel_id: mapelMap.get('8'), tipe_pekan: 'ganjil' },
  ];

  // Hapus jadwal existing untuk testing (Optional)
  await prisma.jadwalPelajaran.deleteMany();

  for (const j of jadwalGanjil) {
    if (j.pegawai_id && j.mapel_id) {
      await prisma.jadwalPelajaran.create({
        data: j,
      });
    }
  }

  // 5. Seed Master Sesi Waktu (Jam Pelajaran)
  const defaultSesi = [
    { jam_ke: 1, waktu_mulai: "04:50", waktu_selesai: "05:30", durasi_menit: 40 },
    { jam_ke: 2, waktu_mulai: "05:30", waktu_selesai: "06:10", durasi_menit: 40 },
    { jam_ke: 3, waktu_mulai: "07:00", waktu_selesai: "07:40", durasi_menit: 40 },
    { jam_ke: 4, waktu_mulai: "07:40", waktu_selesai: "08:20", durasi_menit: 40 },
    { jam_ke: 5, waktu_mulai: "08:20", waktu_selesai: "09:00", durasi_menit: 40 },
    { jam_ke: 6, waktu_mulai: "09:00", waktu_selesai: "09:40", durasi_menit: 40 },
    { jam_ke: 7, waktu_mulai: "10:00", waktu_selesai: "10:40", durasi_menit: 40 },
    { jam_ke: 8, waktu_mulai: "10:40", waktu_selesai: "11:20", durasi_menit: 40 },
    { jam_ke: 9, waktu_mulai: "11:20", waktu_selesai: "12:00", durasi_menit: 40 },
    { jam_ke: 10, waktu_mulai: "18:10", waktu_selesai: "18:50", durasi_menit: 40 },
    { jam_ke: 11, waktu_mulai: "18:50", waktu_selesai: "19:30", durasi_menit: 40 },
  ];

  await prisma.masterSesiWaktu.deleteMany();
  for (const s of defaultSesi) {
    await prisma.masterSesiWaktu.create({
      data: s,
    });
  }
  console.log("✅ Seeding Sesi Waktu Selesai!");

  console.log("✅ Seeding Selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
