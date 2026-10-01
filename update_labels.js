const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');

code = code.replace('<option value="MUBTADI">Mubtadi</option>', '<option value="MUBTADI">Mubtadi (Tahap Pemula)</option>');
code = code.replace('<option value="MUTAWASSITH">Mutawassith</option>', '<option value="MUTAWASSITH">Mutawassith (Tahap Menengah)</option>');
code = code.replace('<option value="MUTAFAWWIQ">Mutafawwiq</option>', '<option value="MUTAFAWWIQ">Mutafawwiq (Tahap Lanjutan)</option>');

code = code.replace(
  '{k.tingkatan}',
  `{k.tingkatan === 'MUBTADI' ? 'Mubtadi (Pemula)' : k.tingkatan === 'MUTAWASSITH' ? 'Mutawassith (Menengah)' : k.tingkatan === 'MUTAFAWWIQ' ? 'Mutafawwiq (Lanjutan)' : k.tingkatan}`
);

fs.writeFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', code);
