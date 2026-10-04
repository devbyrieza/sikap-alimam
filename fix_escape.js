const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/master/santri/kelengkapan/page.tsx', 'utf8');
code = code.split('\\`').join('`');
code = code.split('\\$').join('$');
fs.writeFileSync('src/app/(dashboard)/master/santri/kelengkapan/page.tsx', code);
