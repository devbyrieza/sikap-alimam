const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/master/santri/page.tsx', 'utf8');

// 1. Add red asterisks to NISN and Jenis Kelamin labels
code = code.replace(
  'NISN (Nasional)</label>',
  'NISN (Nasional) <span style={{ color: "red" }}>*</span></label>'
);
code = code.replace(
  'Jenis Kelamin</label>',
  'Jenis Kelamin <span style={{ color: "red" }}>*</span></label>'
);

// 2. Update handleSaveSantri validation logic
code = code.replace(
  'if (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis) {',
  'if (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis || !formSantri.nisn) {'
);
code = code.replace(
  "Swal.fire({ icon: 'error', title: 'Error', text: 'Nama lengkap, NIS, dan Kelas wajib diisi' });",
  "Swal.fire({ icon: 'error', title: 'Error', text: 'Semua form wajib diisi' });"
);

// 3. Update the button disabled state and styles
const oldDisabled = 'disabled={isSaving || !formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis}';
const newDisabled = 'disabled={isSaving || !formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis || !formSantri.nisn}';
code = code.split(oldDisabled).join(newDisabled);

const oldBg = 'background: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis)';
const newBg = 'background: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis || !formSantri.nisn)';
code = code.split(oldBg).join(newBg);

const oldCursor = 'cursor: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis)';
const newCursor = 'cursor: (!formSantri.nama_lengkap || !formSantri.kelas_id || !formSantri.nis || !formSantri.nisn)';
code = code.split(oldCursor).join(newCursor);

fs.writeFileSync('src/app/(dashboard)/master/santri/page.tsx', code);
