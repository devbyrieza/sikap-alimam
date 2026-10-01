const fs = require('fs');
const filePath = 'src/app/(dashboard)/master/santri/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const badButtonRegex = /<button[\s\S]*?Tambah Santri Baru\s*<\/button>\s*<\/div>/;
code = code.replace(badButtonRegex, '</div>');

const correctButtonHTML = `
        <button
          onClick={() => setIsAdding(true)}
          style={{
            position: "relative", zIndex: 1,
            background: "#ddc192", color: "#3b0000", border: "none", cursor: "pointer",
            fontWeight: 800, fontSize: 14, padding: "12px 22px", borderRadius: 14,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(221,193,146,0.3)", transition: "all 0.2s",
            whiteSpace: "nowrap"
          }}
        >
          <Users size={18} /> Tambah Santri Baru
        </button>
`;

code = code.replace(/<\/p>\s*<\/div>\s*<\/div>/, '</p>\n        </div>\n' + correctButtonHTML + '\n      </div>');

fs.writeFileSync(filePath, code);
