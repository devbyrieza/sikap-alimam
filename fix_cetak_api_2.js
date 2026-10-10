const fs = require('fs');
let file = fs.readFileSync('src/app/api/rapor/cetak/route.ts', 'utf8');

const target = `
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 10
    });
`;

const replacement = `
    const tahfidz = await prisma.capaianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 10
    });
    
    const ujian_tahfidz = await prisma.ujianTahfidz.findMany({
      where: { santri_id },
      orderBy: { tanggal: "desc" },
      take: 5
    });
`;

file = file.replace(target, replacement);
file = file.replace('tahfidz,\n      absen,', 'tahfidz,\n      ujian_tahfidz,\n      absen,');
file = file.replace('tahfidz,\r\n      absen,', 'tahfidz,\r\n      ujian_tahfidz,\r\n      absen,');

fs.writeFileSync('src/app/api/rapor/cetak/route.ts', file);
