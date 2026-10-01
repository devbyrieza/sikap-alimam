const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/page.tsx', 'utf8');

code = code.replace(
  'const kel = kelompokList.find(k => k.sesi === sesi && (k as any).pegawai_id === pegawaiId);',
  'const kel = kelompokList.find(k => (k as any).pegawai_id === pegawaiId);'
);

// We should also replace the API endpoint call in page.tsx if it sends sesi.
// Wait, `/api/halaqoh/kelompok` returns all groups anyway.
fs.writeFileSync('src/app/(dashboard)/halaqoh/page.tsx', code);
