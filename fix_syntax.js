const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("beberapa saatexport", "beberapa saat.');\n}\n\nexport");
fs.writeFileSync('server.ts', code);
