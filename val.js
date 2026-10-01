const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/master/santri/page.tsx', 'utf8');

code = code.replace(
  'if (!formSantri.nama_lengkap || !formSantri.kelas_id) {',
  'if (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis) {'
);
code = code.replace(
  "Swal.fire({ icon: 'error', title: 'Error', text: 'Nama lengkap dan Kelas wajib diisi' });",
  "Swal.fire({ icon: 'error', title: 'Error', text: 'Nama lengkap, NIS, dan Kelas wajib diisi' });"
);
code = code.replace(
  /disabled=\{isSaving \|\| !formSantri\.nama_lengkap \|\| !formSantri\.kelas_id\}/g,
  'disabled={isSaving || !formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis}'
);
code = code.replace(
  /background: \(\!formSantri\.nama_lengkap \|\| \!formSantri\.kelas_id\)/g,
  'background: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis)'
);
code = code.replace(
  /cursor: \(\!formSantri\.nama_lengkap \|\| \!formSantri\.kelas_id\)/g,
  'cursor: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis)'
);

fs.writeFileSync('src/app/(dashboard)/master/santri/page.tsx', code);
