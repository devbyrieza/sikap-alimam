const XLSX = require('xlsx');

try {
  const masterFile = XLSX.readFile('C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/master pengajuan.xlsx');
  const masterSheet = masterFile.Sheets[masterFile.SheetNames[0]];
  const masterData = XLSX.utils.sheet_to_json(masterSheet, { header: 1 });
  console.log('MASTER:', JSON.stringify(masterData, null, 2));
} catch (e) { console.error('Error master:', e); }

try {
  const feeFile = XLSX.readFile('C:/Users/itpua/Dev/Work/al-andalus/FEE_PENGUJI_FIX_2026.xlsx');
  const feeSheet = feeFile.Sheets[feeFile.SheetNames[0]];
  const feeData = XLSX.utils.sheet_to_json(feeSheet, { header: 1 });
  console.log('FEE:', JSON.stringify(feeData, null, 2));
} catch (e) { console.error('Error fee:', e); }
