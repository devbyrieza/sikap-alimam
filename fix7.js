const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

file = file.replace(/<tbody>[\s\S]*?\{\(\(\) => \{[\s\S]*?const filteredSantriList = santriList\.filter\(s => s\.nama_lengkap\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\);[\s\S]*?return filteredSantriList\.length === 0 \? \(/g, '<tbody>\n                    {santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (');

file = file.replace(/\) : \([\s\S]*?filteredSantriList\.map\(\(santri, index\) => \{ const i = santriList\.findIndex\(s => s\.id === santri\.id\);/g, ') : (\n                      santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);');

file = file.replace(/                  \)\}<\/tbody>/g, '                  )}</tbody>');

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
