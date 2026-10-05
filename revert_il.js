const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/nilai/page.tsx', 'utf8');

code = code.replace(
  'const nama = selectedKelasInfo?.nama.toLowerCase() || ""; return nama.includes("11 ma") || nama.includes("12 ma") || nama === "il";',
  'const nama = selectedKelasInfo?.nama.toLowerCase() || ""; return nama.includes("11 ma") || nama.includes("12 ma");'
);

fs.writeFileSync('src/app/(dashboard)/nilai/page.tsx', code);
