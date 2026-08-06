const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/login/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove state
content = content.replace(`
  // Role Selection State
  const [requireRoleSelection, setRequireRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);`, '');

// 2. Remove role check from handleSubmit
const submitBlock = `      if (json.requireRoleSelection) {
        setRequireRoleSelection(true);
        setAvailableRoles(json.availableRoles);
        return;
      }`;
content = content.replace(submitBlock, '');

// 3. Remove handleRoleSelect entirely using regex
content = content.replace(/async function handleRoleSelect\([\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\}/, '');

// 4. Remove UI block
const uiBlockStart = `{requireRoleSelection ? (
          <div>
            <p style={{ textAlign: "center", marginBottom: 20, fontSize: 14, color: "#4b5563" }}>
              Akun Anda memiliki akses ganda. Silakan pilih hak akses yang ingin digunakan saat ini:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", background: role === 'ADMIN_SUPER' ? 'var(--primary)' : 'var(--secondary)' }}
                >
                  {loading ? <Loader2 className="spin" size={18} /> : \`Masuk sebagai \${role === 'ADMIN_SUPER' ? 'Admin Super' : 'Guru'}\`}
                </button>
              ))}
            </div>
            {error && (
              <div className="alert-error" style={{ marginTop: 16 }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={() => {
                setRequireRoleSelection(false);
                setPassword("");
              }}
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 16, fontSize: 13, color: "#6b7280" }}
            >
              Kembali
            </button>
          </div>
        ) : (`;

const uiBlockEnd = `
        )}`;

content = content.replace(uiBlockStart, '');
content = content.replace(uiBlockEnd, ''); // Be careful with this replacing other ')}'. Let's do a more precise replacement.
// Let's just do a specific index replacement for the end block.
const lastFormIndex = content.lastIndexOf('</form>');
if (lastFormIndex !== -1) {
    // find the ')}' after '</form>'
    const endBlockIndex = content.indexOf(')}', lastFormIndex);
    if (endBlockIndex !== -1 && endBlockIndex - lastFormIndex < 30) {
        content = content.slice(0, endBlockIndex) + content.slice(endBlockIndex + 2);
    }
}


fs.writeFileSync(filePath, content);
console.log("Done");
