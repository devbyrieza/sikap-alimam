const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// 1. Add activeTab state
code = code.replace(
  'const [error, setError] = useState("");',
  `const [error, setError] = useState("");\n  const [activeTab, setActiveTab] = useState<"asatidzah" | "wali">("asatidzah");`
);

// 2. Add Tabs UI and update labels dynamically
const oldFormHeader = `<h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                marginBottom: "4px",
              }}
            >
              Masuk Portal SIKAP
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>
              Silakan masukkan kredensial akun Asatidzah, Musyrif, atau Wali Santri.
            </p>
          </div>

          {/* Info banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fff8ec 0%, #fdf4e7 100%)",
              border: "1px solid #ddc19240",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "#550000", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#550000", fontWeight: 500, lineHeight: 1.4 }}>
              Login staf, asatidzah, dan wali santri menggunakan{" "}
              <strong>Username / Email / No. WA</strong>.
            </span>
          </div>`;

const newFormHeader = `<h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                marginBottom: "4px",
                textAlign: "center"
              }}
            >
              Masuk Portal SIKAP
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 400, textAlign: "center", marginBottom: "20px" }}>
              Silakan pilih jalur akses Anda.
            </p>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '6px', borderRadius: '100px', marginBottom: '24px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab("wali")}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  background: activeTab === "wali" ? '#fff' : 'transparent',
                  color: activeTab === "wali" ? '#550000' : '#64748b',
                  boxShadow: activeTab === "wali" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                WALI SANTRI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("asatidzah")}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  background: activeTab === "asatidzah" ? '#fff' : 'transparent',
                  color: activeTab === "asatidzah" ? '#550000' : '#64748b',
                  boxShadow: activeTab === "asatidzah" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ASATIDZAH / STAF
              </button>
            </div>
          </div>

          {/* Info banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fff8ec 0%, #fdf4e7 100%)",
              border: "1px solid #ddc19240",
              marginBottom: "20px",
            }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "#550000", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#550000", fontWeight: 500, lineHeight: 1.4 }}>
              {activeTab === "asatidzah" 
                ? <><strong style={{fontWeight: 800}}>PORTAL STAF:</strong> Gunakan <strong>Username / Email / No. WA</strong> untuk masuk.</>
                : <><strong style={{fontWeight: 800}}>PORTAL WALI:</strong> Gunakan <strong>Nomor Induk Santri (NIS)</strong> Anak Anda untuk masuk.</>
              }
            </span>
          </div>`;

code = code.replace(oldFormHeader, newFormHeader);

// 3. Update Input Label & Placeholder
code = code.replace(
  '<label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase" }}>',
  '<label style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase" }}>'
); // Just a placeholder match, let's find the exact string.

code = code.replace(
  'USERNAME / EMAIL / NO. WA <span style={{ color: "#e11d48" }}>*</span>',
  '{activeTab === "asatidzah" ? "USERNAME / EMAIL / NO. WA" : "NIS (NOMOR INDUK SANTRI)"} <span style={{ color: "#e11d48" }}>*</span>'
);

code = code.replace(
  'placeholder="Username / Email / No. WA"',
  'placeholder={activeTab === "asatidzah" ? "Username / Email / No. WA" : "Masukkan NIS Anak Anda"}'
);

fs.writeFileSync('src/app/login/page.tsx', code);
