const fs = require('fs');
let code = fs.readFileSync('src/app/api/nilai/route.ts', 'utf8');

const targetStr = `        if (existing) {
          await prisma.nilaiSantri.update({
            where: { id: existing.id },
            data: {
              nilai: numValue } });
        } else {
          await prisma.nilaiSantri.create({
            data: {
              santri_id: item.santri_id,
              mapel_id: finalMapelId,
              kelas_id,
              semester,
              jenis,
              tahun_ajaran,
              nilai: numValue } });
        }
        count++;
      }`;

const replaceStr = `        if (existing) {
          await prisma.nilaiSantri.update({
            where: { id: existing.id },
            data: {
              nilai: numValue } });
        } else {
          await prisma.nilaiSantri.create({
            data: {
              santri_id: item.santri_id,
              mapel_id: finalMapelId,
              kelas_id,
              semester,
              jenis,
              tahun_ajaran,
              nilai: numValue } });
        }
        count++;
      } else if (value === '' || value === null) {
        // Hapus record jika user mengosongkan form
        const existing = await prisma.nilaiSantri.findFirst({
          where: {
            santri_id: item.santri_id,
            mapel_id: finalMapelId,
            kelas_id,
            semester,
            jenis,
            tahun_ajaran }
        });
        if (existing) {
          await prisma.nilaiSantri.delete({ where: { id: existing.id } });
          count++;
        }
      }`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/app/api/nilai/route.ts', code);
