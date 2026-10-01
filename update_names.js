const fs = require('fs');
const filePath = 'src/app/api/sync-halaqoh/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/"Muhammad Rizki"/g, '"Muhammad Rizky"');
code = code.replace(/"Yaseer Ali Nurdin"/g, '"Yasser Ali Nurdin"');
code = code.replace(/"Radil"/g, '"Radhil"');
code = code.replace(/"Syafiq Karimalai"/g, '"Syafiq Karimaly"');
code = code.replace(/"Dicky Dwi"/g, '"Dicky"');
code = code.replace(/"Muhammad Hafizh Reo Afelano"/g, '"Reo Afelano"');
code = code.replace(/"Naufal Dzaki Purnama"/g, '"Naufal Dzaki"');
code = code.replace(/"Salman Abdulrahim Uran"/g, '"Salman Abdulrahim"');
code = code.replace(/"Muhammad Abdurrahim"/g, '"Abdurrahim"');
code = code.replace(/"Muhammad Abdurrahman"/g, '"Abdurrahman"');

const newSearchLogic = `        const santri = semuaSantri.find(s => {
          const dbName = s.nama_lengkap.toLowerCase();
          const qName = namaSantri.toLowerCase();
          
          if (dbName.replace(/[^a-z0-9]/g, '').includes(qName.replace(/[^a-z0-9]/g, ''))) return true;
          if (qName.replace(/[^a-z0-9]/g, '').includes(dbName.replace(/[^a-z0-9]/g, ''))) return true;

          // Fuzzy keyword match
          const searchWords = qName.split(' ').filter(w => w.length >= 3 && w !== 'muhammad' && w !== 'ahmad' && w !== 'muh' && w !== 'andi' && w !== 'm');
          if (searchWords.length > 0) {
            return searchWords.some(w => dbName.includes(w)); // Changed to some to catch typos in other words!
          }
          return dbName.includes(qName.split(' ')[0]);
        });`;

code = code.replace(/const searchName = namaSantri\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, ''\);\s*const santri = semuaSantri\.find\(s => \{\s*const dbName = s\.nama_lengkap\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, ''\);\s*\/\/ Cek apakah mirip \(substring\) atau ada typo sedikit\s*return dbName\.includes\(searchName\) \|\| searchName\.includes\(dbName\);\s*\}\);/, newSearchLogic);

fs.writeFileSync(filePath, code);
