const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');
code = code.replace(/setFormKelompok\(\{ id: "", nama_kelompok: "", sesi: "subuh", pegawai_id: "", kelas_id: "" \}\)/g, 'setFormKelompok({ id: "", nama_kelompok: "", sesi: "subuh", tingkatan: "MUBTADI", pegawai_id: "", kelas_id: "" })');

// Also update handleEditClick
code = code.replace(
  'sesi: k.sesi,\n      pegawai_id: k.pegawai_id',
  'sesi: k.sesi,\n      tingkatan: k.tingkatan || "MUBTADI",\n      pegawai_id: k.pegawai_id'
);
fs.writeFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', code);
