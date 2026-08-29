const fs = require('fs');
const file = 'src/app/(dashboard)/halaqoh/ujian/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. CatatanRecord -> UjianRecord
content = content.replace('surah_nomor?: number;', 'surah_nomor?: number;\n  surah_selesai_nomor?: number;\n  surah_selesai_nama?: string;\n  surah_selesai_nama_arab?: string;');

// 2. State
content = content.replace('const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);', 'const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);\n  const [selectedSurahAkhir, setSelectedSurahAkhir] = useState<Surah | null>(null);');

// 3. Payload POST
content = content.replace('surah_nomor: selectedSurah?.nomor,', 'surah_nomor: selectedSurah?.nomor,\n        surah_selesai_nomor: selectedSurahAkhir?.nomor ?? null,\n        surah_selesai_nama: selectedSurahAkhir?.nama_latin ?? null,\n        surah_selesai_nama_arab: selectedSurahAkhir?.nama_arab ?? null,');

// 4. useEffect Halaman
const effCode = `
  useEffect(() => {
    if (!selectedSurah || jenisUjian === "ujian_itqon") { setHalamanAuto(null); return; }
    const akhirNomor = selectedSurahAkhir?.nomor || selectedSurah.nomor;
    fetch(\`/api/quran/halaman?surah=\` + selectedSurah.nomor + \`&dari=\` + ayatDari + \`&ke=\` + ayatKe + \`&surah_selesai=\` + akhirNomor)
      .then(r => r.json())
      .then(d => setHalamanAuto(d.halaman ?? null))
      .catch(() => setHalamanAuto(null));
  }, [selectedSurah, selectedSurahAkhir, ayatDari, ayatKe, jenisUjian]);

  useEffect(() => {
    if (!selectedSurah) return;
    if (!selectedSurahAkhir) setSelectedSurahAkhir(selectedSurah);
  }, [selectedSurah]);
`;
content = content.replace(/\/\/\s*Auto-calculate halaman.*?\}, \[selectedSurah.*?\);/s, effCode);

// 5. UI
const replacement = `{/* Surah & Halaman */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                          <SurahPicker surahList={surahList} selected={selectedSurah} onSelect={(s) => { setSelectedSurah(s); setSelectedSurahAkhir(s); }} label="MULAI SURAH" />
                          <SurahPicker surahList={surahList} selected={selectedSurahAkhir} onSelect={setSelectedSurahAkhir} label="SAMPAI SURAH (OPSIONAL)" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                          <div>
                            <label style={labelStyle}>JUMLAH HALAMAN (MADINAH)</label>
                            <div style={{ padding: "10px", borderRadius: 13, background: "#ecfdf5", border: "1.5px solid #a7f3d0", color: "#059669", fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {halamanAuto !== null ? halamanAuto.toFixed(1) + " hal." : "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ayat Range */}
                      {selectedSurah && (
                        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 18, border: "1.5px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          {/* Dari Ayat */}
                          <div>
                            <label style={labelStyle}>Dari Ayat</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setAyatDari(prev => Math.max(1, (prev || 1) - 1))}
                                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >-</button>
                              <input
                                type="number"
                                value={ayatDari || ""}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  setAyatDari(Math.min(selectedSurah?.total_ayat || 300, Math.max(1, val)));
                                }}
                                onBlur={() => {
                                  if (!ayatDari) setAyatDari(1);
                                }}
                                style={{ ...inputStyle, textAlign: "center", padding: "10px", fontWeight: 800 }}
                              />
                              <button
                                type="button"
                                onClick={() => setAyatDari(prev => Math.min(selectedSurah?.total_ayat || 300, (prev || 1) + 1))}
                                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >+</button>
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>Maks: {selectedSurah.total_ayat} ayat</span>
                          </div>

                          {/* Sampai Ayat */}
                          <div>
                            <label style={labelStyle}>Sampai Ayat</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setAyatKe(prev => Math.max(1, (prev || 1) - 1))}
                                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >-</button>
                              <input
                                type="number"
                                value={ayatKe || ""}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  setAyatKe(Math.min(selectedSurahAkhir?.total_ayat || 300, Math.max(1, val)));
                                }}
                                onBlur={() => {
                                  if (!ayatKe) setAyatKe(1);
                                }}
                                style={{ ...inputStyle, textAlign: "center", padding: "10px", fontWeight: 800 }}
                              />
                              <button
                                type="button"
                                onClick={() => setAyatKe(prev => Math.min(selectedSurahAkhir?.total_ayat || 300, (prev || 1) + 1))}
                                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#550000", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >+</button>
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>Maks: {selectedSurahAkhir?.total_ayat || 300} ayat</span>
                          </div>
                        </div>
                      }
`;

let startIndex = content.indexOf('{/* Surah & Halaman */}');
let endIndex = content.indexOf('</div>\r\n                    )}', startIndex);
if (endIndex === -1) endIndex = content.indexOf('</div>\n                    )}', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex + 30);
  fs.writeFileSync(file, content);
  console.log("REPLACED UI UJIAN SUCCESSFULLY!");
} else {
  console.log("BLOCK NOT FOUND", startIndex, endIndex);
}
