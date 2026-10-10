const fs = require('fs');
let file = fs.readFileSync('src/app/api/rapor/cetak/route.ts', 'utf8');

file = file.replace(
  '          tahun_ajaran,\n          jenis: "pts" // MURNI PTS MODE\n        },',
  '          tahun_ajaran\n        },'
);
file = file.replace(
  '          tahun_ajaran,\r\n          jenis: "pts" // MURNI PTS MODE\r\n        },',
  '          tahun_ajaran\r\n        },'
);

fs.writeFileSync('src/app/api/rapor/cetak/route.ts', file);
