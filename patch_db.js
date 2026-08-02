const fs = require('fs');
let code = fs.readFileSync('db.ts', 'utf-8');

code = code.replace(/const dbDir = path\.join\(process\.cwd\(\), 'data'\);/, `const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL;
  const dbDir = isVercel ? '/tmp' : path.join(process.cwd(), 'data');`);

fs.writeFileSync('db.ts', code);
