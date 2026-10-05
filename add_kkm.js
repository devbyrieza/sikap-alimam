const fs = require('fs');
let code = fs.readFileSync('src/app/wali/rapor/page.tsx', 'utf8');

code = code.replace(
  '<th className="py-3.5 px-4 text-center">Ujian (40%)</th>\n                      <th className="py-3.5 px-4 text-center">Nilai Akhir</th>',
  '<th className="py-3.5 px-4 text-center">Ujian (40%)</th>\n                      <th className="py-3.5 px-4 text-center">KKM</th>\n                      <th className="py-3.5 px-4 text-center">Nilai Akhir</th>'
);

code = code.replace(
  '<td className="py-3 px-4 text-center font-bold text-slate-800">{item.hasUjian ? item.ujian : "-"}</td>\n                          <td className="py-3 px-4 text-center font-extrabold text-primary">',
  '<td className="py-3 px-4 text-center font-bold text-slate-800">{item.hasUjian ? item.ujian : "-"}</td>\n                          <td className="py-3 px-4 text-center text-slate-500 font-bold">75</td>\n                          <td className="py-3 px-4 text-center font-extrabold text-primary">'
);

fs.writeFileSync('src/app/wali/rapor/page.tsx', code);
