import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const build = spawn(process.execPath, ['build.mjs'], { stdio: 'inherit' });
await new Promise((resolve, reject) => {
  build.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`)));
});

const root = path.resolve('dist');
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.woff2', 'font/woff2'],
]);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const candidate = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!candidate.startsWith(`${root}${path.sep}`)) throw new Error('Invalid path');
    const info = await stat(candidate);
    const file = info.isDirectory() ? path.join(candidate, 'index.html') : candidate;
    response.setHeader('Content-Type', types.get(path.extname(file)) || 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end('Not found');
  }
}).listen(4173, () => console.log('Development server: http://localhost:4173'));
