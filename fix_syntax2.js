const fs = require('fs');
let f = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');
f = f.replace("                    })()}</tbody>", "                    </tbody>");
f = f.replace("                      {(() => {", "");
f = f.replace("                        const filteredSantriList = santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));", "");
f = f.replace("                        return filteredSantriList.length === 0 ? (", "                      {santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (");
f = f.replace("                        filteredSantriList.map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);", "                        santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).map((santri) => { const i = santriList.findIndex(s => s.id === santri.id);");
fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', f);
