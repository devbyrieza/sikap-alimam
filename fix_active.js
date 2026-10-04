const fs = require('fs');
let code = fs.readFileSync('src/app/api/master/santri/route.ts', 'utf8');

// Insert the self-healing SQL
code = code.replace(
  "UPDATE santri_aktif SET status_kesiswaan = 'aktif' WHERE status_kesiswaan IS NULL;",
  "UPDATE santri_aktif SET status_kesiswaan = 'aktif' WHERE status_kesiswaan IS NULL;\n        UPDATE santri_aktif SET is_active = true WHERE status_kesiswaan = 'aktif' AND is_active = false;"
);

fs.writeFileSync('src/app/api/master/santri/route.ts', code);
