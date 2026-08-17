const express = require('express');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: path.resolve(__dirname, 'frontend') });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const server = express();

  // 1. Mount Backend REST API
  try {
    const backendApp = require('./backend/server');
    server.use(backendApp);
    console.log('✅ [Unified Server] Express REST API mounted under /api');
  } catch (err) {
    console.warn('⚠️ [Unified Server] Warning mounting backend:', err.message);
  }

  // 2. Delegate all frontend rendering to Next.js (Express v5 compatible catch-all)
  server.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`🚀 [ConstructTrack Production Server] Live on http://0.0.0.0:${port}`);
  });
}).catch((err) => {
  console.error('❌ Failed to start unified server:', err);
  process.exit(1);
});
