const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');
const idx = code.indexOf('Nama Kelompok</label>');
console.log(code.substring(idx - 100, idx + 1000));
