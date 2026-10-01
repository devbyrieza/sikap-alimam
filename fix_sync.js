const fs = require('fs');
let code = fs.readFileSync('src/app/api/sync-halaqoh/route.ts', 'utf8');

const regex = /\/\/ Manual Override Mappings[\s\S]*?\/\/ Default strict matching/m;
const newOverrides = `// Manual Override Mappings for problem children
          if (qName.includes('dicky') && dbName.includes('dicky')) return true;
          if (qName.includes('radhil') && (dbName.includes('radil') || dbName.includes('radhil'))) return true;
          if (qName.includes('panji ahmad') && dbName.includes('panji') && dbName.includes('ahmad')) return true;
          if (qName.includes('salman abdulrahim') && dbName.includes('salman')) return true;
          if (qName.includes('yasser ali nurdin') && dbName.includes('yasser')) return true;
          if (qName.includes('syafiq karimaly') && dbName.includes('syafiq')) return true;
          if (qName.includes('miizan') && dbName.includes('miizan')) return true;
          if (qName.includes('azzam al hafizh') && dbName.includes('azzam al hafiz')) return true;
          
          // Abdurrahman & Abdurrahim
          if (qName === 'abdurrahman' && dbName.includes('abdurrahman') && !dbName.includes('hafidz')) return true;
          if (qName === 'abdurrahim' && dbName.includes('abdurrahim') && !dbName.includes('pati') && !dbName.includes('salman')) return true;

          // Default strict matching`;

code = code.replace(regex, newOverrides);
fs.writeFileSync('src/app/api/sync-halaqoh/route.ts', code);
