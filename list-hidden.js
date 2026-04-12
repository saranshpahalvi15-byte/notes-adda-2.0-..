import fs from 'fs';
console.log(fs.readdirSync('.', { withFileTypes: true }).map(d => d.name).filter(n => n.startsWith('.')));
