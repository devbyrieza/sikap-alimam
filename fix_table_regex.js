const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// 1. Remove one of the Aksi headers
file = file.replace(/<th style=\{\{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 \}\}>Aksi<\/th>\s*<th style=\{\{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 \}\}>Aksi<\/th>/g, '<th style={{ textAlign: "center", minWidth: 90, borderBottom: "1px solid #ebdcc3", padding: "14px 16px", color: "#1a1a1a", fontWeight: 800 }}>Aksi</th>');

// 2. Add the Cetak Rapor td
const targetTdBlock = '</div>\n                                </td>\n                            </tr>';
const targetTdBlock2 = '</div>\\n                                </td>\\n                            </tr>';
const targetTdBlock3 = '</div>\r\n                                </td>\r\n                            </tr>';

const replacement = '</div>\n                                </td>\n                                <td style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>\n                                  <a href={`/rapor/print/${santri.id}?semester=${semester}&tahun_ajaran=${tahun_ajaran}`} target="_blank" style={{ display: "inline-block", padding: "6px 12px", background: "#550000", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", textDecoration: "none" }}>Cetak Rapor</a>\n                                </td>\n                            </tr>';

if (file.includes('</div>\n                                </td>\n                            </tr>')) {
  file = file.replace('</div>\n                                </td>\n                            </tr>', replacement);
} else if (file.includes('</div>\r\n                                </td>\r\n                            </tr>')) {
  file = file.replace('</div>\r\n                                </td>\r\n                            </tr>', replacement);
}

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
