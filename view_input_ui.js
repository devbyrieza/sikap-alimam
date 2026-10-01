const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', 'utf8');
const idx = code.indexOf('surah_to');
console.log(code.substring(idx - 1000, idx + 1000));
