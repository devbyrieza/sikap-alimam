const fs = require('fs');
const filePath = 'src/app/api/sync-halaqoh/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const searchParamsLogic = `  try {
    const { searchParams } = new URL(request.url);
    const resetCatatan = searchParams.get('resetCatatan') === 'true';
    const log: string[] = [];

    if (resetCatatan) {
      await prisma.catatanHalaqoh.deleteMany({});
      log.push("⚠️ Berhasil mereset semua data NILAI CATATAN HALAQOH.");
    }`;

code = code.replace(/try\s*\{\s*const log: string\[\] = \[\];/, searchParamsLogic);

fs.writeFileSync(filePath, code);
