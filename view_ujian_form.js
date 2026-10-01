const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', 'utf8');
const idx = code.indexOf('Surah');
console.log(code.substring(idx - 500, idx + 1000));
