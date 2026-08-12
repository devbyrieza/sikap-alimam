const XLSX = require('xlsx');
try {
  const file = XLSX.readFile('C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/Pengajuan_Final-4.xlsx');
  const sheet = file.Sheets[file.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('FINAL-4 HEAD:', JSON.stringify(data.slice(0, 15), null, 2));
} catch (e) { console.error('Error:', e); }
