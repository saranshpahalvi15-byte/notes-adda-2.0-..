import fs from 'fs';
const env = JSON.parse(fs.readFileSync('server-env-dump.json', 'utf8'));
const keys = Object.keys(env).filter(k => k.includes('GEMINI') || k.includes('API') || k.includes('KEY'));
console.log(keys.map(k => `${k}: ${env[k].substring(0, 10)}...`));
