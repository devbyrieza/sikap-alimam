const fs = require('fs');
let code = fs.readFileSync('.github/workflows/docker-publish.yml', 'utf8');

code = code.split('-X GET').join('-X POST');

fs.writeFileSync('.github/workflows/docker-publish.yml', code);
