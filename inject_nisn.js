const fs = require('fs');
const filePath = 'src/app/(dashboard)/master/santri/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add NISN to state
code = code.replace(
  "const [formSantri, setFormSantri] = useState({ nama_lengkap: '', nis: '', kelas_id: '', jenis_kelamin: 'L' });",
  "const [formSantri, setFormSantri] = useState({ nama_lengkap: '', nis: '', nisn: '', kelas_id: '', jenis_kelamin: 'L' });"
);

// 2. Add NISN to reset state in handleSaveSantri
code = code.replace(
  "setFormSantri({ nama_lengkap: '', nis: '', kelas_id: '', jenis_kelamin: 'L' });",
  "setFormSantri({ nama_lengkap: '', nis: '', nisn: '', kelas_id: '', jenis_kelamin: 'L' });"
);

// 3. Update the Modal UI to display NIS and NISN side-by-side using a grid
const newUI = `
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>NIS (Lokal) <span style={{ color: "red" }}>*</span></label>
                  <input value={formSantri.nis} onChange={e => setFormSantri({...formSantri, nis: e.target.value})} placeholder="Nomor Induk Yayasan" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>NISN (Nasional)</label>
                  <input value={formSantri.nisn} onChange={e => setFormSantri({...formSantri, nisn: e.target.value})} placeholder="Nomor Induk Nasional" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }} />
                </div>
              </div>
`;

// Replace the old NIS div block
const oldNisRegex = /<div>\s*<label[^>]*>NIS \(Opsional\)<\/label>\s*<input[^>]*value=\{formSantri\.nis\}[^>]*>\s*<\/div>/;
code = code.replace(oldNisRegex, newUI);

fs.writeFileSync(filePath, code);
