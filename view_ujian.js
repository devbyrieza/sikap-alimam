const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', 'utf8');
const idx = code.indexOf('surah_nomor');
console.log(code.substring(idx - 200, idx + 1000));
