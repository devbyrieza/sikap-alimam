const fs = require('fs');
const filePath = 'src/app/(dashboard)/master/santri/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

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

// Direct string replacement since regex failed due to newlines or weird chars.
const searchStr = `<div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>NIS (Opsional)</label>
                <input value={formSantri.nis} onChange={e => setFormSantri({...formSantri, nis: e.target.value})} placeholder="Nomor Induk Santri" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }} />
              </div>`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, newUI);
  fs.writeFileSync(filePath, code);
  console.log("SUCCESS");
} else {
  console.log("NOT FOUND. Let's do a more robust replace.");
  // Very robust split logic
  const parts = code.split('NIS (Opsional)</label>');
  if (parts.length === 2) {
    const endInputIndex = parts[1].indexOf('</div>') + 6;
    code = parts[0].substring(0, parts[0].lastIndexOf('<div>')) + newUI + parts[1].substring(endInputIndex);
    fs.writeFileSync(filePath, code);
    console.log("SUCCESS FALLBACK");
  } else {
    console.log("FAIL completely.");
  }
}
