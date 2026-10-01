const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', 'utf8');

const oldEffect = `  // Auto-calculate halaman when surah/ayat changes
  useEffect(() => {
    if (!selectedSurah) { setHalamanAuto(null); return; }
    fetch(\`/api/quran/halaman?surah=\${selectedSurah.nomor}&dari=\${ayatDari}&ke=\${ayatKe}\`)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
        const ratio = (ayatKe - ayatDari + 1) / selectedSurah.total_ayat;
        setHalamanAuto(parseFloat((ratio * 0.5).toFixed(1)));
      });
  }, [selectedSurah, ayatDari, ayatKe]);`;

const newEffect = `  // Auto-calculate halaman when surah/ayat changes
  useEffect(() => {
    if (!selectedSurah) { setHalamanAuto(null); return; }
    let url = \`/api/quran/halaman?surah=\${selectedSurah.nomor}&dari=\${ayatDari}&ke=\${ayatKe}\`;
    if (selectedSurahAkhir) {
      url += \`&surahSelesai=\${selectedSurahAkhir.nomor}\`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
        const ratio = (ayatKe - ayatDari + 1) / selectedSurah.total_ayat;
        setHalamanAuto(parseFloat((ratio * 0.5).toFixed(1)));
      });
  }, [selectedSurah, selectedSurahAkhir, ayatDari, ayatKe]);`;

if (code.includes('fetch(`/api/quran/halaman?surah=${selectedSurah.nomor}&dari=${ayatDari}&ke=${ayatKe}`)')) {
  code = code.replace(oldEffect, newEffect);
  fs.writeFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', code);
  console.log("Success frontend");
} else {
  console.log("Not found in frontend");
}
