const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', 'utf8');

const replacement = `              <div>
                <label style={labelStyle}>Sesi Halaqoh</label>
                <select
                  value={formKelompok.sesi}
                  onChange={e => setFormKelompok({ ...formKelompok, sesi: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", marginBottom: 16 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <option value="subuh">Subuh</option>
                  <option value="maghrib">Maghrib</option>
                  <option value="dhuha">Dhuha</option>
                </select>
              </div>
              
              <div>
                <label style={labelStyle}>Tingkatan</label>
                <select
                  value={formKelompok.tingkatan}
                  onChange={e => setFormKelompok({ ...formKelompok, tingkatan: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer", marginBottom: 16 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#550000")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <option value="MUBTADI">Mubtadi</option>
                  <option value="MUTAWASSITH">Mutawassith</option>
                  <option value="MUTAFAWWIQ">Mutafawwiq</option>
                </select>
              </div>`;

code = code.replace(/              <div>\s*<label style=\{labelStyle\}>Sesi Halaqoh<\/label>\s*<select\s*value=\{formKelompok.sesi\}\s*onChange=\{e => setFormKelompok\(\{ \.\.\.formKelompok, sesi: e\.target\.value \}\)\}\s*style=\{\{ \.\.\.inputStyle, appearance: "none", cursor: "pointer" \}\}\s*onFocus=\{e => \(e\.currentTarget\.style\.borderColor = "#550000"\)\}\s*onBlur=\{e => \(e\.currentTarget\.style\.borderColor = "#e2e8f0"\)\}\s*>\s*<option value="subuh">Subuh<\/option>\s*<option value="maghrib">Ba'da Maghrib<\/option>\s*<option value="dhuha">Dhuha<\/option>\s*<\/select>\s*<\/div>/, replacement);

fs.writeFileSync('src/app/(dashboard)/halaqoh/kelompok/page.tsx', code);
