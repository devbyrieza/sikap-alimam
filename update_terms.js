const fs = require('fs');
const filePath = 'src/app/(dashboard)/halaqoh/kelompok/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace('<option value="MUBTADI">Mubtadi (Tahap Pemula)</option>', '<option value="PEMULA">Tahap Pemula</option>');
code = code.replace('<option value="MUTAWASSITH">Mutawassith (Tahap Menengah)</option>', '<option value="MENENGAH">Tahap Menengah</option>');
code = code.replace('<option value="MUTAFAWWIQ">Mutafawwiq (Tahap Lanjutan)</option>', '<option value="LANJUTAN">Tahap Lanjutan</option>');

code = code.replace(
  "{k.tingkatan === 'MUBTADI' ? 'Mubtadi (Pemula)' : k.tingkatan === 'MUTAWASSITH' ? 'Mutawassith (Menengah)' : k.tingkatan === 'MUTAFAWWIQ' ? 'Mutafawwiq (Lanjutan)' : k.tingkatan}",
  "{k.tingkatan === 'PEMULA' ? 'Pemula' : k.tingkatan === 'MENENGAH' ? 'Menengah' : k.tingkatan === 'LANJUTAN' ? 'Lanjutan' : k.tingkatan}"
);

code = code.replace(/tingkatan: "MUBTADI"/g, 'tingkatan: "PEMULA"');
code = code.replace(/tingkatan: k\.tingkatan \|\| "MUBTADI"/g, 'tingkatan: k.tingkatan || "PEMULA"');

fs.writeFileSync(filePath, code);
