const fs = require('fs');

const filePath = 'src/lib/quran-madinah.ts';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Extract all lines that have a surah entry
let surahLinesIndices = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('nomor:') && lines[i].includes('nama_arab:')) {
    surahLinesIndices.push(i);
  }
}

// surahLinesIndices should have 114 entries
if (surahLinesIndices.length !== 114) {
  console.log("Error: found", surahLinesIndices.length, "surahs");
  process.exit(1);
}

// We want to shift nama_arab from Surah 52 (index 51) up to Surah 114 (index 113)
// into Surah 51 (index 50) up to Surah 113 (index 112)

let correctArabicNames = [];
// Get nama_arab for 52..114
for (let i = 51; i <= 113; i++) {
  const lineIdx = surahLinesIndices[i];
  const match = lines[lineIdx].match(/nama_arab:\s*(['"`].*?['"`])/);
  correctArabicNames.push(match[1]);
}
// Add An-Nas
correctArabicNames.push("'النَّاسِ'");

// Now apply them to 51..114 (indices 50..113)
for (let i = 50; i <= 113; i++) {
  const lineIdx = surahLinesIndices[i];
  const correctName = correctArabicNames[i - 50];
  lines[lineIdx] = lines[lineIdx].replace(/nama_arab:\s*['"`].*?['"`]/, `nama_arab: ${correctName}`);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done!');
