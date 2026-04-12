import fs from 'fs';
fs.writeFileSync('env-dump.json', JSON.stringify(process.env, null, 2));
