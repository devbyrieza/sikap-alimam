const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

const regex = /<h2[\s\S]*?Silakan masukkan kredensial akun Asatidzah, Musyrif, atau Wali Santri.[\s\S]*?<\/p>\s*<\/div>[\s\S]*?\{\/\* Info banner \*\/\}[\s\S]*?<div[\s\S]*?>[\s\S]*?<ShieldCheck[\s\S]*?\/>[\s\S]*?<span[\s\S]*?>[\s\S]*?Login staf, asatidzah, dan wali santri menggunakan\{" "\}[\s\S]*?<strong>Username \/ Email \/ No\. WA<\/strong>\.[\s\S]*?<\/span>\s*<\/div>/;

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
                onClick={() => { setActiveTab("wali"); setEmail(""); setPassword(""); setError(""); }}
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
                onClick={() => { setActiveTab("asatidzah"); setEmail(""); setPassword(""); setError(""); }}
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

code = code.replace(regex, newFormHeader);

code = code.replace(
  'USERNAME / EMAIL / NO. WA <span',
  '{activeTab === "asatidzah" ? "USERNAME / EMAIL / NO. WA" : "NIS (NOMOR INDUK SANTRI)"} <span'
);

fs.writeFileSync('src/app/login/page.tsx', code);
