const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/wali/rapor/page.tsx', 'utf8');

// 1. Ganti kalkulasi
code = code.replace(
  'if (item.hasUjian && !item.hasHarian && !item.hasKomp && !item.hasSikap) {',
  '// MURNI PTS MODE\n      if (item.hasUjian) {'
).replace(
  '      } else if (item.hasHarian || item.hasKomp || item.hasSikap || item.hasUjian) {\n        naNum = (0.3 * item.harian + 0.2 * item.kompetensi + 0.1 * item.sikap + 0.4 * item.ujian);\n      }',
  ''
);

// 2. Add banner
code = code.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">',
  '<div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-4 items-start">\n            <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />\n            <div>\n              <h4 className="font-bold text-blue-900">Informasi Rapor Bayangan (PTS Semester 1)</h4>\n              <p className="text-sm text-blue-800 mt-1">\n                Sesuai dengan kebijakan kurikulum, nilai yang ditampilkan pada rapor saat ini adalah <strong>Nilai PTS Murni</strong> tanpa mengakumulasikan nilai Harian, Kompetensi, dan Sikap. \n              </p>\n            </div>\n          </div>\n\n          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">'
);

fs.writeFileSync('src/app/(dashboard)/wali/rapor/page.tsx', code);
