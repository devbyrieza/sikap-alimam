const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// Add State
file = file.replace(
  /const \[loadingData, setLoadingData\] = useState\(false\);/,
  `const [loadingData, setLoadingData] = useState(false);\n  const [searchQuery, setSearchQuery] = useState("");`
);

// Add Search Input
const filterHTML = `<div style={{ fontSize: "15px", fontWeight: "800", color: "#550000" }}>Filter Rekap Nilai</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full items-end">`;
file = file.replace(
  /<div style=\{\{ fontSize: "15px", fontWeight: "800", color: "#550000" \}\}>Filter Rekap Nilai<\/div>\s*<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-end">/,
  filterHTML
);

const searchInputHTML = `              <select
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#fdf8f0", fontSize: "14px", outline: "none", fontWeight: 600 }}
                value={tahun_ajaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
              >
                {TAHUN_AJARAN_LIST.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 w-full">
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#550000" }}>Cari Santri</label>
              <input
                type="text"
                placeholder="Ketik nama santri..."
                className="w-full min-w-0 box-border"
                style={{ padding: "11px 14px", borderRadius: "12px", border: "1px solid #ebdcc3", background: "#ffffff", fontSize: "14px", outline: "none", fontWeight: 600, color: "#1a1a1a" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>`;

file = file.replace(
  /              <select[\s\S]*?value=\{tahun_ajaran\}[\s\S]*?onChange=\{\(e\) => setTahunAjaran\(e\.target\.value\)\}[\s\S]*?>[\s\S]*?\{TAHUN_AJARAN_LIST\.map\(\(th\) => \([\s\S]*?<option key=\{th\} value=\{th\}>[\s\S]*?\{th\}[\s\S]*?<\/option>[\s\S]*?\)\)\}[\s\S]*?<\/select>[\s\S]*?<\/div>/,
  searchInputHTML
);

// Filter santriList before rendering
const renderLogic = `{(() => {
                      const filteredSantriList = santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
                      return filteredSantriList.length === 0 ? (`;
file = file.replace(
  /\{santriList\.length === 0 \? \(/,
  renderLogic
);

// Map filtered list
file = file.replace(
  /santriList\.map\(\(santri, i\) => \{/,
  `filteredSantriList.map((santri, index) => { const i = santriList.findIndex(s => s.id === santri.id);`
);

file = file.replace(
  /<\/tbody>/,
  `})()}</tbody>`
);

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
