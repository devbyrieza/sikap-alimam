const fs = require('fs');
const filePath = 'src/app/(dashboard)/halaqoh/kelompok/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/sesi: "subuh",\s*/g, '');
code = code.replace(/sesi: k\.sesi,\s*/g, '');

fs.writeFileSync(filePath, code);
