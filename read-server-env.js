import fs from 'fs';
const env = JSON.parse(fs.readFileSync('server-env-dump.json', 'utf8'));
console.log('GEMINI_API_KEY:', env.GEMINI_API_KEY);
console.log('NEXT_PUBLIC_GEMINI_API_KEY:', env.NEXT_PUBLIC_GEMINI_API_KEY);
