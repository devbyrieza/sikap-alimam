const XLSX = require('xlsx');

try {
  const file = XLSX.readFile('C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/Pengajuan_Final-4.xlsx');
  const sheetName = file.SheetNames[0];
  const sheet = file.Sheets[sheetName];

  // Update Header Info
  sheet['B5'] = { t: 's', v: ': 12 Agustus 2026' };
  sheet['B6'] = { t: 's', v: ': Panitia PSB' };
  sheet['M6'] = { t: 's', v: ': PSB' };
  sheet['B7'] = { t: 's', v: ': Pencairan Fee Penguji & Pewawancara PSB' };
  // The Rekening was M7, wait index 12 in Row 7 is ": 7341759581". Let's clear it or keep it. Let's keep it.

  // Item 1
  sheet['A10'] = { t: 'n', v: 1 };
  sheet['B10'] = { t: 's', v: 'Fee Penguji & Pewawancara PSB Al Imam Al Islami' };
  sheet['E10'] = { t: 'n', v: 1 };
  sheet['F10'] = { t: 's', v: 'Laporan' };
  sheet['H10'] = { t: 'n', v: 650000 };
  sheet['I10'] = { t: 'n', f: 'E10*H10' };

  // Item 2
  sheet['A11'] = { t: 'n', v: 2 };
  sheet['B11'] = { t: 's', v: 'Fee Penguji & Pewawancara PSB Al Andalus Ulul Albaab' };
  sheet['E11'] = { t: 'n', v: 1 };
  sheet['F11'] = { t: 's', v: 'Laporan' };
  sheet['H11'] = { t: 'n', v: 160000 };
  sheet['I11'] = { t: 'n', f: 'E11*H11' };

  // Clear Item 3 to 7 (rows 12 to 16)
  for (let i = 12; i <= 16; i++) {
    delete sheet['A'+i];
    delete sheet['B'+i];
    delete sheet['E'+i];
    delete sheet['F'+i];
    delete sheet['H'+i];
    delete sheet['I'+i];
  }

  // Update Total in I17
  sheet['I17'] = { t: 'n', f: 'SUM(I10:I16)' };

  // Update Keterangan Tambahan at A30 (row 30)
  sheet['A30'] = { 
    t: 's', 
    v: 'Keterangan Tambahan:\r\n1. Rincian detail fee per penguji/pewawancara terlampir di file FEE_PENGUJI_FIX_2026.xlsx\r\n2. Fee dihitung berdasarkan jumlah sesi (Rp 10.000 / sesi).'
  };

  // Set print area
  if (!sheet['!pageSetup']) sheet['!pageSetup'] = {};
  sheet['!pageSetup'].printArea = 'A1:O32';

  // Save as new xlsx
  XLSX.writeFile(file, 'C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/Pengajuan_Fee_Penguji.xlsx');
  console.log('Successfully updated Pengajuan_Fee_Penguji.xlsx');

} catch (e) {
  console.error(e);
}
