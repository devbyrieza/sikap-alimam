const fs = require('fs');
let code = fs.readFileSync('src/app/api/master/kelas/route.ts', 'utf8');
if (!code.includes('force-dynamic')) {
  code = code.replace(
    'import { normalizeKelasList } from "@/lib/kelas";',
    'import { normalizeKelasList } from "@/lib/kelas";\n\nexport const dynamic = "force-dynamic";'
  );
  fs.writeFileSync('src/app/api/master/kelas/route.ts', code);
}
