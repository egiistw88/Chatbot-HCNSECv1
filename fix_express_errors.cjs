const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const errorHandler = `
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('[Express Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // Vite middleware for development
`;

code = code.replace('  // Vite middleware for development', errorHandler);
fs.writeFileSync('server.ts', code);
