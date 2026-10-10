const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// Remove double Aksi header
const doubleAksi = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>
                            <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>`;
const singleAksi = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>`;
file = file.replace(doubleAksi, singleAksi);

// And another variation just in case spaces differ
const doubleAksi2 = `<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>\\n                          <th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>`;
file = file.replace(doubleAksi2, singleAksi);

// Add the TD
file = file.replace(
  '</div>\n                                </td>\n                            </tr>',
  '</div>\n                                </td>\n                                <td style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}><a href={`/rapor/print/${santri.id}?semester=${semester}&tahun_ajaran=${tahun_ajaran}`} target="_blank" style={{ display: "inline-block", padding: "6px 12px", background: "#550000", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none", boxShadow: "0 4px 6px -1px rgba(85,0,0,0.2)" }}>Cetak Rapor</a></td>\n                            </tr>'
);

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
