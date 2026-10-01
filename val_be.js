const fs = require('fs');
let code = fs.readFileSync('src/app/api/master/santri/route.ts', 'utf8');

code = code.replace(
  'if (!nama_lengkap || !kelas_id) {',
  'if (!nama_lengkap || !kelas_id || !nis || !nisn) {'
);
code = code.replace(
  'return NextResponse.json({ error: "Nama lengkap dan Kelas wajib diisi" }, { status: 400 });',
  'return NextResponse.json({ error: "Nama lengkap, NIS, NISN, dan Kelas wajib diisi" }, { status: 400 });'
);

fs.writeFileSync('src/app/api/master/santri/route.ts', code);
