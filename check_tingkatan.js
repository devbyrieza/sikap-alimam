const fs = require('fs');
const code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');
console.log(code.includes('tingkatan') ? 'Has tingkatan' : 'No tingkatan');
