const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');

// Remove Sesi config & UI
code = code.replace(/const SESI_INFO: Record<string, [\s\S]*?\} \};/, '');

// Remove Sesi from form state
code = code.replace(/sesi: "subuh",\s*\n\s*/g, '');
code = code.replace(/sesi: k\.sesi,\s*\n\s*/g, '');
code = code.replace(/sesi: formKelompok\.sesi,\s*\n\s*/g, '');
code = code.replace(/sesi: string;\s*\n\s*/g, '');

// Remove validation for sesi
code = code.replace(/!formKelompok\.sesi \|\| /g, '');
code = code.replace(/Nama kelompok, sesi, dan pengampu/g, 'Nama kelompok dan pengampu');

// Replace Sesi badge in card
code = code.replace(
  /const sesiConfig = SESI_INFO\[k\.sesi\] \|\| SESI_INFO\.subuh;\n\s*const unassignedSantri/g,
  'const unassignedSantri'
);
code = code.replace(
  /<div style=\{\{ display: "inline-flex", alignItems: "center"[\s\S]*?\{sesiConfig\.icon\} \{sesiConfig\.label\}\n\s*<\/div>/g,
  ''
);

// Remove Sesi dropdown from form
code = code.replace(
  /<div>\s*<label style=\{labelStyle\}>Sesi Halaqoh<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/g,
  ''
);

fs.writeFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', code);
