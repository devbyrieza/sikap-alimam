const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/nilai/page.tsx', 'utf8');

code = code.replace(
  '// Mode PTS Murni: Jika hanya mengisi Ujian PTS, tampilkan murni PTS\n    if (!data.harian && !data.kompetensi && !data.sikap && data.ujian) return u.toFixed(1);',
  '// MURNI PTS MODE\n    if (data.ujian) return u.toFixed(1);'
);

fs.writeFileSync('src/app/(dashboard)/nilai/page.tsx', code);
