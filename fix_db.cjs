const fs = require('fs');
let code = fs.readFileSync('db.ts', 'utf-8');

// Replace multiline db.prepare(...).run(...)
code = code.replace(/db\.prepare\(([^)]+)\)\.run\(/g, "await db.run($1, ");

// Replace specific db.prepare usages that were missed
code = code.replace(/db\.prepare\('SELECT COUNT\(\*\) as count FROM knowledge_bases'\)\.get\(\)/g, "await db.get('SELECT COUNT(*) as count FROM knowledge_bases')");
code = code.replace(/db\.prepare\('SELECT COUNT\(\*\) as c FROM knowledge_chunks WHERE document_id = \?'\)\.get\(([^)]+)\)/g, "await db.get('SELECT COUNT(*) as c FROM knowledge_chunks WHERE document_id = ?', $1)");
code = code.replace(/db\.prepare\(`SELECT \* FROM knowledge_chunks WHERE document_id IN \(\$\{placeholders\}\)`\)\.all\(\.\.\.docIds\)/g, "await db.all(`SELECT * FROM knowledge_chunks WHERE document_id IN (${placeholders})`, ...docIds)");

fs.writeFileSync('db.ts', code);
