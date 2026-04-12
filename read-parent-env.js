import fs from 'fs';
console.log(fs.readFileSync('../.dev.env.json', 'utf8'));
