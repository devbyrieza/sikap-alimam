const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

const badTbody = `                  <tbody>
                    {(() => {
                      const filteredSantriList = santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
                      return filteredSantriList.length === 0 ? (
                      <tr>
                        <td colSpan={6 + mapelList.length} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      filteredSantriList.map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);
                        const bgRow = i % 2 === 0 ? "#ffffff" : "#fdfcf9";
                        return (
                          <tr key={santri.id} style={{ background: bgRow }}>
                            <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, color: "#550000", fontWeight: "700", textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{i + 1}</td>
                            <td className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 10, background: bgRow, fontWeight: "800", borderRight: "1px solid #ebdcc3", borderBottom: "1px solid #f5ede1", padding: "14px 18px" }}>
                              <div className="truncate" style={{ color: "#1a1a1a" }}>{santri.nama_lengkap}</div>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{santri.nis || "-"}</td>
                            {mapelList.map((m) => {
                              const avg = getAvg(santri.id, m.id);
                              const isBawah = avg !== null && avg < 75;
                              return (
                                <td key={m.id} style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                  {avg !== null ? (
                                    <span style={{ fontWeight: "800", color: isBawah ? "#b91c1c" : "#1a1a1a", background: isBawah ? "#fee2e2" : "#fdf8f0", padding: "4px 8px", borderRadius: "8px", border: "1px solid #ebdcc3", fontSize: "13px" }}>
                                      {avg}
                                    </span>
                                  ) : (
                                    <span style={{ color: "#cbd5e1", fontSize: "12px" }}>-</span>
                                  )}
                                </td>
                                );
                              })}
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#1a1a1a", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.total || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#0ea5e9", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.average || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "900", color: "#550000", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                <div style={{ display: "inline-block", background: rankMap.get(santri.id)?.rank === 1 ? "#fef08a" : rankMap.get(santri.id)?.rank === 2 ? "#e2e8f0" : rankMap.get(santri.id)?.rank === 3 ? "#fed7aa" : "#fdf8f0", padding: "4px 12px", borderRadius: "100px", border: "1px solid #ebdcc3" }}>
                                  #{rankMap.get(santri.id)?.rank || "-"}
                                </div>
                              </td>
                          </tr>
                        );
                      })
                    )}
                  )}</tbody>`;

const goodTbody = `                  <tbody>
                    {santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={6 + mapelList.length} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).map((santri) => {
                        const i = santriList.findIndex(s => s.id === santri.id);
                        const bgRow = i % 2 === 0 ? "#ffffff" : "#fdfcf9";
                        return (
                          <tr key={santri.id} style={{ background: bgRow }}>
                            <td className="sticky-col" style={{ position: "sticky", left: 0, zIndex: 10, background: bgRow, color: "#550000", fontWeight: "700", textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{i + 1}</td>
                            <td className="sticky-col" style={{ position: "sticky", left: 40, zIndex: 10, background: bgRow, fontWeight: "800", borderRight: "1px solid #ebdcc3", borderBottom: "1px solid #f5ede1", padding: "14px 18px" }}>
                              <div className="truncate" style={{ color: "#1a1a1a" }}>{santri.nama_lengkap}</div>
                            </td>
                            <td style={{ color: "#64748b", fontSize: "12px", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>{santri.nis || "-"}</td>
                            {mapelList.map((m) => {
                              const avg = getAvg(santri.id, m.id);
                              const isBawah = avg !== null && avg < 75;
                              return (
                                <td key={m.id} style={{ textAlign: "center", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                  {avg !== null ? (
                                    <span style={{ fontWeight: "800", color: isBawah ? "#b91c1c" : "#1a1a1a", background: isBawah ? "#fee2e2" : "#fdf8f0", padding: "4px 8px", borderRadius: "8px", border: "1px solid #ebdcc3", fontSize: "13px" }}>
                                      {avg}
                                    </span>
                                  ) : (
                                    <span style={{ color: "#cbd5e1", fontSize: "12px" }}>-</span>
                                  )}
                                </td>
                                );
                              })}
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#1a1a1a", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.total || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "800", color: "#0ea5e9", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                {rankMap.get(santri.id)?.average || 0}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: "900", color: "#550000", borderBottom: "1px solid #f5ede1", padding: "14px 16px" }}>
                                <div style={{ display: "inline-block", background: rankMap.get(santri.id)?.rank === 1 ? "#fef08a" : rankMap.get(santri.id)?.rank === 2 ? "#e2e8f0" : rankMap.get(santri.id)?.rank === 3 ? "#fed7aa" : "#fdf8f0", padding: "4px 12px", borderRadius: "100px", border: "1px solid #ebdcc3" }}>
                                  #{rankMap.get(santri.id)?.rank || "-"}
                                </div>
                              </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>`;

file = file.replace(badTbody, goodTbody);

// Also remove the bad adinda script that throws tsc error
try { fs.unlinkSync('src/app/api/setup-db/adinda/route.ts'); } catch (e) {}

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
