const fs = require('fs');
const filePath = 'src/app/api/sync-halaqoh/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const flawlessLogic = `        const santri = semuaSantri.find(s => {
          const dbName = s.nama_lengkap.toLowerCase();
          const qName = namaSantri.toLowerCase();
          
          if (dbName.replace(/[^a-z0-9]/g, '') === qName.replace(/[^a-z0-9]/g, '')) return true;

          // Manual Override Mappings for problem children
          if (qName === 'dicky' && dbName.includes('dicky')) return true;
          if (qName === 'dicky' && dbName.includes('diki dwi')) return true;
          if (qName === 'radhil' && (dbName.includes('radhil') || dbName.includes('radil') || dbName.includes('rhadi') || dbName.includes('fadhil'))) return true;
          if (qName === 'panji ahmad' && dbName.includes('panji') && dbName.includes('ahmad')) return true;
          
          // Use 'salman' only if it matches exactly for the student Uran
          if (qName === 'salman abdulrahim' && dbName.includes('salman')) return true;
          
          // Yasser Ali Nurdin -> Yasser / Yasir
          if (qName === 'yasser ali nurdin' && (dbName.includes('yasir') || dbName.includes('yaseer') || dbName.includes('yasser'))) return true;
          
          // Syafiq Karimalai
          if (qName === 'syafiq karimaly' && (dbName.includes('syafik') || dbName.includes('syafiq'))) return true;
          
          // Abdurrahman & Abdurrahim
          if (qName === 'abdurrahman' && dbName.includes('abdurrahman') && !dbName.includes('hafidz')) return true;
          if (qName === 'abdurrahim' && dbName.includes('abdurrahim') && !dbName.includes('pati') && !dbName.includes('salman')) return true;

          // Default strict matching (EVERY word must match)
          const searchWords = qName.split(' ').filter(w => w.length >= 3 && w !== 'muhammad' && w !== 'ahmad' && w !== 'andi' && w !== 'muh' && w !== 'ali');
          if (searchWords.length > 0) {
            return searchWords.every(w => dbName.includes(w));
          }
          return dbName.includes(qName.replace(/[^a-z0-9]/g, ''));
        });`;

code = code.replace(/const santri = semuaSantri\.find\(s => \{[\s\S]*?\}\);/, flawlessLogic);

fs.writeFileSync(filePath, code);
