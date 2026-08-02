const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// The original file is mostly untouched in the middle. We need to fix the setup.
// Let's just find the end of `callChatCompletion` and reconstruct.

const splitPoint = code.indexOf(`throw lastError || new Error('Layanan AI sedang tidak tersedia, silakan coba lagi beberapa saat.');\n}`);

const before = code.substring(0, splitPoint + 95);

// The middle part has all the routes. Let's extract them.
const apiStart = code.indexOf(`  app.get('/api/settings/:key'`);
const apiEnd = code.indexOf(`  // Vite middleware for development`);

const routes = code.substring(apiStart, apiEnd);

const newSetup = `
export const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

let dbInitPromise = null;
app.use(async (req, res, next) => {
  if (!dbInitPromise) {
    dbInitPromise = initDb().catch(e => console.error("DB Init Error:", e));
  }
  await dbInitPromise;
  next();
});

// API Routes
`;

const newEnd = `
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    (async () => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      const PORT = 3000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
      });
    })();
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
    });
  } else {
    // Vercel production: static files are handled by vercel.json routing
    // just export the app
  }

export default app;
`;

const finalCode = before + "\n" + newSetup + routes + newEnd;
fs.writeFileSync('server.ts', finalCode);
