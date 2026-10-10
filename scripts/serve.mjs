// Minimal static file server for the built page: node scripts/serve.mjs <dir> <port>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const [dir = 'dist', port = '4174'] = process.argv.slice(2);
const root = path.resolve(dir);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': `${types[path.extname(file)] ?? 'application/octet-stream'}; charset=utf-8` }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(Number(port), '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
