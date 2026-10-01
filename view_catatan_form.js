const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/page.tsx', 'utf8');
const idx = code.indexOf('DualSurahPicker');
if (idx !== -1) {
    console.log('Found DualSurahPicker');
    console.log(code.substring(idx - 500, idx + 1000));
} else {
    console.log('DualSurahPicker not found in halaqoh/page.tsx');
}
