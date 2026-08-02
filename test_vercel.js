process.env.VERCEL = '1';
import('./dist/server.cjs').then(module => {
  const app = module.default;
  console.log("App exported successfully!", !!app);
}).catch(console.error);
