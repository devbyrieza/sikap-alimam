const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', 'utf8');

// 1. Add state variable
code = code.replace(
  'const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);',
  'const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);\n  const [selectedSurahAkhir, setSelectedSurahAkhir] = useState<Surah | null>(null);'
);

// 2. Add surah_selesai to UjianRecord interface
code = code.replace(
  '  surah_nama?: string;',
  '  surah_nama?: string;\n  surah_selesai_nomor?: number;\n  surah_selesai_nama?: string;'
);

// 3. Update the handleSave logic to send surah_selesai
code = code.replace(
  'surah_nama: selectedSurah?.nama_latin,',
  'surah_nama: selectedSurah?.nama_latin,\n        surah_selesai_nomor: selectedSurahAkhir?.nomor,\n        surah_selesai_nama: selectedSurahAkhir?.nama_latin,'
);

// 4. Update handleEdit logic to set selectedSurahAkhir
code = code.replace(
  'setSelectedSurah(surahList.find(s => s.nomor === r.surah_nomor) || null);',
  'setSelectedSurah(surahList.find(s => s.nomor === r.surah_nomor) || null);\n    setSelectedSurahAkhir(surahList.find(s => s.nomor === r.surah_selesai_nomor) || null);'
);

// 5. Update UI rendering to show two pickers side-by-side
const oldPicker = '<SurahPicker surahList={surahList} selected={selectedSurah} onSelect={setSelectedSurah} label="Nama Surah" />';
const newPickers = `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={(s) => { setSelectedSurah(s); setSelectedSurahAkhir(s); }} label="Dari Surah" />
                  <SurahPicker surahList={surahList} selected={selectedSurahAkhir} onSelect={setSelectedSurahAkhir} label="Sampai Surah" />
                </div>`;
code = code.replace(oldPicker, newPickers);

fs.writeFileSync('src/app/(dashboard)/halaqoh/ujian/page.tsx', code);
