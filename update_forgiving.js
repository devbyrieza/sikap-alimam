const fs = require('fs');
const filePath = 'src/app/api/sync-halaqoh/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const superForgivingLogic = `        const santri = semuaSantri.find(s => {
          const dbName = s.nama_lengkap.toLowerCase();
          const qName = namaSantri.toLowerCase();
          
          if (dbName.replace(/[^a-z0-9]/g, '').includes(qName.replace(/[^a-z0-9]/g, ''))) return true;
          if (qName.replace(/[^a-z0-9]/g, '').includes(dbName.replace(/[^a-z0-9]/g, ''))) return true;

          // Hardcoded fallbacks for the very problematic ones
          if (qName.includes('dicky') && (dbName.includes('dicky') || dbName.includes('diki') || dbName.includes('dwi'))) return true;
          if (qName.includes('radhil') && (dbName.includes('radil') || dbName.includes('radhil') || dbName.includes('radhiel'))) return true;
          if (qName.includes('panji ahmad') && (dbName.includes('panji') || dbName.includes('ahmad'))) return true;
          if (qName.includes('salman') && dbName.includes('salman')) return true;
          if (qName.includes('yasser') && (dbName.includes('yasser') || dbName.includes('yaseer') || dbName.includes('yasir') || dbName.includes('nurdin'))) return true;
          if (qName.includes('syafiq') && (dbName.includes('syafiq') || dbName.includes('syafik') || dbName.includes('karim'))) return true;
          if (qName.includes('abdurrahman') && dbName.includes('abdurrahman')) return true;
          if (qName.includes('abdurrahim') && dbName.includes('abdurrahim')) return true;

          // Fuzzy keyword match (at least ONE unique word matches)
          const searchWords = qName.split(' ').filter(w => w.length >= 4 && w !== 'muhammad' && w !== 'ahmad' && w !== 'andi');
          if (searchWords.length > 0) {
            return searchWords.some(w => dbName.includes(w));
          }
          return dbName.includes(qName.split(' ')[0]);
        });`;

code = code.replace(/const santri = semuaSantri\.find\(s => \{[\s\S]*?\}\);/, superForgivingLogic);

// Make sure we include "Panji Ahmad" properly in the HALAQOH_DATA array
// The array already has "Panji Ahmad" for Agus Cahyono.

fs.writeFileSync(filePath, code);
