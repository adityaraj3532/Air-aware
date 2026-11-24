// Production server (Render): serves the built frontend from dist/ and the AirBuddy /api/chat endpoint.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleChat } from './chatPlugin.js';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain' };

async function serveFile(res, file, cache) {
  res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  if (cache) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(await readFile(file));
}

http.createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/api/chat') return handleChat(req, res);
  if (path === '/healthz') { res.end('ok'); return; }
  const file = normalize(join(DIST, path));
  try {
    if (file.startsWith(DIST) && (await stat(file)).isFile()) return await serveFile(res, file, path.startsWith('/assets/'));
  } catch {}
  try { await serveFile(res, join(DIST, 'index.html')); } // SPA fallback
  catch { res.statusCode = 500; res.end('Build missing: run npm run build'); }
}).listen(PORT, () => console.log(`AirAware listening on :${PORT}`));
