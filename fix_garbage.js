const fs = require('fs');
const filePath = 'src/app/(dashboard)/halaqoh/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the giant block of garbage comments (starts with {/* Ã)
code = code.replace(/\{\/\* Ã[^\/]+\*\/\}/g, '');

// Replace specific garbled strings
code = code.replace(/ÃƒÆ’Â¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, '—');
code = code.replace(/ÃƒÆ’Â¢Ã¢â€šÂ¬Ã‚Â¦/g, '...');
code = code.replace(/ÃƒÆ’Â¢Ã¢â€šÂ¬Ã¢â‚¬Å“/g, '-');
code = code.replace(/ÃƒÆ’â€šÃ‚Â·/g, '·');

fs.writeFileSync(filePath, code);
