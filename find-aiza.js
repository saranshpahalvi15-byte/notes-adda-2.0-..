import fs from 'fs';
const env = JSON.parse(fs.readFileSync('server-env-dump.json', 'utf8'));
const keys = Object.keys(env).filter(k => env[k] && env[k].toString().startsWith('AIza'));
console.log(keys);
