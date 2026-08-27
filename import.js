const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  { nama: 'Ade Supiana', mapel: ['[7 MTs] Bahasa Indonesia'] },
  { nama: 'Agus Cahyono', mapel: ['[7 MTs] Khitobah', '[IL] Khitobah', '[IL] Tadribat Alal Anmath'] },
  { nama: 'Arifin Syaifullah', mapel: ['[7 MTs] Aqidah', '[IL] Aqidah'] },
  { nama: 'Imron Abdillah', mapel: ['[IL] Bahasa Arab', '[IL] Nahwu'] },
  { nama: 'Hardiansyah', mapel: ['[7 MTs] IPA Terpadu'] },
  { nama: 'Muhammad Ikbal', mapel: ['[7 MTs] Shorof', '[IL] Shorof', '[7 MTs] Tahsin', '[IL] Tahsin'] },
  { nama: 'Muhammad Thoriq', mapel: ['[7 MTs] Siroh', '[IL] Siroh', '[7 MTs] Hadits', '[IL] Hadits'] },
  { nama: 'Rieza Eka Tomara', mapel: ['[7 MTs] Matematika'] },
  { nama: 'Teguh Hudaya', mapel: ['[7 MTs] Entrepreneurship', '[IL] Entrepreneurship'] },
  { nama: 'Wahab Rajasam', mapel: ['[7 MTs] Fiqih', '[IL] Fiqih'] },
  { nama: 'Wahyudi Pranata', mapel: ['[7 MTs] Bahasa Arab'] },
  { nama: 'Bachtiar', mapel: ['[7 MTs] Bahasa Inggris'] }
];

async function updateDb() {
  for (const t of data) {
    const p = await prisma.pegawai.findFirst({ where: { nama_lengkap: { contains: t.nama } } });
    if (!p) {
      console.log('Guru tidak ditemukan:', t.nama);
      continue;
    }
    const mapelString = t.mapel.join(', ');
    await prisma.pegawai.update({
      where: { id: p.id },
      data: { mata_pelajaran: mapelString }
    });
    console.log('Updated', p.nama_lengkap, '->', mapelString);
  }
}
updateDb().then(() => console.log('Done')).catch(console.error);
