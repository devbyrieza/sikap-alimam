const fs = require('fs');
const filePath = 'src/app/(dashboard)/master/santri/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const modalHTML = `
      {isAdding && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 500, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "#fef08a", color: "#550000", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={20} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Tambah Santri Baru</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Masukkan data pokok santri</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Nama Lengkap <span style={{ color: "red" }}>*</span></label>
                <input value={formSantri.nama_lengkap} onChange={e => setFormSantri({...formSantri, nama_lengkap: e.target.value})} placeholder="Cth: Muhammad Rizky" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>NIS (Opsional)</label>
                <input value={formSantri.nis} onChange={e => setFormSantri({...formSantri, nis: e.target.value})} placeholder="Nomor Induk Santri" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Kelas <span style={{ color: "red" }}>*</span></label>
                  <select value={formSantri.kelas_id} onChange={e => setFormSantri({...formSantri, kelas_id: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14, background: "white" }}>
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map(k => <option key={k.id} value={k.id}>Kelas {k.nama} ({k.jenjang})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Jenis Kelamin</label>
                  <select value={formSantri.jenis_kelamin} onChange={e => setFormSantri({...formSantri, jenis_kelamin: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14, background: "white" }}>
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setIsAdding(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #cbd5e1", background: "white", color: "#64748b", fontWeight: 700, cursor: "pointer" }}>Batal</button>
              <button onClick={handleSaveSantri} disabled={isSaving || !formSantri.nama_lengkap || !formSantri.kelas_id} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: (!formSantri.nama_lengkap || !formSantri.kelas_id) ? "#cbd5e1" : "#550000", color: "white", fontWeight: 700, cursor: (!formSantri.nama_lengkap || !formSantri.kelas_id) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\s*\);\s*\}\s*$/, modalHTML + '\n    </div>\n  );\n}\n');

fs.writeFileSync(filePath, code);
