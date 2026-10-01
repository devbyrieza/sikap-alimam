const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

code = code.replace(
  'useState<"asatidzah" | "wali">("asatidzah")',
  'useState<"asatidzah" | "wali">("wali")'
);

fs.writeFileSync('src/app/login/page.tsx', code);
