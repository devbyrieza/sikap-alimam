const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');

const anchor = 'const defaultPassword = "Sikap2026!";';
const newLogic = `          // Gunakan DDMMYY dari tanggal_lahir sebagai password default, jika kosong fallback ke Sikap2026!
          let defaultPassword = "Sikap2026!";
          if (santri.tanggal_lahir) {
            const d = new Date(santri.tanggal_lahir);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            defaultPassword = dd + mm + yy;
          }`;

code = code.replace(anchor, newLogic);

fs.writeFileSync('src/app/api/auth/login/route.ts', code);
