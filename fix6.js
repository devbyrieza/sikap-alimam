const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

file = file.replace('                  <tbody>\n                    {(() => {\n                      const filteredSantriList = santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));\n                      return filteredSantriList.length === 0 ? (', '                  <tbody>\n                    {santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (');

file = file.replace('                    ) : (\n                      filteredSantriList.map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);', '                    ) : (\n                      santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);');

file = file.replace('                  )}</tbody>', '                  )}</tbody>'); 

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
