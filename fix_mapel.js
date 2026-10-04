const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/nilai/page.tsx', 'utf8');

// 1. Add IL to isSpecialClass
code = code.replace(
  'return selectedKelasInfo?.nama.toLowerCase().includes("11 ma") || selectedKelasInfo?.nama.toLowerCase().includes("12 ma");',
  'const nama = selectedKelasInfo?.nama.toLowerCase() || ""; return nama.includes("11 ma") || nama.includes("12 ma") || nama === "il";'
);

// 2. Fix the warning banner condition
code = code.replace(
  '{(!kelas_id || !mapel_id) && (',
  '{(!kelas_id || (isSpecialClass ? !namaMapelCustom : !mapel_id)) && ('
);

// 3. Fix the button logic
code = code.replace(
  'cursor: !kelas_id || !mapel_id ? "not-allowed" : "pointer",',
  'cursor: !kelas_id || (isSpecialClass ? !namaMapelCustom : !mapel_id) ? "not-allowed" : "pointer",'
);
code = code.replace(
  'boxShadow: !kelas_id || !mapel_id ? "none" : "0 4px 14px rgba(85, 0, 0, 0.25)",',
  'boxShadow: !kelas_id || (isSpecialClass ? !namaMapelCustom : !mapel_id) ? "none" : "0 4px 14px rgba(85, 0, 0, 0.25)",'
);
code = code.replace(
  'disabled={!kelas_id || !mapel_id}',
  'disabled={!kelas_id || (isSpecialClass ? !namaMapelCustom.trim() : !mapel_id)}'
);
code = code.replace(
  'if (!kelas_id || !mapel_id) {',
  'if (!kelas_id || (isSpecialClass ? !namaMapelCustom.trim() : !mapel_id)) {'
);
code = code.replace(
  'background: !kelas_id || !mapel_id ? "#e2e8f0" : "#550000",',
  'background: !kelas_id || (isSpecialClass ? !namaMapelCustom : !mapel_id) ? "#e2e8f0" : "#550000",'
);
code = code.replace(
  'color: !kelas_id || !mapel_id ? "#94a3b8" : "white",',
  'color: !kelas_id || (isSpecialClass ? !namaMapelCustom : !mapel_id) ? "#94a3b8" : "white",'
);

// 4. Also fix handleLanjut to send the correct mapel name to Step 2
code = code.replace(
  'const selectedMapelNama = mapelList.find((m) => m.id === mapel_id)?.nama || "";',
  'const selectedMapelNama = isSpecialClass ? namaMapelCustom : (mapelList.find((m) => m.id === mapel_id)?.nama || "");'
);

fs.writeFileSync('src/app/(dashboard)/nilai/page.tsx', code);
