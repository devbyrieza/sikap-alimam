const fs = require('fs');
const filePath = 'src/app/api/sync-halaqoh/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  'await prisma.halaqohKelompok.deleteMany({});',
  '// Tidak menghapus kelompok lama agar CatatanHalaqoh tidak hilang'
);
code = code.replace(
  'log.push("✅ Berhasil mereset (menghapus) semua kelompok halaqoh lama.");',
  'log.push("✅ Berhasil mereset (menghapus) keanggotaan santri dari kelompok halaqoh lama.");'
);

const oldCreate = `const kelompok = await prisma.halaqohKelompok.create({
        data: {
          pegawai_id: pegawai.id,
          nama_kelompok: data.nama_kelompok,
          tingkatan: data.tingkatan
        }
      });`;

const newCreate = `let kelompok = await prisma.halaqohKelompok.findFirst({
        where: { pegawai_id: pegawai.id }
      });
      if (!kelompok) {
        kelompok = await prisma.halaqohKelompok.create({
          data: {
            pegawai_id: pegawai.id,
            nama_kelompok: data.nama_kelompok,
            tingkatan: data.tingkatan
          }
        });
      } else {
        await prisma.halaqohKelompok.update({
          where: { id: kelompok.id },
          data: { nama_kelompok: data.nama_kelompok, tingkatan: data.tingkatan }
        });
      }`;

code = code.replace(oldCreate, newCreate);
fs.writeFileSync(filePath, code);
