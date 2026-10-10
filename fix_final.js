const fs = require('fs');

// Restore to original first
let file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// If already modified, restore it by re-running git restore via execSync
const { execSync } = require('child_process');
execSync('git restore src/app/(dashboard)/nilai/rekap/page.tsx');
file = fs.readFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', 'utf8');

// 1. Add state
file = file.replace(
  'const [loadingData, setLoadingData] = useState(false);',
  'const [loadingData, setLoadingData] = useState(false);\n  const [searchQuery, setSearchQuery] = useState("");'
);

// 2. Add search input
const filterOld = `<div style={{ fontSize: "15px", fontWeight: "800", color: "#550000" }}>Filter Rekap Nilai</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-end">`;
const filterNew = `<div style={{ fontSize: "15px", fontWeight: "800", color: "#550000" }}>Filter Rekap Nilai</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full items-end">`;
file = file.replace(filterOld, filterNew);

const selectOld = `              <select
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
            </div>`;
const selectNew = `              <select
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
file = file.replace(selectOld, selectNew);

// 3. Filter render map
const mapOld = `                    {santriList.length === 0 ? (
                      <tr>
                        <td colSpan={6 + mapelList.length} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      santriList.map((santri, i) => {
                        const bgRow = i % 2 === 0 ? "#ffffff" : "#fdfcf9";`;
                        
const mapNew = `                    {santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={6 + mapelList.length} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data nilai untuk filter ini
                        </td>
                      </tr>
                    ) : (
                      santriList.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())).map((santri) => {
                        const i = santriList.findIndex(s => s.id === santri.id);
                        const bgRow = i % 2 === 0 ? "#ffffff" : "#fdfcf9";`;
file = file.replace(mapOld, mapNew);

fs.writeFileSync('src/app/(dashboard)/nilai/rekap/page.tsx', file);
