const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/page.tsx', 'utf8');
const idx = code.indexOf('surahList');
console.log(code.substring(idx - 500, idx + 1000));
