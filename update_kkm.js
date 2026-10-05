const fs = require('fs');
let code = fs.readFileSync('src/app/wali/rapor/page.tsx', 'utf8');

code = code.replace(
  '<td className="py-3 px-4 text-center text-slate-500 font-bold">75</td>',
  '<td className="py-3 px-4 text-center text-slate-500 font-bold">{item.mapel_kategori !== "umum" ? 85 : 80}</td>'
);

code = code.replace(
  'Number(item.nilaiAkhir) >= 75 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"',
  'Number(item.nilaiAkhir) >= (item.mapel_kategori !== "umum" ? 85 : 80) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"'
);

fs.writeFileSync('src/app/wali/rapor/page.tsx', code);
