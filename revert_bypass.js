const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');

code = code.replace(
  "let isSppLunas = santri.pembayaran_spp[0]?.status === 'lunas';\n        // BYPASS KHUSUS DEMO UNTUK ABDUL AZIZ ALI\n        if (santri.nis === '2601070002') isSppLunas = true;",
  "const isSppLunas = santri.pembayaran_spp[0]?.status === 'lunas';"
);

fs.writeFileSync('src/app/api/auth/login/route.ts', code);
