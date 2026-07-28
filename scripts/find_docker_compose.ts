import fs from 'fs';
import path from 'path';

function searchCompose(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchCompose(fullPath);
    } else {
      if (file.toLowerCase().includes('docker-compose') && (file.endsWith('.yml') || file.endsWith('.yaml'))) {
        console.log(`Found compose file: ${fullPath}`);
        console.log(fs.readFileSync(fullPath, 'utf8'));
      }
    }
  }
}

searchCompose('C:\\Users\\itpua\\Dev\\Work\\al-andalus');
