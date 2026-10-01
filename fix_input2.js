const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', 'utf8');

code = code.replace('&surahSelesai=', '&surah_selesai=');
fs.writeFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', code);
