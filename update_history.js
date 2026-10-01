const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', 'utf8');

// Render in history list
const oldHistory = '{r.surah_nama && <div>{r.surah_nama} (Ayat {r.ayat_dari} - {r.ayat_ke})</div>}';
const newHistory = '{r.surah_nama && <div>{r.surah_nama} {r.surah_selesai_nama && r.surah_selesai_nama !== r.surah_nama ? ` - ${r.surah_selesai_nama}` : ""} (Ayat {r.ayat_dari} - {r.ayat_ke})</div>}';
code = code.replace(oldHistory, newHistory);

// What if the old string was slightly different?
const oldHistory2 = '{r.surah_nama && <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{r.surah_nama}</div>}';
const newHistory2 = '{r.surah_nama && <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{r.surah_nama} {r.surah_selesai_nama && r.surah_selesai_nama !== r.surah_nama ? ` - ${r.surah_selesai_nama}` : ""}</div>}';
code = code.replace(oldHistory2, newHistory2);

fs.writeFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', code);
