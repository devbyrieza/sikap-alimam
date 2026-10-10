const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// Remove double Aksi header
const doubleAksi = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>
                          <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>`;
const singleAksi = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>`;
file = file.replace(doubleAksi, singleAksi);

// The rank TD block currently ends with something like this:
// </td>
// </tr>
// );
// We need to insert the Aksi TD right after the Rank TD.

// Let's use Regex to find the rank TD
const regex = /(<td style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>[\s\S]*?<\/td>)\s*<\/tr>/;

if (regex.test(file)) {
  file = file.replace(regex, `$1\n                                <td style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>\n                                  <a href={\`/rapor/print/\${santri.id}?semester=\${semester}&tahun_ajaran=\${tahun_ajaran}\`} target="_blank" style={{ display: "inline-block", padding: "6px 12px", background: "#550000", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>Cetak Rapor</a>\n                                </td>\n                              </tr>`);
} else {
  console.log("Could not find rank TD block via Regex!");
}

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
