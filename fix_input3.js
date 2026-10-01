const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', 'utf8');

const regex = /\/\/ Auto-calculate halaman when surah\/ayat changes[\s\S]*?\}, \[selectedSurah, ayatDari, ayatKe\]\);/;

const newEffect = `// Auto-calculate halaman when surah/ayat changes
  useEffect(() => {
    if (!selectedSurah) { setHalamanAuto(null); return; }
    let url = \`/api/quran/halaman?surah=\${selectedSurah.nomor}&dari=\${ayatDari}&ke=\${ayatKe}\`;
    if (selectedSurahAkhir) {
      url += \`&surah_selesai=\${selectedSurahAkhir.nomor}\`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => {
        const ratio = (ayatKe - ayatDari + 1) / selectedSurah.total_ayat;
        setHalamanAuto(parseFloat((ratio * 0.5).toFixed(1)));
      });
  }, [selectedSurah, selectedSurahAkhir, ayatDari, ayatKe]);`;

if (regex.test(code)) {
  code = code.replace(regex, newEffect);
  fs.writeFileSync('src/app/(dashboard)/halaqoh/input/page.tsx', code);
  console.log("Success!");
} else {
  console.log("Regex not found!");
}
