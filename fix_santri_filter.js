const fs = require('fs');
let code = fs.readFileSync('src/app/api/master/santri/route.ts', 'utf8');

code = code.replace(
  'whereClause.is_active = true;',
  'whereClause.status_kesiswaan = "aktif";'
);

fs.writeFileSync('src/app/api/master/santri/route.ts', code);
