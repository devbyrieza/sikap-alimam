const XLSX = require('xlsx');

try {
  // Read Master
  const masterFile = XLSX.readFile('C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/master pengajuan.xlsx');
  const masterSheetName = masterFile.SheetNames[0];
  const masterSheet = masterFile.Sheets[masterSheetName];
  
  // Date
  masterSheet['D5'] = { t: 's', v: '12 Agustus 2026' };
  
  // Applicant
  masterSheet['D6'] = { t: 's', v: 'Imam Wahyudi' };
  masterSheet['N6'] = { t: 's', v: 'Media / PSB' };
  
  // Tujuan Pemakaian Dana
  masterSheet['D7'] = { t: 's', v: 'Pencairan Fee Penguji & Pewawancara PSB' };
  
  // Items
  // Item 1: Al Imam (Row 11 in Excel, which is index 10)
  masterSheet['B11'] = { t: 's', v: 'Fee Penguji & Pewawancara PSB Al Imam Al Islami' };
  masterSheet['E11'] = { t: 'n', v: 1 };
  masterSheet['F11'] = { t: 's', v: 'Laporan' };
  masterSheet['H11'] = { t: 'n', v: 650000 };
  masterSheet['I11'] = { t: 'n', f: 'E11*H11' };
  
  // Item 2: Al Andalus Ulul Albaab (Row 12 in Excel)
  masterSheet['B12'] = { t: 's', v: 'Fee Penguji & Pewawancara PSB Al Andalus Ulul Albaab' };
  masterSheet['E12'] = { t: 'n', v: 1 };
  masterSheet['F12'] = { t: 's', v: 'Laporan' };
  masterSheet['H12'] = { t: 'n', v: 160000 };
  masterSheet['I12'] = { t: 'n', f: 'E12*H12' };
  
  // Clear Item 3-10
  for (let i = 13; i <= 20; i++) {
    delete masterSheet['B' + i];
    delete masterSheet['E' + i];
    delete masterSheet['F' + i];
    delete masterSheet['H' + i];
    masterSheet['I' + i] = { t: 'n', v: 0 };
  }
  
  // Total
  masterSheet['I21'] = { t: 'n', f: 'SUM(I11:I20)' };
  
  // Note / Justifikasi
  masterSheet['B42'] = { t: 's', v: 'CATATAN & JUSTIFIKASI PENGAJUAN:' };
  masterSheet['B43'] = { t: 's', v: '1. Rincian detail fee per penguji/pewawancara terlampir di file FEE_PENGUJI_FIX_2026.xlsx' };
  masterSheet['B44'] = { t: 's', v: '2. Fee dihitung berdasarkan jumlah sesi ujian/wawancara yang telah dilaksanakan (Rp 10.000 / sesi).' };
  
  // Set print area
  if (!masterSheet['!pageSetup']) masterSheet['!pageSetup'] = {};
  masterSheet['!pageSetup'].printArea = 'A1:O46';
  
  // Write to new file
  const newFilePath = 'C:/Users/itpua/Dev/Work/al-andalus/Pengajuan/Pengajuan_Fee_Penguji.xlsx';
  XLSX.writeFile(masterFile, newFilePath);
  console.log('File created successfully at', newFilePath);
} catch (e) {
  console.error('Error generating file:', e);
}
