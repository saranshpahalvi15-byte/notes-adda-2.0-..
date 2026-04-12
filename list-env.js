import fs from 'fs';
console.log(fs.readdirSync('.').filter(f => f.includes('.env')));
