const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

code = code.replace(
  'Username / Email / No. WA <span',
  '{activeTab === "asatidzah" ? "Username / Email / No. WA" : "NIS (Nomor Induk Santri)"} <span'
);

fs.writeFileSync('src/app/login/page.tsx', code);
