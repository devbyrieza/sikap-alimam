const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');

const replacement = `                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: sesiConfig.bg, color: sesiConfig.color, border: \`1px solid \${sesiConfig.border}\`, marginBottom: 8 }}>
                      {sesiConfig.icon} {sesiConfig.label}
                    </div>
                    {k.tingkatan && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", marginBottom: 8, marginLeft: 6 }}>
                        {k.tingkatan}
                      </div>
                    )}`;

code = code.replace(/<div style=\{\{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: sesiConfig.bg, color: sesiConfig.color, border: `1px solid \$\{sesiConfig.border\}`, marginBottom: 8 \}\}>\s*\{sesiConfig.icon\} \{sesiConfig.label\}\s*<\/div>/, replacement);

fs.writeFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', code);
